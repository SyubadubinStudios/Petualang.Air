# Petualang Air

Dibuat oleh **Ariana Mischa Fadhila dari Syubadubin Studios**.

Prototipe game desktop Windows berdasarkan [desain-game.md](desain-game.md), menggunakan WPF, Blazor Hybrid, dan Three.js. Buka `PetualangAir.sln` untuk mengembangkan solusi.

## Menjalankan

Prasyarat: Windows 10 versi 2004 atau lebih baru, .NET SDK 10, Microsoft Edge WebView2 Runtime, dan GPU dengan WebGL2. Internet diperlukan untuk restore NuGet pertama; Three.js 0.170.0 disertakan lokal beserta lisensinya.

```powershell
dotnet restore PetualangAir.sln
dotnet run --project PetualangAir.Wpf
```

## Fitur prototipe

- Bang Jopi dan rakit bambu 3D prosedural; animasi mendayung dan daya apung empat titik.
- Enam pilihan bioma dengan warna, gelombang, dan arus berbeda.
- Koin, rintangan dengan jeda kerusakan, empat level upgrade, dan pemulihan rakit gratis.
- Stamina turbo yang pulih otomatis; HUD ketahanan, stamina, koin, dan notifikasi.
- Kamera orbit dan penyimpanan otomatis koin, level, ketahanan, serta bioma di `%AppData%/PetualangAir/save.json`. Posisi dunia dan stamina direset saat membuka ulang.
- Kredit pembuat di HUD serta metadata aplikasi.

## Kontrol

Klik area permainan untuk mengaktifkan keyboard setelah memakai tombol HUD. `W/S` atau panah atas/bawah untuk maju/mundur; `A/D` atau panah kiri/kanan untuk berbelok; tahan `Space` bersama maju untuk turbo; seret mouse untuk mengorbit dan gunakan roda mouse untuk zoom.

## Build dan pengujian

```powershell
dotnet build PetualangAir.sln -c Release
dotnet test PetualangAir.sln -c Release
node --check PetualangAir.Wpf/wwwroot/js/petualangEngine.js
```

Node.js hanya diperlukan untuk pemeriksaan sintaks JavaScript, bukan menjalankan game. Pengujian xUnit mencakup ekonomi upgrade, batas state, pergantian bioma, round-trip penyimpanan, serta data rusak. Pemeriksaan manual: coba semua bioma, kontrol, kamera, tabrakan sampai rakit rusak, pemulihan, dan buka ulang untuk memeriksa progres.

Untuk membuat folder distribusi Windows x64 dengan runtime .NET:

```powershell
dotnet publish PetualangAir.Wpf -c Release -r win-x64 --self-contained true -o artifacts/publish
```

Distribusikan seluruh folder hasil publish. WebView2 Runtime tetap diperlukan.

## Struktur dan pengembangan lanjutan

`Services/` menyimpan state dan persistensi, `Components/` mengelola HUD, dan `wwwroot/js/` menjalankan simulasi serta rendering. Interop mengirim event permainan dan pembaruan stamina berkala, bukan setiap frame.

Implementasi ini mencakup starter yang dapat dimainkan. Misi ekologi/budaya, pasar barter, penguncian progres bioma, variasi lingkungan khusus per bioma, model GLB detail, audio adaptif, cuaca kompleks, dan gamepad dalam rancangan masih merupakan pengembangan lanjutan. Target 60 FPS belum dibenchmark pada berbagai perangkat.

Referensi integrasi: [dokumentasi resmi Blazor Hybrid](https://learn.microsoft.com/aspnet/core/blazor/hybrid/?view=aspnetcore-10.0). Lisensi Three.js tersedia di `PetualangAir.Wpf/wwwroot/vendor/three/LICENSE`.
