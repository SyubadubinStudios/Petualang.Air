# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Petualang Air is a Windows rafting/exploration game: a WPF window hosting a Blazor WebView (WebView2) whose Razor UI drives a Three.js engine. User-facing text, docs (`README.md`, `docs/`, `desain-game.md`), and domain identifiers are in Indonesian — keep names such as `KoinNusantara`, `LevelRakit`, `BiomaType.HutanGambut` as they are.

`AGENTS.md` predates the implementation (it describes a design-stage repo targeting .NET 8 with no tests). Its style rules still apply, but `docs/ARCHITECTURE.md` and this file describe the actual structure.

## Commands

Requires .NET SDK 10 (Windows). Node.js is only needed for the JS tests; no `npm install` is required.

```powershell
dotnet run --project PetualangAir.Wpf            # launch the game
dotnet build PetualangAir.sln -c Release
dotnet test PetualangAir.sln -c Release          # xUnit domain tests
npm test                                         # node --test tools/*.test.mjs
./tools/build-release.ps1 -Version 1.0.0         # tests + self-contained publish + Inno Setup installer + portable zip
```

Single tests:

```powershell
dotnet test PetualangAir.sln --filter "FullyQualifiedName~GameStateTests"   # class or method name
node --test tools/weather.test.mjs
```

There is no linter. CI runs `node --check` on every file in `PetualangAir.Wpf/wwwroot/js/` before packaging, so do the same after editing engine JS.

Runtime smoke test against the real WebView2 (needs Python with `websocket-client`). Always point the game at a throwaway save first — the script mutates it:

```powershell
$env:PETUALANG_AIR_SAVE_PATH = "$PWD/artifacts/qa-save.json"
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--remote-debugging-port=9228'
dotnet run --project PetualangAir.Wpf
python tools/runtime_smoke.py      # in a second terminal
```

Asset regeneration (only when changing models or music; GLB/Ogg outputs are committed):

```powershell
blender --background --python tools/build_assets.py   # Blender, tested with 5.2
python tools/build_music.py                           # NumPy + FFmpeg
```

## Architecture

Three layers, each owning one concern:

- **WPF host** (`MainWindow.xaml(.cs)`): builds the DI container, registers `GameStateService` as a singleton, mounts `GamePage` into `wwwroot/index.html`, and saves on window close.
- **C# domain + UI** (`Services/GameStateService.cs`, `Components/GamePage.razor`): `GameStateService` is the single source of truth for the mission catalog, market, prices, barter costs, unlock rules, options, save/migration. `GamePage.razor` is the only component: main menu, HUD, market, journal, options, credits, and all JS interop.
- **JS engine** (`wwwroot/js/`): `petualangEngine.js` owns the render/simulation loop, buoyancy, camera, and lifecycle, exposed as `window.PetualangEngine`. It composes `world.js`/`nature.js` (biomes, GLB assets, obstacles, collectibles), `graphics.js` (sky, water, post-processing, quality presets), `weather.js` + `weatherRules.js`, `input.js` (keyboard/gamepad/menu navigation), and `audio.js`.

### Interop contract

- C# → JS: `GamePage` calls `startGame` (lazy-imports the engine module) and then `PetualangEngine.*` methods (`configure`, `setBiome`, `upgradeRaft`, `setStamina`, `setPaused`, `setMenuMode`, …). `SyncEngine()` pushes health/audio/options in one `configure` call.
- JS → C#: the engine calls `[JSInvokable]` methods on `GamePage` (`OnResourceCollected`, `OnObstacleHit`, `OnStaminaChanged`, `OnDockChanged`, `OnTelemetry`, `OnAction`) through `emit()`, which serializes calls on a promise queue and drops them after dispose.
- Interop is event-driven only: collection, collision, dock changes, telemetry once per second, stamina every 300 ms. Never add per-frame or per-vertex interop; rendering, input, and buoyancy math stay in JS.
- Adding an engine event or command means changing both sides: the `emit`/method in `petualangEngine.js` and the matching `[JSInvokable]`/`InvokeVoidAsync` in `GamePage.razor`. Biome keys cross the boundary as `BiomaType` enum names (e.g. `'SamudraLepas'`), which the JS modules match as strings.

### Constraints that are easy to break

- `PetualangAir.Tests` targets plain `net10.0` and compiles `GameStateService.cs` via a linked `<Compile Include>` rather than a project reference. The service must therefore stay free of WPF, Blazor, and JS-interop dependencies.
- JS unit tests import modules directly in Node (`weatherRules.js`, `input.js`), so the logic they cover must not require `three` or DOM globals at import time. That is why pure weather-phase rules live in `weatherRules.js`, separate from `weather.js`.
- Validation of prices, barter materials, dock requirements, one-time rewards, and unlocks belongs in C#, not in the engine.
- Mission counters are separate from inventory stock: selling items must not reduce mission progress.
- Saves are written to a temp file and swapped atomically. The save path is `%AppData%/PetualangAir/save.json`, overridable with `PETUALANG_AIR_SAVE_PATH` (tests and QA use this). Loading clamps/validates every field, and version-1 saves migrate without revoking visited biomes. "New expedition" must back up to `save.json.previous` first (abort if the backup fails) and must preserve options.
- The engine must release render targets, geometries, materials, listeners, the audio context, and the .NET reference on dispose.
- Three.js 0.170.0 is vendored under `wwwroot/vendor/three/` and resolved through the import map in `index.html` (the game runs offline — no CDN). `addons/objects/Water.js` carries a small local patch that frees its reflection render target; preserve it if the vendored copy is ever updated.
- `*.blend` files are excluded from build output; `build-release.ps1` fails if expected published assets (GLB, Ogg, engine JS) are missing.

## Conventions

- Four-space indentation; PascalCase C#, camelCase JS, kebab-case CSS classes.
- Do not commit `.mcp.json`, `.claude/`, personal saves, build output, or WebView2 caches. `artifacts/` (QA saves, screenshots, release output, downloaded build dependencies) is gitignored.
- Visual changes: screenshots in `docs/screenshots/` are captured from the running app (`tools/capture_docs.py`), not mockups. `docs/TESTING.md` lists the manual pre-release checklist.

## Release

`.github/workflows/release.yml` builds the installer, portable zip, and `SHA256SUMS.txt` on pushes to `main`/`feat/**`, PRs to `main`, and manual dispatch; only pushing a `vMAJOR.MINOR.PATCH` tag publishes a GitHub Release. Actions are pinned to commit SHAs, and `build-release.ps1` pins the Inno Setup 6.4.3 compiler by SHA-256 and checks the WebView2 bootstrapper's Authenticode signature — keep those verifications when touching the pipeline. Details are in `docs/RELEASE.md`.
