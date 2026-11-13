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

## Host Electron (Linux/macOS)

```bash
cd desktop
npm ci
npm run build:web
npm run smoke
```

Uji asap menjalankan Electron dengan save sementara lalu memeriksa label edisi, konteks WebGL2, kompilasi shader, decoding tiga soundtrack Ogg, tulisan save ke disk, keluar melalui jembatan shell, dan pemulihan progres setelah aplikasi dibuka ulang. Screenshot disimpan ke `artifacts/desktop-smoke-<platform>.png`. Pada mesin tanpa GPU gunakan `SMOKE_SOFTWARE_GL=1`; di Linux tanpa layar jalankan melalui `xvfb-run`. CI menjalankannya pada runner Linux dan macOS sebelum pemaketan; hasil itu membuktikan host berfungsi di runner tersebut, bukan performa atau kompatibilitas GPU dan gamepad fisik.

## Pemeriksaan manual sebelum rilis

1. Mulai dari menu utama, lanjutkan, buka options, ubah preset/FOV/audio, dan buka ulang untuk memeriksa persistensi.
2. Coba gerakan, turbo, kamera, tabbing menu, gamepad, fokus jendela, serta layar penuh.
3. Coba keenam bioma, koleksi, tabrakan sampai rusak, pemulihan, barter, dan artefak.
4. Periksa badai, pelangi, mode malam, lampu, serta kualitas air pada setiap preset.
5. Dengarkan semua soundtrack, crossfade, mute, dan pemisahan volume musik/efek.
6. Periksa credits berjalan, jeda credits, mode pengurangan gerakan, dan ekspedisi baru dengan cadangan.
7. Jalankan installer pada Windows bersih, termasuk kasus WebView2 belum terpasang, lalu uji upgrade dan uninstall.
8. Pada Linux dan macOS fisik, jalankan paket rilis lalu ulangi langkah 1–6, termasuk gamepad, layar penuh, dan lokasi save.

## Screenshot

Screenshot diambil langsung dari aplikasi WebView2, bukan mockup atau gambar generatif:

- [Menu utama](screenshots/main-menu.png)
- [Gameplay](screenshots/gameplay.png)
- [Options](screenshots/options.png)
- [Pasar](screenshots/market.png)
- [Credits](screenshots/credits.png)

Uji controller virtual membuktikan pemetaan dan penanganan disconnect, bukan kompatibilitas semua perangkat fisik. Pengujian shader/runtime tidak membuktikan target 60 FPS pada semua GPU atau kualitas audio menurut pendengaran. Catat perangkat dan preset saat melakukan pengujian performa.


## Validasi peningkatan aset Blender (13 November 2026)

- `python tools/validate_assets.py`: lima GLB lolos batas geometri/ukuran, tekstur tertanam, UV, PBR, serta kontrak skin dan animasi.
- `dotnet test PetualangAir.Tests`: 16 tes lulus.
- `node --test tools/input.test.mjs tools/weather.test.mjs`: 5 tes lulus.
- Build WPF Debug dan publish Web Release berhasil.
- `tools/runtime_smoke.py`: 21 pemeriksaan WebView2 lulus dengan save QA terpisah; enam bioma, empat animasi, aksesori, progres, audio, dan WebGL diperiksa.
- `tools/capture_docs.py`: semua preset, tiga soundtrack, dan jeda credits lulus; lima screenshot diperbarui dari aplikasi.

Build host web sudah diperiksa, tetapi paket native Linux/macOS dan benchmark GPU fisik tidak dijalankan ulang dalam sesi ini. Status CI untuk commit rilis tersedia pada halaman GitHub Actions.


## Validasi flora dan serangga tambahan

`python tools/validate_assets.py` juga memeriksa enam GLB ekosistem: maksimal 1,5 MB, 12.000 segitiga, delapan primitive per aset, UV, buffer tertanam, dan pivot sayap. `node --test tools/habitats.test.mjs` menjalankan tiga tes pemetaan habitat, batas kepadatan, serta jarak aman dari dermaga dan koridor awal. Tes habitat ikut proses build installer.

Dengan aplikasi WPF memakai save QA terpisah dan CDP lokal port 9228, jalankan `python tools/runtime_ecosystem.py`. Pemeriksaan mencakup enam bioma, pivot sayap, perubahan tinggi tanaman mengapung, pangkal tanaman laut yang tetap, pemisahan dari objek tabrakan, dan error WebGL. Pergantian karang/gambut tiga kali mempertahankan 630 geometri dan 98 tekstur pada pengujian lokal; ini menguji kestabilan jumlah resource, bukan total VRAM atau target FPS. Screenshot dan laporan tersimpan di `artifacts/`, dengan satu screenshot dokumentasi di `docs/screenshots/ecosystem.png`.

Build WPF dan publish Web berhasil; delapan tes JavaScript lulus. Model dan perilaku baru diuji pada WebView2 Windows. Host native Linux/macOS belum diuji ulang untuk tambahan ini.
