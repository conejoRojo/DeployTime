# Mejoras en Infraestructura Docker

Se han realizado actualizaciones críticas en los archivos de configuración para garantizar un inicio robusto y sin errores, especialmente en entornos Windows.

## 1. `backend/docker/entrypoint.sh` (Nuevo Script Robusto)
Se reescribió el script de inicio para manejar:
- **Permisos de Carpetas:** Intenta `chown` y hace fallback a `chmod 777` en carpetas críticas (`storage`, `bootstrap/cache`, `vendor`) para evitar errores de escritura en volúmenes montados.
- **Dependencias (Composer):** Detecta si la carpeta `vendor` está vacía (común en el primer inicio) y ejecuta `composer install` automáticamente.
- **Espera de Base de Datos:** Implementó un bucle con `netcat` que espera a que MySQL responda antes de iniciar Laravel, preveniendo el crash típico de "Connection Refused".
- **Key Generate:** Genera la `APP_KEY` si falta en el `.env`.

## 2. `backend/Dockerfile.dev`
- **Herramientas de Red:** Se agregó `netcat-openbsd` para permitir la comprobación de conectividad con la base de datos (usado en el entrypoint).

## 3. `backend/docker-compose.yml`
- **Healthcheck de MySQL:** Se añadió una comprobación de salud nativa (`mysqladmin ping`).
- **Dependencia Inteligente:** El servicio `app` ahora espera explícitamente a que `mysql` esté `service_healthy` antes de iniciar, sincronizando perfectamente el arranque.

## Estado Actual
El entorno se ha reconstruido con estas mejoras y los contenedores están corriendo correctamente.
