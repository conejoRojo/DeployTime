# Script para analizar y clasificar secretos detectados
# Ejecutar en PowerShell desde D:\Desarrollo\DeployTime
# Version corregida sin errores de sintaxis

param(
    [string]$BaselinePath = ".secrets.baseline"
)

Write-Host "=== ANALISIS DE SECRETOS DETECTADOS ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el baseline
if (!(Test-Path $BaselinePath)) {
    Write-Host "ERROR: No se encuentra $BaselinePath" -ForegroundColor Red
    Write-Host "Genera el baseline primero con:" -ForegroundColor Yellow
    Write-Host "  python -m detect_secrets scan --all-files > .secrets.baseline" -ForegroundColor White
    exit 1
}

# Leer baseline
try {
    $baseline = Get-Content $BaselinePath -Raw | ConvertFrom-Json
} catch {
    Write-Host "ERROR: No se puede parsear $BaselinePath" -ForegroundColor Red
    exit 1
}

# Estadisticas generales
$totalSecrets = 0
$fileCount = 0
$secretsByType = @{}
$secretsByFile = @{}

foreach ($file in $baseline.results.PSObject.Properties) {
    $fileName = $file.Name
    $secrets = $file.Value
    
    if ($secrets.Count -gt 0) {
        $fileCount++
        $totalSecrets += $secrets.Count
        $secretsByFile[$fileName] = $secrets.Count
        
        foreach ($secret in $secrets) {
            $type = $secret.type
            if (!$secretsByType.ContainsKey($type)) {
                $secretsByType[$type] = 0
            }
            $secretsByType[$type]++
        }
    }
}

Write-Host "RESUMEN GENERAL" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Gray
Write-Host "Total de secretos detectados: $totalSecrets" -ForegroundColor White
Write-Host "Archivos con secretos: $fileCount" -ForegroundColor White
Write-Host ""

# Distribucion por tipo
Write-Host "DISTRIBUCION POR TIPO DE SECRETO" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Gray
$secretsByType.GetEnumerator() | 
    Sort-Object Value -Descending | 
    ForEach-Object {
        $percentage = [math]::Round(($_.Value / $totalSecrets) * 100, 1)
        $percentStr = "$percentage%"
        Write-Host ("{0,-40} {1,5} ({2,6})" -f $_.Name, $_.Value, $percentStr) -ForegroundColor White
    }
Write-Host ""

# Top 20 archivos con mas secretos
Write-Host "TOP 20 ARCHIVOS CON MAS SECRETOS" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Gray
$secretsByFile.GetEnumerator() | 
    Sort-Object Value -Descending | 
    Select-Object -First 20 | 
    ForEach-Object {
        $percentage = [math]::Round(($_.Value / $totalSecrets) * 100, 1)
        $percentStr = "$percentage%"
        Write-Host ("{0,4} secretos ({1,6}) - {2}" -f $_.Value, $percentStr, $_.Name) -ForegroundColor White
    }
Write-Host ""

# Identificar archivos candidatos a exclusion
Write-Host "ARCHIVOS CANDIDATOS A EXCLUSION" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

$excludePatterns = @{
    "\.lock$" = "Archivos de lock (composer.lock, package-lock.json)"
    "node_modules/" = "Dependencias de Node.js"
    "vendor/" = "Dependencias de PHP"
    "\.min\.js$" = "JavaScript minificado"
    "\.svg$" = "Imagenes SVG (base64)"
    "public/assets/" = "Assets publicos"
    "storage/" = "Archivos de storage"
    "\.map$" = "Source maps"
    "bootstrap" = "Framework Bootstrap"
    "jquery" = "Libreria jQuery"
}

$totalExcludable = 0

foreach ($pattern in $excludePatterns.Keys) {
    $matchingFiles = $secretsByFile.Keys | Where-Object { $_ -match $pattern }
    $matchingCount = 0
    
    if ($matchingFiles) {
        $matchingCount = ($matchingFiles | ForEach-Object { $secretsByFile[$_] } | Measure-Object -Sum).Sum
    }
    
    if ($matchingCount -gt 0) {
        $totalExcludable += $matchingCount
        $percentage = [math]::Round(($matchingCount / $totalSecrets) * 100, 1)
        $percentStr = "$percentage%"
        Write-Host ("{0,4} secretos ({1,6}) - {2}" -f $matchingCount, $percentStr, $excludePatterns[$pattern]) -ForegroundColor Cyan
        Write-Host "      Patron: $pattern" -ForegroundColor Gray
        
        if ($matchingFiles.Count -le 5) {
            foreach ($f in $matchingFiles) {
                Write-Host ("        - {0} ({1} secretos)" -f $f, $secretsByFile[$f]) -ForegroundColor DarkGray
            }
        } else {
            Write-Host ("        ({0} archivos)" -f $matchingFiles.Count) -ForegroundColor DarkGray
        }
        Write-Host ""
    }
}

$remainingSecrets = $totalSecrets - $totalExcludable
$excludablePercentage = [math]::Round(($totalExcludable / $totalSecrets) * 100, 1)

Write-Host "IMPACTO DE EXCLUSIONES" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Gray
Write-Host "Secretos excluibles: $totalExcludable ($excludablePercentage%)" -ForegroundColor Cyan
Write-Host "Secretos restantes: $remainingSecrets" -ForegroundColor Yellow
Write-Host ""

# Recomendaciones
Write-Host "RECOMENDACIONES" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Gray

if ($totalExcludable -gt ($totalSecrets * 0.7)) {
    Write-Host "[OK] Mas del 70% son archivos excluibles (locks, vendor, assets)" -ForegroundColor Green
    Write-Host "  Genera un nuevo baseline con exclusiones:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host '  python -m detect_secrets scan --all-files --exclude-files "\.lock$" --exclude-files "node_modules/" --exclude-files "vendor/" --exclude-files "\.min\.js$" --exclude-files "\.svg$" --exclude-files "public/assets/" --exclude-files "storage/" > .secrets.baseline.filtered' -ForegroundColor White
    Write-Host ""
} elseif ($remainingSecrets -lt 100) {
    Write-Host "[OK] Despues de exclusiones quedarian ~$remainingSecrets secretos" -ForegroundColor Green
    Write-Host "  Es manejable para audit manual" -ForegroundColor Cyan
} else {
    Write-Host "[!] Despues de exclusiones quedarian ~$remainingSecrets secretos" -ForegroundColor Yellow
    Write-Host "  Considera agregar mas exclusiones o auditar por grupos" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "SIGUIENTES PASOS" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Gray
Write-Host "1. Genera baseline filtrado con exclusiones (comando arriba)" -ForegroundColor White
Write-Host "2. Verifica cuantos quedan:" -ForegroundColor White
Write-Host "   python -m detect_secrets -c .secrets.baseline.filtered" -ForegroundColor Gray
Write-Host "3. Audit los secretos filtrados:" -ForegroundColor White
Write-Host "   python -m detect_secrets audit .secrets.baseline.filtered" -ForegroundColor Gray
Write-Host "4. Reemplaza baseline oficial:" -ForegroundColor White
Write-Host "   Copy-Item .secrets.baseline.filtered .secrets.baseline -Force" -ForegroundColor Gray
Write-Host "5. Commitea el baseline auditado" -ForegroundColor White
Write-Host ""
