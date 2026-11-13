using Microsoft.JSInterop;
using PetualangAir.Wpf.Services;

namespace PetualangAir.Web;

/// <summary>
/// WebAssembly file I/O lands in an in-memory file system. GameStateService keeps using it unchanged;
/// this class loads the durable copy before the service starts and writes changed files back to the host.
/// </summary>
public static class SaveMirror
{
    private const string Directory = "/petualang-air";
    private static readonly string[] Files = ["save.json", "save.json.previous"];

    public static GameStateService CreateGameState(IJSInProcessRuntime js)
    {
        System.IO.Directory.CreateDirectory(Directory);
        var persisted = new Dictionary<string, string>();
        foreach (var name in Files)
        {
            var text = js.Invoke<string?>("petualangShell.readSave", name);
            if (text is null) continue;
            File.WriteAllText(Path.Combine(Directory, name), text);
            persisted[name] = text;
        }
        var state = new GameStateService(Path.Combine(Directory, Files[0]));
        state.OnStateChanged += () =>
        {
            foreach (var name in Files)
            {
                var path = Path.Combine(Directory, name);
                if (!File.Exists(path)) continue;
                var text = File.ReadAllText(path);
                if (persisted.GetValueOrDefault(name) == text) continue;
                if (js.Invoke<bool>("petualangShell.writeSave", name, text)) persisted[name] = text;
                else Console.Error.WriteLine($"Petualang Air: gagal menyimpan {name} ke penyimpanan host.");
            }
        };
        return state;
    }
}
