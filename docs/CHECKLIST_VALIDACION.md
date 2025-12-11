# CHECKLIST DE VALIDACION - Pipeline de Seguridad

## Pre-requisitos
- [ ] Repositorio configurado como publico
- [ ] GitHub Actions habilitado en Settings -> Actions
- [ ] Archivo security-scan.yml en .github/workflows/

## Paso 1: Configurar Secrets en GitHub

### Navegacion: Settings -> Secrets and variables -> Actions

- [ ] Crear secret `SEMGREP_APP_TOKEN`
  - Ir a https://semgrep.dev/
  - Crear cuenta gratuita con GitHub
  - Generar token en Settings -> Tokens
  - Copiar token en GitHub Secrets

## Paso 2: Habilitar GitHub Security Features

### Navegacion: Settings -> Code security and analysis

- [ ] Dependency graph: **Enabled**
- [ ] Dependabot alerts: **Enabled**
- [ ] Dependabot security updates: **Enabled**
- [ ] Secret scanning: **Enabled**
- [ ] Code scanning: **Optional** (CodeQL adicional)

## Paso 3: Reemplazar workflow existente

```bash
# En tu repositorio local
cd DeployTime
rm .github/workflows/security-scan.yml
cp /ruta/del/archivo/corregido/security-scan.yml .github/workflows/

# Verificar contenido
cat .github/workflows/security-scan.yml | head -20

# Commit y push
git add .github/workflows/security-scan.yml
git commit -m "fix: corregir pipeline de seguridad - todas las issues resueltas"
git push origin main
```

## Paso 4: Ejecutar Test Manual

### Opcion A: Trigger Manual
1. [ ] Ir a GitHub -> Actions tab
2. [ ] Seleccionar "Security Scan (SAST + SCA + Secrets)"
3. [ ] Click en "Run workflow" -> Branch: main -> Run
4. [ ] Esperar 4-6 minutos
5. [ ] Verificar resultados

### Opcion B: Push a main
```bash
# Hacer cambio minimo
echo "# Test pipeline" >> README.md
git add README.md
git commit -m "test: validar pipeline de seguridad"
git push origin main
```

### Opcion C: Crear PR de prueba (RECOMENDADO)
```bash
# Crear rama de test
git checkout -b test/security-validation
echo "# Test PR" >> README.md
git add README.md
git commit -m "test: validar comentarios en PR"
git push origin test/security-validation

# Crear PR en GitHub UI
# Esperar que el pipeline ejecute
# Verificar comentarios automaticos en el PR
```

## Paso 5: Validar Ejecucion Exitosa

### En Actions tab, verificar cada job:

#### Job 1: semgrep-sast
- [ ] Step "Checkout codigo" - Success (verde)
- [ ] Step "Ejecutar Semgrep SAST" - Success o con warnings
- [ ] Step "Subir resultados SARIF" - Success
  - NO debe mostrar "Path does not exist: semgrep.sarif"
  - NO debe mostrar "Resource not accessible by integration"
- [ ] Step "Comentar resultados en PR" - Success (si es PR)

#### Job 2: trivy-sca
- [ ] Step "Checkout codigo" - Success
- [ ] Step "Escanear dependencias PHP" - Success o continue
- [ ] Step "Escanear dependencias Node.js" - Success o continue
- [ ] Step "Escanear configuracion Docker" - Success o continue
- [ ] Step "Subir resultados PHP" - Success
- [ ] Step "Subir resultados Node.js" - Success
- [ ] Step "Subir resultados Docker" - Success
- [ ] Step "Generar reporte" - Success (si es PR)
- [ ] Step "Comentar resultados en PR" - Success (si es PR)

#### Job 3: detect-secrets
- [ ] Step "Checkout codigo" - Success
- [ ] Step "Instalar dependencias" - Success
  - Debe instalar detect-secrets Y jq
- [ ] Step "Escanear secretos" - Success
- [ ] Step "Verificar resultados" - Success o Failure
  - Success = No hay secretos
  - Failure = Hay secretos detectados
- [ ] Step "Comentar secretos en PR" - Success (si fallo anterior)
- [ ] Step "Comentar exito en PR" - Success (si paso anterior)

#### Job 4: security-summary
- [ ] Step "Generar resumen" - Success
- [ ] Resumen visible en Actions summary

## Paso 6: Validar GitHub Security Tab

### Navegacion: Security tab del repositorio

- [ ] Security -> Code scanning alerts
  - Debe mostrar resultados de Semgrep
  - Categorias: semgrep-sast

- [ ] Security -> Code scanning alerts (filtrar por tool)
  - Trivy PHP: categoria "trivy-php"
  - Trivy Node: categoria "trivy-node"
  - Trivy Docker: categoria "trivy-docker"

- [ ] Security -> Dependabot
  - Debe mostrar alertas de dependencias vulnerables
  - Integrado con Trivy results

## Paso 7: Validar Comentarios en PR (si usaste Opcion C)

### En el PR de prueba, verificar:

- [ ] Comentario de Semgrep SAST
  - Formato limpio sin emojis
  - Cuenta de vulnerabilidades por severidad
  - Link a Security tab

- [ ] Comentario de Trivy SCA
  - Tabla con analisis de dependencias
  - Backend PHP listado
  - Desktop Node.js listado

- [ ] Comentario de detect-secrets
  - Lista de secretos encontrados (si hay)
  - O mensaje de "Sin secretos" (si no hay)
  - Acciones requeridas claras

## Paso 8: Validar Tiempo de Ejecucion

### Tiempos esperados (aproximados):
- [ ] semgrep-sast: 1-2 minutos
- [ ] trivy-sca: 2-3 minutos
- [ ] detect-secrets: 30-60 segundos
- [ ] security-summary: 10 segundos
- [ ] **Total: 4-6 minutos**

Si algun job tarda mas de 10 minutos, hay un problema.

## Paso 9: Validar NO Warnings Criticos

### Revisar logs - NO deben aparecer:
- [ ] "Path does not exist: semgrep.sarif" - **ELIMINADO**
- [ ] "Resource not accessible by integration" - **ELIMINADO**
- [ ] "command not found: jq" - **ELIMINADO**
- [ ] "CodeQL Action v3 will be deprecated" - **ACTUALIZADO a v4**

### Warnings aceptables:
- [ ] "No vulnerabilities found" - OK
- [ ] "Caught an exception while gathering telemetry" - OK (informativo)

## Paso 10: Documentar Resultados

### Capturar evidencia para tu trabajo final:

1. [ ] Screenshot del Actions tab mostrando ejecucion exitosa
2. [ ] Screenshot del Security tab con alertas
3. [ ] Screenshot de comentarios en PR
4. [ ] Copiar tiempo de ejecucion total
5. [ ] Exportar lista de vulnerabilidades detectadas (si hay)

### Formato sugerido para documentacion academica:
```
EVIDENCIA 1: Ejecucion exitosa del pipeline
- Fecha: [fecha]
- Commit: [hash]
- Duracion: [X] minutos
- Jobs: 4/4 exitosos
- Vulnerabilidades detectadas: [N]

EVIDENCIA 2: Integracion con GitHub Security
- SARIF files subidos: 4
- Alertas activas: [N]
- Categorias: semgrep-sast, trivy-php, trivy-node, trivy-docker

EVIDENCIA 3: Automatizacion de comentarios en PR
- Comentarios generados: 3-4
- Formato: Markdown
- Tiempo desde commit a comentario: <1 minuto
```

## Troubleshooting - Si algo falla

### Error: "Secret SEMGREP_APP_TOKEN not found"
**Solucion**: Crear el secret en Settings -> Secrets

### Error: Jobs se cancelan automaticamente
**Solucion**: Verificar permisos en Settings -> Actions -> General
- Workflow permissions: Read and write permissions

### Error: "Resource not accessible" persiste
**Solucion**: Verificar que el repo es realmente publico
- Settings -> General -> Danger Zone -> Change visibility

### Error: Trivy no encuentra vulnerabilidades obvias
**Solucion**: Forzar actualizacion de DB
```yaml
# Agregar antes del scan:
- name: Actualizar DB de Trivy
  run: trivy image --download-db-only
```

### Error: detect-secrets marca muchos falsos positivos
**Solucion**: Crear baseline inicial
```bash
# Local
detect-secrets scan --baseline .secrets.baseline
git add .secrets.baseline
git commit -m "chore: baseline de secretos"
git push
```

## Checklist Final

- [ ] Pipeline ejecuta sin errores criticos
- [ ] Los 4 jobs completan exitosamente
- [ ] Resultados suben a GitHub Security tab
- [ ] Comentarios aparecen en PRs
- [ ] Tiempo de ejecucion <6 minutos
- [ ] Sin warnings de deprecacion
- [ ] Evidencia documentada para trabajo final

## Siguiente Fase (Opcional - Post-MVP)

Mejoras adicionales recomendadas:
- [ ] Agregar CodeQL nativo de GitHub
- [ ] Integrar SonarCloud para metricas de calidad
- [ ] Configurar branch protection rules basados en checks
- [ ] Agregar DAST (Dynamic Application Security Testing)
- [ ] Implementar security gates antes de merge

## Contacto de Soporte

Si algun paso falla:
1. Revisar logs completos del job fallido
2. Buscar mensaje de error especifico en documentacion
3. Consultar con tutor/profesor
4. Comunidad GitHub Actions: https://github.community/

## Recursos Adicionales

- Documentacion Semgrep: https://semgrep.dev/docs/
- Documentacion Trivy: https://aquasecurity.github.io/trivy/
- Documentacion detect-secrets: https://github.com/Yelp/detect-secrets
- GitHub Actions: https://docs.github.com/en/actions
- GitHub Security: https://docs.github.com/en/code-security