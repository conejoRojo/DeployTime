# DeployTime - Inicio Rápido

Guía para iniciar el proyecto en 5 minutos.

---

## Pre-requisitos

- Docker Desktop instalado y corriendo
- Node.js 18+ instalado
- Git (opcional)

---

## Inicio en 3 Pasos

### 1. Iniciar Backend

```bash
npm run backend:up
```

**Resultado**:
- MySQL corriendo en puerto 3308
- phpMyAdmin en http://localhost:8081
- Laravel API en http://localhost:8000

### 2. Verificar Backend

```bash
# Ejecutar migraciones (si es primera vez)
npm run migrate

# Probar API
curl http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@deploytime.com","password":"colaborador123"}'
```

**Resultado**: Debe devolver un JWT token

### 3. Iniciar Desktop App

```bash
npm run install:desktop   # Solo primera vez
npm run dev
```

**Resultado**:
- Vite dev server en http://localhost:3000
- Electron app se abre en system tray

---

## Usuarios de Prueba Generados

| Email | Password | Rol | Acceso |
|-------|----------|-----|--------|
| `martin@dixer.net` | `R2D2arturito` | Admin | Desktop App & Web Panel |
| `lautaro@dixer.net` | `R2D2arturito` | Colaborador | Desktop App & Web Panel |
| `luis@dixer.net` | `#Mexico1986` | Admin | Desktop App & Web Panel |

---

## 🌐 Panel de Administración Web

El sistema cuenta con un panel web completo para administrar usuarios, proyectos y tareas.

- **URL**: http://localhost:8000/login
- **Funcionalidades**:
  - Dashboard con estadísticas
  - ABM de Usuarios (Crear, Editar, Eliminar)
  - Gestión de Proyectos y Asignación de Tareas
  - Ver reportes de tiempos

---

## Flujo de Uso

### Paso 1: Login
1. Abrir la app desde el system tray
2. Ingresar: `juan@deploytime.com` / `colaborador123`
3. Click "Iniciar Sesión"

### Paso 2: Seleccionar Proyecto y Tarea
1. Dropdown "Proyecto" → Seleccionar "Sistema Web de Gestión"
2. Dropdown "Tarea" → Seleccionar "Desarrollo API REST"

### Paso 3: Iniciar Timer
1. Click "Iniciar Timer"
2. El timer comenzará a contar en pantalla

### Paso 4: Trabajar
- El timer cuenta automáticamente
- Puedes cerrar la ventana, el timer sigue corriendo
- Click en el icono del tray para abrir de nuevo

### Paso 5: Detener Timer
1. Click "Detener Timer"
2. El tiempo se guarda en el backend
3. Puedes seleccionar otra tarea

---

## Datos de Prueba Incluidos

- **2 Proyectos**:
  - Sistema Web de Gestión
  - App Móvil E-commerce

- **4 Tareas**:
  - Diseño de base de datos (completada)
  - Desarrollo API REST (en progreso)
  - Frontend React (pendiente)
  - Configuración inicial Flutter (completada)

- **5 Time Entries**:
  - Varios registros de tiempo completados
  - 1 timer activo (Juan en "Desarrollo API REST")

---

## Troubleshooting

### Backend no inicia
```bash
# Verificar que Docker esté corriendo
docker ps

# Ver logs
cd backend
docker-compose logs -f app
```

### Desktop no inicia
```bash
# Verificar que backend esté corriendo
curl http://localhost:8000/api/projects

# Limpiar y reinstalar
cd desktop
rm -rf node_modules
npm install
npm run dev
```

### Error "Connection refused"
- Verificar que el backend esté corriendo: `docker-compose ps`
- Verificar que MySQL esté en puerto 3308: `docker ps | grep 3308`

### Error "JWT Token invalid"
- Logout y volver a hacer login
- Verificar que `JWT_SECRET` esté en backend/.env

---

## Notas sobre Docker (desarrollo) 🔧

Si ves errores como "The /var/www/bootstrap/cache directory must be present and writable" o "Failed opening required '/var/www/vendor/autoload.php'", prueba las siguientes opciones:

- Reconstruir imagen y levantar el servicio `app`:

```bash
docker-compose -f backend/docker-compose.yml up -d --build app
```

- Forzar recreación si ya existe el contenedor:

```bash
docker-compose -f backend/docker-compose.yml up -d --force-recreate --build app
```

- Ejecutar `composer` dentro del contenedor (si `vendor` está vacío o faltan dependencias):

```bash
docker-compose -f backend/docker-compose.yml run --rm app composer install --no-interaction --prefer-dist --optimize-autoloader
# o si el contenedor ya está corriendo:
docker-compose exec app composer install --no-interaction --prefer-dist --optimize-autoloader
```

- Si usas el volumen `vendor` y necesitas regenerarlo (vaciar y volver a crear):

```bash
docker volume rm backend_vendor
docker-compose -f backend/docker-compose.yml up -d --build app
```

- Ajustar permisos si hay problemas de escritura (útil en bind mounts/Windows):

```bash
docker-compose exec app chown -R www-data:www-data /var/www/bootstrap/cache /var/www/vendor
# en caso extremo:
docker-compose exec app chmod -R 0777 /var/www/bootstrap/cache /var/www/vendor
```

- Ver logs en tiempo real para depurar:

```bash
docker-compose -f backend/docker-compose.yml logs -f app
```

Consejo: el contenedor incluye un `entrypoint` que crea `bootstrap/cache` y lanza `composer install` si `vendor` está vacío; en Windows los bind mounts pueden ocultar cambios hechos en la capa de la imagen, por lo que a veces es necesario eliminar el volumen `backend_vendor` para recuperar los `vendor` generados en la imagen.

### Snippet útil: fragmento de `Dockerfile.dev` (entrypoint & permisos)

```dockerfile
# Copy entrypoint script and make it executable
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ensure cache and vendor directories exist and are writable during build
RUN mkdir -p /var/www/bootstrap/cache \
    && chown -R www-data:www-data /var/www/bootstrap/cache \
    && mkdir -p /var/www/vendor \
    && chown -R www-data:www-data /var/www/vendor

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

### Comandos rápidos para reiniciar (desarrollo)

- Reconstruir y levantar `app`:

```bash
docker-compose -f backend/docker-compose.yml up -d --build app
```

- Reinicio completo:

```bash
docker-compose -f backend/docker-compose.yml down && docker-compose -f backend/docker-compose.yml up -d --build
```

> Después de guardar este fragmento, puedes reiniciar la app con los comandos anteriores.

---

## URLs Importantes

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| API Backend | http://localhost:8000/api | - |
| phpMyAdmin | http://localhost:8081 | root / root |
| MySQL | localhost:3308 | deploytime_user / deploytime_pass |

---

## Testing Rápido

### Test de Backend
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@deploytime.com","password":"colaborador123"}'

# Copiar el access_token de la respuesta
export TOKEN="eyJ0eXAi..."

# Listar proyectos
curl http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### Test de Desktop
1. Abrir app
2. Login con juan@deploytime.com
3. Seleccionar proyecto y tarea
4. Iniciar timer
5. Esperar 10 segundos
6. Detener timer
7. Verificar en backend que se guardó:
   ```bash
   curl http://localhost:8000/api/my/time-entries \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Documentación Completa

- [README Principal](README.md) - Visión general del proyecto
- [Backend Completado](docs/BACKEND_COMPLETADO.md) - Detalles del backend
- [Integración Completada](docs/INTEGRACION_COMPLETADA.md) - Integración Backend + Desktop
- [Resumen Final](docs/RESUMEN_FINAL.md) - Resumen ejecutivo completo

---

## Siguiente Paso

Una vez que todo esté funcionando:

1. **Desarrollo**: Modificar código y ver cambios en hot reload
2. **Testing**: Probar todos los flujos (login, timer, sync, inactivity)
3. **Build**: `npm run package:win` para crear instalador Windows
4. **Deploy**: Subir backend a servidor Debian (Toran)

---

## Checklist de Verificación

- [ ] Docker Desktop corriendo
- [ ] `docker-compose up -d` ejecutado
- [ ] Backend respondiendo en :8000
- [ ] phpMyAdmin accesible en :8081
- [ ] `npm install` ejecutado en desktop/
- [ ] `npm run dev` corriendo
- [ ] Electron app visible en system tray
- [ ] Login exitoso con juan@deploytime.com
- [ ] Proyectos cargados desde backend
- [ ] Timer funcionando correctamente

---

**¡Listo!**

El sistema DeployTime está corriendo y listo para usar.

Para más información, consulta la [documentación completa](README.md).
