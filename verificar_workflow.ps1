# Script de verificacion y correccion del workflow
# Ejecutar en PowerShell normal (no admin)

Write-Host "=== VERIFICACION DE WORKFLOW DE SEGURIDAD ===" -ForegroundColor Green
Write-Host ""

cd D:\Desarrollo\DeployTime

# Verificar si existe el workflow
$workflowPath = ".github\workflows\security-scan.yml"
if (!(Test-Path $workflowPath)) {
    Write-Host "ERROR: No se encuentra $workflowPath" -ForegroundColor Red
    exit 1
}

Write-Host "Workflow encontrado: $workflowPath" -ForegroundColor Green
Write-Host ""

# Buscar parametros problematicos
Write-Host "=== BUSCANDO ERRORES CONOCIDOS ===" -ForegroundColor Yellow
Write-Host ""

# 1. Buscar generateSarif
$hasGenerateSarif = Select-String -Path $workflowPath -Pattern "generateSarif" -Quiet
if ($hasGenerateSarif) {
    Write-Host "[X] ERROR: Encontrado 'generateSarif' (debe ser 'publishToken')" -ForegroundColor Red
    Select-String -Path $workflowPath -Pattern "generateSarif" -Context 2,2
} else {
    Write-Host "[OK] No tiene 'generateSarif'" -ForegroundColor Green
}

# 2. Buscar publishToken
$hasPublishToken = Select-String -Path $workflowPath -Pattern "publishToken" -Quiet
if ($hasPublishToken) {
    Write-Host "[OK] Tiene 'publishToken' (correcto)" -ForegroundColor Green
} else {
    Write-Host "[X] ERROR: NO tiene 'publishToken' (debe agregarse)" -ForegroundColor Red
}

# 3. Buscar CodeQL v3
$hasCodeQLv3 = Select-String -Path $workflowPath -Pattern "codeql-action.*@v3" -Quiet
if ($hasCodeQLv3) {
    Write-Host "[X] ADVERTENCIA: Usando CodeQL v3 (debe ser v4)" -ForegroundColor Yellow
    Select-String -Path $workflowPath -Pattern "codeql-action.*@v3"
} else {
    Write-Host "[OK] Usando CodeQL v4 (correcto)" -ForegroundColor Green
}

# 4. Verificar GITHUB_TOKEN
$hasGithubToken = Select-String -Path $workflowPath -Pattern "GITHUB_TOKEN" -Quiet
if ($hasGithubToken) {
    Write-Host "[OK] Tiene GITHUB_TOKEN (correcto)" -ForegroundColor Green
} else {
    Write-Host "[X] ERROR: NO tiene GITHUB_TOKEN" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DIAGNOSTICO ===" -ForegroundColor Yellow
Write-Host ""

if ($hasGenerateSarif) {
    Write-Host "El workflow TODAVIA TIENE EL ERROR" -ForegroundColor Red
    Write-Host "Necesitas reemplazarlo con el archivo correcto" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pasos para corregir:" -ForegroundColor Cyan
    Write-Host "1. Verificar que tienes security-scan-FINAL.yml descargado" -ForegroundColor White
    Write-Host "2. Hacer backup:" -ForegroundColor White
    Write-Host "   Copy-Item $workflowPath ${workflowPath}.backup" -ForegroundColor Gray
    Write-Host "3. Reemplazar:" -ForegroundColor White
    Write-Host "   Copy-Item security-scan-FINAL.yml $workflowPath -Force" -ForegroundColor Gray
    Write-Host "4. Verificar:" -ForegroundColor White
    Write-Host "   git diff $workflowPath" -ForegroundColor Gray
    Write-Host "5. Commitear:" -ForegroundColor White
    Write-Host "   git add $workflowPath" -ForegroundColor Gray
    Write-Host "   git commit -m 'fix: workflow corregido definitivamente'" -ForegroundColor Gray
    Write-Host "   git push origin main" -ForegroundColor Gray
} elseif (!$hasPublishToken) {
    Write-Host "El workflow esta incompleto" -ForegroundColor Yellow
    Write-Host "Debe reemplazarse con el archivo correcto" -ForegroundColor Yellow
} else {
    Write-Host "El workflow parece estar CORRECTO" -ForegroundColor Green
    Write-Host ""
    Write-Host "Si GitHub sigue mostrando error:" -ForegroundColor Cyan
    Write-Host "1. Verifica que los cambios fueron pusheados:" -ForegroundColor White
    Write-Host "   git log -1 --oneline" -ForegroundColor Gray
    Write-Host "2. Verifica en GitHub.com que el archivo esta actualizado:" -ForegroundColor White
    Write-Host "   https://github.com/conejoRojo/DeployTime/blob/main/.github/workflows/security-scan.yml" -ForegroundColor Gray
    Write-Host "3. Ejecuta workflow manualmente para forzar refresh" -ForegroundColor White
}

Write-Host ""
Write-Host "=== CONTENIDO ACTUAL DEL WORKFLOW (primeras 100 lineas) ===" -ForegroundColor Yellow
Write-Host ""
Get-Content $workflowPath | Select-Object -First 100