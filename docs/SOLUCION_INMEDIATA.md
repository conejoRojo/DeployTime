# SOLUCION INMEDIATA - 3 PROBLEMAS

## TU SITUACION ACTUAL

✅ **BUENA NOTICIA: Tu .secrets.baseline esta perfecto**
```json
"results": {}
```
Esto significa: 0 secretos reales. Los 19 fueron eliminados o marcados como falsos positivos.

❌ **MALAS NOTICIAS:**
1. detect-secrets no instalado en Windows PowerShell
2. Workflow tiene parametro incorrecto "generateSarif"
3. CodeQL Action v3 (debe ser v4)

---

## SOLUCION 1: Instalar detect-secrets en Windows

### Opcion A: Con pip (Recomendado)

```powershell
# Abrir PowerShell como Administrador
# Windows key + X -> Windows PowerShell (Admin)

# Verificar Python
python --version
# Si no esta instalado: https://www.python.org/downloads/

# Instalar detect-secrets
pip install detect-secrets

# Verificar instalacion
detect-secrets --version
```

### Opcion B: Script automatico

```powershell
# Descargar el script instalar_detect_secrets_windows.ps1
# Ejecutar en PowerShell como Administrador:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\instalar_detect_secrets_windows.ps1
```

### Verificacion

```powershell
# Cerrar y reabrir PowerShell
cd D:\Desarrollo\DeployTime
detect-secrets --version
# Debe mostrar: detect-secrets 1.x.x
```

---

## SOLUCION 2: Reemplazar workflow incorrecto

### El problema en tu workflow actual:

```yaml
# ❌ INCORRECTO (en tu repo actual)
- name: Ejecutar Semgrep SAST
  uses: semgrep/semgrep-action@v1
  with:
    config: ...
    generateSarif: true  # <- ESTE PARAMETRO NO EXISTE
  env:
    SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
```

```yaml
# ✅ CORRECTO (nuevo workflow)
- name: Ejecutar Semgrep SAST
  uses: semgrep/semgrep-action@v1
  with:
    config: ...
    publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}  # <- CAMBIADO
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # <- AGREGADO
```

### Pasos para reemplazar:

```powershell
# En PowerShell
cd D:\Desarrollo\DeployTime

# Hacer backup del workflow actual
Copy-Item .github\workflows\security-scan.yml .github\workflows\security-scan.yml.backup

# Descargar el nuevo security-scan-FINAL.yml
# Copiarlo a:
Copy-Item security-scan-FINAL.yml .github\workflows\security-scan.yml

# Verificar el cambio
git diff .github\workflows\security-scan.yml

# Commitear
git add .github\workflows\security-scan.yml
git commit -m "fix: corregir workflow de seguridad - remover generateSarif"
git push origin main
```

---

## SOLUCION 3: Commitear baseline (ya esta perfecto)

Tu archivo .secrets.baseline ya esta listo:

```powershell
cd D:\Desarrollo\DeployTime

# Verificar que existe
Get-Content .secrets.baseline | Select-String -Pattern '"results"'
# Debe mostrar: "results": {},

# Si existe y esta vacio, commitearlo
git add .secrets.baseline
git commit -m "chore: agregar baseline de detect-secrets vacio"
git push origin main
```

---

## VALIDACION FINAL

### Paso 1: Verificar SEMGREP_APP_TOKEN

```
GitHub.com
  -> Tu repo DeployTime
  -> Settings
  -> Secrets and variables
  -> Actions
  -> Verificar que existe: SEMGREP_APP_TOKEN
```

### Paso 2: Ejecutar workflow manualmente

```
GitHub.com
  -> Actions tab
  -> Security Scan (SAST + SCA + Secrets)
  -> Run workflow (boton derecho)
  -> Branch: main
  -> Run workflow (boton verde)
```

### Paso 3: Resultados esperados (4-6 minutos)

**Job 1: semgrep-sast**
- ✅ Ejecutar Semgrep SAST - Success
- ✅ Subir resultados SARIF - Success
- ✅ NO error "Unexpected input 'generateSarif'"
- ✅ NO error "Path does not exist: semgrep.sarif"

**Job 2: trivy-sca**
- ✅ Todos los steps - Success o continue-on-error
- ✅ NO warnings de CodeQL v3

**Job 3: detect-secrets**
- ✅ Instalar dependencias - Success
- ✅ Escanear secretos - Success
- ✅ Verificar resultados - Success (0 secretos)
- ✅ NO error "Se encontraron X secretos"

**Job 4: security-summary**
- ✅ Generar resumen - Success
- ✅ Tabla muestra:
  ```
  | ✓ Semgrep   | success |
  | ✓ Trivy     | success |
  | ✓ Secrets   | success |
  ```

---

## CHECKLIST RAPIDO

Pre-implementacion:
- [ ] Python instalado en Windows
- [ ] pip instalado
- [ ] detect-secrets instalado y verificado
- [ ] SEMGREP_APP_TOKEN en GitHub Secrets

Reemplazo de workflow:
- [ ] Backup de workflow actual creado
- [ ] security-scan-FINAL.yml descargado
- [ ] Workflow reemplazado en .github/workflows/
- [ ] Cambios commiteados y pusheados

Baseline de secretos:
- [ ] .secrets.baseline existe
- [ ] Contiene "results": {}
- [ ] Commiteado al repo

Validacion:
- [ ] Workflow ejecutado manualmente
- [ ] Los 3 jobs pasaron exitosamente
- [ ] Sin errores de generateSarif
- [ ] Sin errores de CodeQL v3
- [ ] Sin secretos detectados
- [ ] GitHub Security tab poblado

---

## COMANDOS COMPLETOS - COPIAR Y PEGAR

### En PowerShell (como Administrador):

```powershell
# Instalar detect-secrets
pip install detect-secrets

# Cerrar PowerShell, reabrir normal (no admin)
cd D:\Desarrollo\DeployTime

# Verificar instalacion
detect-secrets --version

# Backup workflow actual
Copy-Item .github\workflows\security-scan.yml .github\workflows\security-scan.yml.backup

# Copiar nuevo workflow (despues de descargarlo)
Copy-Item security-scan-FINAL.yml .github\workflows\security-scan.yml

# Verificar baseline existe y esta vacio
Get-Content .secrets.baseline

# Commitear todo
git add .github\workflows\security-scan.yml .secrets.baseline
git commit -m "fix: workflow de seguridad corregido + baseline vacio"
git push origin main
```

---

## TROUBLESHOOTING

### Problema: "python no se reconoce como comando"

**Solucion:**
1. Descargar Python: https://www.python.org/downloads/
2. Durante instalacion: MARCAR "Add Python to PATH"
3. Reiniciar PowerShell

### Problema: "pip no se reconoce como comando"

**Solucion:**
```powershell
python -m ensurepip --upgrade
python -m pip --version
```

### Problema: Workflow sigue fallando con "generateSarif"

**Solucion:**
Verificar que el archivo fue reemplazado correctamente:

```powershell
# Ver contenido del workflow actual
Get-Content .github\workflows\security-scan.yml | Select-String -Pattern "generateSarif"

# Si encuentra algo, el archivo NO se reemplazo
# Eliminar y copiar de nuevo
Remove-Item .github\workflows\security-scan.yml
Copy-Item security-scan-FINAL.yml .github\workflows\security-scan.yml
```

### Problema: detect-secrets falla en workflow pero funciona local

**Solucion:**
El baseline ya esta en el repo, el workflow deberia funcionar.
Si falla, verificar que .secrets.baseline fue pusheado:

```powershell
git status
git add .secrets.baseline
git commit -m "chore: agregar baseline de secretos"
git push origin main
```

---

## RESUMEN DE CAMBIOS

| Componente | Antes | Despues |
|------------|-------|---------|
| detect-secrets | No instalado | Instalado via pip |
| Workflow Semgrep | generateSarif: true | publishToken: TOKEN |
| Workflow CodeQL | v3 (deprecated) | v4 (actual) |
| .secrets.baseline | No existia | Existe con results: {} |
| SEMGREP_APP_TOKEN | Configurado | Configurado |

---

## EVIDENCIA PARA TRABAJO FINAL

Despues de que todo funcione, capturar:

1. **Screenshot de Actions tab**
   - Los 4 jobs en verde
   - Tiempo total: ~4-6 min

2. **Screenshot de Security tab**
   - Code scanning alerts
   - Categorias: semgrep-sast, trivy-php, trivy-node, trivy-docker

3. **Screenshot de workflow file**
   - Mostrar publishToken correcto
   - Mostrar CodeQL v4

4. **Screenshot de .secrets.baseline**
   - Mostrar "results": {}

5. **Logs del workflow**
   - Semgrep: "CI scan completed successfully"
   - Trivy: Scan results
   - detect-secrets: "No se encontraron secretos"

---

## CONTACTO

Si algo no funciona despues de seguir esta guia:
1. Revisar logs del workflow en GitHub Actions
2. Verificar que el archivo fue reemplazado (buscar "generateSarif")
3. Verificar que SEMGREP_APP_TOKEN existe en Secrets
4. Verificar que .secrets.baseline esta en el repo
