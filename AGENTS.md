# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a design-stage workspace for **Petualang Air**, a Windows rafting and exploration game. `desain-game.md` contains the Indonesian game specification, architecture, starter code, and roadmap. No application source tree, tests, or standalone game assets exist yet. `.mcp.json` and `.claude/` contain development-tool configuration.

When implementing the documented starter, use `PetualangAir.Wpf/` with:

- `App.xaml` and `MainWindow.xaml` for the WPF host.
- `Services/` for C# game state and persistence.
- `Components/` for Razor UI components.
- `wwwroot/css/` and `wwwroot/js/` for styles and the Three.js engine.

Keep design changes and their implementation consistent with `desain-game.md`.

## Build, Test, and Development Commands

There are currently no runnable build or test commands. After creating the documented `PetualangAir.Wpf/PetualangAir.Wpf.csproj`, run from the repository root:

- `dotnet restore PetualangAir.Wpf/PetualangAir.Wpf.csproj` — restore dependencies.
- `dotnet build PetualangAir.Wpf/PetualangAir.Wpf.csproj` — compile the application.
- `dotnet run --project PetualangAir.Wpf/PetualangAir.Wpf.csproj` — launch on Windows.

The starter targets .NET 8 for Windows and uses WebView2. Document actual prerequisites when adding the project.

## Coding Style & Naming Conventions

Follow the starter examples: four-space indentation, PascalCase C# types and public members, camelCase JavaScript methods and variables, and kebab-case CSS classes. Match component filenames to their types, such as `GamePage.razor`. Preserve established Indonesian domain names such as `KoinNusantara`. No formatter or linter is configured.

Keep rendering, input, and buoyancy calculations in JavaScript; use event-driven C#/JavaScript interop instead of per-frame calls.

## Testing Guidelines

No testing framework or coverage threshold exists. For documentation changes, verify paths, code fences, and consistency with the design. When executable code is added, document the chosen framework and exact test command. Prioritize game-state boundaries, upgrade costs, collision events, and biome transitions. Record manual Windows checks for controls, HUD updates, and rendering changes.

## Commit & Pull Request Guidelines

No Git metadata or commit history is available in this workspace. Use concise, imperative commit subjects, for example `Document biome transition behavior`. Keep changes focused. Pull requests should explain the change, link relevant issues when available, report validation performed, and include screenshots or video for visual changes. Explicitly identify untested behavior.
