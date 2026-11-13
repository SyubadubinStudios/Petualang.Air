
````markdown
# Desain Solusi Game: Petualang Air

**Dibuat oleh:** Ariana Mischa Fadhila dari Syubadubin Studios

**Genre:** 3D Tropical Rafting & Exploration Adventure  
**Platform Target:** Windows Desktop (WPF + Blazor Hybrid + Three.js WebGL2)  
**Karakter Utama:** Bang Jopi  

---

## 1. Konsep Game & Karakter

### Karakter Utama: Bang Jopi
* **Profil:** Pemuda Nusantara berusia 22 tahun yang ceria, tangguh, pencinta alam, dan pengrajin rakit ulung.
* **Desain Visual (Stylized 3D):**
  * Mengenakan **topi rimba / caping modern** berwarna cokelat dengan pin lencana Nusantara.
  * **Rompi pelampung (life vest)** oranye cerah dengan aksen motif batik parang di bagian bahu, kaos putih, dan celana pendek kargo tahan air.
  * **Peralatan Utama:** Dayung bambu petung berujung sirip karbon serta pengait tali/jaring.
* **Animasi & Ekspresi:** Duduk santai saat diam (*idle*), berdiri menjaga keseimbangan saat ombak besar, tubuh miring dinamis saat berbelok (*counter-leaning*), dan selebrasi saat mendapat artefak langka.

### Rakit Modular (Progression System)
Pemain memulai dengan **Rakit Bambu Ikat Ijuk**, lalu dapat melakukan *upgrade* di Dermaga Bengkel:
1. **Lambung:** Bambu Biasa -> Bambu Petung Berpelampung Drum -> Katamaran Kayu Ulin -> Lambung Komposit Pinisi.
2. **Penggerak:** Dayung Tunggal -> Dayung Ganda -> Mesin Ketinting -> Layar Kain Tenun + Motor Tenaga Surya.
3. **Aksesoris:** Jaring Pengumpul Sampah/Ikan, Lampu Petromaks/Sorot (hutan malam), Bumper Ban Bekas, Kompas Arah Angin.

---

## 2. Dunia & 6 Bioma Perairan Indonesia

| Bioma | Referensi Lokasi | Karakteristik Air & Cuaca | Rintangan & Interaksi Unik |
| :--- | :--- | :--- | :--- |
| **1. Sungai Pegunungan** | Sungai Elo / Ayung / Pekalen | Arus deras, hijau zamrud berbusa putih, kabut pagi, tebing batu curam. | Jeram berbatu, batang kayu tumbang. Fokus pada *steering* presisi & *paddle boost*. |
| **2. Hutan & Sungai Gambut** | Kalimantan / Asmat Papua | Air kecokelatan (tannin), kanopi bakau lebat, kunang-kunang senja. | Akar bakau menjulur, buaya muara (menyelinap pelan), kabut tebal (butuh lampu). |
| **3. Danau Vulkanik** | Danau Toba / Danau Batur | Air biru tua sangat luas, refleksi gunung berapi, angin lembah. | Pusaran angin (*crosswind*), rumah adat di tepian sebagai pos dagang/istirahat. |
| **4. Perairan Perkotaan** | Sungai Martapura / Kanal Jakarta | Air keruh kehijauan, jembatan layang, lampu kota, pasar terapung. | Perahu klotok NPC, misi bersih-bersih sampah plastik untuk poin reputasi, tiang jembatan. |
| **5. Laut Dangkal & Karang** | Raja Ampat / Bunaken | Air biru toska super jernih, pulau karang menjulang, ikan tropis. | Karang dangkal, ubur-ubur, jaring mutiara & artefak laut. |
| **6. Samudra Lepas** | Samudra Hindia / Laut Banda | Gelombang tinggi dinamis, biru pekat, cuaca ekstrem (badai/pelangi). | Ombak raksasa (harus memotong ombak secara diagonal), kawanan lumba-lumba penambah *boost*. |

---

## 3. Gameplay Loop & Mekanik Seru

### Core Loop
`Berlayar & Eksplorasi` -> `Navigasi Arus & Rintangan` -> `Kumpulkan Sumber Daya & Bersihkan Perairan` -> `Barter di Pasar Terapung` -> `Upgrade Rakit & Buka Bioma Baru`

### Mekanik Inti
* **Fisika Daya Apung (4-Point Buoyancy):** Rakit mengambil sampel ketinggian gelombang di 4 titik sudutnya sehingga bisa mengangguk (*pitch*), miring (*roll*), dan terangkat saat menghantam ombak.
* **Kontrol Mendayung Taktis:**
  * `W / S`: Dayung maju / rem mundur.
  * `A / D`: Belok kiri / kanan (simulasi gaya torsi dayung).
  * `Space`: *Power Stroke / Ketinting Boost* (mengonsumsi stamina).
  * `Mouse Drag`: Putar kamera orbit di sekitar Bang Jopi.
* **Sistem Stamina "Segar Nusantara":** Diisi ulang dengan **Es Kelapa Muda** atau **Kopi Tubruk** yang diracik/dibeli di dermaga.
* **Misi Ekologi & Budaya:** Membersihkan sampah di sungai perkotaan menaikkan indeks *Sungai Lestari*, membuka kosmetik batik spesial, serta diskon di pasar terapung.

---

## 4. Desain Visual 3D, Animasi & UI/UX

### Desain 3D & Shader (Three.js)
* **Gaya Visual:** *Stylized Tropical Low-Poly + Cel-Shading* ringan agar cerah, kontras, dan stabil di 60 FPS pada WebView2.
* **Water System:** Gelombang sinusoidal multi-oktaf yang parameternya berubah dinamis per bioma, dilengkapi partikel buih (*splash particles*) di belakang rakit saat mendayung.
* **Animasi Prosedural:** Gerakan mendayung sinkron dengan input pemain dan kecepatan rakit.

### Desain UI/UX (Blazor + CSS Glassmorphism Tropis)
* **Seamless Title Experience:** Kamera langsung mengorbit Bang Jopi di atas air tanpa *loading screen* kaku.
* **HUD Minimalis:**
  * **Kiri Atas:** Kartu profil Bang Jopi, Level Rakit, Bar Ketahanan Rakit, dan Bar Stamina.
  * **Tengah Atas:** Peta Perairan Nusantara (pemilih 6 bioma interaktif).
  * **Kanan Atas:** Penghitung Koin Nusantara & tombol Upgrade Rakit instan.
  * **Bawah Tengah:** Panduan kontrol ringkas.

---

## 5. Arsitektur Teknis: WPF + Blazor Hybrid + Three.js

### Pemisahan Tanggung Jawab & Prinsip Zero-Bottleneck
* **WPF Host (.NET 8/10):** Manajemen jendela desktop Windows, sistem *Save/Load* lokal (`AppData`), dan hosting `BlazorWebView` (WebView2).
* **Blazor Layer (C#):** Mengelola HUD, state permainan (`GameStateService`), toko *upgrade*, dan notifikasi.
* **Three.js Layer (JS/WebGL2):** Menjalankan seluruh *render loop* 60 FPS, matematika gelombang, *buoyancy*, input keyboard, dan partikel secara lokal di JavaScript.
* **JS Interop Event-Driven:** C# <-> JS hanya berkomunikasi saat ada *event* tertentu (mengambil koin, menabrak batu, ganti bioma, atau beli *upgrade*), bukan di setiap *frame*.

```text
+-----------------------------------------------------------------------+
|                       WPF HOST (.NET Desktop)                         |
|  - Window Management (Fullscreen / Minimize)                          |
|  - Local Save/Load System (AppData/PetualangAir/save.json)            |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |                  BlazorWebView (WebView2 Engine)                |  |
|  |                                                                 |  |
|  |  +--------------------------+     +--------------------------+  |  |
|  |  |   Blazor Layer (C#)      |     |   Three.js Layer (JS)    |  |  |
|  |  |  - HUD (HP, Stamina)     |<--->|  - 60FPS Render Loop     |  |  |
|  |  |  - Toko Upgrade Rakit    |Event|  - Buoyancy & Wave Math  |  |  |
|  |  |  - Peta & Bioma Selector |Only |  - Bang Jopi 3D & Rakit  |  |  |
|  |  +--------------------------+     +--------------------------+  |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

---

## 6. Implementasi Starter Code (Proof of Concept)

### Struktur Proyek
```text
PetualangAir.Wpf/
├── PetualangAir.Wpf.csproj
├── App.xaml
├── App.xaml.cs
├── MainWindow.xaml
├── MainWindow.xaml.cs
├── Services/
│   └── GameStateService.cs
├── Components/
│   ├── _Imports.razor
│   └── GamePage.razor
└── wwwroot/
    ├── index.html
    ├── css/
    │   └── app.css
    └── js/
        └── petualangEngine.js
```

### `PetualangAir.Wpf.csproj`
```xml
<Project Sdk="Microsoft.NET.Sdk.Razor">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <UseWPF>true</UseWPF>
    <RootNamespace>PetualangAir.Wpf</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Components.WebView.Wpf" Version="8.0.90" />
  </ItemGroup>
</Project>
```

### `App.xaml` & `App.xaml.cs`
```xml
<Application x:Class="PetualangAir.Wpf.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml">
    <Application.Resources>
    </Application.Resources>
</Application>
```

```csharp
using System.Windows;

namespace PetualangAir.Wpf;

public partial class App : Application
{
}
```

### `MainWindow.xaml` & `MainWindow.xaml.cs`
```xml
<Window x:Class="PetualangAir.Wpf.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:blazor="clr-namespace:Microsoft.AspNetCore.Components.WebView.Wpf;assembly=Microsoft.AspNetCore.Components.WebView.Wpf"
        xmlns:local="clr-namespace:PetualangAir.Wpf.Components"
        Title="Petualang Air - Ekspedisi Bang Jopi"
        Height="800" Width="1366"
        WindowStartupLocation="CenterScreen"
        Background="#0B192C">
    <Grid>
        <blazor:BlazorWebView HostPage="wwwroot\index.html" Services="{DynamicResource services}">
            <blazor:BlazorWebView.RootComponents>
                <blazor:RootComponent Selector="#app" ComponentType="{x:Type local:GamePage}" />
            </blazor:BlazorWebView.RootComponents>
        </blazor:BlazorWebView>
    </Grid>
</Window>
```

```csharp
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
    }
}
```

### `Services/GameStateService.cs`
```csharp
namespace PetualangAir.Wpf.Services;

public enum BiomaType
{
    SungaiGunung,
    HutanGambut,
    DanauVulkanik,
    KotaKanal,
    LautKarang,
    SamudraLepas
}

public class GameStateService
{
    public int KoinNusantara { get; set; } = 150;
    public int LevelRakit { get; set; } = 1;
    public int KetahananRakit { get; set; } = 100;
    public int StaminaJopi { get; set; } = 100;
    public BiomaType BiomaAktif { get; set; } = BiomaType.SungaiGunung;

    public event Action? OnStateChanged;

    public void TambahKoin(int jumlah)
    {
        KoinNusantara += jumlah;
        OnStateChanged?.Invoke();
    }

    public void KenaRintangan(int damage)
    {
        KetahananRakit = Math.Max(0, KetahananRakit - damage);
        OnStateChanged?.Invoke();
    }

    public bool UpgradeRakit()
    {
        int biaya = LevelRakit * 100;
        if (KoinNusantara >= biaya && LevelRakit < 4)
        {
            KoinNusantara -= biaya;
            LevelRakit++;
            KetahananRakit = 100;
            OnStateChanged?.Invoke();
            return true;
        }
        return false;
    }

    public void SetBioma(BiomaType bioma)
    {
        BiomaAktif = bioma;
        OnStateChanged?.Invoke();
    }
}
```

### `Components/_Imports.razor` & `Components/GamePage.razor`
```razor
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.JSInterop
```

```razor
@using PetualangAir.Wpf.Services
@inject IJSRuntime JS
@inject GameStateService GameState
@implements IDisposable

<div class="game-container">
    <canvas id="petualang-canvas"></canvas>

    <div class="hud-top">
        <div class="glass-panel player-card">
            <div class="avatar-badge">BJ</div>
            <div class="stats">
                <div class="player-name">Bang Jopi <span class="badge-lvl">Rakit Lv.@GameState.LevelRakit</span></div>
                <div class="bar-group">
                    <label>Rakit</label>
                    <div class="progress-bar"><div class="fill hp" style="width:@GameState.KetahananRakit%"></div></div>
                </div>
                <div class="bar-group">
                    <label>Stamina</label>
                    <div class="progress-bar"><div class="fill stamina" style="width:@GameState.StaminaJopi%"></div></div>
                </div>
            </div>
        </div>

        <div class="glass-panel biome-switcher">
            <span class="biome-title">PETA PERAIRAN NUSANTARA</span>
            <div class="biome-buttons">
                @foreach (var bioma in Enum.GetValues<BiomaType>())
                {
                    <button class="btn-biome @(GameState.BiomaAktif == bioma ? "active" : "")"
                            @onclick="() => GantiBioma(bioma)">
                        @FormatNamaBioma(bioma)
                    </button>
                }
            </div>
        </div>

        <div class="glass-panel resource-panel">
            <div class="coin-display">🪙 @GameState.KoinNusantara</div>
            <button class="btn-upgrade" @onclick="BeliUpgrade">
                🛠️ Upgrade (@(GameState.LevelRakit * 100))
            </button>
        </div>
    </div>

    @if (!string.IsNullOrEmpty(_toastMessage))
    {
        <div class="toast-banner">@_toastMessage</div>
    }

    <div class="hud-bottom">
        <div class="glass-panel controls-hint">
            <span><b>[W/S]</b> Dayung Maju/Mundur</span>
            <span><b>[A/D]</b> Belok Kiri/Kanan</span>
            <span><b>[SPACE]</b> Kayuhan Turbo</span>
            <span><b>[Mouse Drag]</b> Putar Kamera</span>
        </div>
    </div>
</div>

@code {
    private DotNetObjectReference<GamePage>? _objRef;
    private string _toastMessage = "";

    protected override void OnInitialized()
    {
        GameState.OnStateChanged += StateHasChanged;
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _objRef = DotNetObjectReference.Create(this);
            await JS.InvokeVoidAsync("PetualangEngine.init", "petualang-canvas", _objRef);
        }
    }

    private async Task GantiBioma(BiomaType bioma)
    {
        GameState.SetBioma(bioma);
        await JS.InvokeVoidAsync("PetualangEngine.setBiome", bioma.ToString());
        TampilkanNotifikasi($"Memasuki Zona: {FormatNamaBioma(bioma)}");
    }

    private async Task BeliUpgrade()
    {
        if (GameState.UpgradeRakit())
        {
            await JS.InvokeVoidAsync("PetualangEngine.upgradeRaft", GameState.LevelRakit);
            TampilkanNotifikasi($"Rakit berhasil di-upgrade ke Level {GameState.LevelRakit}!");
        }
        else
        {
            TampilkanNotifikasi("Koin Nusantara tidak cukup atau level sudah maksimal!");
        }
    }

    [JSInvokable]
    public void OnItemCollected(int koin)
    {
        GameState.TambahKoin(koin);
        TampilkanNotifikasi($"+{koin} Koin Nusantara ditemukan!");
        InvokeAsync(StateHasChanged);
    }

    [JSInvokable]
    public void OnObstacleHit(int damage)
    {
        GameState.KenaRintangan(damage);
        InvokeAsync(StateHasChanged);
    }

    private async void TampilkanNotifikasi(string pesan)
    {
        _toastMessage = pesan;
        await InvokeAsync(StateHasChanged);
        await Task.Delay(2500);
        if (_toastMessage == pesan)
        {
            _toastMessage = "";
            await InvokeAsync(StateHasChanged);
        }
    }

    private string FormatNamaBioma(BiomaType b) => b switch
    {
        BiomaType.SungaiGunung => "⛰️ Sungai Gunung",
        BiomaType.HutanGambut => "🌿 Hutan Gambut",
        BiomaType.DanauVulkanik => "🌋 Danau Vulkanik",
        BiomaType.KotaKanal => "🏙️ Sungai Kota",
        BiomaType.LautKarang => "🐠 Laut Karang",
        BiomaType.SamudraLepas => "🌊 Samudra",
        _ => b.ToString()
    };

    public void Dispose()
    {
        GameState.OnStateChanged -= StateHasChanged;
        _objRef?.Dispose();
    }
}
```

### `wwwroot/index.html`
```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Petualang Air</title>
    <link href="css/app.css" rel="stylesheet" />
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
        }
    }
    </script>
</head>
<body>
    <div id="app">Memuat Perairan Nusantara...</div>
    <script type="module" src="js/petualangEngine.js"></script>
    <script src="_framework/blazor.webview.js"></script>
</body>
</html>
```

### `wwwroot/css/app.css`
```css
* { box-sizing: border-box; user-select: none; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
html, body, #app, .game-container { width: 100%; height: 100%; overflow: hidden; background: #081826; }
#petualang-canvas { width: 100%; height: 100%; display: block; }

.glass-panel {
    background: rgba(12, 32, 48, 0.65);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 14px;
    color: #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.hud-top {
    position: absolute; top: 16px; left: 16px; right: 16px;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
    pointer-events: none;
}
.hud-top > * { pointer-events: auto; }

.player-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; min-width: 260px; }
.avatar-badge {
    width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg, #ff8c00, #e65100);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 18px; border: 2px solid #ffd54f;
}
.player-name { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
.badge-lvl { background: #00acc1; padding: 2px 7px; border-radius: 8px; font-size: 11px; margin-left: 6px; }
.bar-group { display: flex; align-items: center; gap: 8px; font-size: 11px; margin-top: 4px; }
.bar-group label { width: 48px; color: #b2ebf2; }
.progress-bar { width: 120px; height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; transition: width 0.3s ease; }
.fill.hp { background: linear-gradient(90deg, #66bb6a, #aed581); }
.fill.stamina { background: linear-gradient(90deg, #29b6f6, #4dd0e1); }

.biome-switcher { padding: 10px 14px; text-align: center; }
.biome-title { display: block; font-size: 10px; letter-spacing: 1.5px; color: #80deea; margin-bottom: 6px; font-weight: 700; }
.biome-buttons { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.btn-biome {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
    color: #fff; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 12px; transition: 0.2s;
}
.btn-biome:hover { background: rgba(255,255,255,0.25); }
.btn-biome.active { background: #ff8f00; border-color: #ffe082; font-weight: 700; }

.resource-panel { padding: 12px 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.coin-display { font-size: 18px; font-weight: 800; color: #ffd54f; }
.btn-upgrade {
    background: linear-gradient(135deg, #00897b, #00bfa5);
    border: none; color: #fff; padding: 7px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px;
}
.btn-upgrade:hover { filter: brightness(1.1); }

.toast-banner {
    position: absolute; top: 110px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 143, 0, 0.9); color: #fff; padding: 10px 22px;
    border-radius: 20px; font-weight: 700; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    animation: popIn 0.25s ease;
}

.hud-bottom { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); }
.controls-hint { padding: 8px 18px; display: flex; gap: 18px; font-size: 12px; color: #e0f7fa; }
.controls-hint b { color: #ffd54f; }

@keyframes popIn { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
```

### `wwwroot/js/petualangEngine.js`
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BIOME_CONFIGS = {
    SungaiGunung: {
        waterColor: 0x1b8a7a, skyColor: 0x87ceeb, fogColor: 0xaad8e6,
        waveAmp: 0.22, waveFreq: 0.45, waveSpeed: 2.8, flowZ: 0.08, envColor: 0x2e7d32
    },
    HutanGambut: {
        waterColor: 0x4e3b25, skyColor: 0x5d7a67, fogColor: 0x4a6353,
        waveAmp: 0.08, waveFreq: 0.3, waveSpeed: 1.2, flowZ: 0.02, envColor: 0x1b5e20
    },
    DanauVulkanik: {
        waterColor: 0x1565c0, skyColor: 0x90caf9, fogColor: 0xb3e5fc,
        waveAmp: 0.16, waveFreq: 0.25, waveSpeed: 1.6, flowZ: 0.0, envColor: 0x37474f
    },
    KotaKanal: {
        waterColor: 0x3b6e61, skyColor: 0xffcc80, fogColor: 0xffe0b2,
        waveAmp: 0.10, waveFreq: 0.5, waveSpeed: 1.8, flowZ: 0.03, envColor: 0x546e7a
    },
    LautKarang: {
        waterColor: 0x00acc1, skyColor: 0x4fc3f7, fogColor: 0xb2ebf2,
        waveAmp: 0.28, waveFreq: 0.22, waveSpeed: 2.0, flowZ: 0.01, envColor: 0xffb74d
    },
    SamudraLepas: {
        waterColor: 0x0d2b52, skyColor: 0x37474f, fogColor: 0x455a64,
        waveAmp: 0.85, waveFreq: 0.14, waveSpeed: 2.4, flowZ: 0.02, envColor: 0x263238
    }
};

class PetualangEngineClass {
    constructor() {
        this.dotnetRef = null;
        this.currentBiome = BIOME_CONFIGS.SungaiGunung;
        this.keys = {};
        this.clock = new THREE.Clock();
        this.raftState = {
            x: 0, z: 0, yaw: 0, speed: 0, angularVel: 0, level: 1, paddlePhase: 0
        };
        this.collectibles = [];
        this.obstacles = [];
        this.particles = [];
        this.envObjects = [];
    }

    init(canvasId, dotnetRef) {
        this.dotnetRef = dotnetRef;
        const canvas = document.getElementById(canvasId);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.currentBiome.skyColor);
        this.scene.fog = new THREE.FogExp2(this.currentBiome.fogColor, 0.012);

        this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 300);
        this.camera.position.set(0, 6, -10);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.08;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 24;

        this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x224466, 0.85);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfff5e1, 1.5);
        this.sunLight.position.set(25, 40, 20);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(1024, 1024);
        this.scene.add(this.sunLight);

        const waterGeo = new THREE.PlaneGeometry(180, 180, 72, 72);
        waterGeo.rotateX(-Math.PI / 2);
        this.waterGeo = waterGeo;
        this.waterBasePos = waterGeo.attributes.position.array.slice();

        this.waterMat = new THREE.MeshStandardMaterial({
            color: this.currentBiome.waterColor,
            roughness: 0.2,
            metalness: 0.15,
            flatShading: true
        });
        this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);

        this.buildRaftAndJopi();
        this.spawnWorldObjects();

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('resize', () => this.onResize());

        this.animate();
    }

    buildRaftAndJopi() {
        this.raftGroup = new THREE.Group();
        this.raftBase = new THREE.Group();
        const bambooMat = new THREE.MeshStandardMaterial({ color: 0xc5a059, roughness: 0.7 });
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });

        for (let i = -3; i <= 3; i++) {
            const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.2, 8), bambooMat);
            log.rotation.x = Math.PI / 2;
            log.position.x = i * 0.36;
            log.castShadow = true;
            log.receiveShadow = true;
            this.raftBase.add(log);
        }
        [-1.3, 1.3].forEach(zPos => {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 0.2), ropeMat);
            beam.position.set(0, 0.15, zPos);
            this.raftBase.add(beam);
        });

        this.sailGroup = new THREE.Group();
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), bambooMat);
        mast.position.set(0, 1.6, 0.5);
        const sail = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.8, 0.06),
            new THREE.MeshStandardMaterial({ color: 0xff7043 })
        );
        sail.position.set(0, 2.0, 0.45);
        this.sailGroup.add(mast, sail);
        this.sailGroup.visible = false;
        this.raftBase.add(this.sailGroup);

        this.raftGroup.add(this.raftBase);

        this.jopiGroup = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd99b66 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
        const vestMat = new THREE.MeshStandardMaterial({ color: 0xff6d00 });
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x795548 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x37474f });

        const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.35), pantsMat);
        legs.position.y = 0.45;
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.42), vestMat);
        torso.position.y = 1.05;
        torso.castShadow = true;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skinMat);
        head.position.y = 1.68;
        head.castShadow = true;
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.08, 12), hatMat);
        hatBrim.position.y = 1.92;
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.25, 12), hatMat);
        hatTop.position.y = 2.05;

        this.paddleArmGroup = new THREE.Group();
        this.paddleArmGroup.position.set(0.45, 1.25, 0.1);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), shirtMat);
        arm.position.y = -0.2;
        const paddleStick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 6), bambooMat);
        paddleStick.rotation.x = Math.PI / 4;
        paddleStick.position.set(0.1, -0.3, 0.2);
        const paddleBlade = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.65, 0.05),
            new THREE.MeshStandardMaterial({ color: 0xffca28 })
        );
        paddleBlade.rotation.x = Math.PI / 4;
        paddleBlade.position.set(0.1, -1.1, -0.6);

        this.paddleArmGroup.add(arm, paddleStick, paddleBlade);
        this.jopiGroup.add(legs, torso, head, hatBrim, hatTop, this.paddleArmGroup);
        this.jopiGroup.position.set(0, 0.1, -0.2);

        this.raftGroup.add(this.jopiGroup);
        this.scene.add(this.raftGroup);
    }

    spawnWorldObjects() {
        [...this.collectibles, ...this.obstacles, ...this.envObjects].forEach(o => this.scene.remove(o));
        this.collectibles = [];
        this.obstacles = [];
        this.envObjects = [];

        const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16);
        coinGeo.rotateX(Math.PI / 2);
        const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xaa6c00, metalness: 0.6 });

        for (let i = 0; i < 18; i++) {
            const coin = new THREE.Mesh(coinGeo, coinMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 12 + Math.random() * 55;
            coin.position.set(Math.cos(angle) * dist, 0.8, Math.sin(angle) * dist);
            this.scene.add(coin);
            this.collectibles.push(coin);
        }

        const rockGeo = new THREE.DodecahedronGeometry(1.1, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, flatShading: true });

        for (let i = 0; i < 14; i++) {
            const rock = new THREE.Mesh(rockGeo, rockMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 16 + Math.random() * 60;
            rock.position.set(Math.cos(angle) * dist, 0.2, Math.sin(angle) * dist);
            rock.scale.set(1 + Math.random(), 0.7 + Math.random() * 0.6, 1 + Math.random());
            rock.castShadow = true;
            this.scene.add(rock);
            this.obstacles.push(rock);
        }

        const islandGeo = new THREE.ConeGeometry(8, 12, 6);
        const islandMat = new THREE.MeshStandardMaterial({ color: this.currentBiome.envColor, flatShading: true });
        for (let i = 0; i < 12; i++) {
            const island = new THREE.Mesh(islandGeo, islandMat);
            const angle = (i / 12) * Math.PI * 2;
            const dist = 70 + Math.random() * 25;
            island.position.set(Math.cos(angle) * dist, 3, Math.sin(angle) * dist);
            island.scale.set(1 + Math.random() * 1.5, 0.8 + Math.random() * 1.4, 1 + Math.random() * 1.5);
            this.scene.add(island);
            this.envObjects.push(island);
        }
    }

    getWaveHeight(x, z, time) {
        const b = this.currentBiome;
        const w1 = Math.sin(x * b.waveFreq + time * b.waveSpeed) * b.waveAmp;
        const w2 = Math.cos(z * (b.waveFreq * 0.8) + time * (b.waveSpeed * 0.7)) * (b.waveAmp * 0.75);
        return w1 + w2;
    }

    spawnSplashParticle(x, y, z) {
        const p = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.18, 0.18),
            new THREE.MeshBasicMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.85 })
        );
        p.position.set(x + (Math.random() - 0.5) * 0.8, y, z + (Math.random() - 0.5) * 0.8);
        p.userData = { life: 1.0, vy: 0.04 + Math.random() * 0.05 };
        this.scene.add(p);
        this.particles.push(p);
    }

    setBiome(biomeKey) {
        if (!BIOME_CONFIGS[biomeKey]) return;
        this.currentBiome = BIOME_CONFIGS[biomeKey];
        this.waterMat.color.setHex(this.currentBiome.waterColor);
        this.scene.background.setHex(this.currentBiome.skyColor);
        this.scene.fog.color.setHex(this.currentBiome.fogColor);
        this.envObjects.forEach(obj => obj.material.color.setHex(this.currentBiome.envColor));
    }

    upgradeRaft(level) {
        this.raftState.level = level;
        if (level >= 2) this.sailGroup.visible = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), 0.05);
        const elapsed = this.clock.getElapsedTime();

        const pos = this.waterGeo.attributes.position;
        this.waterMesh.position.set(this.raftState.x, 0, this.raftState.z);
        for (let i = 0; i < pos.count; i++) {
            const localX = this.waterBasePos[i * 3];
            const localZ = this.waterBasePos[i * 3 + 2];
            pos.setY(i, this.getWaveHeight(localX + this.raftState.x, localZ + this.raftState.z, elapsed));
        }
        pos.needsUpdate = true;
        this.waterGeo.computeVertexNormals();

        const turbo = this.keys['Space'] ? 1.8 : 1.0;
        const speedBoost = 1 + (this.raftState.level - 1) * 0.25;
        let isPaddling = false;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.raftState.speed += 14 * turbo * speedBoost * dt;
            isPaddling = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.raftState.speed -= 9 * dt;
            isPaddling = true;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.raftState.angularVel += 3.5 * dt;
            isPaddling = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.raftState.angularVel -= 3.5 * dt;
            isPaddling = true;
        }

        this.raftState.speed *= 0.94;
        this.raftState.angularVel *= 0.88;
        this.raftState.yaw += this.raftState.angularVel * dt;
        this.raftState.x += Math.sin(this.raftState.yaw) * this.raftState.speed * dt;
        this.raftState.z += Math.cos(this.raftState.yaw) * this.raftState.speed * dt;
        this.raftState.z -= this.currentBiome.flowZ;

        const rx = this.raftState.x;
        const rz = this.raftState.z;
        const hCenter = this.getWaveHeight(rx, rz, elapsed);
        const hFront = this.getWaveHeight(rx + Math.sin(this.raftState.yaw) * 1.6, rz + Math.cos(this.raftState.yaw) * 1.6, elapsed);
        const hRight = this.getWaveHeight(rx + Math.cos(this.raftState.yaw) * 1.1, rz - Math.sin(this.raftState.yaw) * 1.1, elapsed);

        this.raftGroup.position.set(rx, hCenter + 0.08, rz);
        this.raftGroup.rotation.y = this.raftState.yaw;
        this.raftBase.rotation.x = -(hFront - hCenter) * 0.45;
        this.raftBase.rotation.z = -(hRight - hCenter) * 0.45;

        if (isPaddling) {
            this.raftState.paddlePhase += dt * 10 * turbo;
            this.paddleArmGroup.rotation.x = Math.sin(this.raftState.paddlePhase) * 0.7;
            this.jopiGroup.rotation.x = Math.sin(this.raftState.paddlePhase) * 0.1;
            if (Math.random() < 0.45) {
                this.spawnSplashParticle(rx - Math.sin(this.raftState.yaw) * 2, hCenter + 0.15, rz - Math.cos(this.raftState.yaw) * 2);
            }
        } else {
            this.paddleArmGroup.rotation.x *= 0.9;
            this.jopiGroup.rotation.x *= 0.9;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position.y += p.userData.vy;
            p.userData.life -= dt * 1.8;
            p.material.opacity = p.userData.life;
            p.scale.setScalar(p.userData.life);
            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const c = this.collectibles[i];
            c.rotation.y += dt * 2.5;
            c.position.y = this.getWaveHeight(c.position.x, c.position.z, elapsed) + 0.85;
            if (c.position.distanceTo(this.raftGroup.position) < 2.3) {
                const angle = Math.random() * Math.PI * 2;
                c.position.set(rx + Math.cos(angle) * 40, 0.8, rz + Math.sin(angle) * 40);
                if (this.dotnetRef) this.dotnetRef.invokeMethodAsync('OnItemCollected', 25);
            }
        }

        this.obstacles.forEach(obs => {
            obs.position.y = this.getWaveHeight(obs.position.x, obs.position.z, elapsed) * 0.3;
            if (obs.position.distanceTo(this.raftGroup.position) < 2.2) {
                this.raftState.speed = -this.raftState.speed * 0.6 - 2;
                if (this.dotnetRef) this.dotnetRef.invokeMethodAsync('OnObstacleHit', 10);
            }
        });

        const targetOffset = new THREE.Vector3(
            rx - Math.sin(this.raftState.yaw) * 9,
            hCenter + 5.5,
            rz - Math.cos(this.raftState.yaw) * 9
        );
        this.controls.target.lerp(new THREE.Vector3(rx, hCenter + 1.2, rz), 0.1);
        this.camera.position.lerp(targetOffset, 0.04);
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.PetualangEngine = new PetualangEngineClass();
```

---

## 7. Roadmap Pengembangan Lanjutan

1. **Aset 3D Detail (Blender -> `.glb`):** Ekspor model Bang Jopi dengan animasi *skeletal rigging* (`GLTFLoader`), tambahkan perahu klotok, rumah panggung/gadang tepi sungai, dan terumbu karang.
2. **Audio Dinamis Nusantara:** Campuran suara riak sungai, ombak samudra, serta musik adaptif (suling Sunda di danau tenang, kendang & gamelan saat melewati jeram/badai).
3. **Sistem Save/Load Lokal WPF:** Simpan progres `GameStateService` ke `%AppData%/PetualangAir/save.json` menggunakan `System.Text.Json`.
4. **Dukungan Gamepad / Controller:** Gunakan Web Gamepad API atau `SharpDX.XInput` agar sensasi mendayung terasa makin seru.
````

## Implementasi Aktif

Solusi aktif berada di `PetualangAir.Wpf/`. Seluruh kategori fitur lanjutan telah terhubung ke permainan: 12 misi, barter, reputasi, progres bioma, lingkungan khas, GLB skeletal, soundtrack adaptif, cuaca, dan gamepad. Menu utama, options grafis/audio/kamera, scrolling credits, serta pipeline installer GitHub ditambahkan pada implementasi. Starter code di atas dipertahankan sebagai rancangan awal. Lihat `README.md` dan `docs/` untuk aturan terbaru, screenshot, pengujian, serta cara rilis.
