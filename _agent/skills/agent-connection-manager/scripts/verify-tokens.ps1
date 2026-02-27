param(
    [string]$AgentName = "none",
    [int]$EstimatedTokens = 0,
    [switch]$CommitUsage,
    [int]$RealTokens = 0
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillDir = Split-Path -Parent $scriptDir
$quotaFile = Join-Path $skillDir "token-quota.json"

# Crear el archivo si no existe (Caso Límite)
if (-not (Test-Path $quotaFile)) {
    $defaultJson = @{
        monthly_limit     = 10000000
        available_balance = 6666666
        reset_date        = (Get-Date).AddMonths(1).ToString("yyyy-MM-01")
        last_updated      = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    } | ConvertTo-Json
    Set-Content -Path $quotaFile -Value $defaultJson
}

$quota = Get-Content $quotaFile | ConvertFrom-Json

# Verificar fecha de reinicio
$currentDate = Get-Date
$resetDate = [datetime]::Parse($quota.reset_date)
if ($currentDate -ge $resetDate) {
    Write-Host "Iniciando nuevo ciclo de facturacion mensual. Tokens restablecidos."
    $quota.available_balance = $quota.monthly_limit
    $quota.reset_date = $currentDate.AddMonths(1).ToString("yyyy-MM-01")
}

# --- Modo 2: Consumir Uso Real ---
if ($CommitUsage) {
    if ($RealTokens -eq 0) {
        Write-Host "Error: Se debe proveer -RealTokens cuando se usa -CommitUsage."
        exit 1
    }
    
    $quota.available_balance = $quota.available_balance - $RealTokens
    $quota.last_updated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    $quota | ConvertTo-Json | Set-Content $quotaFile
    Write-Host "Consumo real registrado: -$RealTokens tokens. Nuevo saldo: $($quota.available_balance)."
    exit 0
}

# --- Modo 1: Verificacion Pre-vuelo ---
$connectionStatus = "Desconectado/Error"

if ($AgentName -eq "claude") {
    # Testeando Claude
    $claudeTest = (claude --version 2>&1)
    if ($claudeTest -match "Claude Code") {
        $connectionStatus = "Conectado"
    }
    else {
        $connectionStatus = "Desconectado. Ejecuta 'claude login' en tu terminal y abre el enlace en tu navegador."
    }
}
elseif ($AgentName -eq "codex") {
    # Testeando Codex
    $codexTest = (codex --version 2>&1)
    if ($codexTest -match "codex-cli") {
        $connectionStatus = "Conectado"
    }
    else {
        $connectionStatus = "Desconectado. Verifica 'codex login'."
    }
}

# Verificando Balance vs Estimacion
$budgetStatus = ""
if ($EstimatedTokens -gt $quota.available_balance) {
    $budgetStatus = "⚠️ FONDOS INSUFICIENTES para esta estimacion."
}
else {
    $budgetStatus = "✅ Fondos suficientes."
}

# Salida del Reporte (Antigravity leera esto para el reporte)
Write-Output "=== REPORTE DE ESTADO ==="
Write-Output "Agente: $AgentName"
Write-Output "Conexion: $connectionStatus"
Write-Output "Limite Mensual: $($quota.monthly_limit)"
Write-Output "Saldo Disponible: $($quota.available_balance)"
Write-Output "Estimacion de Uso: $EstimatedTokens"
if ($null -ne $quota.session_reset_date) { Write-Output "Reinicio de Sesion: $($quota.session_reset_date)" }
if ($null -ne $quota.weekly_reset_date) { Write-Output "Reinicio Semanal: $($quota.weekly_reset_date)" }
Write-Output "Estado Presupuesto: $budgetStatus"
Write-Output "========================="
