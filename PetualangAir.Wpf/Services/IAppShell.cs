namespace PetualangAir.Wpf.Services;

/// <summary>Window operations supplied by the platform host (WPF on Windows, Electron on Linux/macOS).</summary>
public interface IAppShell
{
    string Edition { get; }
    void Quit();
    void ToggleFullscreen();
}
