# SOLUCION URGENTE - 508 SECRETOS + SEMGREP

## SITUACION CRITICA

```
❌ detect-secrets: 508 secretos detectados
❌ Semgrep: Path does not exist semgrep.sarif
❌ Token Semgrep: Desaparece de la lista
```

---

## PARTE 1: RESOLVER 508 SECRETOS (30-60 min)

### ¿Por que 508 secretos?

**El problema:**
Tu baseline esta vacio `"results": {}` pero el codigo SI tiene secretos.
Cuando el workflow ejecuta, encuentra TODOS los secretos como "nuevos".

**La solucion:**
Generar un baseline REAL auditando TODOS los secretos manualmente.

### Paso 1: Generar scan completo (5 min)

```powershell
cd D:\Desarrollo\DeployTime

# Backup del baseline actual (por si acaso)
Copy-Item .secrets.baseline .secrets.baseline.backup

# Generar scan completo SIN filtros
python -m detect_secrets scan --all-files > .secrets.baseline.full

# Ver cuantos secretos hay
python -m detect_secrets -c .secrets.baseline.full
```

**Resultado esperado:**
```
Se encontraron 508 secretos potenciales en X archivos
```

### Paso 2: Analizar tipos de secretos (10 min)

```powershell
# Ver distribucion por tipo
Get-Content .secrets.baseline.full | ConvertFrom-Json | 
  Select-Object -ExpandProperty results | 
  ForEach-Object { $_.PSObject.Properties.Value } | 
  Group-Object -Property type | 
  Sort-Object Count -Descending | 
  Format-Table Name, Count
```

**Tipos comunes de falsos positivos:**
- `Base64HighEntropyString`: Imagenes SVG inline, fonts, assets
- `HexHighEntropyString`: Hashes de ejemplo, UUIDs
- `KeywordDetector`: Strings como "password", "token", "key" en comentarios
- `PrivateKeyDetector`: Claves de ejemplo en docs

### Paso 3: Estrategia de auditoria

**Opcion A: Audit interactivo (recomendado para <100 secretos)**

```powershell
# Audit interactivo
python -m detect_secrets audit .secrets.baseline.full

# Para cada secreto:
# 'n' = Falso positivo (ignorar)
# 'y' = Secreto real (marcar para remediacion)
# 's' = Saltar
```

**Opcion B: Audit por archivo (recomendado para 508 secretos)**

En lugar de auditar los 508 manualmente, vamos a:
1. Identificar archivos con mas secretos
2. Auditar por grupos
3. Usar exclusiones inteligentes

```powershell
# Listar archivos con mas secretos
Get-Content .secrets.baseline.full | ConvertFrom-Json | 
  Select-Object -ExpandProperty results | 
  ForEach-Object { 
    $file = $_.PSObject.Properties.Name
    $count = $_.PSObject.Properties.Value.Count
    [PSCustomObject]@{
      Archivo = $file
      Secretos = $count
    }
  } | Sort-Object Secretos -Descending | Format-Table -AutoSize
```

**Archivos tipicamente con falsos positivos:**
- `package-lock.json`: Hashes de paquetes
- `composer.lock`: Hashes de paquetes
- `*.svg`: Imagenes en base64
- `*.min.js`: JavaScript minificado
- `vendor/`: Librerias de terceros
- `node_modules/`: Dependencias

### Paso 4: Excluir archivos obvios (5 min)

```powershell
# Regenerar baseline EXCLUYENDO archivos con falsos positivos
python -m detect_secrets scan --all-files `
  --exclude-files '\.lock$' `
  --exclude-files 'node_modules/' `
  --exclude-files 'vendor/' `
  --exclude-files 'package-lock\.json' `
  --exclude-files 'composer\.lock' `
  --exclude-files '\.min\.js$' `
  --exclude-files '\.svg$' `
  --exclude-files 'public/assets/' `
  --exclude-files 'storage/' `
  > .secrets.baseline.filtered

# Contar cuantos quedan
python -m detect_secrets -c .secrets.baseline.filtered
```

**Objetivo:** Reducir de 508 a ~50-100 secretos

### Paso 5: Audit de secretos filtrados (20-40 min)

```powershell
# Audit interactivo de los secretos filtrados
python -m detect_secrets audit .secrets.baseline.filtered

# Para cada secreto:
# 1. Ver el contexto (linea de codigo)
# 2. Determinar si es real o falso positivo
# 3. Marcar apropiadamente
```

**Guia rapida:**

```
FALSO POSITIVO ('n'):
- Ejemplos en README.md: "your-api-key-here"
- Hashes de commits en comentarios
- UUIDs genericos
- Base64 de imagenes/assets
- Valores de placeholder

SECRETO REAL ('y'):
- API keys de servicios (Stripe, AWS, etc)
- Passwords hardcodeados
- JWT secrets
- Database credentials
- Tokens de autenticacion
```

### Paso 6: Identificar secretos reales para remediar

```powershell
# Ver secretos marcados como reales
Get-Content .secrets.baseline.filtered | ConvertFrom-Json | 
  Select-Object -ExpandProperty results | 
  ForEach-Object { 
    $file = $_.PSObject.Properties.Name
    $_.PSObject.Properties.Value | Where-Object { $_.is_secret -eq $true }
  }
```

**Para cada secreto real:**

1. **Remover del codigo**
```php
// ANTES (incorrecto)
define('STRIPE_KEY', 'sk_live_abc123...');

// DESPUES (correcto)
define('STRIPE_KEY', env('STRIPE_KEY'));
```

2. **Agregar a .env.example**
```
STRIPE_KEY=your-stripe-key-here
```

3. **Agregar a .env (local, NO commitear)**
```
STRIPE_KEY=sk_live_abc123...
```

4. **Rotar el secreto si fue expuesto**
- Ir al servicio (Stripe, AWS, etc)
- Generar nuevo secreto
- Revocar el viejo

### Paso 7: Reemplazar baseline (5 min)

```powershell
# Una vez auditado, reemplazar baseline oficial
Copy-Item .secrets.baseline.filtered .secrets.baseline -Force

# Verificar que esta auditado
python -m detect_secrets -c .secrets.baseline
# Debe mostrar: 0 secretos sin auditar

# Ver estadisticas
Get-Content .secrets.baseline | ConvertFrom-Json | 
  Select-Object -ExpandProperty results | 
  Measure-Object | Select-Object Count
```

### Paso 8: Commitear baseline auditado (2 min)

```powershell
# Verificar cambios
git diff .secrets.baseline

# Agregar y commitear
git add .secrets.baseline
git commit -m "fix: baseline de secretos auditado - 508 falsos positivos clasificados"
git push origin main
```

---

## PARTE 2: RESOLVER SEMGREP (15 min)

### Paso 1: Verificar que workflow fue reemplazado

```powershell
cd D:\Desarrollo\DeployTime

# Verificar contenido del workflow
Select-String -Path .github\workflows\security-scan.yml -Pattern "generateSarif|publishToken|GITHUB_TOKEN"
```

**Resultado esperado:**
```
publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}   # DEBE aparecer
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}        # DEBE aparecer
```

**NO debe aparecer:**
```
generateSarif: true   # NO debe estar
```

**Si generateSarif aparece:**
```powershell
# El workflow NO fue reemplazado correctamente
# Reemplazar de nuevo
Copy-Item security-scan-FINAL.yml .github\workflows\security-scan.yml -Force
git add .github\workflows\security-scan.yml
git commit -m "fix: workflow definitivo con publishToken"
git push origin main
```

### Paso 2: Regenerar token de Semgrep (5 min)

**Problema:** Token creado desaparece de la lista

**Solucion:**

1. Ir a: https://semgrep.dev/orgs/-/settings/tokens

2. **IMPORTANTE:** Seleccionar la organizacion correcta
   - Si tienes "Personal" y "dixer", selecciona la correcta
   - El token es por organizacion, no global

3. Click en "Create new token"
   - Name: `DeployTime-GitHub-Actions`
   - Permissions: `CI` (default)
   - Expiration: `Never` o `1 year`

4. **COPIAR EL TOKEN INMEDIATAMENTE**
   ```
   sgp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   
5. **NO cerrar la pagina hasta verificar que funciona**

### Paso 3: Actualizar token en GitHub Secrets (3 min)

1. Ir a: https://github.com/conejoRojo/DeployTime/settings/secrets/actions

2. Buscar: `SEMGREP_APP_TOKEN`

3. Si existe:
   - Click en el nombre
   - Click en "Update secret"
   - Pegar el nuevo token
   - Click "Update secret"

4. Si NO existe:
   - Click "New repository secret"
   - Name: `SEMGREP_APP_TOKEN`
   - Secret: Pegar token
   - Click "Add secret"

### Paso 4: Verificar token en GitHub (2 min)

```
GitHub repo → Settings → Secrets and variables → Actions
└─> Repository secrets
    └─> SEMGREP_APP_TOKEN
        ├─> Updated: Hace X minutos
        └─> Used by: security-scan.yml
```

### Paso 5: Verificar token en Semgrep (2 min)

1. Volver a: https://semgrep.dev/orgs/-/settings/tokens

2. **Verificar que el token aparece en la lista:**
   ```
   Name: DeployTime-GitHub-Actions
   Created: Hace X minutos
   Last used: Never (o fecha)
   ```

3. **Si NO aparece:**
   - Verificar que estas en la organizacion correcta
   - Verificar permisos de la cuenta
   - Intentar en modo incognito (cache issue)

### Paso 6: Forzar ejecucion del workflow (3 min)

1. Ir a: https://github.com/conejoRojo/DeployTime/actions

2. Click: "Security Scan (SAST + SCA + Secrets)"

3. Click: "Run workflow"

4. Branch: main

5. Click: "Run workflow" (verde)

6. Monitorear job semgrep-sast

**Logs esperados:**

```
Run semgrep/semgrep-action@v1
  with:
    publishToken: ***
  env:
    GITHUB_TOKEN: ***

Authenticating with Semgrep Cloud...
Authentication successful

Running Semgrep scan...
Scanning 102 files...
Found 3 issues

Generating SARIF output...
✓ Generated semgrep.sarif

Uploading results to Semgrep Cloud...
✓ Uploaded successfully

View results: https://semgrep.dev/orgs/dixer/findings?repo=...
```

**Si falla con "Authentication failed":**
- Token incorrecto o revocado
- Token no guardado en GitHub Secrets
- Organizacion incorrecta

---

## PARTE 3: VALIDACION COMPLETA

### Test 1: Baseline de secretos (2 min)

```powershell
# Local: Verificar que no detecta secretos nuevos
cd D:\Desarrollo\DeployTime
python -m detect_secrets scan --baseline .secrets.baseline

# Resultado esperado:
# No new secrets detected
```

### Test 2: Workflow completo (6 min)

1. Ejecutar workflow manualmente en GitHub

2. Verificar logs de cada job:

**semgrep-sast:**
```
✓ Ejecutar Semgrep SAST: Success
✓ Subir resultados SARIF: Success
✓ Archivo semgrep.sarif generado
```

**trivy-sca:**
```
✓ Escanear PHP: Success
✓ Escanear Node: Success
✓ Escanear Docker: Success
```

**detect-secrets:**
```
✓ Escanear secretos: Success
✓ Verificar resultados: 0 secretos encontrados
```

**security-summary:**
```
✓ Generar resumen: Success
✓ 3/3 checks passed
```

### Test 3: GitHub Security tab (2 min)

1. Ir a: Security tab

2. Verificar alertas:
   - Semgrep SAST: 3 findings
   - Trivy PHP: X findings
   - Trivy Node: Y findings
   - Trivy Docker: Z findings

---

## TROUBLESHOOTING AVANZADO

### Problema: Semgrep sigue fallando despues de nuevo token

**Verificar en logs:**
```
Run semgrep/semgrep-action@v1
Error: SEMGREP_APP_TOKEN not found
```

**Solucion:**
```powershell
# Verificar que el secret existe
# En GitHub UI: Settings → Secrets → Verificar SEMGREP_APP_TOKEN

# Verificar que el workflow lo referencia correctamente
Select-String -Path .github\workflows\security-scan.yml -Pattern "SEMGREP_APP_TOKEN"
```

### Problema: 508 secretos siguen apareciendo despues de audit

**Causa:** Baseline no fue commiteado o pusheado

**Solucion:**
```powershell
# Verificar que baseline esta en repo
git ls-files .secrets.baseline
# Debe aparecer: .secrets.baseline

# Verificar contenido en GitHub.com
# https://github.com/conejoRojo/DeployTime/blob/main/.secrets.baseline
# Debe tener todos los secretos auditados
```

### Problema: Token de Semgrep desaparece inmediatamente

**Causa posible:** Problema de cuenta/organizacion

**Solucion:**
1. Verificar que tienes permisos de admin en la org
2. Verificar que la org no tiene limite de tokens
3. Contactar soporte de Semgrep si persiste

**Alternativa temporal:**
Usar Semgrep sin token (limitado):
```yaml
- name: Ejecutar Semgrep SAST
  uses: semgrep/semgrep-action@v1
  with:
    config: p/owasp-top-ten
  # Sin publishToken - no sube a Cloud, pero genera SARIF local
```

---

## COMANDOS RESUMIDOS - COPIAR/PEGAR

```powershell
# PARTE 1: Secretos (en PowerShell local)
cd D:\Desarrollo\DeployTime
python -m detect_secrets scan --all-files \
  --exclude-files '\.lock$' \
  --exclude-files 'node_modules/' \
  --exclude-files 'vendor/' \
  --exclude-files '\.min\.js$' \
  --exclude-files '\.svg$' \
  > .secrets.baseline.new
python -m detect_secrets audit .secrets.baseline.new
Copy-Item .secrets.baseline.new .secrets.baseline -Force
git add .secrets.baseline
git commit -m "fix: baseline auditado"
git push origin main

# PARTE 2: Semgrep
# 1. Crear nuevo token en https://semgrep.dev/orgs/-/settings/tokens
# 2. Copiar token (sgp_...)
# 3. Ir a https://github.com/conejoRojo/DeployTime/settings/secrets/actions
# 4. Actualizar SEMGREP_APP_TOKEN con nuevo valor
# 5. Verificar workflow tiene publishToken:
Select-String -Path .github\workflows\security-scan.yml -Pattern "publishToken"
# 6. Ejecutar workflow en GitHub Actions
```

---

## TIEMPO ESTIMADO

```
Generar scan completo:          5 min
Analizar tipos:                10 min
Excluir archivos obvios:        5 min
Audit interactivo:            20-40 min
Remediar secretos reales:     10-30 min
Commitear baseline:             2 min
Regenerar token Semgrep:        5 min
Actualizar en GitHub:           3 min
Validar workflow:               6 min
─────────────────────────────────────
TOTAL:                       66-106 min
                             (1-2 horas)
```

---

## CHECKLIST FINAL

### Secretos:
- [ ] Scan completo generado
- [ ] Archivos excluidos (locks, vendor, node_modules)
- [ ] Audit completado manualmente
- [ ] Falsos positivos marcados con 'n'
- [ ] Secretos reales identificados
- [ ] Secretos reales remediados (movidos a .env)
- [ ] Baseline commiteado y pusheado
- [ ] Workflow ejecuta sin errores (0 secretos)

### Semgrep:
- [ ] Workflow tiene publishToken (no generateSarif)
- [ ] Token nuevo creado en semgrep.dev
- [ ] Token aparece en lista de Semgrep
- [ ] Token actualizado en GitHub Secrets
- [ ] Workflow ejecuta exitosamente
- [ ] semgrep.sarif se genera
- [ ] Resultados aparecen en Security tab

---

¡IMPORTANTE! No te desanimes por los 508 secretos. 
La mayoria son falsos positivos. Despues de excluir 
archivos obvios (locks, vendor, assets), probablemente 
queden ~50-100 para auditar manualmente.
