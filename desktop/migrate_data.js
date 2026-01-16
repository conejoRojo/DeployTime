const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');
const os = require('os');

// Config
const API_URL = 'http://localhost:8000/api';
const ADMIN_EMAIL = 'luis@dixer.net';
const ADMIN_PASS = '#Mexico1986';

// Correct path handling for Windows
const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const DB_PATH = path.join(APPDATA, 'DeployTime', 'deploytime.db');

console.log(`Looking for database at: ${DB_PATH}`);

async function migrate() {
    try {
        // 1. Open Database
        const db = new Database(DB_PATH, { fileMustExist: true });
        console.log('Local database found and opened.');

        // 2. Login to API
        console.log('Logging in to API...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        const token = loginRes.data.access_token;
        console.log('Login successful. Token obtained.');

        const api = axios.create({
            baseURL: API_URL,
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Migrate Projects
        const projects = db.prepare('SELECT * FROM projects').all();
        console.log(`Found ${projects.length} projects to migrate.`);
        
        const projectMap = {}; // local_id -> remote_id

        for (const p of projects) {
            console.log(`Migrating project: ${p.name}`);
            try {
                // Check if exists or just create? Let's create.
                // If we want to avoid duplicates, we could check first, but let's assume push.
                const res = await api.post('/projects', {
                    name: p.name,
                    description: p.description || ''
                });
                projectMap[p.id] = res.data.id;
                console.log(`  -> Created as ID ${res.data.id}`);
            } catch (err) {
                console.error(`  -> Failed to create project ${p.name}:`, err.response?.data || err.message);
                // Try to find if it exists? (Optional, skipping for now)
            }
        }

        // 4. Migrate Tasks
        const tasks = db.prepare('SELECT * FROM tasks').all();
        console.log(`Found ${tasks.length} tasks to migrate.`);

        for (const t of tasks) {
            const remoteProjectId = projectMap[t.project_id];
            if (!remoteProjectId) {
                console.warn(`  -> Skipping task "${t.name}" because project ${t.project_id} was not migrated.`);
                continue;
            }

            console.log(`Migrating task: ${t.name}`);
            try {
                await api.post('/tasks', {
                    project_id: remoteProjectId, // In API typically we don't pass project_id in body if URL is projects/{id}/tasks?
                    // Wait, Route::post('tasks', [TaskController::class, 'store']);
                    // Let's check TaskController Store logic. It usually needs project_id.
                    name: t.name,
                    description: t.description || '',
                    estimated_hours: t.estimated_hours || 0,
                    project_id: remoteProjectId, 
                    status: t.status === 'done' ? 'completed' : (t.status === 'in_progress' ? 'in_progress' : 'pending')
                    // 'assigned_to' ?? Local SQLite doesn't seem to have assigned_to based on database.ts
                });
                console.log('  -> Success');
            } catch (err) {
                console.error(`  -> Failed to create task ${t.name}:`, err.response?.data || err.message);
            }
        }

        console.log('Migration completed.');

    } catch (error) {
        if (error.code === 'SQLITE_CANTOPEN') {
            console.error('ERROR: Could not find or open the database file.');
            console.error('Please verify that DeployTime Desktop has been run at least once.');
        } else {
            console.error('Migration failed:', error.message);
            if (error.response) {
                console.error('API Response:', error.response.data);
            }
        }
    }
}

migrate();
