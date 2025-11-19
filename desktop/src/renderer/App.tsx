import React, { useState, useEffect } from 'react';
import api, { Project, Task, TimeEntry, User } from './services/api';
import './App.css';

const formatSecondsToTime = (totalSeconds: number): string => { // Declara una función auxiliar para formatear segundos a hh:mm:ss
  const seconds = totalSeconds % 60; // Calcula los segundos residuales
  const totalMinutes = Math.floor(totalSeconds / 60); // Convierte el total de segundos a minutos
  const minutes = totalMinutes % 60; // Calcula los minutos residuales
  const hours = Math.floor(totalMinutes / 60); // Calcula las horas completas

  const pad = (v: number) => v.toString().padStart(2, '0'); // Función interna para agregar cero a la izquierda

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`; // Devuelve el string con formato hh:mm:ss
}; // Fin de la función formatSecondsToTime

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
  const [accumulatedTime, setAccumulatedTime] = useState(0); // Tiempo total acumulado (todas las sesiones previas)

  // Email y password para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

    // Timer update - tiempo acumulado (todas las sesiones previas) + sesión actual
  useEffect(() => { // Declara un efecto que se ejecuta cuando cambia el timer activo o el tiempo acumulado
    if (!activeTimer || !activeTimer.start_time) return; // Si no hay timer activo o no tiene start_time, no hace nada

    const interval = setInterval(() => { // Crea un intervalo que se ejecuta cada segundo
      const start = new Date(activeTimer.start_time).getTime(); // Convierte la fecha de inicio del timer a milisegundos
      const now = Date.now(); // Obtiene la marca de tiempo actual en milisegundos
      const currentSession = Math.floor((now - start) / 1000); // Calcula los segundos de la sesión actual
      const total = accumulatedTime + currentSession; // Suma el tiempo acumulado previo + la sesión actual

      setElapsedTime(formatSecondsToTime(total)); // Actualiza el string mostrado del cronómetro usando el helper
    }, 1000); // Ejecuta el intervalo cada 1000 ms (1 segundo)

    return () => { // Función de limpieza del efecto
      clearInterval(interval); // Limpia el intervalo cuando cambia activeTimer/accumulatedTime o se desmonta el componente
    }; // Fin de la limpieza
  }, [activeTimer, accumulatedTime]); // El efecto depende del timer activo y del tiempo acumulado


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

  // Detener timer cuando la aplicación se cierra
  useEffect(() => {
    const handleAppClosing = async () => {
      console.log('App cerrándose, deteniendo timer si existe...');
      if (activeTimer) {
        try {
          await api.stopTimer(activeTimer.id, 'Detenido automáticamente al cerrar la aplicación');
          console.log('Timer detenido automáticamente');
        } catch (error) {
          console.error('Error al detener timer automáticamente:', error);
        }
      }
    };

    // Escuchar evento de cierre desde Electron
    if (window.electronAPI) {
      window.electronAPI.onMessage('app-closing', handleAppClosing);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeListener('app-closing', handleAppClosing);
      }
    };
  }, [activeTimer]);

  // Cargar datos iniciales (proyectos y timer activo)
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Cargar proyectos
      const projectsData = await api.getProjects();
      setProjects(projectsData);
      console.log('Proyectos cargados:', projectsData);

      // Verificar si hay un timer activo
      const activeEntry = await api.getActiveTimeEntry();
      console.log('Timer activo encontrado:', activeEntry);
      if (activeEntry) {
        setActiveTimer(activeEntry);
        console.log('Estado activeTimer actualizado:', activeEntry);

        // Cargar la tarea del timer activo
        if (activeEntry.task) {
          setSelectedProject(activeEntry.task.project_id);
          setSelectedTask(activeEntry.task_id);

          // Cargar tareas del proyecto
          const tasksData = await api.getProjectTasks(activeEntry.task.project_id);
          setTasks(tasksData);

          // Cargar el tiempo acumulado previo en esta tarea
          const accumulated = await api.getTaskTotalTime(activeEntry.task_id);
          console.log('Tiempo acumulado previo:', accumulated, 'segundos');
          setAccumulatedTime(accumulated);
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
      // Obtener el tiempo total acumulado en esta tarea antes de iniciar
      const accumulated = await api.getTaskTotalTime(selectedTask);
      console.log('Tiempo acumulado previo en la tarea:', accumulated, 'segundos');

      const entry = await api.startTimer(selectedTask, 'Iniciando trabajo');
      setActiveTimer(entry);

      // Inicializar con el tiempo acumulado previo
      setAccumulatedTime(accumulated);
    } catch (err: any) {
      console.error('Error completo:', err);
      console.error('Response data:', err.response?.data);
      console.error('Status:', err.response?.status);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error al iniciar timer';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

    // Pausar = detener la sesión actual, pero mantener tarea y tiempo en pantalla
  const handlePauseTimer = async () => { // Declara la función que maneja el botón de Pausa
    if (!activeTimer || !activeTimer.start_time) return; // Si no hay timer activo o no tiene hora de inicio, sale sin hacer nada

    setLoading(true); // Marca que se está procesando la pausa
    setError(null); // Limpia errores previos

    try { // Abre bloque try/catch para manejar errores
      const startMs = new Date(activeTimer.start_time).getTime(); // Convierte la hora de inicio a milisegundos
      const nowMs = Date.now(); // Obtiene la hora actual en milisegundos
      const currentSession = Math.floor((nowMs - startMs) / 1000); // Calcula los segundos trabajados en esta sesión
      const newTotal = accumulatedTime + currentSession; // Suma el acumulado previo más la sesión actual

      await api.stopTimer(activeTimer.id, 'Sesión pausada'); // Detiene la sesión actual en el backend con nota de pausa

      setAccumulatedTime(newTotal); // Actualiza el tiempo acumulado total en estado
      setElapsedTime(formatSecondsToTime(newTotal)); // Congela en pantalla el tiempo total en formato hh:mm:ss
      setActiveTimer(null); // Elimina el timer activo para detener el intervalo (useEffect ya no se ejecuta)
      // Importante: NO tocamos selectedProject ni selectedTask para poder reanudar luego en la misma tarea
    } catch (err: any) { // Captura cualquier error que ocurra al pausar
      console.error('Error al pausar timer:', err); // Loguea el error en consola
      setError(err.response?.data?.error || 'Error al pausar timer'); // Muestra mensaje de error al usuario
    } finally { // Este bloque se ejecuta siempre
      setLoading(false); // Quita el estado de carga
    } // Fin del finally
  }; // Fin de handlePauseTimer

  // Detener timer (STOP) = cerrar sesión y volver a seleccionar tarea/proyecto
  const handleStopTimer = async () => { // Declara la función que maneja el botón de Stop
    if (!activeTimer) { // Si no hay timer activo
      setElapsedTime('00:00:00'); // Resetea el string del cronómetro a cero
      setSelectedTask(null); // Limpia la tarea seleccionada
      setAccumulatedTime(0); // Pone el tiempo acumulado en cero
      return; // Sale de la función porque no hay nada que detener en backend
    }

    setLoading(true); // Marca que se está procesando la detención
    setError(null); // Limpia errores previos

    try { // Bloque try/catch para manejar la llamada a la API
      await api.stopTimer(activeTimer.id, 'Sesión finalizada'); // Llama a la API para detener definitivamente la sesión de tiempo

      setActiveTimer(null); // Elimina el timer activo, deteniendo el intervalo
      setElapsedTime('00:00:00'); // Resetea el cronómetro visual a cero
      setSelectedTask(null); // Limpia la tarea seleccionada para obligar a elegir una nueva
      setAccumulatedTime(0); // Resetea el acumulado porque conceptualment earrancamos una tarea nueva la próxima vez
      // Si también querés volver a seleccionar proyecto, acá podrías hacer:
      // setSelectedProject(null); // Dejar comentado hasta que lo decidas
    } catch (err: any) { // Captura errores de la API
      console.error('Error al detener timer:', err); // Loguea el error en consola
      setError(err.response?.data?.error || 'Error al detener timer'); // Muestra mensaje de error en la UI
    } finally { // Bloque que siempre se ejecuta
      setLoading(false); // Quita el estado de carga
    } // Fin del finally
  }; // Fin de handleStopTimer



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
            <div className="timer-info">
              <div className="project-name">
                {(() => {
                  const task = activeTimer.task || tasks.find((t) => t.id === activeTimer.task_id);
                  const project = task ? projects.find(p => p.id === task.project_id) : null;
                  return project?.name || 'Proyecto';
                })()}
              </div>
              <div className="task-name">
                {activeTimer.task?.name ||
                 tasks.find((t) => t.id === activeTimer.task_id)?.name ||
                 'Tarea'}
              </div>
            </div>

            <div className="timer-display">{elapsedTime}</div>

            <div className="task-info">
              <p className="timer-start-time">
                Creada: {(() => {
                  const task = activeTimer.task || tasks.find((t) => t.id === activeTimer.task_id);
                  if (task?.created_at) {
                    const date = new Date(task.created_at);
                    return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES')}`;
                  }
                  return 'N/A';
                })()}
              </p>
            </div>

            <div className="timer-controls">
              <button
                className="btn-pause"
                onClick={handlePauseTimer}
                disabled={loading}
              >
                ⏸️ Pausar
              </button>
              <button className="btn-stop" onClick={handleStopTimer} disabled={loading}>
                {loading ? 'Deteniendo...' : '⏹️ Stop'}
              </button>
            </div>
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
