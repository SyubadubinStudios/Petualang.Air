# Build dan rilis Windows

Repo: [SyubadubinStudios/Petualang.Air](https://github.com/SyubadubinStudios/Petualang.Air). Workspace lokal: `C:\experiment\syubadubin\Petualang.Air`.

## Membuat installer lokal

```powershell
./tools/build-release.ps1 -Version 1.0.0
```

Skrip menjalankan pengujian C# dan JS, mem-publish `win-x64` self-contained, memverifikasi aset, lalu mengompilasi installer Inno Setup 6.4.3. Compiler dan bootstrapper WebView2 diunduh dari sumber resmi, diperiksa tanda tangan Authenticode-nya, dan disimpan dalam `artifacts/dependencies/`.

Hasil dalam `artifacts/release/`:

- `PetualangAir-Setup-1.0.0-win-x64.exe`
- `PetualangAir-1.0.0-win-x64-portable.zip`
- `SHA256SUMS.txt`

Installer memasang game untuk pengguna aktif di `%LocalAppData%/Programs/Syubadubin Studios/Petualang Air`, membuat shortcut Start Menu, menyediakan pilihan shortcut desktop, dan mendukung uninstall. .NET sudah disertakan. WebView2 diperiksa sebelum instalasi; jika belum tersedia, bootstrapper Microsoft memerlukan internet untuk memasangnya. Setelah dependensi tersedia, game tidak memerlukan internet.

Save di `%AppData%/PetualangAir/` sengaja tidak dihapus saat uninstall. Versi portable harus diekstrak seluruhnya; jangan menjalankan hanya `.exe` yang dipisahkan dari aset dan DLL.

## GitHub Actions

[Workflow release](../.github/workflows/release.yml) berjalan pada push `main`/`feat/**`, pull request ke `main`, manual dispatch, dan tag `v*`. Run biasa menghasilkan artifact yang dapat diunduh; **hanya push tag rilis** yang menerbitkan GitHub Release.

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Tag harus menunjuk commit yang sudah direview dan lulus pengujian. Gunakan versi `major.minor.patch`; workflow menolak input versi lain. Rilis berisi installer, portable ZIP, dan checksum. Rerun tag yang sama mengganti aset bernama sama melalui `gh release upload --clobber`.

Action dipatok ke commit SHA. Job build hanya memiliki `contents: read`; job release terpisah memperoleh `contents: write`. Tidak diperlukan PAT atau secret buatan pengguna untuk menerbitkan rilis. Manual dispatch hanya membuat artifact, tidak menciptakan tag atau rilis.

## Status penandatanganan

Installer game belum ditandatangani dengan sertifikat penerbit Syubadubin Studios. Tanda tangan compiler/bootstrapper diverifikasi, tetapi itu bukan tanda tangan installer game. Windows dapat menampilkan SmartScreen untuk binary baru yang belum memiliki reputasi. Tambahkan proses signing dengan sertifikat organisasi sebelum distribusi komersial; jangan menyimpan private key di repo.

Referensi: [Inno Setup](https://jrsoftware.org/ishelp/), [distribusi WebView2](https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution).
