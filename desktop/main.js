const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

function createWindow() {
  const isDev = !app.isPackaged;

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = 400;
  const windowHeight = 600;
  const margin = 10;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth - margin,
    y: margin,
    show: false,
    frame: false, // Cambiado a true para que tenga barra de título y se pueda mover
    fullscreenable: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: true, // Siempre visible encima de otras ventanas
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'dist/preload/preload.js'),
    },
  });

  // Cargar la aplicación React
  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:3001/');
    // Esperar a que la página cargue antes de abrir DevTools
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/renderer/index.html'));
  }

  // Al hacer clic en X, solo ocultar la ventana (no cerrar la app)
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // NO ocultar la ventana cuando pierde el foco
  // El usuario controla la visibilidad manualmente
}

function createTray() { // Declara la función que crea el icono de bandeja
  const fs = require('fs'); // Importa fs para poder comprobar si existe el archivo
  const iconPath = path.join(__dirname, 'tray-icon.png'); // Construye la ruta absoluta al icono PNG en la misma carpeta que main.js

  let icon = null; // Declara la variable que almacenará la imagen del icono

  if (fs.existsSync(iconPath)) { // Verifica si el archivo tray-icon.png existe
    icon = nativeImage.createFromPath(iconPath); // Crea la imagen del icono desde el archivo PNG
  } else { // Si el archivo no existe en esa ruta
    console.error('[TRAY] No se encontró tray-icon.png en:', iconPath); // Log de error avisando que no se encontró el archivo
    icon = nativeImage.createEmpty(); // Crea una imagen vacía como último recurso para no romper la app
  }

  if (!icon || icon.isEmpty()) { // Verifica si el icono es nulo o está vacío
    console.error('[TRAY] El icono está vacío, es posible que no se vea en la bandeja'); // Advierte que el icono puede no mostrarse
  }

  tray = new Tray(icon); // Crea el icono en la bandeja del sistema usando la imagen cargada
  tray.setToolTip('DeployTime - Time Tracker'); // Define el texto que se ve al pasar el mouse por el icono

  const contextMenu = Menu.buildFromTemplate([ // Crea el menú contextual del icono de bandeja
    { // Primer ítem del menú contextual
      label: 'Mostrar/ocultar ventana', // Texto del ítem para alternar la ventana principal
      click: () => { // Define qué pasa al hacer click en este ítem
        toggleWindow(); // Llama a la función que muestra/oculta la ventana principal
      }, // Fin del handler click
    }, // Fin del primer ítem
    { // Segundo ítem del menú contextual
      type: 'separator', // Agrega un separador visual en el menú
    }, // Fin del separador
    { // Tercer ítem del menú contextual
      label: 'Salir', // Texto del ítem para cerrar la aplicación
      click: () => { // Define qué pasa al hacer click en "Salir"
        app.quit(); // Solicita el cierre de la aplicación Electron
      }, // Fin del handler click
    }, // Fin del tercer ítem
  ]); // Fin de la construcción del menú contextual

  tray.setContextMenu(contextMenu); // Asigna el menú contextual al icono de bandeja

  tray.on('click', () => { // Maneja el evento click directo sobre el icono del tray
    toggleWindow(); // Alterna mostrar u ocultar la ventana principal
  }); // Fin del manejador de click
} // Fin de la función createTray

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
  }

  if (mainWindow?.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

function showWindow() {
  if (!mainWindow) {
    createWindow();
  }

  // Mantener la ventana en su posición actual (arriba a la derecha)
  // No reposicionar cerca del tray icon

  mainWindow?.show();
  mainWindow?.focus();
}

// Esta aplicación corre en el system tray, no se cierra al cerrar todas las ventanas
app.on('window-all-closed', () => {
  // No hacemos nada, la app sigue corriendo en el tray
});

// Detener timer activo antes de salir de la aplicación
app.on('before-quit', async (event) => {
  console.log('Aplicación cerrándose, deteniendo timer activo si existe...');

  // Prevenir que se cierre inmediatamente
  event.preventDefault();

  try {
    // Enviar mensaje al renderer para detener el timer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-closing');

      // Esperar 2 segundos para que el renderer detenga el timer
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Error al detener timer:', error);
  }

  // Ahora sí cerrar la aplicación
  app.exit(0);
});

app.on('ready', () => {
  createTray();
  createWindow();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
