# PIPELINE DE SEGURIDAD - EXPLICACION COMPLETA PARA EL EQUIPO

## Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS WORKFLOW                        │
│                   (security-scan.yml)                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Trigger on: push, PR, manual
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │          4 JOBS PARALELOS                   │
        │                                             │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
        │  │ Semgrep  │  │  Trivy   │  │ detect-  │ │
        │  │   SAST   │  │   SCA    │  │ secrets  │ │
        │  └──────────┘  └──────────┘  └──────────┘ │
        │       │             │              │       │
        │       │             │              │       │
        └───────┼─────────────┼──────────────┼───────┘
                │             │              │
                └─────────────┴──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ security-summary │
                    │   (Job Final)    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ GitHub Security  │
                    │      Tab         │
                    └──────────────────┘
```

## Componente 1: Semgrep SAST

### ¿Qué es SAST?
Static Application Security Testing - Analisis estatico de codigo fuente

### ¿Qué hace Semgrep?
Escanea el codigo fuente en busca de:
- Vulnerabilidades de seguridad (SQL injection, XSS, CSRF)
- Bugs de logica
- Malas practicas de codigo
- Patrones inseguros

### Flujo de ejecucion:

```
1. Checkout del codigo
   └─> Git clone del repositorio en el runner de GitHub

2. Ejecutar Semgrep
   ├─> Descarga reglas de seguridad de Semgrep Cloud
   │   ├─> p/owasp-top-ten (Top 10 vulnerabilidades OWASP)
   │   ├─> p/php (Reglas especificas de PHP)
   │   ├─> p/laravel (Reglas de Laravel framework)
   │   ├─> p/javascript (Reglas de JS)
   │   ├─> p/react (Reglas de React)
   │   ├─> p/sql-injection (Deteccion de SQL injection)
   │   ├─> p/xss (Deteccion de Cross-Site Scripting)
   │   └─> p/security-audit (Auditoria general)
   │
   ├─> Escanea 102 archivos del proyecto
   ├─> Aplica 2454 reglas de codigo
   ├─> Genera resultados en formato SARIF
   └─> Sube a Semgrep Cloud y GitHub Security

3. Subir SARIF a GitHub Security
   └─> Archivo semgrep.sarif -> GitHub Code Scanning API

4. Comentar en PR (si aplica)
   └─> Lee SARIF, agrupa por severidad, comenta
```

### Tipos de hallazgos de Semgrep:

**Nivel ERROR (Critico):**
```php
// Ejemplo: SQL Injection
$sql = "SELECT * FROM users WHERE id = " . $_GET['id'];
// ❌ Entrada no sanitizada directamente en SQL
```

**Nivel WARNING (Advertencia):**
```javascript
// Ejemplo: Uso de eval()
eval(userInput);
// ⚠️ Eval con entrada de usuario es peligroso
```

**Nivel NOTE (Informativo):**
```html
<!-- Ejemplo: Missing integrity attribute -->
<script src="https://cdn.example.com/lib.js"></script>
<!-- ℹ️ Falta atributo integrity para SRI -->
```

### Configuracion actual - Explicada:

```yaml
- name: Ejecutar Semgrep SAST
  uses: semgrep/semgrep-action@v1
  with:
    config: >-
      p/owasp-top-ten    # OWASP Top 10 vulnerabilities
      p/php              # PHP-specific rules
      p/laravel          # Laravel framework rules
      p/javascript       # JavaScript rules
      p/react            # React-specific rules
      p/sql-injection    # SQL injection patterns
      p/xss              # XSS vulnerabilities
      p/security-audit   # General security audit
    publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}
    # Token para subir a Semgrep Cloud Y generar SARIF local
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    # Token para subir a GitHub Security tab
```

**Flujo de tokens:**
```
SEMGREP_APP_TOKEN:
  ├─> Autenticacion con Semgrep Cloud
  ├─> Subir resultados a https://semgrep.dev
  └─> Generar archivo semgrep.sarif local

GITHUB_TOKEN:
  ├─> Autenticacion con GitHub API
  └─> Subir semgrep.sarif a Security tab
```

### Resultados en tu proyecto:

Segun el scan manual que hiciste:
```
✅ Total findings: 3 (0 blocking)
  ├─> 1 Supply Chain (glob CVE-2025-64756)
  ├─> 1 Missing integrity attribute (XSS prevention)
  └─> 1 Unsafe format string (Log forging)
```

## Componente 2: Trivy SCA

### ¿Qué es SCA?
Software Composition Analysis - Analisis de dependencias de terceros

### ¿Qué hace Trivy?
Escanea dependencias en busca de:
- Vulnerabilidades conocidas (CVEs)
- Configuraciones inseguras
- Licencias problematicas

### Flujo de ejecucion:

```
1. Checkout del codigo

2. Escanear backend PHP
   ├─> Lee backend/composer.lock
   ├─> Identifica 113 dependencias de Composer
   ├─> Consulta base de datos de vulnerabilidades
   ├─> Aplica 5044 reglas de supply chain
   ├─> Genera trivy-php-results.sarif
   └─> Sube a GitHub Security (categoria: trivy-php)

3. Escanear desktop Node.js
   ├─> Lee desktop/package-lock.json
   ├─> Identifica 541 dependencias de NPM
   ├─> Consulta base de datos de vulnerabilidades
   ├─> Aplica 4781 reglas de supply chain
   ├─> Genera trivy-node-results.sarif
   └─> Sube a GitHub Security (categoria: trivy-node)

4. Escanear configuracion Docker
   ├─> Lee backend/Dockerfile.dev
   ├─> Verifica configuraciones de seguridad
   ├─> Genera trivy-docker-results.sarif
   └─> Sube a GitHub Security (categoria: trivy-docker)

5. Generar reporte de tabla para PR
   └─> Formatea resultados en Markdown

6. Comentar en PR
   └─> Publica tabla con vulnerabilidades detectadas
```

### Severidad de vulnerabilidades:

```
CRITICAL (Critica):
├─> CVE con CVSS score >= 9.0
├─> Explotacion remota sin autenticacion
├─> Ejecucion de codigo arbitrario (RCE)
└─> Ejemplo: SQL injection en libreria de ORM

HIGH (Alta):
├─> CVE con CVSS score 7.0-8.9
├─> Explotacion requiere condiciones especificas
├─> Escalada de privilegios
└─> Ejemplo: XSS en libreria de frontend

MEDIUM (Media):
├─> CVE con CVSS score 4.0-6.9
├─> Requiere interaccion de usuario
├─> Divulgacion de informacion
└─> Ejemplo: Path traversal en libreria de archivos

LOW (Baja):
├─> CVE con CVSS score 0.1-3.9
├─> Impacto limitado
└─> Ejemplo: DoS con condiciones muy especificas
```

### Ejemplo de vulnerabilidad detectada:

```
Package: glob
Version: 7.2.3
CVE: CVE-2025-64756
Severity: HIGH
Description: Command injection via -c/--cmd option
Fixed in: 10.5.0, 11.1.0

Impacto:
- Un atacante puede ejecutar comandos arbitrarios
- Afecta si usas glob CLI con entrada de usuario
- Reachability: UNREACHABLE (no usas glob CLI)

Accion requerida:
- Actualizar a version >= 10.5.0
- O marcar como unreachable si no usas la funcionalidad
```

### Configuracion actual:

```yaml
- name: Escanear dependencias PHP
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'              # Filesystem scan
    scan-ref: './backend'        # Directorio a escanear
    format: 'sarif'              # Formato de salida
    output: 'trivy-php-results.sarif'
    severity: 'CRITICAL,HIGH,MEDIUM'  # Solo estas severidades
    scanners: 'vuln'             # Escanear vulnerabilidades
  continue-on-error: true        # No fallar workflow si hay issues
```

**¿Por qué continue-on-error: true?**
- Permite continuar aunque haya vulnerabilidades
- Genera reporte sin detener el pipeline
- El equipo decide si mergear o no segun severidad

## Componente 3: detect-secrets

### ¿Qué hace detect-secrets?
Escanea codigo fuente en busca de secretos hardcodeados:
- API keys
- Passwords
- Tokens de acceso
- Claves privadas
- JWT secrets

### Flujo de ejecucion:

```
1. Checkout del codigo

2. Instalar dependencias
   ├─> pip install detect-secrets
   └─> apt-get install jq (parsear JSON)

3. Escanear codigo
   ├─> Escanea todos los archivos
   ├─> Excluye: .lock, node_modules, vendor, .git
   ├─> Aplica heuristicas:
   │   ├─> Base64 High Entropy
   │   ├─> Hex High Entropy
   │   ├─> Private Key patterns
   │   ├─> AWS/GCP/Azure key patterns
   │   └─> Generic API key patterns
   └─> Genera .secrets.baseline

4. Verificar resultados
   ├─> Cuenta secretos con jq
   ├─> Si count > 0: EXIT 1 (falla)
   └─> Si count = 0: EXIT 0 (pasa)

5. Comentar en PR
   └─> Lista secretos por archivo y linea
```

### Tipos de secretos detectados:

**1. Base64 High Entropy String**
```
Detecta: Strings Base64 con alta entropia
Ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
Comun en: JWT tokens, claves encriptadas
```

**2. Hex High Entropy String**
```
Detecta: Strings hexadecimales largos
Ejemplo: "a3f8d9c2e7b1f4..."
Comun en: Hashes, salts, API keys
```

**3. Private Key**
```
Detecta: Claves privadas SSH/RSA
Ejemplo: "-----BEGIN RSA PRIVATE KEY-----"
Comun en: Archivos .pem, .key
```

**4. AWS/Azure/GCP Keys**
```
Detecta: Patrones especificos de cloud providers
Ejemplo: "AKIA..." (AWS), "AIza..." (GCP)
```

### Tu caso: 19 secretos detectados

```bash
Se encontraron 19 secretos potenciales
Error: Process completed with exit code 1.
```

**Distribucion probable:**
```
Falsos positivos (15-17):
├─> Base64 de imagenes SVG inline
├─> Ejemplos en .env.example
├─> Hashes de ejemplo en documentacion
├─> UUIDs genericos
└─> Strings "YOUR_KEY_HERE"

Secretos reales (2-4):
├─> APP_KEY de Laravel
├─> JWT_SECRET
└─> Posiblemente claves de API de desarrollo
```

### Proceso de resolucion:

```
PASO 1: Generar baseline localmente
$ detect-secrets scan --all-files > .secrets.baseline

PASO 2: Auditar interactivamente
$ detect-secrets audit .secrets.baseline
# Clasificar cada uno como real o falso positivo

PASO 3: Remediar secretos reales
# Mover a variables de entorno
# Actualizar .env.example sin valores reales
# Eliminar del historial de git si es necesario

PASO 4: Commitear baseline
$ git add .secrets.baseline
$ git commit -m "chore: baseline de secretos auditado"

PASO 5: Re-ejecutar workflow
# Ahora solo detectara secretos NUEVOS
# Baseline existente se usa como referencia
```

## Componente 4: security-summary

### ¿Qué hace?
Consolida resultados de los 3 jobs anteriores y genera resumen ejecutivo

### Flujo:

```
1. Esperar a que terminen los 3 jobs
   └─> needs: [semgrep-sast, trivy-sca, detect-secrets]

2. Recolectar estados
   ├─> semgrep: ${{ needs.semgrep-sast.result }}
   ├─> trivy: ${{ needs.trivy-sca.result }}
   └─> secrets: ${{ needs.detect-secrets.result }}

3. Generar tabla resumen
   ┌─────────────┬─────────┬─────────────────────────┐
   │ Herramienta │ Estado  │ Descripcion             │
   ├─────────────┼─────────┼─────────────────────────┤
   │ ✓ Semgrep   │ success │ Analisis estatico       │
   │ ✓ Trivy     │ success │ Analisis de dependencias│
   │ ✗ Secrets   │ failure │ Deteccion de secretos   │
   └─────────────┴─────────┴─────────────────────────┘

4. Generar mensaje final
   ├─> Todos success: "Todos los checks pasaron"
   └─> Alguno failure: "Accion requerida"

5. Publicar en GitHub Actions Summary
   └─> Visible en la UI de Actions
```

## Integracion con GitHub Security

### GitHub Security Tab

```
Security
  ├─> Code scanning alerts
  │   ├─> Semgrep findings (categoria: semgrep-sast)
  │   ├─> Trivy PHP (categoria: trivy-php)
  │   ├─> Trivy Node (categoria: trivy-node)
  │   └─> Trivy Docker (categoria: trivy-docker)
  │
  ├─> Dependabot alerts
  │   └─> Integrado con Trivy results
  │
  └─> Secret scanning
      └─> GitHub native + detect-secrets
```

### Formato SARIF

SARIF = Static Analysis Results Interchange Format

**¿Por qué SARIF?**
- Formato estandar para resultados de seguridad
- Soportado nativamente por GitHub
- Permite integracion con multiples herramientas

**Estructura de SARIF:**
```json
{
  "version": "2.1.0",
  "runs": [{
    "tool": {
      "driver": {
        "name": "Semgrep",
        "version": "1.144.1"
      }
    },
    "results": [{
      "ruleId": "php.lang.security.sql-injection",
      "level": "error",
      "message": {
        "text": "Posible SQL injection detectado"
      },
      "locations": [{
        "physicalLocation": {
          "artifactLocation": {
            "uri": "backend/app/Http/Controllers/UserController.php"
          },
          "region": {
            "startLine": 42,
            "startColumn": 15
          }
        }
      }]
    }]
  }]
}
```

## Metricas y KPIs del Pipeline

### Tiempo de ejecucion (por job):
```
semgrep-sast:    1-2 min   (depende de cantidad de codigo)
trivy-sca:       2-3 min   (depende de cantidad de deps)
detect-secrets:  30-60 seg (depende de archivos)
security-summary: 10 seg

TOTAL: 4-6 minutos en paralelo
```

### Consumo de recursos:
```
GitHub Actions minutes (publico): Gratis ilimitado
CPU: 2 cores por job
RAM: 7 GB por job
Disco: 14 GB por job
```

### Deteccion de vulnerabilidades:
```
SAST (Semgrep):
├─> Code rules: 2454
├─> Supply chain rules: 9825
└─> Archivos escaneados: 102

SCA (Trivy):
├─> Backend deps: 113 packages
├─> Desktop deps: 541 packages
└─> CVEs conocidos: Base de datos actualizada diariamente

Secrets (detect-secrets):
├─> Tipos de secretos: 15+ patrones
└─> Heuristicas: Base64, Hex, Private Keys, Cloud Keys
```

## Flujo Completo - Diagrama de Secuencia

```
Developer                GitHub                Semgrep Cloud        GitHub Security
    |                       |                         |                    |
    |-- git push main ----->|                         |                    |
    |                       |                         |                    |
    |                       |-- Trigger workflow ---->|                    |
    |                       |                         |                    |
    |                       |-- Run Semgrep --------->|                    |
    |                       |                         |-- Analyze rules -->|
    |                       |                         |                    |
    |                       |<------- SARIF ----------|                    |
    |                       |                         |                    |
    |                       |-- Upload SARIF ---------------------->|      |
    |                       |                         |                    |
    |                       |-- Run Trivy ----------->|                    |
    |                       |<------- SARIF ----------|                    |
    |                       |                         |                    |
    |                       |-- Upload SARIF ---------------------->|      |
    |                       |                         |                    |
    |                       |-- Run detect-secrets -->|                    |
    |                       |<-- Results (19 found)---|                    |
    |                       |                         |                    |
    |                       |-- Workflow fails ------>|                    |
    |                       |                         |                    |
    |<-- Email notification-|                         |                    |
    |                       |                         |                    |
```

## Soluciones a los 3 Problemas

### Problema 1: SEMGREP_APP_TOKEN
```
SOLUCION:
1. Ir a Settings -> Secrets and variables -> Actions
2. Click "New repository secret"
3. Name: SEMGREP_APP_TOKEN
4. Value: [token de semgrep.dev]
5. Add secret
```

### Problema 2: semgrep.sarif no existe
```
SOLUCION:
Cambiar en workflow:
  env:
    SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

Por:
  with:
    publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Problema 3: 19 secretos detectados
```
SOLUCION:
1. Ejecutar localmente: detect-secrets scan > .secrets.baseline
2. Auditar: detect-secrets audit .secrets.baseline
3. Marcar falsos positivos
4. Remediar secretos reales
5. Commitear baseline: git add .secrets.baseline
6. Re-ejecutar workflow (usara baseline)
```

## Proximos Pasos

1. [ ] Agregar SEMGREP_APP_TOKEN en GitHub Secrets
2. [ ] Actualizar workflow con publishToken
3. [ ] Auditar los 19 secretos localmente
4. [ ] Commitear .secrets.baseline
5. [ ] Re-ejecutar workflow
6. [ ] Validar que los 3 jobs pasen
7. [ ] Documentar en trabajo final

## Recursos para el Equipo

- GitHub Actions docs: https://docs.github.com/en/actions
- Semgrep docs: https://semgrep.dev/docs/
- Trivy docs: https://aquasecurity.github.io/trivy/
- detect-secrets: https://github.com/Yelp/detect-secrets
- SARIF spec: https://sarifweb.azurewebsites.net/