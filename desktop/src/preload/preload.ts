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

  // Timer operations (sincronizadas offline)
  startTimer: (taskId: number, notes?: string): Promise<any> => 
    ipcRenderer.invoke('timer:start', { taskId, notes }),
  
  stopTimer: (entryId: number, notes?: string): Promise<any> => 
    ipcRenderer.invoke('timer:stop', { entryId, notes }),
  
  pauseTimer: (entryId: number, notes?: string): Promise<any> => 
    ipcRenderer.invoke('timer:pause', { entryId, notes }),
  
  completeTask: (taskId: number, entryId?: number, notes?: string): Promise<any> => 
    ipcRenderer.invoke('timer:complete', { taskId, entryId, notes }),

  getActiveTimeEntry: (): Promise<any> => 
    ipcRenderer.invoke('timer:getActive'),

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
      startTimer: (taskId: number, notes?: string) => Promise<any>;
      stopTimer: (entryId: number, notes?: string) => Promise<any>;
      pauseTimer: (entryId: number, notes?: string) => Promise<any>;
      completeTask: (taskId: number, entryId?: number, notes?: string) => Promise<any>;
      getActiveTimeEntry: () => Promise<any>;
      platform: string;
      version: string;
    };
  }
}
