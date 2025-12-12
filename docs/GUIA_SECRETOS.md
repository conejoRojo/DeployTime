# GUIA PARA GESTIONAR SECRETOS DETECTADOS

## Contexto

detect-secrets encontró 19 secretos potenciales. NO todos son secretos reales.

## Categorías de Secretos

### 1. SECRETOS REALES (Eliminar inmediatamente)
```
❌ API Keys reales
❌ Passwords de bases de datos
❌ Tokens de acceso de GitHub/servicios externos
❌ Claves privadas (private keys)
❌ JWT secrets en producción
❌ Credenciales de servicios (AWS, GCP, Azure)
```

### 2. FALSOS POSITIVOS (Marcar como safe)
```
✓ Base64 de imágenes SVG inline
✓ Hashes de ejemplo en documentación
✓ Strings "YOUR_KEY_HERE" o "example-key-123"
✓ UUIDs genéricos (00000000-0000...)
✓ Salts/IVs de ejemplo en comentarios
✓ Tokens de prueba en tests unitarios
✓ Secrets en archivos .env.example
```

### 3. SECRETOS DE DESARROLLO (Evaluar caso por caso)
```
⚠️ Claves de desarrollo local
⚠️ Secrets en archivos .env.dev
⚠️ API keys de servicios de testing
⚠️ Credenciales de BD de desarrollo local
```

## Proceso de Revisión - Paso a Paso

### PASO 1: Generar y revisar el baseline localmente

```bash
cd DeployTime

# Generar baseline con exclusiones
detect-secrets scan --all-files \
  --exclude-files '\.lock$' \
  --exclude-files 'node_modules/' \
  --exclude-files 'vendor/' \
  --exclude-files '\.git/' \
  --exclude-files 'package-lock\.json' \
  --exclude-files 'composer\.lock' \
  > .secrets.baseline

# Ver resumen
jq '.results | to_entries | map("\(.key): \(.value | length)")' .secrets.baseline
```

### PASO 2: Auditar interactivamente

```bash
# Modo interactivo para clasificar cada secreto
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

Is this a valid secret? i.e. not a false positive (y)es, (n)o, (s)kip, (q)uit:
```

**Opciones:**
- `y` = Es un secreto real (MALO - debe eliminarse)
- `n` = Es un falso positivo (SEGURO - se marca como tal)
- `s` = Saltar (revisar después)
- `q` = Salir

### PASO 3: Revisar archivos específicos

Según tu estructura, los lugares más probables de falsos positivos:

**A. Backend Laravel (.env.example)**
```bash
# Revisar archivo de ejemplo
cat backend/.env.example

# Estos suelen ser falsos positivos:
APP_KEY=base64:your-key-here-for-example-purposes
DB_PASSWORD=your-password-here
JWT_SECRET=your-secret-here
```

**B. Desktop Electron (config/secrets de ejemplo)**
```bash
# Revisar configs de ejemplo
grep -r "secret" desktop/src/ --include="*.ts" --include="*.js"
```

**C. Documentación**
```bash
# Revisar docs con ejemplos
grep -r "API_KEY\|SECRET\|TOKEN" docs/ README.md
```

### PASO 4: Clasificar cada secreto

#### Ejemplo 1: Secreto REAL - JWT Secret en código
```javascript
// ❌ MALO - Secreto real hardcodeado
const JWT_SECRET = "mi-clave-super-secreta-de-produccion-2024";
```
**ACCION**: 
1. Eliminar del código
2. Mover a variables de entorno
3. Agregar a .gitignore si está en archivo .env

#### Ejemplo 2: Falso Positivo - Imagen SVG
```html
<!-- ✓ SEGURO - Base64 de imagen inline -->
<link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0..." />
```
**ACCION**: Marcar como falso positivo en audit

#### Ejemplo 3: Falso Positivo - Ejemplo en documentación
```markdown
## Configuración
Agrega tu API key:
```bash
export API_KEY="your-api-key-here"
```
**ACCION**: Marcar como falso positivo en audit

#### Ejemplo 4: Secreto de DESARROLLO - .env.dev
```bash
# ⚠️ EVALUAR - Clave de desarrollo local
DATABASE_URL=mysql://root:dev123@localhost:3306/deploytime_dev
```
**ACCION**: 
- Si es desarrollo local: OK, pero documentar
- Si es compartido en repo: Cambiar a .env.example

### PASO 5: Generar baseline limpio

Después de auditar:

```bash
# El archivo .secrets.baseline ahora tiene marcados los falsos positivos
# Commitear este archivo al repo
git add .secrets.baseline
git commit -m "chore: baseline de detect-secrets con falsos positivos marcados"
git push
```

### PASO 6: Actualizar workflow para usar baseline

Modificar el workflow para que use el baseline existente:

```yaml
- name: Escanear secretos en el codigo
  run: |
    # Si existe baseline, actualizar; si no, crear nuevo
    if [ -f ".secrets.baseline" ]; then
      detect-secrets scan --baseline .secrets.baseline
    else
      detect-secrets scan --all-files \
        --exclude-files '\.lock$' \
        --exclude-files 'node_modules/' \
        --exclude-files 'vendor/' \
        --exclude-files '\.git/' \
        --exclude-files 'package-lock\.json' \
        --exclude-files 'composer\.lock' \
        > .secrets.baseline
    fi
```

## Casos Especiales

### Laravel - APP_KEY
```bash
# En .env.example suele estar:
APP_KEY=

# En .env (no commiteado) debería estar:
APP_KEY=base64:generado_por_php_artisan_key_generate
```

**Si detect-secrets marca APP_KEY en .env.example como vacío:**
- Es falso positivo (no hay secreto, está vacío)

### Electron - API endpoints con tokens de ejemplo
```typescript
// En documentación o código de ejemplo
const API_URL = "https://api.deploytime.com?token=YOUR_TOKEN_HERE";
```
**Es falso positivo** - String genérico de placeholder

### Base64 de imágenes inline
```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..." />
```
**Es falso positivo** - Contenido de imagen, no un secreto

## Checklist de Validación

Después de revisar los 19 secretos:

- [ ] Auditado los 19 secretos con `detect-secrets audit .secrets.baseline`
- [ ] Marcados falsos positivos (probablemente 15-18 de los 19)
- [ ] Identificados secretos reales (probablemente 1-4)
- [ ] Eliminados secretos reales del código
- [ ] Movidos a variables de entorno
- [ ] Actualizado .env.example sin valores reales
- [ ] Commiteado .secrets.baseline al repo
- [ ] Re-ejecutado workflow - debería pasar

## Comandos Rápidos de Referencia

```bash
# Ver total de secretos
jq '.results | to_entries | map(.value | length) | add' .secrets.baseline

# Listar archivos con secretos
jq -r '.results | keys[]' .secrets.baseline

# Ver secretos de un archivo específico
jq '.results["backend/.env.example"]' .secrets.baseline

# Auditar interactivamente
detect-secrets audit .secrets.baseline

# Scan incremental (solo nuevos cambios)
detect-secrets scan --baseline .secrets.baseline

# Ver estadísticas del baseline
cat .secrets.baseline | jq '{
  version: .version,
  total_files: (.results | length),
  total_secrets: (.results | to_entries | map(.value | length) | add)
}'
```

## Recursos Adicionales

- Documentación detect-secrets: https://github.com/Yelp/detect-secrets
- Guía de secrets en CI/CD: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- OWASP Secrets Management: https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password

## Para el Trabajo Final Académico

**Documentar en tu tesis:**
1. Total de secretos detectados: 19
2. Secretos reales encontrados: [X]
3. Falsos positivos identificados: [Y]
4. Proceso de validación implementado: Audit manual + baseline
5. Tiempo de remediación: [Z] minutos
6. Métrica: 100% de secretos reales eliminados en primera iteración