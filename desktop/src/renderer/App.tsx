import React, { useState, useEffect } from 'react';
import api, { Project, Task, TimeEntry, User } from './services/api';
import './App.css';

const SYNC_INTERVAL_MS = 600_000; // define el intervalo de sincronización en milisegundos (600.000 ms = 10 minutos)

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
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState<number | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0); // Tiempo total acumulado (todas las sesiones previas)
  // Configuración
  const [showSettings, setShowSettings] = useState(false);
  // Aviso configurable del Timer (minutos)
  const [warningMinutes, setWarningMinutes] = useState<number>(() => Number(localStorage.getItem('warning_minutes') || '120'));
  const [lastWarnedCycle, setLastWarnedCycle] = useState(0); // Ciclo de aviso actual (1 para 120m, 2 para 240m, etc)
  const [warning, setWarning] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Email y password para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(() => api.getBaseUrl());
  const [showUrlModal, setShowUrlModal] = useState(() => !localStorage.getItem('api_url'));
  const isPaused = !activeTimer && selectedTask !== null && accumulatedTime > 0;

  const handleUrlUpdate = () => {
    if (!apiUrl.trim()) return;
    api.updateBaseUrl(apiUrl);
    setShowUrlModal(false);
    // Forzar recarga si ya estábamos logueados (opcional)
    if (isLoggedIn) {
      loadInitialData();
    }
  };

  const currentTask = (activeTimer?.task as Task | undefined) || tasks.find((t) => t.id === (activeTimer?.task_id || selectedTask));

  const syncFromServer = async (): Promise<void> => {              // declara una función asíncrona para sincronizar datos desde el servidor
    if (!isLoggedIn) {                                            // si el usuario no está logueado
      return;                                                     // sale sin hacer nada
    }

    try {                                                         // inicia bloque try para manejar errores
      setLoading(true);                                           // marca la UI como "cargando" para evitar acciones mientras sincroniza
      setError(null);                                             // limpia cualquier error anterior

      const remoteProjects = await api.getProjects();             // llama a la API para obtener la lista de proyectos remotos

      setProjects(remoteProjects);                                // actualiza el estado local de proyectos con los que vienen del servidor

      // Mantener el proyecto seleccionado si todavía existe       //
      if (selectedProject) {                                      // verifica si hay un proyecto seleccionado actualmente
        const stillExists = remoteProjects.some(                  // busca si el proyecto seleccionado sigue existiendo en la lista remota
          (p) => p.id === selectedProject                         // compara el id del proyecto de la lista con el id seleccionado
        );                                                        //
        if (!stillExists) {                                       // si el proyecto seleccionado ya no existe
          setSelectedProject(null);                               // limpia la selección de proyecto
          setTasks([]);                                           // limpia también las tareas mostradas
        }                                                         //
      }

      // Si no hay proyecto seleccionado pero la lista no está vacía, selecciona el primero
      if (!selectedProject && remoteProjects.length > 0) {        // si no hay proyecto seleccionado y hay al menos un proyecto remoto
        const firstProjectId = remoteProjects[0].id;              // toma el id del primer proyecto de la lista
        setSelectedProject(firstProjectId);                       // lo marca como proyecto seleccionado
        const remoteTasks = await api.getProjectTasks(            // obtiene las tareas del primer proyecto desde la API
          firstProjectId                                         // pasa el id del proyecto al método de la API
        );                                                        //
        setTasks(remoteTasks);                                    // actualiza el estado local de tareas con las que vienen del servidor
      }

      // Si hay proyecto seleccionado y sigue existiendo, refrescamos tareas también
      if (selectedProject) {                                      // si hay un proyecto seleccionado (y llegó hasta acá, por lo que sigue existiendo)
        const remoteTasks = await api.getProjectTasks(            // llama a la API para obtener las tareas del proyecto seleccionado
          selectedProject                                        // pasa el id del proyecto seleccionado
        );                                                        //
        setTasks(remoteTasks);                                    // actualiza el estado local de tareas
      }

      // Opcional: acá podrías refrescar un timeEntry activo si tu API lo soporta
      // const active = await api.getActiveTimeEntry();           // ejemplo de llamada opcional
      // setActiveTimer(active ?? null);                          // actualiza el timer activo con lo que diga el servidor

    } catch (err: any) {                                          // captura cualquier error que ocurra en el try
      console.error('Error al sincronizar con el servidor', err); // muestra el error en consola para diagnóstico
      setError('No se pudo sincronizar con el servidor.');        // guarda un mensaje de error para mostrar en la UI
    } finally {                                                   // bloque que se ejecuta siempre, haya error o no
      setLoading(false);                                          // desmarca la UI como "cargando"
    }
  };

  useEffect(() => {                                              // declara un efecto que se ejecuta cuando cambia isLoggedIn
    if (!isLoggedIn) {                                           // si el usuario NO está logueado
      return;                                                    // no programa la sincronización
    }

    let cancelled = false;                                       // bandera para evitar ejecutar lógica cuando el componente se desmonta

    const runInitialSync = async () => {                         // define una función interna para ejecutar una primera sync inmediata
      try {                                                      // bloque try para manejar errores
        await syncFromServer();                                  // llama a la función de sincronización definida arriba
      } catch (err) {                                            // captura cualquier error
        console.error('Error en sync inicial', err);             // escribe en consola el error
      }
    };

    runInitialSync();                                            // ejecuta la sincronización inicial apenas el usuario se loguea

    const intervalId = window.setInterval(() => {                // crea un intervalo periódico usando setInterval del navegador
      if (cancelled) {                                           // si el efecto ya se canceló
        return;                                                  // sale sin hacer nada
      }
      syncFromServer().catch((err) => {                          // llama a la función de sincronización y maneja errores
        console.error('Error en sync periódica', err);           // escribe en consola el error de la sync periódica
      });
    }, SYNC_INTERVAL_MS);                                        // fija el intervalo en la constante SYNC_INTERVAL_MS (10 minutos)

    return () => {                                               // función de limpieza del efecto
      cancelled = true;                                          // marca la bandera como cancelada
      window.clearInterval(intervalId);                          // limpia el intervalo para evitar fugas de recursos
    };
  }, [isLoggedIn]);                                              // ejecuta este efecto sólo cuando cambia isLoggedIn (login / logout)


  // Timer update - tiempo acumulado (todas las sesiones previas) + sesión actual
  useEffect(() => { // Declara un efecto que se ejecuta cuando cambia el timer activo o el tiempo acumulado
    if (!activeTimer || !activeTimer.start_time) return;

    const interval = setInterval(() => {
      const start = new Date(activeTimer.start_time).getTime();
      const now = Date.now();
      const currentSession = Math.floor((now - start) / 1000);
      const total = accumulatedTime + currentSession;

      setElapsedTime(formatSecondsToTime(total));

      // Chequeo de tiempo límite (Warning)
      const currentCycle = Math.floor(total / (warningMinutes * 60));
      if (currentCycle > lastWarnedCycle && currentCycle > 0) {
        setLastWarnedCycle(currentCycle);
        setShowWarningModal(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [activeTimer, accumulatedTime, warningMinutes, lastWarnedCycle]); // El efecto depende de estos valores

  // Resetear warning cuando cambia el activeTimer (nueva sesión)
  useEffect(() => {
    if (activeTimer) {
      setLastWarnedCycle(Math.floor(accumulatedTime / (warningMinutes * 60)));
      setShowWarningModal(false);
    }
  }, [activeTimer?.id, warningMinutes]);

  // Chequeo de tiempo límite (removido de useEffect porque ahora está en el intervalo)


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
          // Cargar el tiempo acumulado previo en esta tarea
          if (activeEntry.task_total_seconds !== undefined) {
            const startMs = new Date(activeEntry.start_time).getTime();
            const nowMs = Date.now();
            const currentSessionSec = Math.floor((nowMs - startMs) / 1000);
            // Sincronizar: Ajustar accumulatedTime para que (acc + current) coincida con el total del servidor
            const adjustedAccumulated = activeEntry.task_total_seconds - currentSessionSec;
            setAccumulatedTime(adjustedAccumulated);
            console.log('Sincronizando con servidor. Total Server:', activeEntry.task_total_seconds, 'Ajuste:', adjustedAccumulated);
          } else {
            const accumulated = await api.getTaskTotalTime(activeEntry.task_id);
            console.log('Tiempo acumulado previo:', accumulated, 'segundos');
            setAccumulatedTime(accumulated);
          }
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

  const handleCreateProject = async () => { // Maneja la creación de un proyecto nuevo
    if (!newProjectName.trim()) { // Si el nombre está vacío
      alert('El nombre del proyecto es obligatorio'); // Muestra alerta al usuario
      return; // Sale de la función sin intentar crear el proyecto
    }

    setLoading(true); // Activa el estado de carga
    setError(null); // Limpia errores previos

    try { // Bloque try/catch para manejar errores
      const project = await api.createProject({
        name: newProjectName, // Usa el nombre ingresado
        description: newProjectDescription || '' // Usa la descripción o cadena vacía
      }); // Llama a la API para crear el proyecto

      setProjects([...projects, project]); // Agrega el nuevo proyecto a la lista de proyectos en estado
      setNewProjectName(''); // Limpia el nombre ingresado
      setNewProjectDescription(''); // Limpia la descripción ingresada
      setSelectedProject(project.id); // Selecciona automáticamente el proyecto recién creado
      await handleProjectChange(project.id); // Carga las tareas del nuevo proyecto
    } catch (err: any) { // Captura errores de la API
      console.error('Error al crear proyecto:', err); // Loguea el error en consola
      setError(err.response?.data?.error || 'Error al crear proyecto'); // Muestra mensaje descriptivo en la UI
    } finally { // Bloque que siempre se ejecuta
      setLoading(false); // Quita el estado de carga
    } // Fin del finally
  }; // Fin de handleCreateProject

  const handleCreateTask = async () => { // Maneja la creación de una tarea dentro de un proyecto
    if (!selectedProject) { // Si no hay proyecto seleccionado
      alert('Seleccioná un proyecto primero'); // Muestra alerta al usuario
      return; // Sale de la función
    }
    if (!newTaskName.trim()) { // Si el nombre de la tarea está vacío
      alert('El nombre de la tarea es obligatorio'); // Alerta informativa
      return; // Sale de la función
    }

    setLoading(true); // Activa estado de carga
    setError(null); // Limpia errores previos

    try { // Bloque try/catch para manejar errores de API
      const task = await api.createTask({
        project_id: selectedProject, // Asigna la tarea al proyecto seleccionado
        name: newTaskName, // Usa el nombre ingresado
        description: newTaskDescription || '', // Usa la descripción o cadena vacía
        estimated_hours: newTaskEstimatedHours // Asigna horas estimadas si existen
      }); // Llama a la API para crear la tarea

      setTasks([...tasks, task]); // Agrega la nueva tarea al estado
      setNewTaskName(''); // Limpia el campo nombre
      setNewTaskDescription(''); // Limpia el campo descripción
      setNewTaskEstimatedHours(undefined); // Limpia las horas estimadas
    } catch (err: any) { // Captura errores de la API
      console.error('Error al crear tarea:', err); // Loguea el error
      setError(err.response?.data?.error || 'Error al crear tarea'); // Muestra mensaje descriptivo al usuario
    } finally { // Bloque que siempre se ejecuta
      setLoading(false); // Quita estado de carga
    } // Fin del finally
  }; // Fin de handleCreateTask

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
      setLastWarnedCycle(Math.floor(accumulatedTime / (warningMinutes * 60)));

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
      const msg = err.response?.data?.error || err.message || 'Error al pausar timer';
      setError(msg); // Muestra mensaje de error al usuario
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
      const msg = err.response?.data?.error || err.message || 'Error al detener timer';
      setError(msg); // Muestra mensaje de error en la UI
    } finally { // Bloque que siempre se ejecuta
      setLoading(false); // Quita el estado de carga
    } // Fin del finally
  }; // Fin de handleStopTimer
  
  // Terminar Tarea (Completar)
  const handleCompleteTask = async () => {
    const targetTaskId = activeTimer?.task_id || selectedTask;
    if (!targetTaskId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Si hay timer activo, detenerlo
      if (activeTimer) {
        await api.stopTimer(activeTimer.id, 'Tarea completada');
        setActiveTimer(null);
      }

      // 2. Marcar tarea como completada en backend
      await api.completeTask(targetTaskId);

      // 3. Limpiar estado visual
      setElapsedTime('00:00:00');
      setAccumulatedTime(0);
      setSelectedTask(null);
      
      // Actualizar la lista de tareas localmente para reflejar el cambio (opcional, o forzar recarga)
      setTasks(tasks.map(t => t.id === targetTaskId ? { ...t, status: 'completed' } : t));

    } catch (err: any) {
      console.error('Error al completar tarea:', err);
      const msg = err.response?.data?.error || err.message || 'Error al completar tarea';
      setError(msg);
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
            <input className="form-field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <input className="form-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="submit"                                           // el botón dispara el submit del formulario
              className="btn-start"                                   // la clase que ya usás para estilo
              disabled={loading || !email || !password}               // se deshabilita si está cargando o faltan datos
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
          {/* <div className="login-hint">
            <small>Usuario de prueba: juan@deploytime.com / colaborador123</small>
          </div> */}
        </div>

        {/* Modal de URL Inicial */}
        {showUrlModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>🌐 Configurar Servidor</h3>
              <p>Ingresa la URL del servidor para comenzar.</p>
              <input
                className="form-field"
                type="text"
                placeholder="https://api.tu-servidor.com"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                style={{ marginBottom: '20px', textAlign: 'center' }}
              />
              <div className="modal-actions">
                <button className="modal-btn pause" onClick={handleUrlUpdate}>
                  Guardar y Continuar
                </button>
                <button className="modal-btn continue" onClick={() => {
                  const local = 'http://localhost:8000/api';
                  setApiUrl(local);
                  api.updateBaseUrl(local);
                  setShowUrlModal(false);
                }}>
                  Usar Localhost
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (showSettings) {
    return (
      <div className="app">
        <div className="header">
          <h2>Configuración</h2>
          <button className="btn-logout" onClick={() => setShowSettings(false)}>
            🔙
          </button>
        </div>

        <div className="content settings-view">

          {/* Crear Proyecto (solo admin) */}
          {user?.role === 'admin' && (
            <div className="create-box">
              <h4>Crear nuevo proyecto</h4>

              <input className="form-field"
                type="text"
                placeholder="Nombre del proyecto"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                disabled={loading}
              />

              <textarea className="form-field"
                placeholder="Descripción (opcional)"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                disabled={loading}
              />

              <button
                className="btn-start"
                onClick={handleCreateProject}
                disabled={loading || !newProjectName.trim()}
              >
                Crear Proyecto
              </button>
            </div>
          )}

          {/* Aviso del Timer (para todos) */}
          <div className="create-box">
            <h4>Aviso del Timer (minutos)</h4>

            <input className="form-field"
              type="number"
              min={1}
              value={warningMinutes}
              onChange={(e) => setWarningMinutes(Number(e.target.value))}
              disabled={loading}
            />

            <div className="btn-row">
              <button
                className="btn-start"
                onClick={() => {
                  localStorage.setItem('warning_minutes', String(warningMinutes));
                  setLastWarnedCycle(0);
                  setWarning(null);
                }}
                disabled={loading}
              >
                Guardar aviso
              </button>

              <button
                className="btn-start"
                onClick={() => {
                  setWarningMinutes(120);
                  localStorage.setItem('warning_minutes', '120');
                  setLastWarnedCycle(0);
                  setWarning(null);
                }}
                disabled={loading}
              >
                Restablecer
              </button>
            </div>

            <small>Al superar este tiempo, la app te preguntará qué hacer.</small>
          </div>

          {/* Configuración de Servidor URL */}
          <div className="create-box">
            <h4>Servidor API (URL)</h4>
            <input className="form-field"
              type="text"
              placeholder="http://tu-servidor.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled={loading}
            />
            <button
              className="btn-start"
              onClick={handleUrlUpdate}
              disabled={loading || !apiUrl.trim()}
            >
              Actualizar URL
            </button>
            <small>URL actual: {api.getBaseUrl()}</small>
          </div>

          {/* Crear Tarea */}
          <div className="create-box">
            <h4>Crear nueva tarea</h4>

            <select className="form-field"
              value={selectedProject || ''}
              onChange={(e) => handleProjectChange(Number(e.target.value))}
              disabled={loading}
            >
              <option value="">Selecciona un proyecto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input className="form-field"
              type="text"
              placeholder="Nombre de la tarea"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              disabled={loading}
            />

            <textarea className="form-field"
              placeholder="Descripción"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              disabled={loading}
            />

            <input className="form-field"
              type="number"
              placeholder="Horas estimadas"
              value={newTaskEstimatedHours ?? ''}
              onChange={(e) =>
                setNewTaskEstimatedHours(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              disabled={loading}
            />

            <button
              className="btn-start"
              onClick={handleCreateTask}
              disabled={loading || !newTaskName.trim() || !selectedProject}
            >
              Crear Tarea
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Pantalla principal
  return (
    <div className="app">
      <div className="header">
        <button
          className="btn-logout header-icon"
          onClick={() => setShowSettings(true)}
          title="Configuración"
        >
          ⚙️
        </button>
        <h2>DeployTime</h2>
        <div className="header-actions">
          <button
            className="btn-logout header-icon"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            👤
          </button>

        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {warning && <div className="warning-banner">{warning}</div>}
      <div className="content">
        {loading && !activeTimer && <div className="loading">Cargando...</div>}

        {activeTimer || isPaused ? (
          <div className="timer-active">
            <div className="timer-info">
              <div className="project-name">
                {(() => {
                  const task =
                    activeTimer?.task || tasks.find((t) => t.id === (activeTimer?.task_id || selectedTask));
                  const project = task ? projects.find((p) => p.id === task.project_id) : null;
                  return project?.name || 'Proyecto';
                })()}
              </div>

              <div className="task-name">
                {activeTimer?.task?.name ||
                  tasks.find((t) => t.id === (activeTimer?.task_id || selectedTask))?.name ||
                  'Tarea'}
              </div>
            </div>

            <div className="timer-display">{elapsedTime}</div>

            <div className="task-info">
              <p className="timer-start-time">
                Creada:{' '}
                {currentTask?.created_at
                  ? (() => {
                    const date = new Date(currentTask.created_at);
                    return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES')}`;
                  })()
                  : 'N/A'}
              </p>

              {currentTask?.estimated_hours != null && (
                <p className="timer-start-time">
                  Tiempo estimado: {currentTask.estimated_hours} h
                </p>
              )}
            </div>


            <div className="timer-controls">

              {/* SI ESTÁ PAUSADO → MOSTRAR BOTÓN PLAY */}
              {isPaused && (
                <button 
                  className="btn-pause" 
                  onClick={handleStartTimer} 
                  disabled={loading || !(user?.role === 'admin' || tasks.find(t => t.id === selectedTask)?.assigned_users?.some(u => u.id === user?.id) || tasks.find(t => t.id === selectedTask)?.created_by === user?.id)}
                  title={(user?.role === 'admin' || tasks.find(t => t.id === selectedTask)?.assigned_users?.some(u => u.id === user?.id) || tasks.find(t => t.id === selectedTask)?.created_by === user?.id) ? 'Reanudar' : 'Solo asignado/creador/admin'}
                >
                  Play
                </button>
              )}

              {/* SI ESTÁ ACTIVO → MOSTRAR BOTÓN PAUSAR */}
              {activeTimer && (
                <button className="btn-pause" onClick={handlePauseTimer} disabled={loading}>
                  Pausar
                </button>
              )}

              <button className="btn-stop" onClick={handleStopTimer} disabled={loading} style={{ marginRight: '5px' }}>
                Detener
              </button>

              <button 
                className="btn-stop" 
                onClick={handleCompleteTask} 
                disabled={loading}
                style={{ backgroundColor: '#28a745' }} // Verde para Terminar
              >
                Terminar
              </button>
            </div>
          </div>
        ) : (
          // --- NO HAY TIMER ACTIVO, NI PAUSADO → MUESTRA FORM NORMAL ---
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
                    <option key={task.id} value={task.id} disabled={task.status === 'completed'}>
                      {task.name} {task.status === 'completed' ? '(Completada)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}


            <button 
              className="btn-start" 
              onClick={handleStartTimer} 
              disabled={!selectedTask || loading || !(user?.role === 'admin' || tasks.find(t => t.id === selectedTask)?.assigned_users?.some(u => u.id === user?.id) || tasks.find(t => t.id === selectedTask)?.created_by === user?.id)}
              title={(!selectedTask) ? 'Selecciona una tarea' : (user?.role === 'admin' || tasks.find(t => t.id === selectedTask)?.assigned_users?.some(u => u.id === user?.id) || tasks.find(t => t.id === selectedTask)?.created_by === user?.id) ? 'Iniciar Timer' : 'Solo el usuario asignado o creador puede iniciar esta tarea'}
            >
              {loading ? 'Iniciando...' : 'Iniciar Timer'}
            </button>
          </div>
        )}

      </div>

      <div className="footer">
        <small>v1.0.0 by Dixer.net - {user?.name} ({user?.role === 'admin' ? 'Admin' : 'Colaborador'})</small>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Tiempo límite alcanzado</h3>
            <p>Has superado los {warningMinutes} minutos en esta tarea.</p>

            <div className="modal-actions">
              <button className="modal-btn pause" onClick={() => {
                handlePauseTimer();
                setShowWarningModal(false);
              }}>
                Pausar
              </button>

              <button className="modal-btn stop" onClick={() => {
                handleStopTimer();
                setShowWarningModal(false);
              }}>
                Stop
              </button>

              <button className="modal-btn new-task" onClick={() => {
                // Stop current and let user choose new
                handleStopTimer();
                setShowWarningModal(false);
              }}>
                ➕ Iniciar nueva tarea
              </button>

              <button className="modal-btn continue" onClick={() => {
                setShowWarningModal(false);
                // Opcional: reiniciar contador de aviso? Por ahora solo cierra.
              }}>
                Continuar trabajando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
