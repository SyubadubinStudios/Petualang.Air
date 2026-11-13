# Pengujian dan bukti visual

## Pemeriksaan otomatis

```powershell
dotnet build PetualangAir.sln -c Release
dotnet test PetualangAir.sln -c Release
npm test
```

Node.js test runner tidak memerlukan paket npm tambahan. Tes domain mencakup keseluruhan kampanye tanpa pemberian koin debug, reward sekali, barter, inventaris, diskon, bumper, minuman, invalid save, migrasi, options, dan cadangan ekspedisi baru. Tes JS mencakup deadzone, analog sticks/triggers, disconnect, serta batas fase cuaca.

## Integrasi WebView2

Gunakan file save percobaan baru agar pengujian tidak mengubah progres pemain:

```powershell
$env:PETUALANG_AIR_SAVE_PATH = "$PWD/artifacts/qa-save.json"
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--remote-debugging-port=9228'
dotnet run --project PetualangAir.Wpf
# Di terminal lain (Python + websocket-client):
python tools/runtime_smoke.py
```

Skrip menguji GLB skeletal, pickup aktual, callback misi, keenam bioma, badai/pelangi, pembelian aksesori, minuman, input controller virtual, audio, dan tampilan penutup kampanye. Skrip sengaja mengubah save percobaan untuk menjalankan jalur kampanye. Jangan gunakan save asli. Port debugging hanya untuk pengembangan; tidak diaktifkan oleh build distribusi.

## Pemeriksaan manual sebelum rilis

1. Mulai dari menu utama, lanjutkan, buka options, ubah preset/FOV/audio, dan buka ulang untuk memeriksa persistensi.
2. Coba gerakan, turbo, kamera, tabbing menu, gamepad, fokus jendela, serta layar penuh.
3. Coba keenam bioma, koleksi, tabrakan sampai rusak, pemulihan, barter, dan artefak.
4. Periksa badai, pelangi, mode malam, lampu, serta kualitas air pada setiap preset.
5. Dengarkan semua soundtrack, crossfade, mute, dan pemisahan volume musik/efek.
6. Periksa credits berjalan, jeda credits, mode pengurangan gerakan, dan ekspedisi baru dengan cadangan.
7. Jalankan installer pada Windows bersih, termasuk kasus WebView2 belum terpasang, lalu uji upgrade dan uninstall.

## Screenshot

Screenshot diambil langsung dari aplikasi WebView2, bukan mockup atau gambar generatif:

- [Menu utama](screenshots/main-menu.png)
- [Gameplay](screenshots/gameplay.png)
- [Options](screenshots/options.png)
- [Pasar](screenshots/market.png)
- [Credits](screenshots/credits.png)

Uji controller virtual membuktikan pemetaan dan penanganan disconnect, bukan kompatibilitas semua perangkat fisik. Pengujian shader/runtime tidak membuktikan target 60 FPS pada semua GPU atau kualitas audio menurut pendengaran. Catat perangkat dan preset saat melakukan pengujian performa.
