# Build dan rilis

Repo: [SyubadubinStudios/Petualang.Air](https://github.com/SyubadubinStudios/Petualang.Air). Workspace lokal: `C:\experiment\syubadubin\Petualang.Air`.

## Membuat installer lokal

```powershell
./tools/build-release.ps1 -Version 1.0.0
```

Skrip menjalankan pengujian C# dan JS, mem-publish `win-x64` self-contained, memverifikasi aset, lalu mengompilasi installer Inno Setup 6.4.3. Compiler dan bootstrapper WebView2 diunduh dari sumber resmi dan disimpan dalam `artifacts/dependencies/`. Hash SHA-256 compiler dipatok dari manifest `.issig` rilis resmi; bootstrapper WebView2 diperiksa tanda tangan Authenticode Microsoft-nya.

Hasil dalam `artifacts/release/`:

- `PetualangAir-Setup-1.0.0-win-x64.exe`
- `PetualangAir-1.0.0-win-x64-portable.zip`
- `SHA256SUMS.txt`

Installer memasang game untuk pengguna aktif di `%LocalAppData%/Programs/Syubadubin Studios/Petualang Air`, membuat shortcut Start Menu, menyediakan pilihan shortcut desktop, dan mendukung uninstall. .NET sudah disertakan. WebView2 diperiksa sebelum instalasi; jika belum tersedia, bootstrapper Microsoft memerlukan internet untuk memasangnya. Setelah dependensi tersedia, game tidak memerlukan internet.

Save di `%AppData%/PetualangAir/` sengaja tidak dihapus saat uninstall. Versi portable harus diekstrak seluruhnya; jangan menjalankan hanya `.exe` yang dipisahkan dari aset dan DLL.

## Paket Linux dan macOS

```bash
cd desktop
npm ci
npm run build:web          # dotnet publish PetualangAir.Web ke desktop/build/web
npm run dist -- --linux    # atau --mac --x64 --arm64 (hanya di macOS)
```

Hasil dalam `artifacts/desktop/`: AppImage dan `tar.gz` Linux x64, serta `dmg` dan `zip` macOS untuk `x64` dan `arm64`. Paket membawa Electron (Chromium) dan runtime .NET WebAssembly, sehingga pemain tidak perlu memasang .NET maupun WebView.

- **Linux:** `chmod +x PetualangAir-*.AppImage` lalu jalankan. AppImage memerlukan FUSE 2 (`libfuse2`); tanpa itu gunakan `--appimage-extract-and-run` atau paket `tar.gz`.
- **macOS:** paket belum ditandatangani dengan Developer ID dan belum dinotarisasi, sehingga Gatekeeper menolaknya saat pertama dibuka. Setelah menyalin aplikasi ke `/Applications`, jalankan `xattr -cr "/Applications/Petualang Air.app"`, atau izinkan melalui System Settings, Privacy & Security.
- Save berada di `~/.config/PetualangAir/save.json` (Linux) dan `~/Library/Application Support/PetualangAir/save.json` (macOS).

## GitHub Actions

[Workflow release](../.github/workflows/release.yml) berjalan pada push `main`/`feat/**`, pull request ke `main`, manual dispatch, dan tag `v*`. Run biasa menghasilkan artifact yang dapat diunduh; **hanya push tag rilis** yang menerbitkan GitHub Release.

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Tag harus menunjuk commit yang sudah direview dan lulus pengujian. Gunakan versi `major.minor.patch`; workflow menolak input versi lain. Rilis berisi installer dan portable ZIP Windows, paket Linux dan macOS, serta checksum per platform (`SHA256SUMS.txt`, `SHA256SUMS-linux.txt`, `SHA256SUMS-macos.txt`). Job `desktop` menjalankan tes domain, tes JS, dan uji asap Electron pada runner Linux dan macOS sebelum memaketkan. Rerun tag yang sama mengganti aset bernama sama melalui `gh release upload --clobber`.

Action dipatok ke commit SHA. Job build hanya memiliki `contents: read`; job release terpisah memperoleh `contents: write`. Tidak diperlukan PAT atau secret buatan pengguna untuk menerbitkan rilis. Manual dispatch hanya membuat artifact, tidak menciptakan tag atau rilis.

## Status penandatanganan

Installer Windows dan paket macOS belum ditandatangani dengan sertifikat penerbit Syubadubin Studios. Integritas compiler dan tanda tangan bootstrapper diverifikasi, tetapi itu bukan tanda tangan installer game. Windows dapat menampilkan SmartScreen untuk binary baru yang belum memiliki reputasi. Tambahkan proses signing dengan sertifikat organisasi sebelum distribusi komersial; jangan menyimpan private key di repo.

Referensi: [Inno Setup](https://jrsoftware.org/ishelp/), [distribusi WebView2](https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution).
