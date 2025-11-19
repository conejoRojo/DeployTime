import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  // Cargar la aplicación React
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Ocultar ventana cuando pierde el foco
  mainWindow.on('blur', () => {
    if (!mainWindow?.webContents.isDevToolsOpened()) {
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Crear icono temporal (usaremos uno personalizado después)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEWSURBVDiNpdMxSgNBFMbx3wwmIIiVhYWFYGMhHiAHELyBhY2FV7CwEbyAhY2FnZWFhY2VlZWVhZWFhY2FhY2FhY2F+9nMLpvdJH7weLPv/5s3j3kTiAhSSk0ppXullJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllJqllH4BnmVjgCGbJCkAAAAASUVORK5CYII='
  );

  tray = new Tray(icon);
  tray.setToolTip('DeployTime - Time Tracker');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar Timer',
      click: () => {
        toggleWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Click en el icono del tray muestra/oculta la ventana
  tray.on('click', () => {
    toggleWindow();
  });
}

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

  // Posicionar ventana cerca del icono del tray
  const trayBounds = tray?.getBounds();
  const windowBounds = mainWindow?.getBounds();

  if (trayBounds && windowBounds) {
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
    const y = Math.round(trayBounds.y + trayBounds.height);

    mainWindow?.setPosition(x, y, false);
  }

  mainWindow?.show();
  mainWindow?.focus();
}

// Esta aplicación corre en el system tray, no se cierra al cerrar todas las ventanas
app.on('window-all-closed', () => {
  // No hacemos nada, la app sigue corriendo en el tray
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
