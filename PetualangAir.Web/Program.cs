using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using PetualangAir.Wpf.Components;
using PetualangAir.Wpf.Services;
using PetualangAir.Web;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<GamePage>("#app");
builder.Services.AddSingleton<IAppShell, BrowserShell>();
builder.Services.AddSingleton(services => SaveMirror.CreateGameState((IJSInProcessRuntime)services.GetRequiredService<IJSRuntime>()));
await builder.Build().RunAsync();
