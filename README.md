# Petualang Air

**Dibuat oleh Ariana Mischa Fadhila dari Syubadubin Studios.**

Game eksplorasi perairan Nusantara untuk Windows, Linux, dan macOS: enam bioma, 12 misi ekologi dan budaya, pasar terapung, rakit modular, serta perjalanan dari hulu hingga samudra.

![Menu utama Petualang Air](docs/screenshots/main-menu.png)

## Bermain

Unduh installer atau paket portable dari [GitHub Releases](https://github.com/SyubadubinStudios/Petualang.Air/releases). Installer menyertakan .NET dan memasang WebView2 bila diperlukan. Windows 10 versi 2004 atau lebih baru, CPU x64, dan GPU WebGL2 diperlukan. Setelah dependensi terpasang, game dapat dimainkan offline.

Untuk Linux (x64) tersedia AppImage dan `tar.gz`; untuk macOS (Intel dan Apple Silicon) tersedia `dmg` dan `zip`. Keduanya membawa runtime sendiri dan tidak memerlukan .NET. Paket macOS belum ditandatangani/dinotarisasi; lihat [Build & release](docs/RELEASE.md) untuk cara membukanya.

Untuk menjalankan dari source, instal .NET SDK 10:

```powershell
dotnet run --project PetualangAir.Wpf
```

Di Linux/macOS (perlu juga Node.js 22+):

```bash
cd desktop
npm ci
npm run build:web
npm start
```

WASD mendayung, Space turbo, mouse mengorbit kamera, E membuka pasar, M misi, J koleksi budaya, 1/2 minuman, Escape jeda, dan F11 layar penuh. Gamepad standar juga didukung.

## Isi ekspedisi

- Enam lingkungan: jeram pegunungan, bakau gambut, danau vulkanik, kanal kota, karang, dan samudra.
- Kupu-kupu dan capung beranimasi, teratai dan eceng gondok mengapung, serta lamun dan rumput laut di tepian karang.
- Misi, reputasi Sungai Lestari, barter, artefak budaya, kosmetik batik, dan pembukaan bioma bertahap.
- Empat rakit; jaring, lampu, bumper, kompas; kelapa dan kopi untuk stamina.
- Air berpantulan, langit atmosfer, bayangan, vegetasi bergerak, cuaca, bloom, dan preset Low–Ultra.
- Aset Blender lokal dengan tekstur PBR, detail anyaman dan kayu, dek bambu, serta karakter 13 tulang dengan empat animasi.
- Menu utama sinematik, options yang tersimpan, scrolling credits, dan tiga soundtrack orisinal adaptif.
- Save otomatis, migrasi progres lama, serta cadangan sebelum memulai ekspedisi baru.

![Gameplay Petualang Air](docs/screenshots/gameplay.png)

## Galeri lokasi

Tepian sungai dengan teratai, kupu-kupu, dan capung:

![Ekosistem sungai](docs/screenshots/river-wetlands.png)

Rawa gambut dengan tanaman mengapung:

![Rawa gambut](docs/screenshots/peat-wetlands.png)

Lamun dan rumput laut di tepian karang:

![Tepian karang](docs/screenshots/coral-shallows.png)

[Lihat enam lokasi beserta keterangan dan cara mengambil screenshot](docs/GALLERY.md).

Visual menggunakan aset semi-realistis dan pipeline sinematik; tidak diklaim setara produksi AAA. Performa bergantung perangkat dan preset.

## Dokumentasi

| Panduan | Isi |
| --- | --- |
| [Gameplay](docs/GAMEPLAY.md) | Kontrol, misi, pasar, cuaca, dan progres |
| [Grafis & audio](docs/GRAPHICS-AUDIO.md) | Options, animasi, soundtrack, dan sumber aset |
| [Arsitektur](docs/ARCHITECTURE.md) | Modul, interop, aturan domain, dan kontribusi |
| [Pengujian](docs/TESTING.md) | Tes otomatis, uji runtime, dan screenshot |
| [Build & release](docs/RELEASE.md) | Installer, GitHub Actions, tag rilis, dan checksum |

## Build dan pengujian

```powershell
dotnet build PetualangAir.sln -c Release
dotnet test PetualangAir.sln -c Release
npm test
./tools/build-release.ps1 -Version 1.0.0
```

Node.js diperlukan untuk tes JS dan host Electron Linux/macOS. Blender, Python/NumPy, dan FFmpeg hanya diperlukan bila membuat ulang model atau musik. Aset GLB/Ogg dan Three.js sudah disertakan.

Workflow GitHub membangun paket Windows, Linux, dan macOS beserta checksum pada push dan PR; push tag `vMAJOR.MINOR.PATCH` menerbitkan GitHub Release. Installer game saat ini belum ditandatangani dengan sertifikat penerbit.

Source berlisensi [MIT](LICENSE). Lihat [pemberitahuan pihak ketiga](THIRD-PARTY-NOTICES.md). Workspace pengembangan: `C:\experiment\syubadubin\Petualang.Air`.
