# Connection Handling, Auto-Start, and Auto-Stop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a 45-minute silent token refresh in the frontend, make the Electron app auto-start with Windows, and ensure active timers are stopped when the app or Windows closes.

**Architecture:** We will modify `App.tsx` to include a `setInterval` that calls `api.refreshToken()` every 45 minutes while the user is logged in. We will modify `desktop/src/main/main.js` (or `main.ts` depending on setup) to use Electron's `app.setLoginItemSettings()` for auto-start. Finally, we will intercept the `before-quit` event in Electron to notify the frontend (or do it directly in frontend via `useEffect` cleanup or `beforeunload`) to stop active timers.

**Tech Stack:** React, Electron, Vite.

---

### Task 1: Implement Silent Token Refresh (Frontend Agent)

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
        // Despachar el evento o setear error
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

---

### Task 2: Implement Auto-Start with Windows (Electron Agent)

**Files:**
- Modify: `d:\Desarrollo\DeployTime\desktop\src\main\main.js` (Verify exact path)

**Step 1: Add Auto-Start implementation**
In `main.js`, add the configuration so the app launches on login.
```javascript
app.whenReady().then(() => {
  // ... existing code ...
  
  // Habilitar Auto-Inicio en Windows
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
  });
});
```

**Step 2: Commit**
```bash
git add desktop/src/main/main.js
git commit -m "feat(electron): enable auto-start on windows login"
```

---

### Task 3: Implement Auto-Stop on Close (Electron Agent)

**Files:**
- Modify: `d:\Desarrollo\DeployTime\desktop\src\main\main.js`

**Step 1: Handle before-quit event**
When the app or Windows shuts down, Electron emits `before-quit`. Send an IPC message to the renderer to stop the timer.
```javascript
let isQuitting = false;

app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault(); // Stop the quit temporarily
    isQuitting = true;
    
    // Notify renderer to stop timers
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-closing');
      
      // Wait a bit to let the API call finish before forcing quit
      setTimeout(() => {
        app.quit();
      }, 2000); // 2 seconds delay
    } else {
      app.quit();
    }
  }
});
```

Note: `App.tsx` already has a listener for `app-closing` in lines 209-232, but it might need a small adjustment if it requires time to finish the API call. The timeout in `main.js` works well for this.

**Step 2: Commit**
```bash
git add desktop/src/main/main.js
git commit -m "feat(electron): delay quit to allow auto-stop of timers"
```
