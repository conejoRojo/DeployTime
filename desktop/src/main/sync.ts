import { getDatabase } from './database';
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

interface SyncResult {
  success: boolean;
  projectsSynced: number;
  tasksSynced: number;
  timeEntriesSynced: number;
  errors: string[];
}

class SyncService {
  private client: AxiosInstance;
  private token: string | null = null;
  private db = getDatabase();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  setToken(token: string): void {
    this.token = token;
  }

  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      projectsSynced: 0,
      tasksSynced: 0,
      timeEntriesSynced: 0,
      errors: [],
    };

    try {
      // 1. Sincronizar proyectos desde el servidor
      const projects = await this.syncProjects();
      result.projectsSynced = projects;

      // 2. Sincronizar tareas desde el servidor
      const tasks = await this.syncTasks();
      result.tasksSynced = tasks;

      // 3. Verificar timer activo
      await this.syncActiveTimer();

      // 4. Procesar cola de sincronización pendiente
      await this.processSyncQueue();

      console.log('Sincronización completada:', result);
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message || 'Error desconocido');
      console.error('Error en sincronización:', error);
    }

    return result;
  }

  private async syncProjects(): Promise<number> {
    try {
      const response = await this.client.get('/projects');
      const projects = response.data;

      // Guardar en base de datos local
      this.db.saveProjects(projects);

      console.log(`Proyectos sincronizados: ${projects.length}`);
      return projects.length;
    } catch (error) {
      console.error('Error al sincronizar proyectos:', error);
      return 0;
    }
  }

  private async syncTasks(): Promise<number> {
    try {
      const projects = this.db.getProjects();
      let totalTasks = 0;

      for (const project of projects) {
        const response = await this.client.get(`/projects/${project.id}/tasks`);
        const tasks = response.data;

        this.db.saveTasks(tasks);
        totalTasks += tasks.length;
      }

      console.log(`Tareas sincronizadas: ${totalTasks}`);
      return totalTasks;
    } catch (error) {
      console.error('Error al sincronizar tareas:', error);
      return 0;
    }
  }

  private async syncActiveTimer(): Promise<void> {
    try {
      const response = await this.client.get('/my/active-time-entry');
      const activeEntry = response.data.active_entry;

      if (activeEntry) {
        this.db.saveTimeEntry({
          ...activeEntry,
          synced: 1,
        });
        console.log('Timer activo sincronizado');
      }
    } catch (error) {
      console.error('Error al sincronizar timer activo:', error);
    }
  }

  private async processSyncQueue(): Promise<void> {
    const queue = this.db.getSyncQueue();

    for (const item of queue) {
      try {
        await this.syncQueueItem(item);
        this.db.clearSyncQueue(item.id!);
      } catch (error) {
        console.error(`Error al sincronizar item ${item.id}:`, error);
        // Mantener en la cola para reintentar después
      }
    }
  }

  private async syncQueueItem(item: any): Promise<void> {
    const data = JSON.parse(item.data);

    switch (item.entity_type) {
      case 'time_entry':
        if (item.action === 'start') {
          await this.client.post('/time-entries', data);
        } else if (item.action === 'stop') {
          await this.client.put(`/time-entries/${item.entity_id}/stop`, data);
        }
        break;

      case 'task':
        if (item.action === 'create') {
          await this.client.post('/tasks', data);
        } else if (item.action === 'update') {
          await this.client.put(`/tasks/${item.entity_id}`, data);
        }
        break;

      default:
        console.warn(`Tipo de entidad desconocido: ${item.entity_type}`);
    }
  }

  // Sincronización al iniciar timer (prioritaria)
  async syncTimerStart(taskId: number, notes?: string): Promise<any> {
    try {
      const response = await this.client.post('/time-entries', {
        task_id: taskId,
        notes,
      });

      const entry = response.data;
      this.db.saveTimeEntry({ ...entry, synced: 1 });

      return entry;
    } catch (error) {
      // Si falla, guardar en cola de sincronización
      this.db.addToSyncQueue({
        entity_type: 'time_entry',
        entity_id: 0, // Se asignará después
        action: 'start',
        data: JSON.stringify({ task_id: taskId, notes }),
        created_at: new Date().toISOString(),
      });

      throw error;
    }
  }

  // Sincronización al detener timer (prioritaria)
  async syncTimerStop(entryId: number, notes?: string): Promise<any> {
    try {
      const response = await this.client.put(`/time-entries/${entryId}/stop`, {
        notes,
      });

      const entry = response.data;
      this.db.saveTimeEntry({ ...entry, synced: 1 });

      return entry;
    } catch (error) {
      // Si falla, guardar en cola de sincronización
      this.db.addToSyncQueue({
        entity_type: 'time_entry',
        entity_id: entryId,
        action: 'stop',
        data: JSON.stringify({ notes }),
        created_at: new Date().toISOString(),
      });

      throw error;
    }
  }
}

let syncInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncInstance) {
    syncInstance = new SyncService();
  }
  return syncInstance;
}

export default SyncService;
