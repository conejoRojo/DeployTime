# Guía de Despliegue (Deploy)

Este documento detalla los pasos para desplegar el backend y generar el ejecutable de la aplicación de escritorio.

## 1. Despliegue del Backend

El backend está contenerizado con Docker, lo que facilita su despliegue en cualquier servidor que soporte Docker Compose.

### Requisitos del Servidor
- Docker y Docker Compose instalados.
- Puertos 8000, 8081 y 3308 disponibles (configurables en `docker-compose.yml`).

### Pasos
1. **Copiar archivos**: Sube la carpeta `backend/` al servidor.
2. **Configurar entorno**:
   - Copia `.env.example` a `.env`.
   - Ajusta las variables de entorno (DB_PASSWORD, APP_URL, JWT_SECRET, etc.).
3. **Iniciar servicios**:
   ```bash
   cd backend
   docker-compose up -d --build
   ```
4. **Inicializar base de datos**:
   ```bash
   docker-compose exec app php artisan migrate --seed
   ```
   *Nota: `--seed` creará los usuarios admin por defecto.*

5. **Optimización (Producción)**:
   ```bash
   docker-compose exec app php artisan config:cache
   docker-compose exec app php artisan route:cache
   docker-compose exec app php artisan view:cache
   ```

## 2. Despliegue en Servidor Toran (cPanel/FTP)

Para desplegar el backend en un hosting compartido o servidor con cPanel (como Toran):

1. **Preparar archivos**:
   - Comprimir el contenido de la carpeta `backend` (excepto `node_modules` y `vendor`).
   - Asegurarse de tener la carpeta `vendor` generada localmente (`composer install`) o ejecutar `composer install` en el servidor si tiene acceso SSH. Lo ideal es subir `vendor` si no hay SSH.

2. **Subir archivos**:
   - Usar un cliente FTP (FileZilla) o el Administrador de Archivos de cPanel.
   - Crear una carpeta fuera del `public_html` (ej: `deploytime_api`) y subir ahí todo el contenido.
   - Mover el contenido de la carpeta `public` del backend al `public_html` (o subdominio).

3. **Configurar Base de Datos**:
   - En cPanel → Bases de Datos MySQL: Crear una nueva BD y Usuario.
   - En phpMyAdmin: Importar la estructura si es necesario, o dejar que las migraciones corran (si hay acceso SSH). Si no, exportar la BD local e importarla en el servidor.

4. **Configurar index.php**:
   - Editar `public_html/index.php` para apuntar correctamente a la carpeta donde subiste el código:
     ```php
     require __DIR__.'/../deploytime_api/vendor/autoload.php';
     $app = require_once __DIR__.'/../deploytime_api/bootstrap/app.php';
     ```

5. **Configurar .env**:
   - Subir `.env` con las credenciales de producción (BD, URL).
   - `APP_ENV=production`
   - `APP_DEBUG=false`

6. **Permisos**:
   - Asegurar que `storage` y `bootstrap/cache` tengan permisos de escritura (775).

---

## 4. Generación de Desktop App (Build)

Para distribuir la aplicación a los usuarios finales, debes generar el ejecutable (.exe en Windows).

### Requisitos
- Node.js instalado.
- Dependencias instaladas (`npm install` en la carpeta `desktop`).

### Pasos
1. **Navegar a la carpeta desktop**:
   ```bash
   cd desktop
   ```

2. **Configurar URL de Producción**:
   - Antes de compilar, puedes asegurar que la URL por defecto apunte al servidor de producción en lugar de localhost.
   - Edita `src/renderer/services/api.ts` o confía en que el usuario la cambie en la configuración.

3. **Construir el ejecutable**:
   Para Windows:
   ```bash
   npm run build
   ```
   o si tienes scripts específicos en `package.json` como `package` o `make`:
   ```bash
   npm run build:win
   ```
   *(Verificar scripts en `package.json`)*.

4. **Localizar el instalador**:
   - El archivo generado (ej. `DeployTime Setup 1.0.0.exe`) estará en la carpeta `dist/` o `release/`.

## 3. Actualizaciones

### Backend
1. `git pull` (o subir nuevos archivos).
2. `docker-compose up -d --build app`.
3. `docker-compose exec app php artisan migrate` (si hubo cambios en BD).

### Desktop
1. Generar nueva versión cambiando `version` en `package.json`.
2. Correr build nuevamente.
3. Distribuir el nuevo ejecutable a los usuarios.
