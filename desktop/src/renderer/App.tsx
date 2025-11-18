import React, { useState, useEffect } from 'react';
import api, { Project, Task, TimeEntry, User } from './services/api';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email y password para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Timer update
  useEffect(() => {
    if (!activeTimer || !activeTimer.start_time) return;

    const interval = setInterval(() => {
      const start = new Date(activeTimer.start_time).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);

      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Verificar si hay sesión guardada al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsLoggedIn(true);
          await loadInitialData();
        } catch (err) {
          console.error('Error al cargar sesión:', err);
          api.clearToken();
        }
      }
    };

    checkAuth();
  }, []);

  // Cargar datos iniciales (proyectos y timer activo)
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Cargar proyectos
      const projectsData = await api.getProjects();
      setProjects(projectsData);

      // Verificar si hay un timer activo
      const activeEntry = await api.getActiveTimeEntry();
      if (activeEntry) {
        setActiveTimer(activeEntry);

        // Cargar la tarea del timer activo
        if (activeEntry.task) {
          setSelectedProject(activeEntry.task.project_id);
          setSelectedTask(activeEntry.task_id);

          // Cargar tareas del proyecto
          const tasksData = await api.getProjectTasks(activeEntry.task.project_id);
          setTasks(tasksData);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar datos iniciales:', err);
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.login(email, password);
      setUser(response.user);
      setIsLoggedIn(true);

      // Cargar datos iniciales
      await loadInitialData();
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setProjects([]);
      setTasks([]);
      setSelectedProject(null);
      setSelectedTask(null);
      setActiveTimer(null);
    }
  };

  // Cambiar proyecto
  const handleProjectChange = async (projectId: number) => {
    setSelectedProject(projectId);
    setSelectedTask(null);
    setLoading(true);
    setError(null);

    try {
      const tasksData = await api.getProjectTasks(projectId);
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Error al cargar tareas:', err);
      setError(err.response?.data?.error || 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar timer
  const handleStartTimer = async () => {
    if (!selectedTask) return;

    setLoading(true);
    setError(null);

    try {
      const entry = await api.startTimer(selectedTask, 'Iniciando trabajo');
      setActiveTimer(entry);
    } catch (err: any) {
      console.error('Error al iniciar timer:', err);
      setError(err.response?.data?.error || 'Error al iniciar timer');
    } finally {
      setLoading(false);
    }
  };

  // Detener timer
  const handleStopTimer = async () => {
    if (!activeTimer) return;

    setLoading(true);
    setError(null);

    try {
      await api.stopTimer(activeTimer.id, 'Trabajo completado');
      setActiveTimer(null);
      setElapsedTime('00:00:00');
      setSelectedTask(null);
    } catch (err: any) {
      console.error('Error al detener timer:', err);
      setError(err.response?.data?.error || 'Error al detener timer');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de login
  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>DeployTime</h1>
          <p>Time Tracker</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>
          <div className="login-hint">
            <small>Usuario de prueba: juan@deploytime.com / colaborador123</small>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla principal
  return (
    <div className="app">
      <div className="header">
        <h2>DeployTime</h2>
        <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
          ⚙️
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="content">
        {loading && !activeTimer && <div className="loading">Cargando...</div>}

        {activeTimer ? (
          <div className="timer-active">
            <div className="timer-display">{elapsedTime}</div>
            <p className="timer-task">
              {activeTimer.task?.name || tasks.find((t) => t.id === activeTimer.task_id)?.name || 'Tarea'}
            </p>
            <button className="btn-stop" onClick={handleStopTimer} disabled={loading}>
              {loading ? 'Deteniendo...' : 'Detener Timer'}
            </button>
          </div>
        ) : (
          <div className="timer-idle">
            <div className="select-group">
              <label>Proyecto:</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => handleProjectChange(Number(e.target.value))}
                disabled={loading}
              >
                <option value="">Selecciona un proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <div className="select-group">
                <label>Tarea:</label>
                <select
                  value={selectedTask || ''}
                  onChange={(e) => setSelectedTask(Number(e.target.value))}
                  disabled={loading}
                >
                  <option value="">Selecciona una tarea</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              className="btn-start"
              onClick={handleStartTimer}
              disabled={!selectedTask || loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Timer'}
            </button>
          </div>
        )}
      </div>

      <div className="footer">
        <small>v1.0.0 - {user?.name}</small>
      </div>
    </div>
  );
}

export default App;
