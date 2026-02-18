import { contextBridge, ipcRenderer } from 'electron';

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // API para comunicación con el proceso principal
  sendMessage: (channel: string, data: any) => {
    const validChannels = ['start-timer', 'stop-timer', 'sync-data', 'hide-window', 'toggle-window', 'quit-app'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  hideWindow: () => ipcRenderer.send('hide-window'),
  toggleWindow: () => ipcRenderer.send('toggle-window'),
  quitApp: () => ipcRenderer.send('quit-app'),

  onMessage: (channel: string, callback: (data: any) => void) => {
    const validChannels = ['timer-update', 'sync-complete', 'inactivity-warning', 'app-closing', 'timer-synced'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },

  removeListener: (channel: string, callback: any) => {
    ipcRenderer.removeListener(channel, callback);
  },

  // Información del sistema
  platform: process.platform,
  version: process.versions.electron,
});

// TypeScript declarations para window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      sendMessage: (channel: string, data: any) => void;
      onMessage: (channel: string, callback: (data: any) => void) => void;
      removeListener: (channel: string, callback: any) => void;
      hideWindow: () => void;
      toggleWindow: () => void;
      quitApp: () => void;
      platform: string;
      version: string;
    };
  }
}
