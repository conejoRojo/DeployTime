# EXPLICACION TECNICA: Error "generateSarif"

## El Error Completo

```
Unexpected input(s) 'generateSarif', valid inputs are ['entryPoint', 'args', 'config', 'publishToken']
```

## ¿Por que ocurre este error?

### Contexto historico

La accion `semgrep/semgrep-action` ha evolucionado y cambio su API:

**Version antigua (ya no soportada):**
```yaml
- uses: semgrep/semgrep-action@v1
  with:
    generateSarif: true  # Parametro que YA NO EXISTE
```

**Version actual (correcta):**
```yaml
- uses: semgrep/semgrep-action@v1
  with:
    publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}  # Parametro correcto
```

### ¿Que hace cada parametro?

#### generateSarif (OBSOLETO - NO USAR)

```yaml
# ❌ OBSOLETO - Ya no funciona
generateSarif: true
```

**Comportamiento anterior:**
- Generaba archivo SARIF localmente
- Funcionaba en versiones antiguas

**Por que fue removido:**
- Funcion duplicada con publishToken
- Causaba confusion
- No permitia subir a Semgrep Cloud

#### publishToken (ACTUAL - USAR ESTE)

```yaml
# ✅ ACTUAL - Este es el correcto
with:
  publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Comportamiento actual:**
- Autentica con Semgrep Cloud
- Sube resultados a https://semgrep.dev
- **GENERA archivo semgrep.sarif localmente**
- Permite que GitHub Security acceda al SARIF

### Flujo de datos con publishToken

```
Codigo fuente
     │
     ▼
┌──────────────────┐
│ semgrep-action   │
│ (con publishToken)│
└────────┬─────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐    ┌──────────────┐
│ Semgrep Cloud│    │semgrep.sarif │
│  (online)    │    │   (local)    │
└──────────────┘    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ GitHub       │
                    │ Security Tab │
                    └──────────────┘
```

### Flujo de datos con generateSarif (obsoleto)

```
Codigo fuente
     │
     ▼
┌──────────────────┐
│ semgrep-action   │
│(generateSarif)   │
└────────┬─────────┘
         │
         ▼
    ❌ ERROR
    Parametro no reconocido
```

## Comparacion Tecnica

| Aspecto | generateSarif | publishToken |
|---------|---------------|--------------|
| Estado | Obsoleto | Actual |
| Genera SARIF local | Si | Si |
| Sube a Semgrep Cloud | No | Si |
| Requiere token | No | Si |
| Requiere GITHUB_TOKEN | No | Si |
| Funciona en v1 | No (removido) | Si |

## ¿Por que tu workflow tenia generateSarif?

**Posibles razones:**

1. **Tutorial antiguo:**
   - Seguiste documentacion de 2023 o anterior
   - Semgrep cambio su API en 2024

2. **Workflow copiado:**
   - Copiaste de un proyecto viejo
   - No actualizado a nueva sintaxis

3. **Documentacion desactualizada:**
   - Algunos blogs/tutoriales no actualizaron
   - GitHub tiene ejemplos antiguos en algunos repos

## Como verificar tu workflow actual

### En GitHub Web UI:

1. Ir a tu repo: https://github.com/conejoRojo/DeployTime
2. Click en `.github/workflows/security-scan.yml`
3. Buscar (Ctrl+F): `generateSarif`

**Si aparece:**
```yaml
generateSarif: true  # <- ENCONTRADO: Necesita actualizacion
```

**Debe ser:**
```yaml
publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}  # <- CORRECTO
```

### En PowerShell local:

```powershell
cd D:\Desarrollo\DeployTime
Get-Content .github\workflows\security-scan.yml | Select-String -Pattern "generateSarif"
```

**Si devuelve algo:**
- El archivo necesita actualizacion

**Si no devuelve nada:**
- El archivo ya esta correcto

## El fix correcto - Paso a paso

### Paso 1: Ver el error en tu workflow

```yaml
# Tu workflow ACTUAL (con error)
jobs:
  semgrep-sast:
    steps:
      - name: Ejecutar Semgrep SAST
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/php
            p/laravel
          generateSarif: true          # <- LINEA PROBLEMATICA
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
```

### Paso 2: Aplicar la correccion

```yaml
# Workflow CORREGIDO
jobs:
  semgrep-sast:
    steps:
      - name: Ejecutar Semgrep SAST
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/php
            p/laravel
          publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}  # <- CAMBIADO
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}        # <- AGREGADO
```

### Cambios realizados:

1. **Removido:** `generateSarif: true`
2. **Agregado en `with:`:** `publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}`
3. **Cambiado `env:`:** De `SEMGREP_APP_TOKEN` a `GITHUB_TOKEN`

## ¿Por que necesitamos GITHUB_TOKEN?

### Flujo completo con ambos tokens:

```
SEMGREP_APP_TOKEN:
├─> Autentica con Semgrep Cloud
├─> Sube resultados a https://semgrep.dev
└─> Genera semgrep.sarif local

GITHUB_TOKEN:
├─> Autentica con GitHub API
├─> Lee el archivo semgrep.sarif
└─> Sube a GitHub Security Tab
```

### Sin GITHUB_TOKEN:

```
❌ ERROR: Cannot upload SARIF to GitHub Security
Resource not accessible by integration
```

### Con GITHUB_TOKEN:

```
✅ SUCCESS: SARIF uploaded to GitHub Security
Findings visible in Security tab
```

## Parametros validos de semgrep-action@v1

Segun el mensaje de error, estos son los unicos parametros validos:

```yaml
uses: semgrep/semgrep-action@v1
with:
  entryPoint: string     # Punto de entrada custom
  args: string           # Argumentos CLI custom
  config: string         # Reglas a aplicar (lo usamos)
  publishToken: string   # Token para Semgrep Cloud (lo usamos)
```

**Cualquier otro parametro = ERROR**

Por ejemplo, estos TAMBIEN son invalidos:
- ❌ `generateSarif: true`
- ❌ `sarif: true`
- ❌ `output: semgrep.sarif`
- ❌ `format: sarif`

## Documentacion oficial actualizada

**Correcto (2024+):**
- https://github.com/semgrep/semgrep-action
- https://semgrep.dev/docs/ci/

**Obsoleto (evitar):**
- Tutoriales pre-2024 con generateSarif
- Ejemplos en blogs viejos
- Stack Overflow respuestas antiguas

## Validacion del fix

Despues de actualizar el workflow, verificar:

### En el log de Actions:

**ANTES (con error):**
```
Run semgrep/semgrep-action@v1
Error: Unexpected input(s) 'generateSarif'
❌ Job failed
```

**DESPUES (correcto):**
```
Run semgrep/semgrep-action@v1
Scan completed successfully
Uploading scan results
✅ Job succeeded
```

### En el filesystem del runner:

**ANTES (con error):**
```
ls -la
# NO existe semgrep.sarif
```

**DESPUES (correcto):**
```
ls -la
-rw-r--r-- 1 runner docker 45678 Dec 12 10:30 semgrep.sarif
# ✅ Archivo generado
```

### En GitHub Security:

**ANTES (con error):**
```
Security tab
└─> Code scanning
    └─> (vacio - sin resultados)
```

**DESPUES (correcto):**
```
Security tab
└─> Code scanning
    └─> Semgrep findings
        ├─> 3 findings
        ├─> Category: semgrep-sast
        └─> Last updated: hace X minutos
```

## Preguntas frecuentes

### ¿Por que Semgrep cambio su API?

**Razon oficial:**
- Unificar autenticacion con un solo token
- Simplificar integracion con Semgrep Cloud
- Eliminar parametros redundantes

### ¿Funcionara mi workflow viejo en versiones futuras?

**No.**
- generateSarif fue removido permanentemente
- Workflows con este parametro fallan
- Necesitas actualizar a publishToken

### ¿Puedo usar semgrep sin token?

**Si, pero limitado:**
```yaml
uses: semgrep/semgrep-action@v1
with:
  config: p/owasp-top-ten
# Sin publishToken:
# ✅ Escanea codigo
# ✅ Imprime resultados en log
# ❌ NO genera SARIF
# ❌ NO sube a Semgrep Cloud
# ❌ NO integra con GitHub Security
```

### ¿El token SEMGREP_APP_TOKEN es gratis?

**Si:**
- Cuenta gratuita en semgrep.dev
- Limite: 100,000 lineas de codigo/mes
- Suficiente para PyMEs

### ¿Que pasa si no tengo GITHUB_TOKEN?

**No te preocupes:**
- GitHub Actions provee este token automaticamente
- No necesitas crearlo manualmente
- Solo referenciarlo: `${{ secrets.GITHUB_TOKEN }}`

## Resumen ejecutivo

| Concepto | Valor |
|----------|-------|
| Parametro obsoleto | generateSarif |
| Parametro correcto | publishToken |
| Token requerido | SEMGREP_APP_TOKEN |
| Token adicional | GITHUB_TOKEN (auto) |
| Archivo generado | semgrep.sarif |
| Destino Cloud | semgrep.dev |
| Destino GitHub | Security tab |

## Conclusion

El error "Unexpected input 'generateSarif'" ocurre porque:

1. Tu workflow usa sintaxis antigua (pre-2024)
2. generateSarif fue removido de la API
3. Debe reemplazarse con publishToken
4. publishToken genera SARIF Y sube a Cloud

La solucion es simple:
- Remover: `generateSarif: true`
- Agregar: `publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}`
- Agregar: `env.GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`

Una vez aplicado, el workflow funcionara perfectamente.
