# DeployTime Desktop - Electron App

Aplicación de escritorio para Windows 11 que funciona como time tracker en la bandeja del sistema.

## Características

- 🕐 Timer en tiempo real
- 📊 Selección de proyecto y tarea
- 🔔 Notificaciones de inactividad (10 minutos)
- 💾 Base de datos local SQLite para trabajo offline
- 🔄 Sincronización automática con servidor Laravel
- 🎨 Interfaz minimalista en la bandeja del sistema

## Stack Tecnológico

- **Electron** - Framework para aplicaciones de escritorio
- **React** - UI components
- **TypeScript** - Type safety
- **Vite** - Build tool y dev server
- **SQLite** - Base de datos local

## Estructura del Proyecto

```
desktop/
├── src/
│   ├── main/          # Electron main process
│   │   └── main.ts
│   ├── preload/       # Preload script (IPC bridge)
│   │   └── preload.ts
│   └── renderer/      # React app (UI)
│       ├── App.tsx
│       ├── App.css
│       └── main.tsx
├── public/
│   └── index.html
├── dist/              # Compiled output
└── release/           # Built installers
```

## Scripts Disponibles

### Desarrollo

```bash
# Iniciar en modo desarrollo (hot reload)
npm run dev

# Solo Vite dev server
npm run dev:vite

# Solo Electron
npm run dev:electron
```

### Build

```bash
# Build completo (renderer + main + preload)
npm run build

# Build solo renderer (React)
npm run build:renderer

# Build solo main process
npm run build:main

# Build solo preload
npm run build:preload
```

### Empaquetado

```bash
# Crear instalador para Windows
npm run package:win

# Build para todas las plataformas
npm run package
```

## Desarrollo

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar desarrollo

```bash
npm run dev
```

Esto iniciará:
- Vite dev server en `http://localhost:3000`
- Electron con hot reload activado
- DevTools abierto automáticamente

### 3. La aplicación se abrirá como ventana en el system tray

- Click en el icono del tray para mostrar/ocultar
- La ventana se posiciona automáticamente cerca del icono
- Se oculta al perder el foco (blur)

## Integración con Backend

La aplicación se conecta al backend Laravel en:

```
http://localhost:8000/api
```

Endpoints principales:
- `POST /auth/login` - Autenticación
- `GET /projects` - Lista de proyectos
- `GET /tasks` - Lista de tareas
- `POST /time-entries` - Iniciar timer
- `PUT /time-entries/{id}/stop` - Detener timer
- `GET /my/active-time-entry` - Obtener timer activo

## Configuración

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000/api
```

## Build para Producción

```bash
npm run package:win
```

Esto generará un instalador en `release/` que incluye:
- Instalador NSIS para Windows
- Opción de elegir directorio de instalación
- Icono personalizado
- Auto-inicio con Windows (opcional)

## Características Pendientes

- [ ] Implementar login real con JWT
- [ ] Conectar con API Laravel
- [ ] Base de datos SQLite local
- [ ] Sincronización automática
- [ ] Detector de inactividad (10 min)
- [ ] Notificaciones push
- [ ] Auto-inicio con Windows
- [ ] Minimizar a tray al cerrar
- [ ] Atajos de teclado globales

## Estado Actual

✅ Setup inicial completado
✅ Estructura de proyecto
✅ System tray integration
✅ UI básica con React
✅ TypeScript configurado
✅ Build scripts funcionando

🔄 En desarrollo:
- Integración con API
- Base de datos SQLite
- Sincronización

## Requisitos del Sistema

- Windows 11 (recomendado)
- Windows 10 (compatible)
- Node.js 18+
- npm 9+

## Licencia

MIT
