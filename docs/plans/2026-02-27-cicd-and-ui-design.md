# UI and Deployment Design Plan

## 1. UI: Historial de Entradas de Tiempo (Opción 1A)

**Objetivo:** Permitir a los usuarios y administradores ver no solo las horas totales acumuladas de cada tarea, sino también el detalle individual (fecha, hora de inicio, hora de fin y duración de esa sesión) dentro de la vista del proyecto (`admin/projects/show.blade.php`).

**Enfoque Elegido (Opción A - Filas Desplegables):**
- **Trigger:** Añadiremos un botón discreto (p. ej., un ícono de flecha `▼` o botón `+ Detalles`) al lado de la información de "Tiempo Total" en la fila de cada tarea.
- **Accordion Row:** Al hacer click, usando un simple script en Vanilla JS (o Alpine.js si el servidor lo usa), se revelará una fila oculta `<tr class="hidden">` inmediatamente debajo de la tarea.
- **Data:** Esta fila interna contendrá una sub-tabla con el listado de todos los `TimeEntry` de esa tarea. Las columnas serán:
  - Usuario (Si hay múltiples)
  - Fecha (ej: `27-Feb-2026`)
  - Inicio (ej: `14:30`)
  - Fin (ej: `16:15`)
  - Duración (ej: `01:45:00`)
- **Backend:** Actualizaremos el eager loading en `ProjectController@show` para cargar `tasks.timeEntries.user` para evitar problemas de _N+1 queries_. 

## 2. CI/CD: Automatización de Despliegue con GitHub Actions

**Objetivo:** Actualizar el servidor automáticamente cuando se haga `push` a la rama `main` en GitHub, evitando entrar manualment por SSH a correr comandos.

**Estado Actual:**
- Hemos encontrado que ya existe un archivo de CI/CD: `.github/workflows/deploy-ssh.yml`. 
- Este archivo **ya está programado para dispararse al hacer push a `main`**.
- El script se conecta al servidor mediante SSH, copia los archivos y corre las migraciones/caches de Laravel.

**¿Qué falta para completarlo?**
El flujo fallará (o no hará nada) si GitHub no conoce las credenciales del servidor. Para activarlo, el usuario debe establecer en la pestaña `Settings > Secrets and variables > Actions` del repositorio las siguientes "Repository secrets":
- `SSH_HOST`: La IP o dominio del servidor (ej. `tu-dominio.com`)
- `SSH_USERNAME`: El usuario de acceso SSH (normalmente el de cPanel).
- `SSH_PRIVATE_KEY`: La clave SSH privada (generada en el servidor o local) para autorizar la entrada sin contraseña.
- `SSH_PORT`: El puerto SSH (suele ser `22` u otro personalizado).

**Acción Requerida:** Tras guiar al usuario para cargar los secretos, el sistema de despliegue quedará validado y 100% operativo sin cambiar nada más de código (ya que en el paso previo arreglamos el único path roto).
