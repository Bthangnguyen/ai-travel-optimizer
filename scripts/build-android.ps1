param([switch]$SkipClean)
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileDir = Join-Path $projectRoot "mobile"
if (-not (Test-Path $mobileDir)) { throw "Mobile directory not found" }
Set-Location $mobileDir
Write-Host "Building Android Development Client..." -ForegroundColor Green
$env:EAS_NO_VCS = "1"
$buildArgs = @("build", "--platform", "android", "--profile", "development")
if (-not $SkipClean) { $buildArgs += "--clear-cache" }
& eas @buildArgs
