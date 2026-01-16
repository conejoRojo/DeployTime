import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

interface Project {
  id: number;
  name: string;
  description: string;
  created_by: number;
  synced: number;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  estimated_hours?: number;
  status: string;
  created_by: number;
  synced: number;
  created_at: string;
  updated_at: string;
}

interface TimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  notes?: string;
  synced: number;
  created_at: string;
  updated_at: string;
}

interface SyncQueue {
  id?: number;
  entity_type: string;
  entity_id: number;
  action: string;
  data: string;
  created_at: string;
}

class LocalDatabase {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'deploytime.db');

    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables(): void {
    // Tabla de proyectos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by INTEGER,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // Tabla de tareas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        estimated_hours REAL,
        status TEXT DEFAULT 'pending',
        created_by INTEGER,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    // Tabla de registros de tiempo
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      )
    `);

    // Cola de sincronización
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Configuración local
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    console.log('Base de datos SQLite inicializada');
  }

  // Proyectos
  saveProjects(projects: Project[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO projects
      (id, name, description, created_by, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `);

    const insertMany = this.db.transaction((projects: Project[]) => {
      for (const project of projects) {
        stmt.run(
          project.id,
          project.name,
          project.description,
          project.created_by,
          project.created_at,
          project.updated_at
        );
      }
    });

    insertMany(projects);
  }

  getProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY name');
    return stmt.all() as Project[];
  }

  getProject(id: number): Project | undefined {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as Project | undefined;
  }

  // Tareas
  saveTasks(tasks: Task[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tasks
      (id, project_id, name, description, estimated_hours, status, created_by, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const insertMany = this.db.transaction((tasks: Task[]) => {
      for (const task of tasks) {
        stmt.run(
          task.id,
          task.project_id,
          task.name,
          task.description,
          task.estimated_hours,
          task.status,
          task.created_by,
          task.created_at,
          task.updated_at
        );
      }
    });

    insertMany(tasks);
  }

  getProjectTasks(projectId: number): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY name');
    return stmt.all(projectId) as Task[];
  }

  getTask(id: number): Task | undefined {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    return stmt.get(id) as Task | undefined;
  }

  // Time Entries
  saveTimeEntry(entry: TimeEntry): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO time_entries
      (id, task_id, user_id, start_time, end_time, notes, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.id,
      entry.task_id,
      entry.user_id,
      entry.start_time,
      entry.end_time || null,
      entry.notes || null,
      entry.synced,
      entry.created_at,
      entry.updated_at
    );
  }

  getActiveTimeEntry(userId: number): TimeEntry | undefined {
    const stmt = this.db.prepare(
      'SELECT * FROM time_entries WHERE user_id = ? AND end_time IS NULL LIMIT 1'
    );
    return stmt.get(userId) as TimeEntry | undefined;
  }

  getMyTimeEntries(userId: number, fromDate?: string, toDate?: string): TimeEntry[] {
    let query = 'SELECT * FROM time_entries WHERE user_id = ?';
    const params: any[] = [userId];

    if (fromDate) {
      query += ' AND start_time >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      query += ' AND start_time <= ?';
      params.push(toDate);
    }

    query += ' ORDER BY start_time DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as TimeEntry[];
  }

  // Cola de sincronización
  addToSyncQueue(item: SyncQueue): void {
    const stmt = this.db.prepare(`
      INSERT INTO sync_queue (entity_type, entity_id, action, data)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(item.entity_type, item.entity_id, item.action, item.data);
  }

  getSyncQueue(): SyncQueue[] {
    const stmt = this.db.prepare('SELECT * FROM sync_queue ORDER BY id ASC');
    return stmt.all() as SyncQueue[];
  }

  clearSyncQueue(id: number): void {
    const stmt = this.db.prepare('DELETE FROM sync_queue WHERE id = ?');
    stmt.run(id);
  }

  // Configuración
  setConfig(key: string, value: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    stmt.run(key, value);
  }

  getConfig(key: string): string | undefined {
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value;
  }

  // Limpiar base de datos (para testing)
  clearAll(): void {
    this.db.exec('DELETE FROM projects');
    this.db.exec('DELETE FROM tasks');
    this.db.exec('DELETE FROM time_entries');
    this.db.exec('DELETE FROM sync_queue');
  }

  close(): void {
    this.db.close();
  }
}

let dbInstance: LocalDatabase | null = null;

export function getDatabase(): LocalDatabase {
  if (!dbInstance) {
    dbInstance = new LocalDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export default LocalDatabase;
