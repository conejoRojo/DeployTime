# Diseño: Manejo de Conexiones y Ciclo de Vida de la App

## Propósito
Mejorar la experiencia de usuario y la fiabilidad de la aplicación de escritorio DeployTime asegurando que la conexión se mantenga por al menos 6 horas sin interrupciones, que la aplicación inicie automáticamente con Windows, y que los temporizadores activos se detengan automáticamente si la aplicación se cierra o Windows se apaga.

## Características Aprobadas

### 1. Renovación Silenciosa de Token (Refresh en Background)
**Problema:** Los JWT del backend expiran a los 60 minutos, causando desconexiones repentinas (Errores 401).
**Solución:**
- El frontend (React - `App.tsx`) implementará un temporizador (`setInterval`) que se activará cada 45 minutos (2.700.000 ms) siempre que el usuario esté logueado.
- El temporizador llamará a la ruta `/api/auth/refresh` (mediante `api.refreshToken()`).
- Al obtener el nuevo token, reemplaza el anterior en memoria y `localStorage`, garantizando sesiones ininterrumpidas (ej. 6-8 horas continuas).
- Si el refresco falla (ej. sin internet, servidor caído o token revocado), se atrapará el error, se limpiará la sesión local (`api.clearToken()`) y se redirigirá al usuario a la pantalla de login con el mensaje: "La sesión ha expirado".

### 2. Auto-inicio con Windows
**Problema:** El usuario necesita abrir manualmente la aplicación cada vez que arranca la PC.
**Solución:**
- Aprovechar las utilidades nativas de Electron (`app.setLoginItemSettings`) en el proceso principal (`main.js`).
- Se configurará para que la aplicación se lance automáticamente en el inicio de sesión del sistema operativo (`openAtLogin: true`).

### 3. Detención Automática de Temporizadores (Auto-Stop)
**Problema:** Si el usuario olvida pausar/detener su tarea y apaga la PC o cierra la aplicación, el temporizador en el servidor sigue corriendo, generando registros de tiempo irreales.
**Solución:**
- Enlazar la parada técnica en el ciclo de vida de Electron (`main.js` captura eventos como `before-quit` o se usa `window.onbeforeunload` en el proceso de renderizado `App.tsx`).
- Cuando se detecta el cierre un gracefully shutdown (cierre de ventana o apagado del sistema), se verificará si hay un `activeTimer`.
- Si lo hay, se emitirá una petición síncrona o asíncrona segura (`navigator.sendBeacon` o mediante el proceso principal de Electron) a la API `PUT /time-entries/{id}/stop` con la nota "Detenido automáticamente al cerrar la aplicación".
- Nota: Al apagar Windows de golpe, React puede no tener tiempo suficiente, por lo que respaldarse llamando a la API desde `main.js` interceptando la señal de cierre suele ser más seguro para este caso de uso.

## Consideraciones de Implementación
- Las tareas se dividirán entre distintos agentes dada su distinta naturaleza (procesos de React vs configuración de Electron). 
- **Agente 1 (Frontend React):** Encargado de la lógica de refresh de tokens en `App.tsx`.
- **Agente 2 (Main Electron):** Encargado del Auto-inicio (`app.setLoginItemSettings`) y del Auto-Stop interceptando la señal de finalización en `main.js`.
