param(
    [string]$ApiUrl = "http://127.0.0.1:8000",
    [int]$BackendPort = 8000,
    [int]$WebPort = 19006
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot "mobile"
Set-Location $projectRoot

if (-not (Test-Path (Join-Path $projectRoot ".deps"))) {
    throw "Missing .deps. Install backend dependencies first."
}

if (-not (Test-Path (Join-Path $mobileRoot "node_modules"))) {
    throw "Missing mobile/node_modules. Run npm install in mobile first."
}

$homePath = Join-Path $mobileRoot ".expo-home"
$appData = Join-Path $homePath "AppData\Roaming"
$localAppData = Join-Path $homePath "AppData\Local"
New-Item -ItemType Directory -Force -Path $homePath, $appData, $localAppData | Out-Null

$exportDir = "web-dist-" + (Get-Date -Format "yyyyMMddHHmmss")
$backendJob = $null
$webJob = $null

try {
    Set-Location $mobileRoot
    $env:HOME = $homePath
    $env:USERPROFILE = $homePath
    $env:APPDATA = $appData
    $env:LOCALAPPDATA = $localAppData
    $env:EXPO_NO_TELEMETRY = "1"
    $env:EXPO_OFFLINE = "1"
    $env:CI = "1"
    $env:EXPO_PUBLIC_API_URL = $ApiUrl
    npx expo export --platform web --output-dir $exportDir | Out-Host

    Set-Location $projectRoot
    $backendJob = Start-Job -ScriptBlock {
        param($root, $port)
        Set-Location $root
        python -c @"
import uvicorn
import fastapi
import starlette
import pydantic
import google
import h11
import sys

sys.path.insert(0, '.')
sys.path.insert(0, '.deps')

from backend.app.main import app

uvicorn.run(
    app,
    host='127.0.0.1',
    port=$port,
    log_level='warning',
    http='h11',
    loop='asyncio',
    ws='none',
)
"@
    } -ArgumentList $projectRoot, $BackendPort

    $webJob = Start-Job -ScriptBlock {
        param($root, $port)
        Set-Location $root
        python -m http.server $port
    } -ArgumentList (Join-Path $mobileRoot $exportDir), $WebPort

    Start-Sleep -Seconds 8

    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/health"
    $planBody = @{ prompt = "Plan a Hue day trip from 08:00 with culture and food, budget 1200000, 5 stops" } | ConvertTo-Json
    $plan = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/plan" -Method Post -ContentType "application/json" -Body $planBody
    $index = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$WebPort"

    [pscustomobject]@{
        backend_health        = $health.status
        engine                = $plan.engine_used
        fallback_level        = $plan.fallback_level
        stops                 = $plan.itinerary.Count
        first_stop            = $plan.itinerary[0].name
        frontend_status       = $index.StatusCode
        frontend_has_html     = [bool]($index.Content -match "<!DOCTYPE html>")
        frontend_has_bundle   = [bool]($index.Content -match "_expo/static/js/web/")
        export_dir            = Join-Path $mobileRoot $exportDir
    } | Format-List | Out-Host
}
finally {
    if ($backendJob) {
        Stop-Job -Job $backendJob -ErrorAction SilentlyContinue | Out-Null
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue | Out-Null
        Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    }
    if ($webJob) {
        Stop-Job -Job $webJob -ErrorAction SilentlyContinue | Out-Null
        Receive-Job -Job $webJob -ErrorAction SilentlyContinue | Out-Null
        Remove-Job -Job $webJob -Force -ErrorAction SilentlyContinue
    }
}
