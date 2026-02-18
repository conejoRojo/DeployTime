# DeployTime

DeployTime es una plataforma de seguimiento de tiempo con arquitectura híbrida:
- `backend/`: API REST y panel web en Laravel.
- `desktop/`: aplicación de escritorio en Electron + React para registro de tiempo y trabajo offline.

## Requisitos

- Docker Desktop
- Docker Compose
- Node.js 18+
- npm

## Levantar entorno con Docker

Desde la raíz del proyecto:

```bash
cd backend
docker-compose up -d
```

Servicios levantados:
- API Laravel: `http://localhost:8000`
- phpMyAdmin: `http://localhost:8081`
- MySQL: `localhost:3308`

Inicialización recomendada (primera vez):

```bash
cd backend
# PowerShell
Copy-Item .env.example .env
# Bash
cp .env.example .env
# generar APP_KEY y JWT_SECRET dentro del contenedor
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan jwt:secret
# migraciones + seeders
docker-compose exec app php artisan migrate --seed
```

## Variables de entorno requeridas (backend/.env)

Variables mínimas para correr en Docker:

```env
APP_NAME=DeployTime
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_KEY=base64:...   # generado con php artisan key:generate

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=deploytime
DB_USERNAME=deploytime_user
DB_PASSWORD=deploytime_pass

JWT_SECRET=...       # generado con php artisan jwt:secret
```

Notas:
- Las credenciales de MySQL deben coincidir con `backend/docker-compose.yml`.
- `APP_KEY` y `JWT_SECRET` son obligatorias para autenticación y cifrado.

## Comandos principales de gestión

En este proyecto **no existe `manage.py`** (Django).
El equivalente es `php artisan` (Laravel), ejecutado dentro del contenedor `app`:

```bash
cd backend
docker-compose exec app php artisan list
docker-compose exec app php artisan migrate
docker-compose exec app php artisan migrate:rollback
docker-compose exec app php artisan db:seed
docker-compose exec app php artisan route:list
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan test
```

Atajos disponibles desde la raíz (`package.json`):

```bash
npm run backend:up
npm run backend:down
npm run migrate
npm run install:desktop
npm run dev
npm run package:win
```

## Estructura de carpetas

```text
DeployTime/
├── backend/                  # Laravel API + panel web + Docker
│   ├── app/                  # Controllers, Models, Middleware
│   ├── config/               # Configuración (DB, JWT, CORS, etc.)
│   ├── database/             # Migrations y seeders
│   ├── routes/               # api.php, web.php
│   ├── docker/               # entrypoint y config MySQL
│   ├── docker-compose.yml
│   └── Dockerfile.dev
├── desktop/                  # Electron + React + TypeScript
│   ├── src/main/             # Proceso principal (tray, sync, timers)
│   ├── src/preload/          # Bridge IPC
│   └── src/renderer/         # UI React
├── docs/                     # Documentación técnica y operativa
└── package.json              # Scripts de orquestación en raíz
```

## Flujo rápido (backend + desktop)

```bash
# 1) Backend
npm run backend:up
npm run migrate

# 2) Desktop
npm run install:desktop
npm run dev
```

## Referencias

- Inicio rápido: `docs/INICIO_RAPIDO.md`
- Cambios Docker: `docs/CAMBIOS_DOCKER.md`
- Seguridad: `docs/SECURITY.md`
- API testing: `backend/api-test.http`

