param(
    [string]$ApiUrl = "http://127.0.0.1:8000",
    [switch]$Offline
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot "mobile"
Set-Location $mobileRoot

if (-not (Test-Path (Join-Path $mobileRoot "node_modules"))) {
    throw "Missing mobile/node_modules. Run npm install in mobile first."
}

$homePath = Join-Path $mobileRoot ".expo-home"
$appData = Join-Path $homePath "AppData\Roaming"
$localAppData = Join-Path $homePath "AppData\Local"
New-Item -ItemType Directory -Force -Path $homePath, $appData, $localAppData | Out-Null

$env:HOME = $homePath
$env:USERPROFILE = $homePath
$env:APPDATA = $appData
$env:LOCALAPPDATA = $localAppData
$env:EXPO_NO_TELEMETRY = "1"
$env:EXPO_PUBLIC_API_URL = $ApiUrl

if ($Offline) {
    $env:EXPO_OFFLINE = "1"
}

npx expo start --web

