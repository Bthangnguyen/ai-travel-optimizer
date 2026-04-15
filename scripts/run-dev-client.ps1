#!/usr/bin/env powershell
<#
  .SYNOPSIS
    Run Expo Development Server for Dev Client
  
  .DESCRIPTION
    Starts Expo development server and displays connection instructions.
    Use this AFTER you have built and installed the Development Client (APK/IPA) on your device.
    
    The Dev Client will connect to this server, allowing you to:
    - Hot reload code changes
    - Access native APIs (geofencing, background location, etc.)
    - Debug in real-time
    
  .PARAMETER BackendUrl
    URL of the backend API server (e.g., http://192.168.1.10:8000)
    If not provided, will attempt to auto-detect from backend service
    
  .EXAMPLE
    .\run-dev-client.ps1
    
  .EXAMPLE
    .\run-dev-client.ps1 -BackendUrl "http://192.168.1.10:8000"
#>
param(
    [string]$BackendUrl
)

$ErrorActionPreference = "Stop"

# Navigate to mobile directory
$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileDir = Join-Path $projectRoot "mobile"

if (-not (Test-Path $mobileDir)) {
    throw "Mobile directory not found at $mobileDir"
}

Set-Location $mobileDir

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Starting Expo Development Server for Dev Client" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "  1. You must have the Development Client installed on your device"
Write-Host "       • For Android: .\build-dev-client-android.ps1"
Write-Host "       • For iOS: .\build-dev-client-ios.ps1"
Write-Host "  2. Device must be on the same WiFi network as this computer"
Write-Host "  3. Backend API service must be running"
Write-Host ""

# Check if npm dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
}

# Set API URL environment variable if provided
if ($BackendUrl) {
    $env:EXPO_PUBLIC_API_URL = $BackendUrl.TrimEnd('/')
    Write-Host "Backend URL set to: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Yellow
} else {
    Write-Host "Backend URL not specified. Will auto-detect from network." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "Starting Expo server..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "  1. Open Development Client app on your device"
Write-Host "  2. Scan the QR code displayed below (or use connection screen)"
Write-Host "  3. App will connect and start loading JavaScript bundle"
Write-Host "  4. After connection: press 'r' to reload, 's' to show menu"
Write-Host "  5. Keep this terminal open while developing"
Write-Host ""

try {
    & npm start
} catch {
    Write-Host ""
    Write-Host "✗ Server failed to start!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
