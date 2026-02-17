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

### 2.1. Configuración de Subdominio y SSL (Recomendado)
Para asegurar el funcionamiento de sesiones y HTTPS:

1. **Crear Subdominio**:
   - Accede a cPanel → **Dominios** (o Subdominios).
   - Crea `deploytime.dixer.net`.
   - Establece el **Directorio raíz (Document Root)** a la carpeta `public_html/api` (donde subirás el contenido de la carpeta `public` de Laravel).

2. **Activar HTTPS**:
   - Accede a cPanel → **SSL/TLS Status**.
   - Selecciona `deploytime.dixer.net` y haz clic en **Run AutoSSL**. Esto generará el certificado gratuito.

### 2.2. Preparar y subir archivos

### 2.3. Configurar Base de Datos:
   - En cPanel → Bases de Datos MySQL: Crear una nueva BD y Usuario.
   - En phpMyAdmin: Importar el archivo `init_database.sql` proporcionado.
   - Si tiene acceso SSH, puede correr las migraciones: `php artisan migrate --seed`.

### 2.4. Configurar .env:
   - Subir `.env` con las credenciales de producción (BD, URL).
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - **Crucial**: Ejecutar `php artisan key:generate` para generar la `APP_KEY` si no se ha configurado.

### 2.5. Configurar index.php:
   - Si movió la carpeta `public` al `public_html`, edite `index.php` para apuntar correctamente al vendor y bootstrap:
     ```php
     require __DIR__.'/../deploytime_api/vendor/autoload.php';
     $app = require_once __DIR__.'/../deploytime_api/bootstrap/app.php';
     ```

### 2.6. Permisos y Enlaces:
   - Asegurar que `storage` y `bootstrap/cache` tengan permisos de escritura (775).
   - Crear enlace simbólico para storage: `php artisan storage:link`. Si no tiene SSH, puede crear un script PHP que ejecute `symlink()`.

### 2.7. Optimización:
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`

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
