using Microsoft.JSInterop;
using PetualangAir.Wpf.Services;

namespace PetualangAir.Web;

/// <summary>Forwards window operations to <c>window.petualangShell</c> (Electron host, or browser fallbacks).</summary>
public sealed class BrowserShell(IJSRuntime js) : IAppShell
{
    private readonly IJSInProcessRuntime runtime = (IJSInProcessRuntime)js;
    public string Edition => runtime.Invoke<string>("petualangShell.edition");
    public void Quit() => runtime.InvokeVoid("petualangShell.quit");
    public void ToggleFullscreen() => runtime.InvokeVoid("petualangShell.toggleFullscreen");
}
