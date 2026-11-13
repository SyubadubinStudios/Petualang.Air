using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using PetualangAir.Wpf.Services;

namespace PetualangAir.Wpf;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddWpfBlazorWebView();
        serviceCollection.AddSingleton<GameStateService>();

#if DEBUG
        serviceCollection.AddBlazorWebViewDeveloperTools();
#endif

        Resources.Add("services", serviceCollection.BuildServiceProvider());
        InitializeComponent();
        Closing += (_, _) => ((ServiceProvider)Resources["services"]).GetRequiredService<GameStateService>().Save();
    }
}
