using System.Windows;
using PetualangAir.Wpf.Services;

namespace PetualangAir.Wpf;

public sealed class WpfShell : IAppShell
{
    public string Edition => "WINDOWS EDITION";
    public void Quit() => Application.Current.MainWindow.Close();
    public void ToggleFullscreen()
    {
        var window = Application.Current.MainWindow;
        if (window.WindowStyle == WindowStyle.None) { window.WindowStyle = WindowStyle.SingleBorderWindow; window.WindowState = WindowState.Normal; }
        else { window.WindowStyle = WindowStyle.None; window.WindowState = WindowState.Maximized; }
    }
}
