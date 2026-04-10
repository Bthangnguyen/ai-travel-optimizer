param(
    [string]$ApiUrl,
    [string]$PackagerHost,
    [ValidateSet("lan", "tunnel", "localhost")]
    [string]$HostType = "lan",
    [int]$Port = 8081,
    [int]$BackendPort = 8000,
    [switch]$Clear,
    [switch]$Offline
)

$ErrorActionPreference = "Stop"

function Get-LanIpv4 {
    $ipconfigOutput = ipconfig
    $candidate = $null

    foreach ($line in $ipconfigOutput) {
        if ($line -match "IPv4 Address[^\:]*:\s*(\d+\.\d+\.\d+\.\d+)") {
            $ip = $matches[1]
            if (
                $ip -notlike "127.*" -and
                $ip -notlike "169.254.*" -and
                $ip -notlike "172.26.*" -and
                $ip -notlike "172.31.*"
            ) {
                $candidate = $ip
            }
        }
    }

    if (-not $candidate) {
        throw "Unable to detect a LAN IPv4 address. Connect to Wi-Fi or pass -PackagerHost manually."
    }

    return $candidate
}

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

if ($Offline) {
    $env:EXPO_OFFLINE = "1"
} else {
    Remove-Item Env:EXPO_OFFLINE -ErrorAction SilentlyContinue
}

if ($HostType -eq "lan") {
    if (-not $PackagerHost) {
        $PackagerHost = Get-LanIpv4
    }

    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $PackagerHost

    if (-not $ApiUrl) {
        $ApiUrl = "http://$PackagerHost`:$BackendPort"
    }
} else {
    Remove-Item Env:REACT_NATIVE_PACKAGER_HOSTNAME -ErrorAction SilentlyContinue

    if (-not $ApiUrl) {
        $ApiUrl = "http://127.0.0.1:$BackendPort"
    }
}

$env:EXPO_PUBLIC_API_URL = $ApiUrl

$command = @("expo", "start", "--go", "--host", $HostType, "--port", $Port)
if ($Clear) {
    $command += "--clear"
}

$metroHostLabel = if ($PackagerHost) { $PackagerHost } else { "auto" }
Write-Host "Expo host type: $HostType"
Write-Host "Metro host: $metroHostLabel"
Write-Host "Backend URL: $ApiUrl"

if ($HostType -eq "lan" -and $PackagerHost) {
    Write-Host "Open this URL in Expo Go: exp://$PackagerHost`:$Port"
}

& npx @command
