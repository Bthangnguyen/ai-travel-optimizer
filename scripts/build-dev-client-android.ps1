#!/usr/bin/env powershell
<#
  .SYNOPSIS
    Build Expo Development Client for Android (APK format)
  
  .DESCRIPTION
    Builds a native Expo Development Client for Android.
    This is a prerequisite to enable background geofencing.
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
Write-Host "Building Expo Development Client for Android (APK)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "  1. You must have EAS CLI installed: npm install -g eas-cli"
Write-Host "  2. You must be logged in to Expo: eas login"
Write-Host "  3. You must have an Expo account with build access"
Write-Host ""

# Check if EAS CLI is installed
try {
    $easVersion = & eas --version 2>&1
    Write-Host "✓ EAS CLI found: $easVersion"
}
catch {
    Write-Host "✗ EAS CLI not found!" -ForegroundColor Red
    Write-Host "  Install: npm install -g eas-cli" -ForegroundColor Yellow
    Write-Host "  Then: eas login" -ForegroundColor Yellow
    exit 1
}

# Check if npm dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    }
    catch {
        Write-Host "✗ npm install failed!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Building Android Development Client..." -ForegroundColor Yellow
Write-Host ""

# Build command
$buildArgs = @("build", "--platform", "android", "--profile", "development")

if (-not $SkipClean) {
    $buildArgs += "--clear-cache"
}

try {
    & eas @buildArgs
    if ($LASTEXITCODE -ne 0) {
        throw "EAS build failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Host ""
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✓ Android Development Client built successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Downloaded APK should appear in your EAS dashboard"
Write-Host "  2. Transfer APK to your Android device"
Write-Host "  3. Install: adb install app-release.apk"
Write-Host ""
