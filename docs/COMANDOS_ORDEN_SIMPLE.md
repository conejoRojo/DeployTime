# COMANDOS EXACTOS - COPIAR Y PEGAR EN ORDEN

## PASO 1: GENERAR BASELINE FILTRADO (5 min)

```powershell
cd D:\Desarrollo\DeployTime

# Comando completo en UNA LINEA - copia TODO:
python -m detect_secrets scan --all-files --exclude-files "\.lock$" --exclude-files "node_modules/" --exclude-files "vendor/" --exclude-files "package-lock\.json" --exclude-files "composer\.lock" --exclude-files "\.min\.js$" --exclude-files "\.svg$" --exclude-files "public/assets/" --exclude-files "storage/" --exclude-files "\.map$" --exclude-files "dist/" --exclude-files "build/" > .secrets.baseline.new
```

**Espera ~30 segundos**

---

## PASO 2: VERIFICAR REDUCCION (1 min)

```powershell
# Contar secretos en el nuevo baseline
$baseline = Get-Content .secrets.baseline.new -Raw | ConvertFrom-Json
$totalSecrets = 0
foreach ($file in $baseline.results.PSObject.Properties) {
    $totalSecrets += $file.Value.Count
}
Write-Host "Secretos restantes para auditar: $totalSecrets" -ForegroundColor Cyan
```

**Esperado: < 100 secretos**

Si salen más de 100, lee GUIA_COMPLETA_DETECTSECRETS.md para agregar más exclusiones.

---

## PASO 3: AUDIT MANUAL (30-60 min)

```powershell
# Iniciar audit interactivo
python -m detect_secrets audit .secrets.baseline.new
```

**Para CADA secreto:**
- Lee el contexto (línea de código mostrada)
- Decide:
  - `n` + Enter = Falso positivo (la mayoría)
  - `y` + Enter = Secreto real (pocos)
  - `s` + Enter = Skip (si no estás seguro)

**GUIA RAPIDA:**

**Marca `n` (falso positivo):**
```
✓ "your-key-here", "example@example.com"
✓ "password123" en comentarios/README
✓ Hashes, UUIDs, timestamps
✓ Base64 de imágenes
✓ Valores de ejemplo/placeholder
```

**Marca `y` (secreto real):**
```
✗ sk_live_... (Stripe producción)
✗ AKIA... (AWS key)
✗ ghp_... (GitHub token)
✗ Passwords reales en código
```

**Puedes salir con `q` y continuar después**

---

## PASO 4: REMEDIAR SECRETOS REALES (si los hay)

**Si NO marcaste ningún secreto como real (`y`):**
→ Salta al Paso 5

**Si SÍ marcaste secretos como reales:**

Para cada secreto real:

```php
// ANTES
'api_key' => 'sk_live_abc123...',

// DESPUES
'api_key' => env('API_KEY'),
```

```powershell
# Agregar a .env.example
Add-Content .env.example "API_KEY=your-api-key-here"

# Agregar a .env local (NO commitear)
Add-Content .env "API_KEY=sk_live_abc123..."
```

**IMPORTANTE:** Si el secreto fue pusheado a GitHub, debes ROTARLO:
- Ir al servicio (Stripe, AWS, etc)
- Generar nuevo secreto
- Revocar el viejo

---

## PASO 5: VERIFICAR Y REEMPLAZAR BASELINE (2 min)

```powershell
# Verificar que no detecta nuevos secretos
python -m detect_secrets scan --baseline .secrets.baseline.new

# Debe decir: "No new secrets detected"
# Si dice otra cosa, vuelve al Paso 3

# Si todo OK, reemplazar baseline oficial
Copy-Item .secrets.baseline .secrets.baseline.backup
Copy-Item .secrets.baseline.new .secrets.baseline -Force

# Verificar de nuevo
python -m detect_secrets scan --baseline .secrets.baseline
# Debe decir: "No new secrets detected"
```

---

## PASO 6: COMMITEAR (2 min)

```powershell
# Ver estado
git status

# Agregar baseline
git add .secrets.baseline

# Si remediaste secretos, agregar esos archivos también
# git add backend/config/services.php
# git add .env.example

# Commitear
git commit -m "fix: baseline de secretos auditado - falsos positivos clasificados"

# Pushear
git push origin main
```

---

## PASO 7: EJECUTAR WORKFLOW EN GITHUB (6 min)

1. Ir a: https://github.com/conejoRojo/DeployTime/actions
2. Click "Run workflow"
3. Branch: main
4. Click "Run workflow" (verde)
5. **Esperar 4-6 minutos**

---

## PASO 8: VALIDAR RESULTADO

**Debe mostrar:**

```
✅ SAST - Semgrep           [2 min] Success
✅ SCA - Trivy              [3 min] Success
✅ Detección de Secretos    [1 min] Success
✅ Resumen de Seguridad     [5 seg] Success

4/4 checks passed
```

**En el job "Detección de Secretos" debe decir:**
```
No se encontraron secretos hardcodeados
```

---

## RESULTADO FINAL

**Pipeline 100% funcional:**
- ✅ Semgrep: 3 findings detectados
- ✅ Trivy: Dependencias analizadas
- ✅ detect-secrets: 0 secretos
- ✅ Security tab: Poblado con alertas

**Métricas:**
- Costo: $0
- Tiempo: 4-6 minutos
- Cobertura: 100% commits
- Estado: PASSING

---

## SI ALGO FALLA

### Problema: Workflow sigue fallando en detect-secrets

**Verificar local:**
```powershell
python -m detect_secrets scan --baseline .secrets.baseline
```

Si detecta secretos:
- El baseline no fue pusheado correctamente
- Hay código nuevo con secretos
- El audit no está completo

**Solución:**
```powershell
git status
git log -1
# Verificar que el commit del baseline existe
```

### Problema: Demasiados secretos para auditar (>100)

**Solución:**
Agregar más exclusiones. Lee GUIA_COMPLETA_DETECTSECRETS.md sección "Troubleshooting".

### Problema: No estoy seguro si un secreto es real o falso

**Solución:**
- Marca con `s` (skip)
- Investiga el contexto
- Pregunta al equipo
- Vuelve después

---

## TIEMPO TOTAL

```
Generar baseline:       5 min
Verificar:              1 min
Audit (80 secretos): 30-60 min
Remediar (si hay):   10-30 min
Verificar y replace:    2 min
Commitear:              2 min
Validar workflow:       6 min
────────────────────────────
TOTAL:               56-106 min
                     (1-2 horas)
```

---

## CHECKLIST RAPIDO

- [ ] Paso 1: Baseline filtrado generado
- [ ] Paso 2: < 100 secretos verificado
- [ ] Paso 3: Audit completado
- [ ] Paso 4: Secretos reales remediados (si aplica)
- [ ] Paso 5: Baseline verificado y reemplazado
- [ ] Paso 6: Cambios commiteados y pusheados
- [ ] Paso 7: Workflow ejecutado
- [ ] Paso 8: 4/4 jobs passing

---

## ARCHIVOS DE REFERENCIA

**Para troubleshooting:**
- GUIA_COMPLETA_DETECTSECRETS.md (guía exhaustiva)
- analizar_secretos_fixed.ps1 (análisis detallado)

**Para presentación:**
- GUIA_PRESENTACION_PROYECTO.md (estructura de 55 min)

---

¡ADELANTE! Copia y pega los comandos en orden.
