# Buenas Prácticas de Seguridad - DeployTime

**Documento**: Guía de Desarrollo Seguro  
**Autor**: Luis Gastiarena  
**Última actualización**: Diciembre 2024  
**Proyecto**: DeployTime - Dixer.net

---

## Tabla de Contenidos

1. [Estrategia de Branching](#estrategia-de-branching)
2. [Pipeline de Seguridad Automatizado](#pipeline-de-seguridad)
3. [Gestión de Secretos](#gestión-de-secretos)
4. [Revisión de Código](#revisión-de-código)
5. [Respuesta a Vulnerabilidades](#respuesta-a-vulnerabilidades)
6. [Checklist Pre-Commit](#checklist-pre-commit)

---

## Estrategia de Branching

### Ramas Principales
```
main (producción) ← solo mediante PR desde develop
  ↑
develop (integración) ← PRs desde feature/*
  ↑
feature/* (desarrollo) ← trabajo diario
hotfix/* (emergencias) ← solo para bugs críticos
```

### Flujo de Trabajo

#### Desarrollo de Nueva Funcionalidad
```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear rama de feature
git checkout -b feature/nombre-descriptivo

# 3. Desarrollar y commitear
git add .
git commit -m "feat: descripción del cambio"

# 4. Subir y crear PR
git push origin feature/nombre-descriptivo
# Crear PR en GitHub: feature/* → develop
```

#### Corrección de Bug en Producción
```bash
# 1. Crear hotfix desde main
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-bug

# 2. Arreglar y commitear
git add .
git commit -m "fix: corrección específica"

# 3. Mergear a main Y develop
git push origin hotfix/descripcion-bug
# Crear PR 1: hotfix/* → main
# Crear PR 2: hotfix/* → develop
```

### Convenciones de Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `security:` Parche de seguridad
- `refactor:` Refactorización de código
- `docs:` Documentación
- `test:` Tests
- `chore:` Tareas de mantenimiento

**Ejemplo**:
```
feat: agregar autenticación JWT al módulo de reportes

- Implementar middleware de autenticación
- Agregar validación de tokens
- Tests unitarios incluidos

Closes #123
```

---

## Pipeline de Seguridad

### Herramientas Automatizadas

| Herramienta | Tipo | Qué Detecta | Cuándo se Ejecuta |
|-------------|------|-------------|-------------------|
| **Semgrep** | SAST | Vulnerabilidades en código PHP/JS | Cada PR + push a main/develop |
| **Trivy** | SCA | CVEs en dependencias + Docker | Cada PR + push a main/develop |
| **detect-secrets** | Secrets | API keys, passwords hardcodeados | Cada PR + push a main/develop |

### Proceso Automatizado

1. **Desarrollador crea PR** → GitHub ejecuta pipeline
2. **Pipeline escanea código** → Detecta vulnerabilidades
3. **Pipeline comenta en PR** → Lista issues encontrados
4. **Si FALLA** → PR bloqueado, debe corregirse
5. **Si PASA** → PR puede mergearse

### Interpretación de Resultados

#### Semgrep SAST

**Severidad**:
- 🔴 **CRITICAL/ERROR**: Debe corregirse antes de mergear
- 🟡 **WARNING**: Revisar y evaluar
- 🔵 **INFO**: Recomendación

**Ejemplo de vulnerabilidad común**:
```php
// VULNERABLE (SQL Injection)
$user = User::where('id', $request->id)->first();

// CORRECTO
$user = User::where('id', (int)$request->id)->first();
// Mejor aún: usar route model binding
```

#### Trivy SCA

**Cómo corregir dependencias vulnerables**:
```bash
# Ver detalles de la vulnerabilidad
composer show laravel/framework

# Actualizar a versión segura
composer update laravel/framework

# Si no hay versión segura, evaluar alternativas
```

#### detect-secrets

**Falsos positivos comunes**:
- Hashes de ejemplo en tests
- Tokens de prueba no funcionales
- Claves públicas

**Cómo excluir falsos positivos**:
```bash
# Agregar al baseline
detect-secrets scan --baseline .secrets.baseline

# O agregar comentario inline
API_KEY = "test_key_123"  # pragma: allowlist secret
```

---

## Gestión de Secretos

### NUNCA HACER
```php
// NO hardcodear credenciales
$apiKey = "sk_live_51234567890abcdef";
$dbPassword = "MiPasswordSeguro123";

// NO commitear archivos .env
git add .env  // NUNCA
```

### SIEMPRE HACER
```php
// Usar variables de entorno
$apiKey = env('STRIPE_API_KEY');
$dbPassword = env('DB_PASSWORD');

// Validar que existan
if (!env('STRIPE_API_KEY')) {
    throw new Exception('STRIPE_API_KEY no configurada');
}
```

### Configuración en GitHub Actions

Para secrets en CI/CD:

1. Ir a **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Agregar (ejemplo):
   - Name: `DB_PASSWORD`
   - Secret: `valor_secreto`

Usar en workflow:
```yaml
env:
  DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

### Archivo `.env.example`

Mantener siempre actualizado con todas las variables necesarias:
```env
# Base de datos
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=deploytime
DB_USERNAME=root
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_TTL=60

# APIs externas
STRIPE_KEY=
STRIPE_SECRET=
```

---

## Revisión de Código

### Checklist del Reviewer

Antes de aprobar un PR, verificar:

#### Seguridad

- [ ] No hay credenciales hardcodeadas
- [ ] Inputs del usuario están validados
- [ ] Queries usan parámetros preparados (no concatenación)
- [ ] Archivos subidos son validados (tipo, tamaño)
- [ ] Permisos/roles verificados en endpoints protegidos

#### Calidad

- [ ] Código sigue PSR-12 (PHP) o estándares del proyecto
- [ ] Funciones tienen responsabilidad única
- [ ] Nombres de variables/funciones son descriptivos
- [ ] Comentarios explican el "por qué", no el "qué"

#### Tests

- [ ] Tests unitarios para lógica de negocio
- [ ] Tests de integración para APIs
- [ ] Coverage mínimo 80% en archivos modificados

### Ejemplo de Revisión de Seguridad
```php
// Código vulnerable enviado en PR
public function login(Request $request) {
    $user = User::where('email', $request->email)->first();
    if ($user && $user->password == $request->password) {
        return response()->json(['token' => 'abc123']);
    }
}

// Comentario del reviewer:
// 🔴 VULNERABILIDADES CRÍTICAS:
// 1. Password sin hashear (comparación directa)
// 2. Token hardcodeado
// 3. Sin rate limiting
// 4. Sin validación de input

// Código corregido
public function login(Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|min:8'
    ]);
    
    $credentials = $request->only('email', 'password');
    
    if (!$token = auth()->attempt($credentials)) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }
    
    return response()->json(['token' => $token]);
}
```

---

## Respuesta a Vulnerabilidades

### Procedimiento de Emergencia

#### Vulnerabilidad Detectada en Producción

1. **Evaluación Inmediata** (15 min)
   - ¿Está siendo explotada?
   - ¿Qué datos están en riesgo?
   - ¿Cuál es el vector de ataque?

2. **Mitigación Temporal** (30 min)
   - Deshabilitar funcionalidad afectada
   - Aplicar WAF rules si es posible
   - Monitorear logs en tiempo real

3. **Fix y Deploy** (2-4 horas)
```bash
   # Crear hotfix
   git checkout main
   git pull
   git checkout -b hotfix/CVE-descripcion
   
   # Corregir vulnerabilidad
   # ... código ...
   
   # Tests rápidos
   php artisan test
   
   # PR urgente
   git push origin hotfix/CVE-descripcion
   # Mergear a main con aprobación express
```

4. **Post-Mortem** (24-48 horas)
   - Documentar incidente
   - Analizar causa raíz
   - Implementar controles preventivos

### MTTR Objetivo

**Meta del MVP**: Reducir MTTR de **3-30 días** a **< 24 horas**

- Detección: < 5 minutos (automatizado)
- Evaluación: < 30 minutos
- Corrección: < 4 horas
- Deploy: < 2 horas

---

## Checklist Pre-Commit

Antes de hacer `git commit`, verificar:

### Backend Laravel
```bash
# 1. Code style
./vendor/bin/pint

# 2. Tests
php artisan test

# 3. Verificar .env no está staged
git status | grep ".env$"  # Debe estar vacío

# 4. Escanear secretos localmente (opcional)
pip install detect-secrets
detect-secrets scan
```

### Desktop Electron
```bash
# 1. Linting
npm run lint

# 2. Build de prueba
npm run build

# 3. Verificar dependencias
npm audit --audit-level=high
```

### Todos los Desarrolladores

- [ ] El código compila/ejecuta sin errores
- [ ] Tests pasan localmente
- [ ] Sin credenciales hardcodeadas
- [ ] Comentarios útiles agregados
- [ ] Variables de entorno documentadas en `.env.example`

---

## Métricas de Seguridad

Tracking mensual (para mejora continua):

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Vulnerabilidades críticas detectadas | 0 en producción | - |
| MTTR promedio | < 24 horas | - |
| PRs bloqueados por seguridad | Reducir 20% mensual | - |
| Coverage de tests | > 80% | - |
| Falsos positivos | < 10% | - |

---

## Recursos y Referencias

### Documentación Oficial

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security Best Practices](https://laravel.com/docs/11.x/security)
- [Semgrep Rules](https://semgrep.dev/explore)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)

### Capacitación Interna

- Revisar logs de vulnerabilidades mensualmente
- Sesiones de code review en equipo (si >1 dev)
- Actualización de esta guía trimestralmente

---

**Fin del documento**  
*Para consultas: luis@dixer.net*