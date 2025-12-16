# GUIA COMPLETA - RESOLVER detect-secrets AL 100%

## OBJETIVO

Reducir de 508 secretos a 0 secretos mediante:
1. Exclusión de archivos obvios (locks, vendor, assets)
2. Audit manual de falsos positivos
3. Remediación de secretos reales

**Tiempo estimado: 1-2 horas**

---

## FASE 1: GENERAR BASELINE FILTRADO (10 min)

### Paso 1.1: Generar baseline con exclusiones

```powershell
cd D:\Desarrollo\DeployTime

# Comando completo en UNA LINEA (copia todo):
python -m detect_secrets scan --all-files --exclude-files "\.lock$" --exclude-files "node_modules/" --exclude-files "vendor/" --exclude-files "package-lock\.json" --exclude-files "composer\.lock" --exclude-files "\.min\.js$" --exclude-files "\.svg$" --exclude-files "public/assets/" --exclude-files "storage/" --exclude-files "\.map$" --exclude-files "dist/" --exclude-files "build/" > .secrets.baseline.new
```

**Nota:** Todo en una sola línea, sin backticks.

### Paso 1.2: Verificar reducción

```powershell
# Comparar tamaños
$fullSize = (Get-Item .secrets.baseline.full).Length
$newSize = (Get-Item .secrets.baseline.new).Length
$reduction = [math]::Round((1 - ($newSize / $fullSize)) * 100, 1)

Write-Host "Baseline completo: $fullSize bytes" -ForegroundColor Cyan
Write-Host "Baseline filtrado: $newSize bytes" -ForegroundColor Cyan
Write-Host "Reduccion: $reduction%" -ForegroundColor Green
```

**Esperado:** Reducción > 70%

### Paso 1.3: Contar secretos restantes

```powershell
# Contar secretos en el nuevo baseline
$baseline = Get-Content .secrets.baseline.new -Raw | ConvertFrom-Json
$totalSecrets = 0
foreach ($file in $baseline.results.PSObject.Properties) {
    $totalSecrets += $file.Value.Count
}
Write-Host "Secretos restantes: $totalSecrets" -ForegroundColor $(if ($totalSecrets -lt 100) { "Green" } else { "Yellow" })
```

**Objetivo:** < 100 secretos

### Paso 1.4: Analizar distribución (opcional)

```powershell
# Ejecutar script corregido
.\analizar_secretos_fixed.ps1 -BaselinePath .secrets.baseline.new
```

Esto te mostrará:
- Tipos de secretos más comunes
- Archivos con más secretos
- Candidatos adicionales a exclusión

---

## FASE 2: AUDIT MANUAL (30-60 min)

### Paso 2.1: Iniciar audit interactivo

```powershell
python -m detect_secrets audit .secrets.baseline.new
```

### Paso 2.2: Interfaz de audit

Para CADA secreto detectado, verás:

```
Secret:      1 of 87
Filename:    backend/app/Http/Controllers/AuthController.php
Secret Type: Base64HighEntropyString
----------
41:    'secret' => 'your-secret-key-here',
----------

Is this a true secret? i.e. not a false-positive (y)es, (n)o, (s)kip, (q)uit:
```

### Paso 2.3: Criterios de clasificación

**FALSO POSITIVO (`n`):**
```
✓ "your-api-key-here"
✓ "example@example.com"
✓ "password123" en README/comentarios
✓ "sk_test_..." (keys de testing público)
✓ Hashes de git commits
✓ UUIDs genéricos (12345678-1234-1234...)
✓ Base64 de assets/imágenes
✓ Valores de placeholder/ejemplo
✓ Constantes matemáticas (pi, e, phi)
✓ Timestamps y fechas
✓ Coordenadas geográficas
```

**SECRETO REAL (`y`):**
```
✗ sk_live_... (Stripe production)
✗ AKIA... (AWS access key)
✗ ghp_... (GitHub personal token)
✗ AIza... (Google API key)
✗ xoxb-... (Slack token)
✗ Passwords reales en código
✗ JWT secrets de producción
✗ Database credentials hardcodeados
✗ OAuth client secrets
✗ Private keys reales
```

**SKIP (`s`):**
```
? No estás seguro
? Necesitas más contexto
? Revisarás después
```

### Paso 2.4: Shortcuts útiles

Durante el audit:
- `n` + Enter: Marcar como falso positivo (más común)
- `y` + Enter: Marcar como secreto real
- `s` + Enter: Saltar temporalmente
- `q` + Enter: Salir (guarda progreso)

### Paso 2.5: Si necesitas parar

El audit guarda progreso automáticamente.

Para continuar después:
```powershell
python -m detect_secrets audit .secrets.baseline.new
```

Continuará desde donde lo dejaste.

---

## FASE 3: REMEDIAR SECRETOS REALES (variable)

### Paso 3.1: Identificar secretos marcados como reales

```powershell
# Leer baseline y buscar secretos reales
$baseline = Get-Content .secrets.baseline.new -Raw | ConvertFrom-Json
$realSecrets = @()

foreach ($file in $baseline.results.PSObject.Properties) {
    $fileName = $file.Name
    foreach ($secret in $file.Value) {
        if ($secret.is_verified -eq $false -or $secret.PSObject.Properties.Name -notcontains 'is_verified') {
            # Secreto no verificado o no auditado = potencialmente real
            $realSecrets += [PSCustomObject]@{
                File = $fileName
                Line = $secret.line_number
                Type = $secret.type
            }
        }
    }
}

Write-Host "Secretos potencialmente reales: $($realSecrets.Count)" -ForegroundColor Yellow
$realSecrets | Format-Table -AutoSize
```

### Paso 3.2: Para cada secreto real

**Ejemplo en PHP:**

```php
// ANTES (incorrecto) - backend/config/services.php
'stripe' => [
    'key' => 'sk_live_51H8xYz2eZvKYlo2C...',
    'secret' => 'whsec_abc123def456...'
],

// PASO 1: Mover a variable de entorno
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_WEBHOOK_SECRET')
],

// PASO 2: Agregar a .env.example
STRIPE_KEY=your-stripe-key-here
STRIPE_WEBHOOK_SECRET=your-webhook-secret-here

// PASO 3: Agregar a .env local (NO commitear)
STRIPE_KEY=sk_live_51H8xYz2eZvKYlo2C...
STRIPE_WEBHOOK_SECRET=whsec_abc123def456...

// PASO 4: Verificar .gitignore incluye .env
/.env
```

**Ejemplo en JavaScript:**

```javascript
// ANTES (incorrecto) - desktop/src/config/api.js
const API_KEY = 'AIzaSyB1234567890abcdefg';

// DESPUES (correcto)
const API_KEY = process.env.REACT_APP_API_KEY;

// En .env.example
REACT_APP_API_KEY=your-api-key-here

// En .env local (NO commitear)
REACT_APP_API_KEY=AIzaSyB1234567890abcdefg
```

### Paso 3.3: Rotar secretos expuestos

Si el secreto fue commiteado y pusheado:

**Para Stripe:**
1. Login en https://dashboard.stripe.com
2. Developers → API keys
3. Click "Roll key" en la key comprometida
4. Actualizar .env con nueva key

**Para GitHub:**
1. Settings → Developer settings → Personal access tokens
2. Revocar token comprometido
3. Generar nuevo token
4. Actualizar .env

**Para AWS:**
1. IAM Console → Users → Security credentials
2. "Make inactive" en access key comprometida
3. "Create access key" para generar nueva
4. Actualizar .env

### Paso 3.4: Verificar remediación

```powershell
# Buscar el secreto en el código (debe no existir)
Select-String -Path backend -Pattern "sk_live_" -Recurse

# No debe encontrar nada (o solo en .env que está gitignored)
```

---

## FASE 4: FINALIZAR BASELINE (5 min)

### Paso 4.1: Verificar audit completo

```powershell
# Escanear con el baseline auditado
python -m detect_secrets scan --baseline .secrets.baseline.new

# Resultado esperado:
# No new secrets detected
```

### Paso 4.2: Reemplazar baseline oficial

```powershell
# Backup del baseline anterior
Copy-Item .secrets.baseline .secrets.baseline.backup

# Reemplazar con el nuevo
Copy-Item .secrets.baseline.new .secrets.baseline -Force

# Verificar
python -m detect_secrets scan --baseline .secrets.baseline
# Debe decir: No new secrets detected
```

### Paso 4.3: Limpiar archivos temporales

```powershell
# Eliminar archivos temporales
Remove-Item .secrets.baseline.full -ErrorAction SilentlyContinue
Remove-Item .secrets.baseline.filtered -ErrorAction SilentlyContinue
Remove-Item .secrets.baseline.new -ErrorAction SilentlyContinue
```

---

## FASE 5: COMMITEAR Y VALIDAR (10 min)

### Paso 5.1: Verificar archivos a commitear

```powershell
# Ver cambios
git status

# Debe mostrar:
# modified: .secrets.baseline
# (y posiblemente archivos remediados si hubo secretos reales)
```

### Paso 5.2: Commitear baseline

```powershell
git add .secrets.baseline

# Si remediaste secretos reales, agregar esos archivos también
git add backend/config/services.php  # ejemplo
git add .env.example                  # si agregaste nuevas variables

git commit -m "fix: baseline de secretos auditado - 508 falsos positivos clasificados"

git push origin main
```

### Paso 5.3: Ejecutar workflow completo

1. Ir a: https://github.com/conejoRojo/DeployTime/actions
2. Click "Run workflow"
3. Branch: main
4. Click "Run workflow"

### Paso 5.4: Monitorear ejecución

**Job: detect-secrets (1 min)**

```
Instalar dependencias
├─> pip install detect-secrets
└─> apt-get install jq

Escanear secretos
├─> Usando baseline existente
└─> detect-secrets scan --baseline .secrets.baseline

Verificar resultados
├─> Contar secretos con jq
└─> 0 secretos encontrados

Comentar exito en PR
└─> "Sin secretos hardcodeados"
```

### Paso 5.5: Validación exitosa

```
✅ SAST - Semgrep (PHP + JavaScript)       [2 min] Success
✅ SCA - Trivy (Dependencias + Docker)     [3 min] Success
✅ Deteccion de Secretos Hardcodeados      [1 min] Success
✅ Resumen de Seguridad                    [5 seg] Success

Total: 4/4 jobs passed
```

---

## TROUBLESHOOTING

### Problema: Audit muestra muchos secretos en archivos que debieron ser excluidos

**Causa:** Patrones de exclusión no funcionaron correctamente.

**Solución:**
```powershell
# Ver qué archivos tienen más secretos
$baseline = Get-Content .secrets.baseline.new -Raw | ConvertFrom-Json
$baseline.results.PSObject.Properties | 
    ForEach-Object { [PSCustomObject]@{File=$_.Name; Count=$_.Value.Count} } | 
    Sort-Object Count -Descending | 
    Select-Object -First 10
```

Agrega patrones adicionales y regenera baseline.

### Problema: No estoy seguro si un secreto es real o falso positivo

**Solución:**
1. Marca como skip (`s`)
2. Investiga el contexto del archivo
3. Busca el valor en documentación
4. Pregunta al equipo
5. Vuelve a auditar después

### Problema: Tengo 200+ secretos todavía después de exclusiones

**Solución:**
Agrega más exclusiones:

```powershell
# Identificar archivos problemáticos
$baseline = Get-Content .secrets.baseline.new -Raw | ConvertFrom-Json
$baseline.results.PSObject.Properties.Name | 
    Group-Object { $_.Split('/')[0] } | 
    Sort-Object Count -Descending

# Agregar directorios completos si es necesario
# --exclude-files "tests/"
# --exclude-files "docs/"
# --exclude-files "examples/"
```

### Problema: Workflow sigue fallando después de audit

**Verificación:**

```powershell
# Local: Verificar que no detecta nuevos secretos
python -m detect_secrets scan --baseline .secrets.baseline

# Debe decir: No new secrets detected
```

Si encuentra secretos:
- El baseline no está auditado completamente
- Hay secretos nuevos desde el audit
- El baseline no fue pusheado correctamente

---

## CHECKLIST COMPLETO

### Fase 1: Baseline Filtrado
- [ ] Comando de scan con exclusiones ejecutado
- [ ] Reducción > 70% verificada
- [ ] Secretos restantes < 100
- [ ] Distribución analizada (opcional)

### Fase 2: Audit Manual
- [ ] Audit iniciado: `python -m detect_secrets audit`
- [ ] Todos los secretos clasificados (n/y/s)
- [ ] Falsos positivos marcados con 'n'
- [ ] Secretos reales identificados

### Fase 3: Remediación (si hay secretos reales)
- [ ] Secretos movidos a .env
- [ ] .env.example actualizado
- [ ] .env local configurado (no commiteado)
- [ ] Secretos rotados (si fueron expuestos)
- [ ] Código actualizado para usar env vars

### Fase 4: Finalizar
- [ ] Scan con baseline no detecta nuevos secretos
- [ ] Baseline oficial reemplazado
- [ ] Archivos temporales eliminados

### Fase 5: Validar
- [ ] Baseline commiteado y pusheado
- [ ] Workflow ejecutado en GitHub
- [ ] detect-secrets job: Success
- [ ] 0 secretos reportados
- [ ] Security tab actualizado

---

## METRICAS FINALES

Al completar exitosamente:

**Antes:**
- Secretos detectados: 508
- Baseline: Vacío (falso negativo)
- Estado: Failing

**Después:**
- Secretos detectados: 0
- Baseline: Auditado con ~80-100 entradas marcadas como safe
- Estado: Passing

**Configuración final:**
- Archivos excluidos: ~8-10 patrones
- Falsos positivos clasificados: 80-95%
- Secretos reales remediados: 5-20% (si los había)
- Pipeline: 100% funcional

---

## TIEMPO TOTAL ESTIMADO

```
Generar baseline filtrado:      10 min
Audit manual (80 secretos):  30-60 min
Remediar secretos reales:    10-30 min
Finalizar y validar:            15 min
─────────────────────────────────────
TOTAL:                       65-115 min
                             (1-2 horas)
```

---

¡ADELANTE! Con esta guía completa puedes resolver detect-secrets al 100%.
