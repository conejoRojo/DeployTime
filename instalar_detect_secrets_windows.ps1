# Instalacion de detect-secrets en Windows
# Ejecutar en PowerShell como Administrador

Write-Host "=== INSTALACION DE DETECT-SECRETS EN WINDOWS ===" -ForegroundColor Green
Write-Host ""

# Verificar si Python esta instalado
Write-Host "1. Verificando Python..." -ForegroundColor Yellow
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonVersion = python --version
    Write-Host "   Python encontrado: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Python no esta instalado" -ForegroundColor Red
    Write-Host "   Descarga Python desde: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "   Asegurate de marcar 'Add Python to PATH' durante la instalacion" -ForegroundColor Yellow
    exit 1
}

# Verificar si pip esta instalado
Write-Host ""
Write-Host "2. Verificando pip..." -ForegroundColor Yellow
if (Get-Command pip -ErrorAction SilentlyContinue) {
    $pipVersion = pip --version
    Write-Host "   pip encontrado: $pipVersion" -ForegroundColor Green
} else {
    Write-Host "   ERROR: pip no esta instalado" -ForegroundColor Red
    Write-Host "   Instala pip con: python -m ensurepip --upgrade" -ForegroundColor Yellow
    exit 1
}

# Instalar detect-secrets
Write-Host ""
Write-Host "3. Instalando detect-secrets..." -ForegroundColor Yellow
pip install detect-secrets

# Verificar instalacion
Write-Host ""
Write-Host "4. Verificando instalacion..." -ForegroundColor Yellow
if (Get-Command detect-secrets -ErrorAction SilentlyContinue) {
    $dsVersion = detect-secrets --version
    Write-Host "   detect-secrets instalado correctamente: $dsVersion" -ForegroundColor Green
} else {
    Write-Host "   ERROR: detect-secrets no se instalo correctamente" -ForegroundColor Red
    Write-Host "   Intenta cerrar y reabrir PowerShell" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== INSTALACION COMPLETADA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos disponibles:" -ForegroundColor Cyan
Write-Host "  detect-secrets scan --help" -ForegroundColor White
Write-Host "  detect-secrets audit --help" -ForegroundColor White
Write-Host ""
Write-Host "Para usar en tu proyecto:" -ForegroundColor Cyan
Write-Host "  cd D:\Desarrollo\DeployTime" -ForegroundColor White
Write-Host "  detect-secrets scan --all-files > .secrets.baseline" -ForegroundColor White
