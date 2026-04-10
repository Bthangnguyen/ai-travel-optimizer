param(
    [string]$HostAddress = "0.0.0.0",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$depsPath = Join-Path $projectRoot ".deps"
if (-not (Test-Path $depsPath)) {
    throw "Missing .deps. Install backend dependencies first."
}

$pythonExe = $null
$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCommand -and $pythonCommand.Source -and $pythonCommand.Source -notlike "*WindowsApps*") {
    $pythonExe = $pythonCommand.Source
}

if (-not $pythonExe) {
    $wherePython = @(where.exe python 2>$null | Where-Object { $_ -and $_ -notlike "*WindowsApps*" })
    if ($wherePython.Count -gt 0) {
        $pythonExe = $wherePython[0]
    }
}

if (-not $pythonExe) {
    throw "Python interpreter not found. Ensure python.exe is installed and available in PATH."
}

$pythonCode = @"
import sys
import uvicorn
import fastapi
import starlette
import pydantic
import google
import h11

sys.path.insert(0, '.')
sys.path.insert(0, '.deps')

from backend.app.main import app

uvicorn.run(
    app,
    host='$HostAddress',
    port=$Port,
    log_level='info',
    http='h11',
    loop='asyncio',
    ws='none',
)
"@

& $pythonExe -c $pythonCode
