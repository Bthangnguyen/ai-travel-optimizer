#!/usr/bin/env powershell
<#
  .SYNOPSIS
    Build Expo Development Client for iOS (Ad Hoc format)
  
  .DESCRIPTION
    Builds a native Expo Development Client for iOS.
    This is a prerequisite to enable background geofencing.
    
    Only Expo Development Build (or full native build) supports:
    - Background location tracking
    - Geofencing with OS-level monitoring
    - "Always Allow" location permission
    
    Expo Go (the sandbox) does NOT support these features!
    
  .PARAMETER SkipClean
    Skip cache clear if already building
    
  .EXAMPLE
    .\build-dev-client-ios.ps1
    
  .EXAMPLE
    .\build-dev-client-ios.ps1 -SkipClean
#>
param(
    [switch]$SkipClean
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
Write-Host "Building Expo Development Client for iOS (Ad Hoc IPA)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "  1. You must have EAS CLI installed: npm install -g eas-cli"
Write-Host "  2. You must be logged in to Expo: eas login"
Write-Host "  3. You must have an Apple Developer account linked to Expo"
Write-Host "  4. Device must be registered with your Apple Developer account"
Write-Host ""
Write-Host "Important Notes:" -ForegroundColor Yellow
Write-Host "  • This will build a 100-150 MB IPA (takes ~5-10 min on EAS servers)"
Write-Host "  • GPS-based background tracking is ONLY available in Development Client builds"
Write-Host "  • Expo Go (sandbox) does NOT support geofencing or background location tracking"
Write-Host "  • You MUST register your device UDID before this build will work"
Write-Host ""

# Check if EAS CLI is installed
try {
    $easVersion = & eas --version 2>&1 | Out-String
    Write-Host "✓ EAS CLI found: $easVersion"
} catch {
    Write-Host "✗ EAS CLI not found!" -ForegroundColor Red
    Write-Host "  Install: npm install -g eas-cli" -ForegroundColor Yellow
    Write-Host "  Then: eas login" -ForegroundColor Yellow
    exit 1
}

# Check if npm dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
}

Write-Host ""
Write-Host "Building iOS Development Client (Ad Hoc)..." -ForegroundColor Yellow
Write-Host ""

# Build command
$buildArgs = @(
    "build",
    "--platform", "ios",
    "--profile", "development"
)

if (-not $SkipClean) {
    $buildArgs += "--clear-cache"
}

try {
    & eas @buildArgs
    if ($LASTEXITCODE -ne 0) {
        throw "EAS build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✓ iOS Development Client built successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. IPA file should appear in your EAS dashboard"
Write-Host "  2. Download the IPA from Expo dashboard"
Write-Host "  3. Transfer to device using Xcode or Apple Configurator 2"
Write-Host "  4. Or use: eas build:run --platform ios"
Write-Host ""
Write-Host "To run on device:" -ForegroundColor Yellow
Write-Host "  eas build:run --platform ios"
Write-Host ""
