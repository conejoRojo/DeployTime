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

## 2. Despliegue en Servidor Compartido (cPanel/Toran) sin Docker

Como desarrollas en local usando **Docker** pero tu servidor de producción es un **Hosting Compartido (cPanel)** estándar (sin soporte para Docker), el proceso implica "traducir" tu entorno contenedorizado a una instalación nativa de PHP/MySQL.

**Ruta pública configurada:** `/public_html/deploytime.dixer.net`

### Fase 1: Preparación (En tu PC con Docker)
Como no tienes PHP/Composer instalados en tu Windows (porque usas los del contenedor), debemos usar el propio contenedor### Paso 2: Preparar los Archivos (En tu PC)
**¡ATENCIÓN!** Tu configuración de Docker usa un volumen para `vendor`. El comando `docker cp` suele fallar en Windows con errores de "file exists". Usaremos una copia interna para solucionarlo.

1. **Instalar dependencias y Compilar Assets**:
   Abre una terminal en la carpeta `backend`:
   ```powershell
   # 1. Instalar dependencias PHP en el contenedor
   docker exec -it deploytime_app composer install --optimize-autoloader --no-dev
   
   # 2. Compilar assets frontend (Si tienes Node.js en Windows)
   # Necesario para el Dashboard de administración
   npm install && npm run build
   ```

2. **Extraer la carpeta `vendor` al host**:
   Ejecuta estos 2 bloques de comandos en PowerShell para "sacar" la carpeta del contenedor:

   ```powershell
   # A. Copia interna: Del volumen oculto a una carpeta visible ('vendor_export')
   docker exec deploytime_app rm -rf /var/www/vendor_export
   docker exec deploytime_app cp -r /var/www/vendor /var/www/vendor_export
   
   # B. Reemplazo local: Borra la carpeta vieja y renombra la nueva
   Remove-Item -Recurse -Force vendor -ErrorAction SilentlyContinue
   Rename-Item vendor_export vendor
   ```
   *Ahora `backend\vendor` tendrá los archivos correctos.*

3. **Empaquetar el Código**:
   Crea un archivo `.zip` con el contenido de `backend`.

   **⛔ NO INCLUIR (Borrar o ignorar al zipear):**
   - **Carpetas**: `node_modules`, `.git`, `.github`, `.idea`, `.vscode`, `docker`, `tests`.
   - **Archivos Raíz**: `docker-compose.yml`, `Dockerfile*`, `package.json`, `package-lock.json`, `vite.config.js`, `phpunit.xml`, `README.md`, `*.bat`, `*.sh`.
   - **Temporales/Dev**: `storage/*.key`, `storage/logs/*.log`, `public/hot`.

   **✅ SÍ INCLUIR:**
   - `app`, `bootstrap`, `config`, `database`, `resources`, `routes`
   - `public` (Incluyendo la carpeta `build` generada y `index.php`)
   - `storage` (Estructura de carpetas)
   - `vendor` (La que acabamos de extraer)
   - `.env.example`, `artisan`, `composer.json`

### Paso 3: Crear Base de Datos
1. En **cPanel**, ve a **Asistente de Bases de datos MySQL** (MySQL Database Wizard).
2. **Paso 1**: Nombra la base de datos (ej: `usuario_deploytime`).
3. **Paso 2**: Crea un usuario para la base (ej: `usuario_admin`). Genera una contraseña segura y **GÚARDALA**.
4. **Paso 3**: Asigna el usuario a la base de datos y marca la casilla **"TODOS LOS PRIVILEGIOS" (ALL PRIVILEGES)**.
5. Finaliza. Ya tienes: Nombre de BD, Usuario y Contraseña.

### Paso 4: Subir Archivos al Servidor
Usaremos el **Administrador de Archivos** de cPanel.

1. Ve al **Administrador de Archivos** en cPanel.
2. Asegúrate de ver los archivos ocultos (Configuración -> Mostrar archivos ocultos/dotfiles).
3. **Subir el núcleo (Código Privado)**:
   - Navega a la raíz de tu usuario (carpeta `/home/tu_usuario/`). **No entres a public_html todavía**.
   - Crea una nueva carpeta llamada `deploytime_core`.
   - Entra en ella, sube tu archivo `.zip` y extráelo (Clic derecho -> Extract). Borra el .zip al terminar.
4. **Publicar la web**:
   - Entra a la carpeta `deploytime_core/public` (que acabas de subir).
   - Selecciona **todos** los archivos, CARPETAS y OCULTOS en esta carpeta (`index.php`, `.htaccess`, `robots.txt`, etc.).
   - Haz clic en **Mover (Move)**.
   - Envialos a la carpeta de tu subdominio (ej: `/public_html/deploytime.dixer.net`).
   - Ahora `deploytime_core/public` debería estar vacía.

### Paso 5: Conectar el Código (`index.php`)
Debemos decirle al archivo público dónde quedó el resto del código .

1. Ve a la carpeta del subdominio (`/public_html/deploytime.dixer.net`).
2. Edita el archivo `index.php`.
3. Busca las líneas `require ... autoload.php` y `$app = require_once ... app.php`. Modifica las rutas para apuntar a tu carpeta `deploytime_core`.
   
   Si tu web está en `/public_html/deploytime.dixer.net` y tu código en `/home/tu_usuario/deploytime_core`, usa esta ruta relativa:
   ```php
   // Navega 2 carpetas hacia atrás (../../)
   require __DIR__.'/../../deploytime_core/vendor/autoload.php';
   $app = require_once __DIR__.'/../../deploytime_core/bootstrap/app.php';
   ```

### Paso 6: Configurar Entorno (`.env`)
1. Ve a la carpeta `deploytime_core`.
2. Renombra el archivo `.env.example` a `.env`.
3. Edítalo (clic derecho -> Edit) con tus datos reales:
   
   **IMPORTANTE**: Debes generar una `APP_KEY` válida para producción.
   - Si no tienes una, genera una localmente con `docker exec deploytime_app php artisan key:generate --show` y cópiala.
   - Debería verse así: `base64:unacadenaaleatoria...`

   ```env
   APP_NAME=DeployTime
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:TU_CLAVE_GENERADA_AQUI
   APP_URL=https://deploytime.dixer.net
   
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=nombre_de_tu_bd_creada
   DB_USERNAME=usuario_creado
   DB_PASSWORD=contraseña_creada
   ```
4. Guarda los cambios.

### Paso 7: Importar Datos
Como tu base de datos está en un contenedor, primero debemos extraerla.

1. **Generar Backup (En tu PC)**:
   Abre una terminal en `backend` y ejecuta:
   ```powershell
   docker exec deploytime_mysql mysqldump -u deploytime_user -pdeploytime_pass deploytime > backup_produccion.sql
   ```
   *Esto creará el archivo `backup_produccion.sql` en tu carpeta local.*

2. **Importar en cPanel**:
   - Abre **phpMyAdmin**.
   - Selecciona la nueva base de datos.
   - Ve a la pestaña **Importar** y sube el archivo `backup_produccion.sql` que acabamos de generar.

### Paso 8: Configurar Enlace Simbólico (Storage)
Larvel guarda imágenes en una carpeta privada. Para hacerlas públicas:
1. Crea un archivo `symlink.php` en tu carpeta pública (`/public_html/deploytime.dixer.net`):
   ```php
   <?php
   // Ajusta 'usuario' y las rutas
   $target = '/home/tu_usuario/deploytime_core/storage/app/public'; 
   $link = '/home/tu_usuario/public_html/deploytime.dixer.net/storage'; 
   symlink($target, $link);
   echo "Symlink creado <br>";
   echo "Target: $target <br>";
   echo "Link: $link";
   ?>
   ```
2. Ejecútalo visitando `https://deploytime.dixer.net/symlink.php`.
   - Si funciona, verás "Symlink creado".
   - Si falla, verifica que la ruta `$target` sea correcta y que la carpeta `storage` no exista ya en `public_html`.
3. **Borra** el archivo `symlink.php` al terminar.
4. Verifica permisos: Las carpetas `storage` y `bootstrap/cache` dentro de `deploytime_core` deben tener permisos 775 (Clic derecho -> Permissions).

---

## 3. Automatización con GitHub Actions (CI/CD)

Puedes configurar que el proyecto se despliegue automáticamente al hacer push a la rama `main` usando FTP (más compatible con cPanel standard) o SSH (si lo tienes habilitado).

### Opción A: Vía FTP (Recomendado cPanel básico)
Crea el archivo `.github/workflows/deploy-ftp.yml`:

```yaml
name: Deploy cPanel FTP
on:
  push:
    branches:
      - main
jobs:
  web-deploy:
    name: 🎉 Deploy
    runs-on: ubuntu-latest
    steps:
    - name: 🚚 Get latest code
      uses: actions/checkout@v4

    - name: 🔨 Install Dependencies
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
    - run: composer install --no-dev --optimize-autoloader

    - name: 📂 Sync Files via FTP
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        # Subir todo el contenido a la carpeta CORE privada
        server-dir: /deploytime_core/
        # Excluir archivos innecesarios
        exclude: |
          **/.git*
          **/.git*/**
          **/node_modules/**
          **/tests/**
          **/docker/**
```

### Opción B: Vía SSH (Avanzado)
Si tienes acceso SSH, es más rápido y permite ejecutar migraciones.
Crea el archivo `.github/workflows/deploy-ssh.yml`:

```yaml
name: Deploy cPanel SSH
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          
      - name: Install Dependencies
        run: composer install --no-dev --optimize-autoloader

      - name: Copy files via SSH
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          source: "."
          target: "/home/${{ secrets.SSH_USERNAME }}/deploytime_core"
          rm: false # No borrar carpetas existentes como storage
          
      - name: Execute Remote Commands
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
             cd /home/${{ secrets.SSH_USERNAME }}/deploytime_core
             php artisan migrate --force
             php artisan config:cache
             php artisan route:cache
             php artisan view:cache
```

**Para que funcione:**
1. Ve a tu repositorio en GitHub -> Settings -> Secrets and variables -> Actions.
2. Crea los "Repository secrets" necesarios (`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` o los de `SSH_...`).

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

## 5. Actualizaciones

### Backend
1. **Opción Manual**: Repite los pasos de "Preparar archivos" y sube solo los cambios o el `.zip` completo sobrescribiendo. Luego ejecuta migraciones si es necesario.
2. **Opción GitHub**: Haz push a `main` y verifica la acción.

### Desktop
1. Generar nueva versión cambiando `version` en `package.json`.
2. Correr build nuevamente.
3. Distribuir el nuevo ejecutable a los usuarios.
