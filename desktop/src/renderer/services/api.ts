import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'collaborator';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: User;
  collaborators?: User[];
}

export interface Task {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  estimated_hours?: number;
  status: 'pending' | 'in_progress' | 'completed';
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  task?: Task;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
}

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.dispatchEvent(new Event('unauthorized'));
        }
        return Promise.reject(error);
      }
    );

    this.loadToken();
  }

  private loadToken(): void {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  private saveToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  public getToken(): string | null {
    return this.token;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    this.saveToken(response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/refresh');
    this.saveToken(response.data.access_token);
    return response.data;
  }

  async getProjects(): Promise<Project[]> {
    const response = await this.client.get<Project[]>('/projects');
    return response.data;
  }

  async getProject(id: number): Promise<Project> {
    const response = await this.client.get<Project>(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: { name: string; description?: string }): Promise<Project> {
    const response = await this.client.post<Project>('/projects', data);
    return response.data;
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    const response = await this.client.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
  }

  async getTask(id: number): Promise<Task> {
    const response = await this.client.get<Task>(`/tasks/${id}`);
    return response.data;
  }

  async createTask(data: {
    project_id: number;
    name: string;
    description?: string;
    estimated_hours?: number;
    status?: 'pending' | 'in_progress' | 'completed';
  }): Promise<Task> {
    const response = await this.client.post<Task>('/tasks', data);
    return response.data;
  }

  async startTimer(taskId: number, notes?: string): Promise<TimeEntry> {
    const response = await this.client.post<TimeEntry>('/time-entries', {
      task_id: taskId,
      notes,
    });
    return response.data;
  }

  async stopTimer(id: number, notes?: string): Promise<TimeEntry> {
    const response = await this.client.put<TimeEntry>(`/time-entries/${id}/stop`, {
      notes,
    });
    return response.data;
  }

  async getActiveTimeEntry(): Promise<TimeEntry | null> {
    try {
      const response = await this.client.get<TimeEntry>(
        '/my/active-time-entry'
      );
      // Si el backend retorna un objeto vacío o null, retornar null
      if (!response.data || !response.data.id) {
        return null;
      }
      return response.data;
    } catch (error) {
      console.error('Error al obtener timer activo:', error);
      return null;
    }
  }

  async getMyTimeEntries(params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<TimeEntry[]> {
    const response = await this.client.get<TimeEntry[]>('/my/time-entries', {
      params,
    });
    return response.data;
  }

  // Obtener tiempo total acumulado en una tarea
  async getTaskTotalTime(taskId: number): Promise<number> {
    try {
      const entries = await this.getMyTimeEntries();
      const taskEntries = entries.filter(
        (entry) => entry.task_id === taskId && entry.end_time !== null
      );

      let totalSeconds = 0;
      taskEntries.forEach((entry) => {
        if (entry.start_time && entry.end_time) {
          const start = new Date(entry.start_time).getTime();
          const end = new Date(entry.end_time).getTime();
          totalSeconds += Math.floor((end - start) / 1000);
        }
      });

      return totalSeconds;
    } catch (error) {
      console.error('Error al obtener tiempo total de la tarea:', error);
      return 0;
    }
  }
}

export const api = new ApiService();
export default api;
