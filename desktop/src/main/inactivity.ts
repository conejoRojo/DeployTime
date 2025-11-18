import { powerMonitor, BrowserWindow, dialog } from 'electron';
import { EventEmitter } from 'events';

const INACTIVITY_THRESHOLD = 10 * 60 * 1000; // 10 minutos en milisegundos

interface InactivityEvent {
  type: 'inactive' | 'active';
  timestamp: number;
  inactiveDuration?: number;
}

class InactivityDetector extends EventEmitter {
  private lastActivityTime: number;
  private checkInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = true;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    super();
    this.lastActivityTime = Date.now();
    this.setupListeners();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private setupListeners(): void {
    // Eventos de actividad del sistema
    powerMonitor.on('resume', () => {
      console.log('Sistema reactivado desde suspensión');
      this.handleActivity();
    });

    powerMonitor.on('suspend', () => {
      console.log('Sistema suspendido');
      this.handleInactivity();
    });

    // Detectar cuando el usuario desbloquea la sesión
    powerMonitor.on('unlock-screen', () => {
      console.log('Pantalla desbloqueada');
      this.handleActivity();
    });

    // Detectar cuando el usuario bloquea la sesión
    powerMonitor.on('lock-screen', () => {
      console.log('Pantalla bloqueada');
      this.handleInactivity();
    });
  }

  start(): void {
    if (this.checkInterval) {
      return; // Ya está corriendo
    }

    console.log('Detector de inactividad iniciado');
    this.lastActivityTime = Date.now();
    this.isActive = true;

    // Verificar inactividad cada minuto
    this.checkInterval = setInterval(() => {
      this.checkInactivity();
    }, 60 * 1000); // Cada 60 segundos
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Detector de inactividad detenido');
    }
  }

  private checkInactivity(): void {
    const now = Date.now();
    const inactiveDuration = now - this.lastActivityTime;

    if (inactiveDuration >= INACTIVITY_THRESHOLD && this.isActive) {
      console.log(`Inactividad detectada: ${Math.floor(inactiveDuration / 1000 / 60)} minutos`);
      this.handleInactivity(inactiveDuration);
    }
  }

  private handleActivity(): void {
    const wasInactive = !this.isActive;
    this.lastActivityTime = Date.now();
    this.isActive = true;

    if (wasInactive) {
      const event: InactivityEvent = {
        type: 'active',
        timestamp: this.lastActivityTime,
      };
      this.emit('activity', event);
      console.log('Usuario activo de nuevo');
    }
  }

  private async handleInactivity(duration?: number): Promise<void> {
    if (!this.isActive) {
      return; // Ya marcado como inactivo
    }

    this.isActive = false;
    const inactiveDuration = duration || Date.now() - this.lastActivityTime;

    const event: InactivityEvent = {
      type: 'inactive',
      timestamp: Date.now(),
      inactiveDuration,
    };

    this.emit('inactivity', event);
    console.log('Usuario inactivo');

    // Mostrar diálogo de confirmación
    await this.showInactivityDialog(inactiveDuration);
  }

  private async showInactivityDialog(inactiveDuration: number): Promise<void> {
    if (!this.mainWindow) {
      console.warn('No hay ventana principal para mostrar el diálogo');
      return;
    }

    const minutes = Math.floor(inactiveDuration / 1000 / 60);

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'warning',
      title: 'Inactividad Detectada',
      message: '¿Seguiste trabajando?',
      detail: `Se detectaron ${minutes} minutos de inactividad.\n\n¿Deseas mantener el timer corriendo o ajustar el tiempo?`,
      buttons: ['Sí, seguí trabajando', 'No, detener timer', 'Ajustar tiempo'],
      defaultId: 0,
      cancelId: 1,
    });

    const result = {
      action: response.response === 0 ? 'continue' : response.response === 1 ? 'stop' : 'adjust',
      inactiveDuration,
    };

    this.emit('inactivity-response', result);
    console.log('Respuesta de inactividad:', result.action);

    // Resetear actividad
    this.lastActivityTime = Date.now();
    this.isActive = true;
  }

  // Método para actualizar manualmente la última actividad
  updateActivity(): void {
    this.lastActivityTime = Date.now();
    this.isActive = true;
  }

  // Obtener tiempo de inactividad actual
  getInactiveDuration(): number {
    return Date.now() - this.lastActivityTime;
  }

  // Verificar si está inactivo
  isInactive(): boolean {
    return !this.isActive || this.getInactiveDuration() >= INACTIVITY_THRESHOLD;
  }
}

let detectorInstance: InactivityDetector | null = null;

export function getInactivityDetector(): InactivityDetector {
  if (!detectorInstance) {
    detectorInstance = new InactivityDetector();
  }
  return detectorInstance;
}

export function stopInactivityDetector(): void {
  if (detectorInstance) {
    detectorInstance.stop();
  }
}

export default InactivityDetector;
