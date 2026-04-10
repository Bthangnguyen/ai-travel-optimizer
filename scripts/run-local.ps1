param(
    [string]$HostAddress = "127.0.0.1",
    [int]$BackendPort = 8000,
    [switch]$Offline
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendScript = Join-Path $PSScriptRoot "run-backend.ps1"
$mobileScript = Join-Path $PSScriptRoot "run-mobile-web.ps1"
$apiUrl = "http://$HostAddress`:$BackendPort"

if (-not (Test-Path $backendScript)) {
    throw "Missing scripts/run-backend.ps1"
}

if (-not (Test-Path $mobileScript)) {
    throw "Missing scripts/run-mobile-web.ps1"
}

Set-Location $projectRoot

Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-ExecutionPolicy", "Bypass",
    "-File", $backendScript,
    "-HostAddress", $HostAddress,
    "-Port", $BackendPort
) -WorkingDirectory $projectRoot | Out-Null

Start-Sleep -Seconds 4

$args = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $mobileScript,
    "-ApiUrl", $apiUrl
)

if ($Offline) {
    $args += "-Offline"
}

& powershell.exe @args

