# API Testing Guide - DeployTime

Base URL: `http://localhost:8000/api`

## Autenticación

Todas las rutas excepto login y register requieren el header:
```
Authorization: Bearer {token}
```

---

## 1. Autenticación

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@deploytime.com",
  "password": "admin123"
}
```

**Respuesta exitosa:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "Administrador",
    "email": "admin@deploytime.com",
    "role": "admin"
  }
}
```

### Obtener usuario autenticado
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Refrescar token
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

---

## 2. Proyectos

### Listar proyectos
```http
GET /api/projects
Authorization: Bearer {token}
```

**Admin**: ve todos los proyectos
**Colaborador**: solo ve proyectos donde es colaborador

### Ver proyecto específico
```http
GET /api/projects/1
Authorization: Bearer {token}
```

### Crear proyecto (solo admin)
```http
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nuevo Proyecto",
  "description": "Descripción del proyecto"
}
```

### Actualizar proyecto (solo admin)
```http
PUT /api/projects/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Proyecto Actualizado",
  "description": "Nueva descripción"
}
```

### Eliminar proyecto (solo admin)
```http
DELETE /api/projects/1
Authorization: Bearer {token}
```

### Agregar colaborador a proyecto (solo admin)
```http
POST /api/projects/1/collaborators
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 2
}
```

### Remover colaborador de proyecto (solo admin)
```http
DELETE /api/projects/1/collaborators/2
Authorization: Bearer {token}
```

---

## 3. Tareas

### Listar tareas de un proyecto
```http
GET /api/projects/1/tasks
Authorization: Bearer {token}
```

### Ver tarea específica
```http
GET /api/tasks/1
Authorization: Bearer {token}
```

### Crear tarea
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "project_id": 1,
  "name": "Nueva tarea",
  "description": "Descripción de la tarea",
  "estimated_hours": 8.5,
  "status": "pending"
}
```

**Status posibles**: `pending`, `in_progress`, `completed`

### Actualizar tarea
```http
PUT /api/tasks/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tarea actualizada",
  "status": "in_progress"
}
```

### Eliminar tarea
```http
DELETE /api/tasks/1
Authorization: Bearer {token}
```

---

## 4. Registros de Tiempo (Time Entries)

### Listar registros de una tarea
```http
GET /api/tasks/1/time-entries
Authorization: Bearer {token}
```

### Ver registro específico
```http
GET /api/time-entries/1
Authorization: Bearer {token}
```

### Iniciar registro de tiempo
```http
POST /api/time-entries
Authorization: Bearer {token}
Content-Type: application/json

{
  "task_id": 2,
  "notes": "Comenzando desarrollo de feature X"
}
```

**Nota**: Solo puede haber un registro activo por usuario a la vez.

### Detener registro de tiempo
```http
PUT /api/time-entries/1/stop
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Completado desarrollo inicial"
}
```

### Eliminar registro
```http
DELETE /api/time-entries/1
Authorization: Bearer {token}
```

### Obtener registro activo del usuario
```http
GET /api/my/active-time-entry
Authorization: Bearer {token}
```

**Respuesta si hay activo:**
```json
{
  "id": 4,
  "task_id": 2,
  "user_id": 2,
  "start_time": "2025-11-17T09:00:00.000000Z",
  "end_time": null,
  "notes": "Continuando con desarrollo de API",
  "task": {
    "id": 2,
    "project_id": 1,
    "name": "Desarrollo API REST",
    "status": "in_progress"
  }
}
```

**Respuesta si no hay activo:**
```json
{
  "active_entry": null
}
```

### Obtener todos los registros del usuario
```http
GET /api/my/time-entries
Authorization: Bearer {token}
```

**Con filtros opcionales:**
```http
GET /api/my/time-entries?from_date=2025-11-10&to_date=2025-11-17
Authorization: Bearer {token}
```

---

## Usuarios de Prueba

### Administrador
- Email: `admin@deploytime.com`
- Password: `admin123`
- Permisos: CRUD completo en proyectos, puede asignar colaboradores

### Colaborador 1 (Juan)
- Email: `juan@deploytime.com`
- Password: `colaborador123`
- Proyectos: Sistema Web de Gestión, App Móvil E-commerce
- Tiene una entrada de tiempo activa actualmente

### Colaborador 2 (María)
- Email: `maria@deploytime.com`
- Password: `colaborador123`
- Proyectos: Sistema Web de Gestión

---

## Datos de Prueba Creados

### Proyectos
1. **Sistema Web de Gestión**
   - Creador: Admin
   - Colaboradores: Juan, María
   - Tareas: 3

2. **App Móvil E-commerce**
   - Creador: Admin
   - Colaboradores: Juan
   - Tareas: 1

### Tareas con tiempo registrado
- **Diseño de base de datos** (completada)
  - 2 registros de tiempo por Admin
  - Total: ~8.5 horas

- **Desarrollo API REST** (en progreso)
  - 1 registro completado + 1 activo por Juan
  - Total: 9+ horas y contando

---

## Testing con cURL

### Ejemplo completo de flujo

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@deploytime.com","password":"colaborador123"}' \
  | jq -r '.access_token')

# 2. Ver mis proyectos
curl http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN"

# 3. Ver mi entrada activa
curl http://localhost:8000/api/my/active-time-entry \
  -H "Authorization: Bearer $TOKEN"

# 4. Detener entrada activa (reemplazar ID)
curl -X PUT http://localhost:8000/api/time-entries/4/stop \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Trabajo completado por hoy"}'

# 5. Iniciar nueva entrada
curl -X POST http://localhost:8000/api/time-entries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task_id":3,"notes":"Iniciando frontend"}'
```

---

## Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Error en los datos enviados
- `401 Unauthorized` - Token inválido o expirado
- `403 Forbidden` - No tienes permisos para este recurso
- `404 Not Found` - Recurso no encontrado
- `422 Unprocessable Entity` - Errores de validación

---

## Recomendaciones

1. **Postman/Insomnia**: Usa estas herramientas para testing manual
2. **Guardar token**: Guarda el token en una variable de entorno
3. **Renovar token**: Si expira, usa `/api/auth/refresh`
4. **Solo un timer activo**: Recuerda detener el timer actual antes de iniciar uno nuevo

---

## Próximos pasos

Para integrar con la aplicación Electron:
1. Guardar token en localStorage o config local
2. Incluir token en todas las peticiones
3. Manejar renovación automática de token
4. Sincronizar datos locales (SQLite) con servidor
5. Implementar retry en caso de fallo de red
