You are implementing Task 1: Implement Silent Token Refresh (Frontend Agent)

## Task Description

**Goal:** Implement a 45-minute silent token refresh in the frontend. Ensure active timers are unaffected by the refresh.

**Files:**
- Modify: `d:\Desarrollo\DeployTime\desktop\src\renderer\App.tsx`

**Step 1: Write the implementation in App.tsx**
Add a new `useEffect` that runs when `isLoggedIn` is true.
```typescript
  useEffect(() => {
    if (!isLoggedIn) return;

    const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutos

    const intervalId = window.setInterval(async () => {
      try {
        await api.refreshToken();
        console.log('Token renovado silenciosamente en background');
      } catch (err) {
        console.error('Error al renovar token, forzando cierre de sesión:', err);
        api.clearToken();
        setIsLoggedIn(false);
        setUser(null);
        setActiveTimer(null);
        setTasks([]);
        setProjects([]);
        setSelectedProject(null);
        setSelectedTask(null);
        setElapsedTime('00:00:00');
        setAccumulatedTime(0);
        // Opcionalmente agregar un mensaje de error como setError('La sesión ha expirado');
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoggedIn]);
```

**Step 2: Commit**
```bash
git add desktop/src/renderer/App.tsx
git commit -m "feat(frontend): add 45-min silent token refresh"
```

## Context

The backend uses JWT tokens that expire in 60 minutes. To prevent users from being disconnected randomly (401 errors), we are implementing a silent background refresh every 45 minutes using the existing `api.refreshToken()` method.

## Your Job

1. Implement exactly what the task specifies
2. Verify implementation works or logic is sound
3. Commit your work
4. Self-review: ensure no syntax errors were introduced and the interval is correctly cleared.
5. Report back what you changed and committed.
