#define AppName "Petualang Air"
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef PublishDir
  #define PublishDir "..\artifacts\publish"
#endif
#ifndef OutputDir
  #define OutputDir "..\artifacts\release"
#endif
#ifndef Bootstrapper
  #define Bootstrapper "..\artifacts\dependencies\MicrosoftEdgeWebview2Setup.exe"
#endif

[Setup]
AppId={{74D8A84A-DB8A-4FAF-B930-9AB8AE163850}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher=Syubadubin Studios
AppPublisherURL=https://github.com/SyubadubinStudios/Petualang.Air
AppSupportURL=https://github.com/SyubadubinStudios/Petualang.Air/issues
AppCopyright=2026 Syubadubin Studios - Ariana Mischa Fadhila
DefaultDirName={localappdata}\Programs\Syubadubin Studios\Petualang Air
DefaultGroupName=Syubadubin Studios
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0.19041
OutputDir={#OutputDir}
OutputBaseFilename=PetualangAir-Setup-{#AppVersion}-win-x64
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
LicenseFile=..\LICENSE
UninstallDisplayIcon={app}\PetualangAir.Wpf.exe
CloseApplications=yes
RestartApplications=no
SetupLogging=yes
VersionInfoVersion={#AppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Files]
Source: "{#PublishDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.pdb,*.WebView2\*"
Source: "{#Bootstrapper}"; Flags: dontcopy

[Icons]
Name: "{group}\Petualang Air"; Filename: "{app}\PetualangAir.Wpf.exe"
Name: "{autodesktop}\Petualang Air"; Filename: "{app}\PetualangAir.Wpf.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\PetualangAir.Wpf.exe"; Description: "Launch Petualang Air"; Flags: nowait postinstall skipifsilent

[Code]
function WebView2Installed: Boolean;
var Version: String;
begin
  Result := (RegQueryStringValue(HKLM32, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0'));
  if not Result then
    Result := (RegQueryStringValue(HKCU, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0'));
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var ExitCode: Integer;
begin
  Result := '';
  if not WebView2Installed then
  begin
    ExtractTemporaryFile('MicrosoftEdgeWebview2Setup.exe');
    if not Exec(ExpandConstant('{tmp}\MicrosoftEdgeWebview2Setup.exe'), '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, ExitCode) then
      Result := 'WebView2 Runtime could not be started. Install the Microsoft WebView2 Evergreen Runtime, then run this installer again.'
    else if (ExitCode <> 0) or not WebView2Installed then
      Result := 'WebView2 Runtime installation did not complete. An internet connection is required for the first runtime installation. Install WebView2 from Microsoft, then retry.';
  end;
end;
