param(
    [ValidatePattern('^\d+\.\d+\.\d+$')][string]$Version = '1.2.0',
    [switch]$SkipTests
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
Push-Location -LiteralPath $repoRoot
try {
    if (-not $SkipTests) {
        dotnet test PetualangAir.sln -c Release
        if ($LASTEXITCODE -ne 0) { throw 'Domain tests failed' }
        node --test tools/input.test.mjs tools/weather.test.mjs tools/habitats.test.mjs
        if ($LASTEXITCODE -ne 0) { throw 'JavaScript tests failed' }
    }
    $publishDir = Join-Path $repoRoot "artifacts/publish-$Version"
    $releaseDir = Join-Path $repoRoot 'artifacts/release'
    $dependencyDir = Join-Path $repoRoot 'artifacts/dependencies'
    New-Item -ItemType Directory -Force $publishDir,$releaseDir,$dependencyDir | Out-Null
    dotnet publish PetualangAir.Wpf/PetualangAir.Wpf.csproj -c Release -r win-x64 --self-contained true -p:Version=$Version -p:DebugType=None -p:DebugSymbols=false -o $publishDir
    if ($LASTEXITCODE -ne 0) { throw 'Publish failed' }
    foreach ($asset in @('PetualangAir.Wpf.exe','wwwroot/models/bang-jopi.glb','wwwroot/audio/jejak-air.ogg','wwwroot/js/graphics.js')) {
        if (-not (Test-Path -LiteralPath (Join-Path $publishDir $asset))) { throw "Missing published asset: $asset" }
    }
    $bootstrapper = Join-Path $dependencyDir 'MicrosoftEdgeWebview2Setup.exe'
    if (-not (Test-Path -LiteralPath $bootstrapper) -or (Get-Item -LiteralPath $bootstrapper).Length -eq 0) {
        Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile $bootstrapper -UseBasicParsing -TimeoutSec 120
    }
    $signature = Get-AuthenticodeSignature -LiteralPath $bootstrapper
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Microsoft Corporation') { throw 'WebView2 bootstrapper signature validation failed' }
    $compilerRoot = Join-Path $dependencyDir 'InnoSetup-6.4.3'
    $compiler = Join-Path $compilerRoot 'ISCC.exe'
    if (-not (Test-Path -LiteralPath $compiler)) {
        $setup = Join-Path $dependencyDir 'innosetup-6.4.3.exe'
        Invoke-WebRequest -Uri 'https://github.com/jrsoftware/issrc/releases/download/is-6_4_3/innosetup-6.4.3.exe' -OutFile $setup -UseBasicParsing -TimeoutSec 120
        # Inno 6.4.3 uses its upstream .issig signature, not Windows Authenticode.
        # Pinned file-hash from the official is-6_4_3 release's .exe.issig manifest.
        $compilerHash = 'f3c42116542c4cc57263c5ba6c4feabfc49fe771f2f98a79d2f7628b8762723b'
        if ((Get-FileHash -LiteralPath $setup -Algorithm SHA256).Hash.ToLowerInvariant() -ne $compilerHash) { throw 'Inno Setup checksum validation failed' }
        $arguments = @('/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART','/NOICONS','/CURRENTUSER',('/DIR="' + $compilerRoot + '"'))
        $process = Start-Process -FilePath $setup -ArgumentList $arguments -WindowStyle Hidden -PassThru -Wait
        if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $compiler)) { throw 'Inno Setup installation failed' }
    }
    & $compiler "/DAppVersion=$Version" "/DPublishDir=$publishDir" "/DOutputDir=$releaseDir" "/DBootstrapper=$bootstrapper" (Join-Path $repoRoot 'installer/PetualangAir.iss')
    if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed' }
    $portable = Join-Path $releaseDir "PetualangAir-$Version-win-x64-portable.zip"
    Compress-Archive -Path (Join-Path $publishDir '*') -DestinationPath $portable -Force
    $installer = Join-Path $releaseDir "PetualangAir-Setup-$Version-win-x64.exe"
    @($installer,$portable) | ForEach-Object { $hash=Get-FileHash -LiteralPath $_ -Algorithm SHA256; "$($hash.Hash.ToLowerInvariant())  $([IO.Path]::GetFileName($_))" } | Set-Content -Encoding ascii (Join-Path $releaseDir 'SHA256SUMS.txt')
    Write-Output "Release artifacts: $releaseDir"
} finally { Pop-Location }
