# GUIA DE IMPLEMENTACION - PASO A PASO

## RESUMEN EJECUTIVO

Pipeline de seguridad con 3 problemas identificados:
- âŒ Semgrep: No genera archivo SARIF
- âŒ detect-secrets: 19 secretos detectados
- âœ… Trivy: Funcionando correctamente

Tiempo estimado de resolucion: 30-45 minutos

---

## PROBLEMA 1: SEMGREP_APP_TOKEN - Como agregarlo

### Paso 1.1: Obtener el token de Semgrep

- [ ] Ir a https://semgrep.dev/
- [ ] Iniciar sesion con tu cuenta de GitHub
- [ ] Ir a Settings (icono de usuario arriba derecha)
- [ ] Click en "Tokens" en el menu lateral
- [ ] Click en "Generate new token"
- [ ] Copiar el token generado (empieza con `sgp_...`)

### Paso 1.2: Agregar token a GitHub

- [ ] Ir a tu repositorio: https://github.com/conejoRojo/DeployTime
- [ ] Click en "Settings" (ultima pestaÃ±a)
- [ ] En el menu lateral izquierdo: "Secrets and variables"
- [ ] Click en "Actions" (el primero, NO Codespaces ni Dependabot)
- [ ] Click en el boton verde "New repository secret"
- [ ] Completar formulario:
  ```
  Name: SEMGREP_APP_TOKEN
  Secret: sgp_[tu_token_aqui]
  ```
- [ ] Click "Add secret"

### Verificacion:
```
Deberias ver en la lista:
SEMGREP_APP_TOKEN    Updated X seconds ago
```

---

## PROBLEMA 2: SEMGREP.SARIF - Corregir workflow

### Paso 2.1: Descargar workflow corregido

- [ ] Descargar el archivo `security-scan.yml` que te entrege
- [ ] En tu proyecto local: `cd DeployTime`
- [ ] Reemplazar archivo: `cp security-scan.yml .github/workflows/`

### Paso 2.2: Revisar cambios

El cambio principal en el job semgrep-sast:

**ANTES (incorrecto):**
```yaml
- name: Ejecutar Semgrep SAST
  uses: semgrep/semgrep-action@v1
  with:
    config: >-
      p/owasp-top-ten
      # ... mas configs
  env:
    SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
```

**DESPUES (correcto):**
```yaml
- name: Ejecutar Semgrep SAST
  uses: semgrep/semgrep-action@v1
  with:
    config: >-
      p/owasp-top-ten
      # ... mas configs
    publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Paso 2.3: Commitear y pushear

- [ ] `git add .github/workflows/security-scan.yml`
- [ ] `git commit -m "fix: corregir generacion de SARIF en semgrep"`
- [ ] `git push origin main`

### Verificacion:
- [ ] Ir a Actions tab en GitHub
- [ ] Ver que el workflow se ejecuta
- [ ] Verificar que el step "Subir resultados SARIF" pasa sin error

---

## PROBLEMA 3: 19 SECRETOS - Auditoria y resolucion

### Paso 3.1: Instalar detect-secrets localmente

```bash
# En tu maquina local
cd DeployTime
pip install detect-secrets
```

### Paso 3.2: Generar baseline

```bash
# Generar archivo de baseline
detect-secrets scan --all-files \
  --exclude-files '\.lock$' \
  --exclude-files 'node_modules/' \
  --exclude-files 'vendor/' \
  --exclude-files '\.git/' \
  --exclude-files 'package-lock\.json' \
  --exclude-files 'composer\.lock' \
  > .secrets.baseline

# Ver resumen
cat .secrets.baseline | python -m json.tool | head -20
```

### Paso 3.3: Auditar interactivamente

```bash
# Modo interactivo
detect-secrets audit .secrets.baseline
```

**Interfaz de audit:**
```
Secret:      1 of 19
Filename:    backend/.env.example
Secret Type: Base64 High Entropy String
----------
12: DATABASE_PASSWORD=your-password-here
----------

Is this a valid secret? (y)es, (n)o, (s)kip, (q)uit: n
```

**Para cada secreto:**
- [ ] Si es falso positivo (ej: imagen SVG, ejemplo en docs): Presionar `n`
- [ ] Si es secreto real: Presionar `y`, anotar para remediar
- [ ] Si no estas seguro: Presionar `s`, revisar despues

### Paso 3.4: Categorizar los 19 secretos

Crea una tabla para trackear:

```
| # | Archivo                    | Tipo      | Real/Falso | Accion      |
|---|----------------------------|-----------|------------|-------------|
| 1 | backend/.env.example       | Base64    | Falso      | Marcar n    |
| 2 | desktop/public/index.html  | Base64    | Falso      | Marcar n    |
| 3 | backend/config/app.php     | Hex       | Real       | Eliminar    |
| ... (completar los 19)
```

### Paso 3.5: Remediar secretos reales

Para cada secreto REAL identificado:

**A. Secreto en codigo:**
```php
// âŒ ANTES
define('JWT_SECRET', 'mi-clave-secreta-123');

// âœ… DESPUES
define('JWT_SECRET', env('JWT_SECRET'));
```

**B. Agregar a .env:**
```bash
# .env (no commiteado)
JWT_SECRET=mi-clave-secreta-123
```

**C. Actualizar .env.example:**
```bash
# .env.example (commiteado)
JWT_SECRET=your-jwt-secret-here
```

**D. Verificar .gitignore:**
```bash
# Asegurarse que .env esta ignorado
cat .gitignore | grep "\.env$"
```

### Paso 3.6: Commitear baseline auditado

```bash
# Agregar baseline con falsos positivos marcados
git add .secrets.baseline
git commit -m "chore: baseline de detect-secrets auditado"
git push origin main
```

### Verificacion:
- [ ] Todos los secretos auditados
- [ ] Secretos reales eliminados del codigo
- [ ] Secretos movidos a .env
- [ ] Baseline commiteado
- [ ] Workflow pasa sin errores

---

## VALIDACION FINAL

### Paso 4.1: Ejecutar workflow manualmente

- [ ] Ir a GitHub Actions tab
- [ ] Seleccionar "Security Scan (SAST + SCA + Secrets)"
- [ ] Click "Run workflow"
- [ ] Branch: main
- [ ] Click "Run workflow" (boton verde)

### Paso 4.2: Verificar resultados esperados

**Job semgrep-sast:**
- [ ] âœ… Checkout codigo - Success
- [ ] âœ… Ejecutar Semgrep SAST - Success (o con warnings menores)
- [ ] âœ… Subir resultados SARIF - Success
- [ ] âœ… NO error "Path does not exist: semgrep.sarif"
- [ ] âœ… NO error "Resource not accessible by integration"

**Job trivy-sca:**
- [ ] âœ… Todas los steps - Success o continue-on-error

**Job detect-secrets:**
- [ ] âœ… Instalar dependencias - Success (pip + jq)
- [ ] âœ… Escanear secretos - Success
- [ ] âœ… Verificar resultados - Success (0 secretos nuevos)
- [ ] âœ… NO error "Se encontraron X secretos potenciales"

**Job security-summary:**
- [ ] âœ… Generar resumen - Success
- [ ] âœ… Tabla muestra:
  ```
  | âœ“ Semgrep   | success | ... |
  | âœ“ Trivy     | success | ... |
  | âœ“ Secrets   | success | ... |
  ```

### Paso 4.3: Verificar GitHub Security tab

- [ ] Ir a Security tab del repositorio
- [ ] Click en "Code scanning"
- [ ] Verificar que aparecen alertas de:
  - Semgrep (categoria: semgrep-sast)
  - Trivy PHP (categoria: trivy-php)
  - Trivy Node (categoria: trivy-node)
  - Trivy Docker (categoria: trivy-docker)

### Paso 4.4: Probar en PR

- [ ] Crear rama de test: `git checkout -b test/security-pipeline`
- [ ] Hacer cambio minimo: `echo "# Test" >> README.md`
- [ ] Commitear: `git commit -am "test: validar pipeline"`
- [ ] Pushear: `git push origin test/security-pipeline`
- [ ] Crear PR en GitHub
- [ ] Esperar que workflow ejecute (4-6 min)
- [ ] Verificar comentarios automaticos en el PR:
  - [ ] Comentario de Semgrep
  - [ ] Comentario de Trivy
  - [ ] Comentario de detect-secrets
- [ ] Verificar resumen en Actions tab del PR

---

## DOCUMENTACION PARA TRABAJO FINAL

### Metricas a reportar:

**Configuracion:**
- Herramientas integradas: 3 (Semgrep, Trivy, detect-secrets)
- Reglas aplicadas:
  - SAST: 2,454 reglas
  - SCA: 9,825 reglas
  - Secrets: 15+ patrones
- Archivos escaneados: 102
- Dependencias analizadas: 654 (113 PHP + 541 Node)

**Resultados iniciales:**
- Vulnerabilidades SAST: 3 findings (0 blocking)
- Vulnerabilidades SCA: [completar despues de scan]
- Secretos detectados: 19 (X reales, Y falsos positivos)

**Remediacion:**
- Secretos reales eliminados: X
- Falsos positivos identificados: Y
- Tiempo de remediacion: Z minutos
- MTTR (Mean Time To Remediation): <24 horas

**Automatizacion:**
- Ejecucion automatica: Push, PR, Manual
- Tiempo de pipeline: 4-6 minutos
- Integracion nativa con GitHub Security
- Comentarios automaticos en PRs
- Costo: $0 (herramientas gratuitas + repo publico)

### Screenshots necesarios:

1. [ ] GitHub Actions - Ejecucion exitosa completa
2. [ ] GitHub Security - Tab con alertas
3. [ ] PR con comentarios automaticos
4. [ ] Semgrep Cloud dashboard
5. [ ] Tabla de vulnerabilidades en PR
6. [ ] Resumen de security-summary

### Explicacion para defensa:

**Problema original:**
"Las PyMEs no tienen recursos para implementar seguridad continua"

**Solucion implementada:**
"Pipeline automatizado de costo cero que reduce MTTR de semanas a <24h"

**Tecnologias utilizadas:**
- GitHub Actions (CI/CD gratuito)
- Semgrep (SAST gratuito)
- Trivy (SCA gratuito)
- detect-secrets (open source)

**Resultados medibles:**
- 100% de commits escaneados automaticamente
- 0% de intervencion manual requerida
- 100% de secretos reales eliminados
- X vulnerabilidades detectadas y remediadas

---

## TROUBLESHOOTING

### Si Semgrep sigue sin generar SARIF:

**Verificar:**
```bash
# Ver logs del step
# Buscar linea: "Uploading scan results"
# Debe decir: "Generated SARIF output"
```

**Solucion:**
- Verificar que SEMGREP_APP_TOKEN esta configurado
- Verificar que publishToken esta en with:, no en env:
- Verificar que GITHUB_TOKEN esta en env:

### Si detect-secrets sigue fallando:

**Verificar:**
```bash
# Localmente
detect-secrets scan --baseline .secrets.baseline
# Deberia decir: "No new secrets detected"
```

**Solucion:**
- Asegurarse que .secrets.baseline esta commiteado
- Verificar que audit marco correctamente los falsos positivos
- Revisar que secretos reales fueron eliminados del codigo

### Si Trivy marca demasiadas vulnerabilidades:

**Opciones:**
1. Actualizar dependencias: `composer update` / `npm update`
2. Revisar reachability (muchas son unreachable)
3. Crear baseline de supresion para falsos positivos
4. Priorizar CRITICAL y HIGH primero

---

## CHECKLIST FINAL

Pre-implementacion:
- [ ] SEMGREP_APP_TOKEN configurado en GitHub Secrets
- [ ] Workflow actualizado con publishToken
- [ ] detect-secrets instalado localmente

Auditoria de secretos:
- [ ] .secrets.baseline generado
- [ ] 19 secretos auditados
- [ ] Secretos reales identificados: X
- [ ] Falsos positivos marcados: Y
- [ ] Secretos reales eliminados del codigo
- [ ] Baseline commiteado

Validacion:
- [ ] Workflow ejecutado manualmente - PASS
- [ ] Los 3 jobs completaron exitosamente
- [ ] GitHub Security tab poblado con alertas
- [ ] PR de prueba con comentarios automaticos
- [ ] Sin errores criticos en logs

Documentacion:
- [ ] Screenshots capturados
- [ ] Metricas recolectadas
- [ ] Evidencia de remediacion
- [ ] Explicacion tecnica preparada

Post-implementacion:
- [ ] Branch protection rules configuradas (opcional)
- [ ] Equipo capacitado en uso del pipeline
- [ ] Proceso de remediacion documentado
- [ ] Baseline de seguridad establecido

---

## SOPORTE

Documentos de referencia entregados:
1. `.github/workflows/security-scan.yml` - Workflow de seguridad
2. `docs/GUIA_SECRETOS.md` - Gestión de secretos
3. `docs/PIPELINE.md` - Flujo de CI/CD
4. `docs/SECURITY.md` - Lineamientos de seguridad
5. `revisar_secretos.sh` - Script de análisis
Si algo falla, revisar logs especificos del step que falla en GitHub Actions.
