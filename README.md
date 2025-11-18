# DeployTime - Time Tracking System

Sistema completo de seguimiento de tiempo para equipos de desarrollo con aplicación de escritorio y backend API.

---

## 📋 Descripción

**DeployTime** es un sistema de time tracking diseñado para colaboradores y administradores que permite:

- ⏱️ Trackear tiempo trabajado en tareas específicas
- 📊 Gestionar proyectos y colaboradores (admin)
- 💻 Aplicación de escritorio en la bandeja del sistema (Windows 11)
- 🔄 Sincronización automática con servidor
- 📴 Trabajo offline con base de datos local
- ⚠️ Detector de inactividad de 10 minutos

---

## 🏗️ Arquitectura

### Backend (Laravel 11 API)
- **Framework**: Laravel 11
- **Base de datos**: MySQL 8.0
- **Autenticación**: JWT (tymon/jwt-auth)
- **Deployment**: Docker (dev) + Debian server (prod)
- **Puerto**: 8000

### Desktop App (Electron)
- **Framework**: Electron + React + TypeScript
- **Build**: Vite
- **Base de datos local**: SQLite (offline)
- **Plataforma**: Windows 11 / 10

---

## 📁 Estructura del Proyecto

```
DeployTime/
├── backend/               # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── ProjectController.php
│   │   │   ├── TaskController.php
│   │   │   └── TimeEntryController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Project.php
│   │   │   ├── Task.php
│   │   │   └── TimeEntry.php
│   │   └── Middleware/
│   │       └── AdminMiddleware.php
│   ├── database/
│   │   ├── migrations/      # 5 tablas
│   │   └── seeders/
│   ├── routes/api.php       # 20+ endpoints
│   ├── docker-compose.yml
│   └── .env
│
├── desktop/               # Electron App
│   ├── src/
│   │   ├── main/          # Electron main process
│   │   ├── preload/       # IPC Bridge
│   │   └── renderer/      # React UI
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── docs/                  # Documentación
    ├── BACKEND_COMPLETADO.md
    ├── BACKEND_STATUS.md
    ├── ELECTRON_SETUP_COMPLETADO.md
    ├── API_TESTING.md
    └── PROGRESO.md
```

---

## 🚀 Quick Start

### Backend API

```bash
# Iniciar con Docker
cd backend
docker-compose up -d

# Ejecutar migraciones y seeders
docker-compose exec app php artisan migrate --seed

# API disponible en http://localhost:8000
```

**Usuarios de prueba:**
- Admin: `admin@deploytime.com` / `admin123`
- Colaborador 1: `juan@deploytime.com` / `colaborador123`
- Colaborador 2: `maria@deploytime.com` / `colaborador123`

### Desktop App

```bash
cd desktop
npm install
npm run dev
```

La aplicación se abrirá en la bandeja del sistema.

---

## 📊 Base de Datos

### Tablas

1. **users** - Usuarios (admin/collaborator)
2. **projects** - Proyectos
3. **project_collaborators** - Relación N:M proyectos-usuarios
4. **tasks** - Tareas de proyectos
5. **time_entries** - Registros de tiempo

### Relaciones

```
User
├── hasMany Projects (created_by)
├── belongsToMany Projects (collaborator)
└── hasMany TimeEntries

Project
├── belongsTo User (creator)
├── belongsToMany Users (collaborators)
└── hasMany Tasks

Task
├── belongsTo Project
└── hasMany TimeEntries

TimeEntry
├── belongsTo Task
└── belongsTo User
```

---

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login con JWT
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Usuario actual

### Proyectos (Admin)
- `GET /api/projects` - Listar
- `POST /api/projects` - Crear
- `GET /api/projects/{id}` - Ver
- `PUT /api/projects/{id}` - Actualizar
- `DELETE /api/projects/{id}` - Eliminar
- `POST /api/projects/{id}/collaborators` - Agregar colaborador
- `DELETE /api/projects/{id}/collaborators/{userId}` - Remover

### Tareas
- `GET /api/projects/{id}/tasks` - Listar por proyecto
- `POST /api/tasks` - Crear
- `GET /api/tasks/{id}` - Ver
- `PUT /api/tasks/{id}` - Actualizar
- `DELETE /api/tasks/{id}` - Eliminar

### Time Entries
- `POST /api/time-entries` - Iniciar timer
- `PUT /api/time-entries/{id}/stop` - Detener timer
- `GET /api/my/active-time-entry` - Timer activo del usuario
- `GET /api/my/time-entries` - Mis registros
- `GET /api/tasks/{id}/time-entries` - Registros de una tarea
- `DELETE /api/time-entries/{id}` - Eliminar

Ver documentación completa en [docs/API_TESTING.md](docs/API_TESTING.md)

---

## ✅ Estado del Desarrollo

### Backend ✅ 100% Completado
- [x] Docker Compose configurado
- [x] MySQL 8.0 + phpMyAdmin
- [x] Migraciones y modelos
- [x] JWT Authentication
- [x] 4 Controllers completos
- [x] 20+ endpoints funcionales
- [x] Middleware admin
- [x] Seeders con datos de prueba
- [x] **TESTEADO Y FUNCIONANDO**

### Desktop App ✅ 100% Completado
- [x] Electron + React + TypeScript
- [x] System tray integration
- [x] UI completa (login + timer)
- [x] Build scripts
- [x] Ventana frameless con auto-hide
- [x] **Integración con API Laravel**
- [x] **SQLite local storage**
- [x] **Sincronización automática**
- [x] **Detector de inactividad**
- [x] **COMPLETAMENTE FUNCIONAL**

---

## 🛠️ Tecnologías

### Backend
- Laravel 11
- MySQL 8.0
- JWT Authentication
- Docker & Docker Compose
- PHP 8.2

### Frontend Desktop
- Electron 39
- React 19
- TypeScript 5
- Vite 6
- SQLite (pendiente)

---

## 📖 Documentación

- [Backend Completado](docs/BACKEND_COMPLETADO.md) - Estado del backend
- [Backend Status](docs/BACKEND_STATUS.md) - Resolución de errores
- [Electron Setup](docs/ELECTRON_SETUP_COMPLETADO.md) - Setup de Electron
- [**Integración Completada**](docs/INTEGRACION_COMPLETADA.md) - **Backend + Desktop integrados** ⭐
- [API Testing](docs/API_TESTING.md) - Guía de testing de API
- [Progreso General](docs/PROGRESO.md) - Historial de desarrollo

---

## 🎯 Próximos Pasos

### ✅ Fase 1: Backend API - COMPLETADO
- [x] Laravel 11 + MySQL + Docker
- [x] JWT Authentication
- [x] 20+ endpoints API REST
- [x] Seeders con datos de prueba

### ✅ Fase 2: Desktop App - COMPLETADO
- [x] Electron + React + TypeScript
- [x] Integración completa con API
- [x] SQLite local storage
- [x] Servicio de sincronización
- [x] Detector de inactividad (10 min)

### Fase 3: Mejoras Futuras (Opcional)
1. Dashboard web para administradores
2. Reportes y estadísticas
3. Comparación estimado vs real
4. Exportación de datos

---

## 🔐 Seguridad

- ✅ JWT con tokens renovables
- ✅ Passwords hasheados con bcrypt
- ✅ Middleware de autenticación y autorización
- ✅ Context Isolation en Electron
- ✅ Preload script con whitelist de canales IPC
- ✅ SQL injection prevention (Eloquent)
- ✅ CORS configurado

---

## 🧪 Testing

### Backend API
```bash
# Con REST Client (VSCode)
Abrir: backend/api-test.http
Click: "Send Request"

# Con curl
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@deploytime.com","password":"admin123"}'
```

### Desktop App
```bash
cd desktop
npm run dev
```

---

## 📦 Deployment

### Backend (Producción)
```bash
# En servidor Debian (Toran)
git clone <repo>
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan migrate --force
```

### Desktop App (Build)
```bash
cd desktop
npm run build
npm run package:win
# Instalador en: desktop/release/
```

---

## 👥 Roles y Permisos

### Administrador
- ✅ CRUD completo de proyectos
- ✅ Gestionar colaboradores
- ✅ Ver todos los proyectos
- ✅ Asignar tareas

### Colaborador
- ✅ Ver proyectos asignados
- ✅ CRUD de tareas en sus proyectos
- ✅ Iniciar/detener timer
- ✅ Ver su historial de tiempos

---

## 🌐 URLs de Desarrollo

- **API Backend**: http://localhost:8000/api
- **phpMyAdmin**: http://localhost:8081
- **MySQL**: localhost:3308
- **Electron Dev**: http://localhost:3000 (Vite)

---

## 📄 Licencia

MIT

---

## 🤝 Contribuir

Este es un proyecto privado de DeployTime.

---

## 📞 Soporte

Para soporte, contactar al equipo de desarrollo.

---

**Desarrollado por**: Claude Code AI
**Fecha**: Noviembre 2025
**Versión**: 1.0.0
**Principio**: KISSES (Keep It Simple, Smart, Efficient & Secure)
