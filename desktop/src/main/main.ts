import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import { getSyncService } from './sync';
import { getDatabase } from './database';

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

// IPC Handlers

ipcMain.on('toggle-window', () => {
  toggleWindow();
});

ipcMain.on('hide-window', () => {
  if (mainWindow?.isVisible()) {
    mainWindow.hide();
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
});

// Timer IPC Handlers - Delegate to SyncService for offline queue support
ipcMain.handle('timer:start', async (event, data) => {
  try {
    const { taskId, notes } = data;
    const syncService = getSyncService();
    const result = await syncService.syncTimerStart(taskId, notes || '');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('timer:start error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('timer:stop', async (event, data) => {
  try {
    const { entryId, notes } = data;
    const syncService = getSyncService();
    const result = await syncService.syncTimerStop(entryId, notes || '');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('timer:stop error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('timer:pause', async (event, data) => {
  try {
    const { entryId, notes } = data;
    const syncService = getSyncService();
    // Pause is same as stop for our purposes
    const result = await syncService.syncTimerStop(entryId, notes || '');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('timer:pause error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('timer:complete', async (event, data) => {
  try {
    const { taskId, entryId, notes } = data;
    const syncService = getSyncService();
    
    // First stop the timer if there's an active entry
    if (entryId) {
      await syncService.syncTimerStop(entryId, notes || '');
    }
    
    // Then mark task as complete by updating in sync queue
    const db = getDatabase();
    const taskId_num = typeof taskId === 'string' ? parseInt(taskId) : taskId;
    
    // Add task completion to sync queue
    db.addToSyncQueue('task', taskId_num, 'complete', { status: 'completed' });
    
    // Also process the sync queue to try sending
    await syncService.processSyncQueue();
    
    return { success: true, message: 'Task marked as complete' };
  } catch (error: any) {
    console.error('timer:complete error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('timer:getActive', async (event) => {
  try {
    const syncService = getSyncService();
    // Try to get from API first, fallback to local DB
    try {
      const result = await syncService.getActiveTimeEntry?.();
      if (result) return { success: true, data: result };
    } catch (e) {
      console.warn('Could not fetch active timer from API:', e);
    }
    
    // Fallback to local database
    const db = getDatabase();
    const entries = db.getTimeEntries?.() || [];
    const activeEntry = entries.find((e: any) => !e.end_time);
    
    return { success: true, data: activeEntry || null };
  } catch (error: any) {
    console.error('timer:getActive error:', error);
    return { success: false, error: error.message };
  }
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
