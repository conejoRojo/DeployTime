# Script de build para DeployTime - Windows Installer
# Uso: powershell -ExecutionPolicy Bypass -File build-win.ps1

$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:WIN_CSC_LINK = ""

Set-Location $PSScriptRoot

Write-Host "==> Generando iconos..." -ForegroundColor Cyan
node generate-icons.js
if ($LASTEXITCODE -ne 0) { Write-Host "Error generando iconos" -ForegroundColor Red; exit 1 }

Write-Host "==> Compilando renderer (Vite)..." -ForegroundColor Cyan
npm run build:renderer
if ($LASTEXITCODE -ne 0) { Write-Host "Error en build:renderer" -ForegroundColor Red; exit 1 }

Write-Host "==> Compilando preload (TypeScript)..." -ForegroundColor Cyan
npm run build:preload
if ($LASTEXITCODE -ne 0) { Write-Host "Error en build:preload" -ForegroundColor Red; exit 1 }

Write-Host "==> Empaquetando instalador Windows (.exe)..." -ForegroundColor Cyan
npx electron-builder --win
if ($LASTEXITCODE -ne 0) { Write-Host "Error en electron-builder" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "==> Instalador generado en: release\DeployTime Setup 1.0.0.exe" -ForegroundColor Green
