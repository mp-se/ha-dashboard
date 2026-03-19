# Server-Side Config API Plan

## Overview

Create a Node.js/Express backend to serve and persist dashboard configuration and serve local entity data when needed. The backend will run in the same Docker container as Nginx, providing a REST API for loading/saving configs with token-based authentication and automatic backups. The backend will be protected by NGNIX to ensure that we have limited exposure of the backend.

## Requirements Summary

| Aspect             | Decision                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| **Use Cases**      | Load config, save config changes, load local entity data (offline mode) |
| **Persistence**    | File system (JSON)                                                      |
| **API Style**      | REST, write capability                                                  |
| **Authentication** | Bearer token (password-protected updates)                               |
| **Deployment**     | Same container (Node.js + Nginx)                                        |
| **Versioning**     | Automatic backup copies before overwrite                                |
| **Validation**     | Frontend-only (not backend)                                             |
| **Framework**      | Express.js                                                              |

## Edge Case Behavior (Clarifications)

1. **Missing Config File**: Server **fails to start** (process.exit(1)) if `dashboard-config.json` doesn't exist. Config file is required.
2. **Empty Password**: If `app.password` is empty or missing in config, authentication is disabled (acceptable for development).
3. **Concurrent Saves**: Multiple save requests are **queued** — only one save executes at a time. Subsequent requests wait for previous save to complete.
4. **Draft Persistence**: Drafts are stored in `localStorage` (not sessionStorage), persisting across browser sessions and restarts.
5. **Backup Directory**: Created automatically at server startup if it doesn't exist.
6. **Log Rotation**: Logs output to stdout/stderr. Docker's log driver handles rotation (no in-app log rotation).

## Phase 1: Backend Server Setup

### Create server structure:

```
src/
├── server.js                # Consolidated Express server (config, auth, routes, logging)
└── ... (rest of frontend files)
```

### Dependencies to add:

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2",
  "dotenv": "^16.0.3"
}
```

### Server Configuration (`src/server/config.ts`)

```typescript
export interface ServerConfig {
  port: number;
  dataDir: string;
  backupDir: string;
  backupLimit: number;
  corsOrigin: string;
  editorPassword: string; // Cached at startup, not from environment
}

export function loadConfig(): ServerConfig {
  const dataDir = process.env.DATA_DIR || "/usr/share/nginx/html/data";

  // Load editor password from config file once at startup
  let editorPassword = "";
  try {
    const configPath = path.join(dataDir, "dashboard-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    editorPassword = config.app?.password || "";
  } catch (error) {
    console.warn("Failed to load editor password from config:", error);
  }

  return {
    port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000,
    dataDir: dataDir,
    backupDir: process.env.BACKUP_DIR || "/usr/share/nginx/html/data/backups",
    backupLimit: process.env.BACKUP_LIMIT
      ? parseInt(process.env.BACKUP_LIMIT)
      : 30,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    editorPassword: editorPassword, // Cached from dashboard-config.json
  };
}
```

### Authentication Strategy

**Single password from configuration file (cached at startup):**

1. **Server startup** — Load password from `dashboard-config.json` `app.password` field once
2. **Cache in memory** — Store in `config.editorPassword` for fast access to all requests
3. **Developer mode toggle** — Validate password against config in `DeveloperModeToggle.vue`
4. **API POST requests** — Validate Bearer token against cached `config.editorPassword`
5. **Frontend save calls** — Use password from loaded config object

**Flow:**

```
dashboard-config.json has: "app": { "password": "my-secret-password" }
↓ (on server startup)
Backend loads password into config.editorPassword (cached in memory)
↓ (on each request)
Backend validates Bearer token against config.editorPassword (no file reads)
↓ (in frontend)
Frontend uses password from loaded config for API calls and dev mode toggle
```

**Benefits:**

- Password loaded once at startup, not on every request
- Fast authentication without repeated file I/O
- Single source of truth: `dashboard-config.json` `app.password` field
- Both API and dev mode toggle use same password

## Phase 2: API Endpoints Design

### Endpoints

All endpoints are prefixed with `/api/`

#### Configuration Endpoints

**POST /api/config**

```
Description: Save dashboard configuration (creates backup of existing)
Auth: Required (Bearer token)
Headers: Authorization: Bearer {TOKEN}
Body: { /* dashboard config object */ }
Response: 200 OK
{
  "success": true,
  "data": {
    "saved": true,
    "backupPath": "dashboard-config.json.backup.2026-03-18T10-30-45Z.json"
  }
}
```

#### Local Data (Read-Only)

**GET /api/data/local**

```
Description: Load local entity data (offline mode, read-only)
Auth: None required
Response: 200 OK
{
  "success": true,
  "data": { /* local data object */ }
}
```

#### Health Check

**GET /api/health**

```
Description: Health check endpoint
Auth: None required
Response: 200 OK
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-03-18T10:30:45Z"
  }
}
```

### Error Responses

**401 Unauthorized**

```json
{
  "success": false,
  "error": "Authentication failed"
}
```

**400 Bad Request**

```json
{
  "success": false,
  "error": "Invalid request"
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Note**: Detailed error information is logged server-side in container logs, not exposed to clients.

## Phase 3: File Operations & Storage

### Backup Strategy (`src/server/utils/fileOps.ts`)

**IMPORTANT: Only dashboard-config.json is backed up** (manual "Save to Backend" button, not auto-save):

- Local data (`local-data.json`) is NOT backed up, only persisted
- Prevents filesystem bloat from creating backups on every keystroke
- User controls when changes are persisted

1. **On POST /api/config** (user clicks "Save"), create timestamped backup of existing file
2. **Timestamp format**: `ISO8601` with milliseconds: `2026-03-18T10-30-45.123Z`
3. **Backup filename**: `{original-name}.backup.{timestamp}.json`
   - Example: `dashboard-config.backup.2026-03-18T10-30-45.123Z.json`
4. **Backup location**: `/data/backups/` directory (Nginx configured to deny direct HTTP access for security)
5. **Cleanup**: Remove backups exceeding `BACKUP_LIMIT=30` (keep most recent N config backups)
6. **Atomicity**: Write to temp file first, then rename (avoid incomplete writes)

### File Operations Interface

```typescript
interface FileOpsResult {
  success: boolean;
  data?: unknown;
  error?: string;
  backupPath?: string;
}

// Read JSON file with error handling
async function readJsonFile(filePath: string): Promise<FileOpsResult>;

// Write JSON file with backup creation
async function writeJsonFile(
  filePath: string,
  data: unknown,
  createBackup?: boolean,
): Promise<FileOpsResult>;

// List backups for a file
async function listBackups(filePath: string): Promise<string[]>;

// Cleanup old backups
async function cleanupOldBackups(
  filePath: string,
  limit: number,
): Promise<void>;
```

### Example Backup Flow

```
1. User edits dashboard in Visual Editor
   → Changes stay in-memory only (NOT persisted to server yet)

2. User clicks "Save to Backend" button
   → Frontend calls POST /api/config

3. Backend receives request:
   → Check if dashboard-config.json exists
   → If exists, copy to dashboard-config.json.backup.2026-03-18T10-30-45Z.json
   → Write new content to dashboard-config.json
   → Check backup count, if > BACKUP_LIMIT, delete oldest
   → Return success + backupPath

4. Frontend shows success toast
   → User can continue editing or save again later

Result: ~1-2 backups per editing session, not thousands per hour
```

## Phase 4: Frontend Integration

### Save-on-Demand Pattern (IMPORTANT)

**Why manual save?** To prevent filesystem bloat from backups:

- Each `POST /api/config` creates a timestamped backup
- If we saved on every change, we'd create dozens of backups per editing session
- **Solution**: User explicitly clicks "Save to Backend" to persist changes and trigger backup

**Loading Strategy - Static File Only:**

- On app startup, load config from static `/data/dashboard-config.json`
- Static file serves as the single source of truth for defaults
- Changes are persisted through "Save to Backend" button to the API
- Backend keeps backups of saved versions

**Data Flow**:

```
Loading:
1. Fetch /data/dashboard-config.json (static file)
2. Config loaded into memory from static file

Saving:
1. User edits config in Visual Editor → Changes stay in-memory only
2. User clicks "Save to Backend" button → POST /api/config
3. Frontend includes: Authorization: Bearer {editorPassword}
4. Backend validates password against config value
5. Backend creates backup of existing file
6. Backend writes new config to disk
7. Backup retained per BACKUP_LIMIT policy
```

### Update `configStore.ts`

**Add method to save config (called explicitly):**

```typescript
const saveConfigToBackend = async (config: unknown): Promise<boolean> => {
  try {
    const configStore = useConfigStore();
    const password =
      (configStore.dashboardConfig as Record<string, any>)?.app?.password || "";

    if (!password) {
      logger.warn("Editor password not configured in config, skipping save");
      return false;
    }

    // Development: VITE_API_URL env var points to localhost:3000
    // Production: Uses BASE_URL (app served with Nginx /api/ proxy to localhost:3000)
    const apiBaseUrl =
      import.meta.env.VITE_API_URL || import.meta.env.BASE_URL || "/";
    const apiUrl =
      apiBaseUrl + (apiBaseUrl.endsWith("/") ? "api/config" : "/api/config");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      let errorMsg = "Failed to save config";
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (parseError) {
        // Response not JSON, use generic message
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    logger.log("✓ Dashboard config saved to server:", result.data.backupPath);

    // Clear draft from local storage after successful save
    localStorage.removeItem("dashboardConfigDraft");

    return true;
  } catch (error) {
    logger.error("Error saving dashboard config to server:", error);
    return false;
  }
};
```

**Modify `loadDashboardConfig()` to use static file only:**

```typescript
const loadDashboardConfig = async (): Promise<ValidationResult> => {
  try {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const staticUrl = baseUrl + "data/dashboard-config.json";

    const response = await fetchWithTimeout(staticUrl, {}, TIMEOUT_CONFIG);

    if (!response.ok) {
      throw new Error(
        `Failed to load config from static file: ${response.statusText}`,
      );
    }

    const data = await response.json();
    logger.log("✓ Loaded config from static file");
    // Process config...
    return validationResult;
  } catch (error) {
    logger.error("Error loading config:", error);
    throw error;
  }
};
```

### UI Changes Required

**Visual Editor Mode Control**:

- Add "EDIT" button in toolbar (shown when NOT in edit mode)
  - Requires password validation via modal
  - On success: Enter edit mode, show saved draft if available in local storage
  - Prompt user if draft exists: "Resume editing previous draft?"
- Add "SAVE" button in toolbar (shown only when in edit mode)
  - Persists changes via POST /api/config
  - Clears local storage draft on success
  - Shows success/error toast
- Add "VIEW" button in toolbar (shown when in edit mode)
  - Exits edit mode, discards unsaved local changes
  - Returns to read-only dashboard view

**Example buttons**:

```vue
<!-- View mode: show EDIT button -->
<button
  v-if="!isEditMode"
  @click="enterEditMode()"
  class="btn btn-primary btn-sm"
>
  <i class="mdi mdi-pencil"></i> Edit
</button>

<!-- Edit mode: show SAVE and VIEW buttons -->
<template v-else>
  <button
    @click="saveConfig()"
    :disabled="!hasChanges"
    class="btn btn-success btn-sm me-2"
  >
    <i class="mdi mdi-content-save"></i> Save
  </button>
  <button @click="exitEditMode()" class="btn btn-secondary btn-sm">
    <i class="mdi mdi-eye"></i> View
  </button>
</template>
```

### Error Handling & Local Storage Notes

**Error Handling:**

- If loading fails: Error is thrown (no fallback, config must be in static file)
- If API fails with 401: User needs valid authentication for save operations
- If save fails: Show error toast, allow user to retry
- Generic error responses only (details logged server-side)

**Local Storage (Draft Management):**

- Store unsaved changes in `localStorage` with key `dashboardConfigDraft` (persists across browser sessions)
- On entering edit mode: If draft exists, prompt user with "Resume editing previous draft?"
- On successful save: Clear draft from local storage automatically
- On exiting edit mode without saving: Keep draft in local storage for next edit session
- Draft serves as recovery mechanism if browser restarts unexpectedly or user navigates away

## Phase 5: Docker & Deployment

### Update `Dockerfile`

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime with Nginx + Node.js
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

# Create app directory
WORKDIR /app

# Copy built frontend from builder
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy Node.js backend files
COPY src/server ./server
COPY docker/app-server.js ./
COPY package*.json ./

RUN npm ci --omit=dev

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create data directories with proper permissions
RUN mkdir -p /usr/share/nginx/html/data/backups && \
    chmod -R 755 /usr/share/nginx/html/data

# Expose ports
EXPOSE 80 443

# Start both Nginx and Node.js server
CMD ["sh", "-c", "nginx -g 'daemon off;' & node app-server.js"]
```

### Create `docker/app-server.js`

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

// Load configuration with cached editor password
function loadConfig() {
  const dataDir = process.env.DATA_DIR || '/usr/share/nginx/html/data';
  const configPath = path.join(dataDir, 'dashboard-config.json');

  // FAIL if config file missing - required at startup
  let editorPassword = '';
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    editorPassword = configData.app?.password || '';  // Empty password is acceptable
  } catch (error) {
    console.error('[ERROR] Failed to load config:', error.message);
    process.exit(1);  // Exit if config file missing or invalid
  }

  // Create backup directory if it doesn't exist at startup
  const backupDir = path.join(dataDir, 'backups');
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`[INFO] Created backup directory: ${backupDir}`);
    }
  } catch (error) {
    console.error('[ERROR] Failed to create backup directory:', error.message);
    process.exit(1);
  }

  return {
    port: process.env.SERVER_PORT || 3000,
    dataDir: dataDir,
    backupDir: backupDir,
    backupLimit: process.env.BACKUP_LIMIT ? parseInt(process.env.BACKUP_LIMIT) : 30,
    editorPassword: editorPassword  // Cached from dashboard-config.json
  };
}

const config = loadConfig();
const app = express();

// Queue for serializing save requests (only one save at a time)
// This prevents race conditions when multiple saves happen concurrently
let saveInProgress = false;
const saveQueue = [];

function enqueueSave(handler) {
  return new Promise((resolve, reject) => {
    saveQueue.push({ handler, resolve, reject });
    processSaveQueue();
  });
}

async function processSaveQueue() {
  if (saveInProgress || saveQueue.length === 0) return;

  saveInProgress = true;
  const { handler, resolve, reject } = saveQueue.shift();

  try {
    const result = await handler();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    saveInProgress = false;
    processSaveQueue();
  }
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Simple logging utility
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err || '')
};

// Backup cleanup utility - sorts by timestamp extracted from filename
// Only dashboard-config backups are cleaned up; local-data is not backed up
// Backups stored in /data/backups/ directory (Nginx denies direct HTTP access)
function cleanupOldBackups(filePath) {
  const filename = path.basename(filePath);
  const backupDir = path.join(path.dirname(filePath), 'backups');
  const backupPattern = `${filename}.backup.`;

  // Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    return;
  }

  try {
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(f => f.startsWith(backupPattern))
      .map(f => ({
        name: f,
        // Extract timestamp: filename.backup.YYYY-MM-DDTHH-MM-SS.FFFZ.json
        timestamp: f.substring(backupPattern.length)
          .replace(/\.json$/, '')
          .replace(/-/g, (m, i) => i < 10 ? m : ':')
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Delete backups beyond the limit (keep most recent BACKUP_LIMIT=30)
    if (backups.length > config.backupLimit) {
      const toDelete = backups.slice(config.backupLimit);
      toDelete.forEach(backup => {
        const backupPath = path.join(backupDir, backup.name);
        fs.unlinkSync(backupPath);
        log.info(`Deleted old backup: ${backup.name}`);
      });
    }
  } catch (error) {
    log.error('Error cleaning up backups:', error);
  }
}

// Authentication middleware
const authenticate = (req, res, next) => {
  if (!config.editorPassword) {
    // Password disabled in development (empty or not configured)
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    log.warn('Authentication failed: Missing or invalid authorization header');
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }

  const token = authHeader.substring(7);
  if (token !== config.editorPassword) {
    log.warn('Authentication failed: Invalid token/password');
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }

  next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

// Save config (with timestamped backup including milliseconds)
// Save requests are queued - only one save at a time to prevent race conditions
app.post('/api/config', authenticate, async (req, res) => {
  try {
    // Enqueue save operation to serialize concurrent requests
    const result = await enqueueSave(async () => {
      const filePath = path.join(config.dataDir, 'dashboard-config.json');

      // Create backup if file exists (in /backups/ subdirectory, Nginx protected)
      let backupPath = null;
      if (fs.existsSync(filePath)) {
        // Format: YYYY-MM-DDTHH-MM-SS.FFFZ (milliseconds prevent collisions)
        const now = new Date();
        const isoString = now.toISOString();
        const timestamp = isoString
          .replace(/:/g, '-')
          .slice(0, -1);  // Keep .FFF, remove final Z, will add Z after
        const fullTimestamp = timestamp + 'Z';

        backupPath = path.join(config.backupDir, `dashboard-config.json.backup.${fullTimestamp}`);
        fs.copyFileSync(filePath, backupPath);
        log.info(`Created backup: ${path.basename(backupPath)}`);
      }

      // Write new config
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
      log.info('Config saved successfully');

      // Cleanup old backups (enforces BACKUP_LIMIT=30)
      try {
        cleanupOldBackups(filePath);
      } catch (err) {
        log.warn('Error cleaning up backups (continuing):', err);
      }

      return { backupPath };
    });

    res.json({
      success: true,
      data: {
        saved: true,
        backupPath: result.backupPath ? `dashboard-config.json.backup.${result.backupPath}` : null
      }
    });
  } catch (error) {
    log.error('Error saving config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  log.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`✓ API server listening on port ${config.port}`);
  console.log(`📁 Data directory: ${config.dataDir}`);
  console.log(`� Backup directory: ${config.backupDir}`);
  console.log(`🔐 Authentication: ${config.editorPassword ? 'Enabled' : 'Disabled (development mode)'}`);
  console.log(`\n[INFO] Logs are output to stdout/stderr. Docker's log driver handles log rotation.\n`);
});
});
```

### Update `docker/nginx.conf`

Add API proxy configuration and backup denial rules under the server block:

```nginx
# Deny direct access to backup files (security - backups not served to clients)
location /data/backups/ {
  deny all;
}

# Proxy API requests to Node.js backend
location /api/ {
  proxy_pass http://localhost:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  # Allow CORS headers from backend
  proxy_pass_request_headers on;
  add_header 'Access-Control-Allow-Origin' '*' always;
}

# Serve static files from public directory
location / {
  try_files $uri $uri/ /index.html;
}
```

**Security**:

- Nginx denies all direct HTTP access to `/data/backups/`
- Backups are only accessible via authenticated API endpoints
- Clients cannot browse or download backups directly

### Update `docker-compose.yml`

No changes needed to `docker-compose.yml` — same container serves both frontend and API.

**Volumes** remain as-is:

```yaml
volumes:
  - ./public/data:/usr/share/nginx/html/data:ro # Changed to rw for API to write
```

Actually, change `:ro` to `:rw` so backend can write:

```yaml
volumes:
  - ./public/data:/usr/share/nginx/html/data:rw
```

## Phase 6: Environment & Configuration

### Environment Variables

Create `.env.example` (or document in `CONFIGURATION.md`):

```env
# Server Configuration (Backend)
SERVER_PORT=3000
DATA_DIR=/usr/share/nginx/html/data
BACKUP_DIR=/usr/share/nginx/html/data/backups
BACKUP_LIMIT=30

# Editor password is loaded from dashboard-config.json (app.password field)
# No environment variable needed for password
```

**Security Note**: Backups are stored on disk but Nginx is configured to deny HTTP access to the `/data/backups/` directory (see nginx.conf below).

### Frontend Development Variables

Create `.env.local` for local development (NOT committed to git):

```env
# API URL for development - points to local backend server
# In production, remove this so it uses the base URL (proxied by Nginx)
VITE_API_URL=http://localhost:3000/

# VITE_API_URL is optional:
# - If set: Uses this URL for all API calls (development mode)
# - If not set: Uses base URL prefix (production mode, requires Nginx proxy)
```

### Development Workflow

When developing the dashboard with separate frontend and backend servers:

**1. Start the Backend Server:**

```bash
# Option A: Run Node.js server directly
node docker/app-server.js
# Server runs on localhost:3000

# Option B: Run via npm script
npm run dev:server
```

**2. Start the Frontend Dev Server (in another terminal):**

```bash
npm run dev
# Frontend runs on localhost:5173 with hot reload
```

**3. Create .env.local:**

```bash
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000/
EOF
```

**4. Use the Dashboard:**

- Open http://localhost:5173 in your browser
- All API calls are routed to http://localhost:3000 backend
- Save/load operations tested locally before Docker deployment
- No Nginx proxy needed during development

**Production Deployment:**

```bash
# Build once, deploy with Docker
npm run build
docker-compose up
# Frontend served via Nginx with /api/ proxied to localhost:3000 backend
# .env.local not used; defaults to BASE_URL (/) with Nginx routing
```

## Phase 6b: Password-Protected Developer Mode (NEW)

**Requirement**: Add UI button to toggle developer mode with password protection

### Configuration

**Update [public/data/dashboard-config.json](public/data/dashboard-config.json)**:

```json
{
  "app": {
    "title": "Home Assistant Dashboard",
    "developerMode": false,
    "password": "your-secure-dev-password",
    "localMode": false
  },
  ...
}
```

### Type Updates

**Update [src/types/index.ts](src/types/index.ts)**:

```typescript
export interface AppSettings {
  developerMode?: boolean;
  password?: string; // Password to toggle dev mode at runtime
  localMode?: boolean;
}
```

### Backend Store Logic

**Update [src/stores/authStore.ts](src/stores/authStore.ts)**:

Add method to validate password and toggle developer mode:

```typescript
const toggleDeveloperMode = (password: string): boolean => {
  const configStore = useConfigStore();
  const appConfig = (configStore.dashboardConfig as Record<string, unknown>)?.app
    as Record<string, unknown> | undefined;

  // Check if password is configured
  if (!appConfig?.password) {
    logger.warn('Developer password not configured in dashboard config');
    return false;
  }

  // Validate password
  if (password !== String(appConfig.password)) {
    logger.warn('Invalid developer password');
    return false;
  }

  // Toggle mode
  developerMode.value = !developerMode.value;
  logger.log(`✓ Developer mode ${developerMode.value ? 'enabled' : 'disabled'}`);
  return true;
};
```

### Frontend UI Component

**Create [src/components/DeveloperModeToggle.vue](src/components/DeveloperModeToggle.vue)**:

```vue
<template>
  <div>
    <!-- Bug Icon Button (in navbar) -->
    <button
      class="btn btn-sm btn-outline-secondary ms-2"
      @click="showModal = true"
      title="Toggle Developer Mode (password required)"
    >
      <i class="mdi mdi-bug"></i>
    </button>

    <!-- Password Modal -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Developer Mode</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              aria-label="Close"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Enter Developer Password</label>
              <input
                v-model="password"
                type="password"
                class="form-control"
                placeholder="Password"
                @keyup.enter="toggleMode"
                autocomplete="off"
              />
            </div>

            <div v-if="error" class="alert alert-danger mb-0">
              <i class="mdi mdi-alert-circle me-2"></i>
              {{ error }}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="toggleMode"
              :disabled="!password"
            >
              <i class="mdi mdi-shield-lock me-2"></i>
              Toggle Developer Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";

const store = useAuthStore();
const showModal = ref(false);
const password = ref("");
const error = ref("");

const toggleMode = () => {
  const success = store.toggleDeveloperMode(password.value);
  if (success) {
    // Close modal on success
    closeModal();
  } else {
    // Show error message
    error.value = "Invalid password";
    password.value = "";
  }
};

const closeModal = () => {
  showModal.value = false;
  password.value = "";
  error.value = "";
};
</script>
```

### Update Navbar

**Update [src/components/AppNavbar.vue](src/components/AppNavbar.vue)**:

Add DeveloperModeToggle component in navbar (near other toolbar buttons):

```vue
<template>
  <!-- Navbar ... -->
  <nav class="navbar ...">
    <!-- ... existing navbar code ... -->

    <!-- Right side toolbar -->
    <div class="navbar-collapse">
      <div class="ms-auto d-flex align-items-center">
        <!-- ... other buttons ... -->

        <!-- Developer Mode Toggle -->
        <DeveloperModeToggle />

        <!-- ... dark mode toggle, etc ... -->
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import DeveloperModeToggle from "@/components/DeveloperModeToggle.vue";
// ... other imports ...
</script>
```

### User Experience Flow

```
1. User clicks 🐛 bug icon in navbar
2. Modal appears: "Enter Developer Password"
3. User types password and presses Enter or clicks button
4. If correct:
   → Developer mode toggles (on ↔ off)
   → Modal closes
   → Dev views appear/disappear in navbar (dev, device, raw)
5. If incorrect:
   → Error message shows
   → Password field clears
   → User can retry
```

### Testing Strategy

**Unit Tests** (`src/components/__tests__/DeveloperModeToggle.spec.js`):

- Modal opens on button click
- Modal closes on cancel
- Password validation calls store method
- Error message shown on invalid password
- Modal closes on successful toggle
- Password field clears on close

**Store Tests** (`src/stores/__tests__/authStore.spec.js`):

- `toggleDeveloperMode()` validates password correctly
- Returns true on correct password
- Returns false on incorrect password
- Returns false if password not configured
- Toggles `developerMode` ref value
- Logs appropriate messages

### Update `CONFIGURATION.md`

Add section:

````markdown
## Server API Configuration

The dashboard API backend provides endpoints for persisting configuration changes. Authentication uses the password from your dashboard configuration file.

### Environment Variables

- `SERVER_PORT` — Backend server port (default: 3000, internal only)
- `DATA_DIR` — Directory containing config and data files (default: /usr/share/nginx/html/data)
- `BACKUP_LIMIT` — Number of backup versions to retain (default: 10)

### Configuration

The API authentication password comes from `app.password` field in your dashboard config:

```json
{
  "app": {
    "password": "your-secure-password"
  }
}
```
````

### Example Docker Run

```bash
docker run -d \
  -p 8080:80 \
  -p 8443:443 \
  -v ./config:/usr/share/nginx/html/data \
  ha-dashboard
```

### API Endpoints

See SERVER_API_PLAN.md for complete endpoint documentation.

````

## Phase 7: Testing Strategy

### Backend Unit Tests (`src/server/__tests__/`)

**Test files:**
- `routes/config.spec.ts` — Test POST /api/config
- `routes/health.spec.ts` — Test GET /api/health
- `utils/fileOps.spec.ts` — Test file read/write, backup creation
- `middleware/auth.spec.ts` — Test token authentication

**Example test structure:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';

describe('POST /api/config', () => {
  it('should reject without token', async () => {
    const response = await request(app)
      .post('/api/config')
      .send({ app: { title: 'Test' } });
    expect(response.status).toBe(401);
  });

  it('should save config with valid token', async () => {
    const response = await request(app)
      .post('/api/config')
      .set('Authorization', 'Bearer test-token')
      .send({ app: { title: 'Test' } });
    expect(response.status).toBe(200);
    expect(response.body.data.backupPath).toBeDefined();
  });

  it('should create backup before saving', async () => {
    // Call twice to verify backup creation
    const config1 = { app: { title: 'Test1' } };
    const config2 = { app: { title: 'Test2' } };

    await request(app)
      .post('/api/config')
      .set('Authorization', 'Bearer test-token')
      .send(config1);

    const response = await request(app)
      .post('/api/config')
      .set('Authorization', 'Bearer test-token')
      .send(config2);

    expect(response.body.data.backupPath).toMatch(/backup/);
  });
});
````

### Frontend Integration Tests

**Test updates to `configStore.ts`:**

```typescript
describe("configStore — Config loading and saving", () => {
  it("should load config from static file", async () => {
    vi.mock("fetch", () => ({
      default: vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => mockConfig,
        }),
      ),
    }));

    const result = await store.loadDashboardConfig();
    expect(result.valid).toBe(true);
  });

  it("should save config via API with token", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => ({ success: true, data: { saved: true } }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await store.saveDashboardConfig(mockConfig);
    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
        }),
      }),
    );
  });

  it("should handle save API errors gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => ({ success: false, error: "Unauthorized" }),
        }),
      ),
    );

    const result = await store.saveDashboardConfig(mockConfig);
    expect(result).toBe(false);
  });
});
```

### E2E Tests

**Test full integration with Docker:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Dashboard Configuration & Persistence", () => {
  test("should load static config and persist changes via API", async ({
    page,
    browser,
  }) => {
    // Start with default config from static file
    await page.goto("http://localhost:8443");

    // Verify initial config loaded
    const initialTitle = await page
      .locator("[data-config-title]")
      .textContent();
    expect(initialTitle).toBeDefined();

    // Verify persistence after save
    // Simulate config save, check that changes persist
  });

  test("should create backups when saving config", async ({ page }) => {
    // This requires access to filesystem or server logs
    // Can verify backup creation by checking server logs
    // Configure backend to save and verify backup file creation
  });
});
```

## Phase 8: Package.json & Build Updates

### Add Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "supertest": "^6.3.3",
    "@types/express": "^4.17.17"
  }
}
```

### Update Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "node docker/app-server.js",
    "dev:full": "npm run build && concurrently \"npm run dev\" \"npm run dev:server\"",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "start:prod": "node docker/app-server.js"
  }
}
```

## Summary Table

| File                                                                                     | Change                                                         | Priority |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------- |
| [package.json](package.json)                                                             | Add express, cors, body-parser, dotenv                         | Phase 1  |
| **NEW** `docker/app-server.js`                                                           | Consolidated Express server with routes, auth, config, logging | Phase 1  |
| [src/stores/configStore.ts](src/stores/configStore.ts)                                   | Add `saveConfigToBackend()` method                             | Phase 2  |
| [src/views/VisualEditorView.vue](src/views/VisualEditorView.vue)                         | Add EDIT/SAVE/VIEW buttons in toolbar                          | Phase 2  |
| [docker/Dockerfile](docker/Dockerfile)                                                   | Multi-stage build, Node.js                                     | Phase 3  |
| [docker/nginx.conf](docker/nginx.conf)                                                   | Add /api/ proxy rule                                           | Phase 3  |
| [docker-compose.yml](docker-compose.yml)                                                 | Change volume `:ro` → `:rw`                                    | Phase 3  |
| [CONFIGURATION.md](CONFIGURATION.md)                                                     | Document API, env vars, save workflow                          | Phase 4  |
| [src/types/index.ts](src/types/index.ts)                                                 | Add `password` to AppSettings                                  | Phase 4  |
| [src/stores/authStore.ts](src/stores/authStore.ts)                                       | Add `toggleDeveloperMode()` method                             | Phase 4  |
| **NEW** [src/components/DeveloperModeToggle.vue](src/components/DeveloperModeToggle.vue) | Password modal component                                       | Phase 4  |
| [src/components/AppNavbar.vue](src/components/AppNavbar.vue)                             | Add DeveloperModeToggle button                                 | Phase 4  |
| [public/data/dashboard-config.json](public/data/dashboard-config.json)                   | Add `password` field                                           | Phase 4  |
| **NEW** `src/server/__tests__/`                                                          | Backend unit & E2E tests                                       | Phase 5  |

## Implementation Order

1. **Phase 1**: Add dependencies to package.json
2. **Phase 2**: Create consolidated server (docker/app-server.js), update frontend configStore & UI
3. **Phase 3**: Update Docker files (Dockerfile, nginx.conf, docker-compose.yml)
4. **Phase 4**: Add developer mode feature & documentation
5. **Phase 5**: Tests & verification

## Notes & Considerations

### Manual Save Pattern (NEW — Key Design Decision)

- **No auto-save on every keystroke** — Changes stay in-memory until user clicks "Save"
- **Why?** Prevents backup bloat (would create hundreds per editing session)
- **Backup only on explicit save** — Each POST /api/config/data creates 1 backup
- **Result** — Typical editing session = 1-2 backups instead of 100s
- **User experience** — Clear control: Edit → Preview → Save when ready
- **Unsaved changes** — Lost if user closes tab/browser without saving (acceptable tradeoff)

### Password-Protected Developer Mode (NEW)

- **Configuration**: `password` field in `app` config (required for feature to work)
- **UI**: Bug icon (🐛) in navbar opens password modal
- **Password validation**: Checks against config password (case-sensitive)
- **On success**: Toggles `developerMode` state, dev views appear/disappear in navbar
- **On failure**: Shows error, clears password field, allows retry
- **Security note**: Password stored in config file (for LAN deployments, acceptable risk)
- **Use case**: Allow runtime control of developer features without restarting or editing config files

### Development vs. Production

- **Development**: Set `password: ""` in config to disable auth (load from static files)
- **Production**: Set `password: "your-secure-password"` in config for security

### File Permissions

In Docker, ensure Node.js can write to `/usr/share/nginx/html/data/`:

- Dockerfile sets `chmod -R 755` on data directory
- May need to run Node.js as root or adjust group permissions

### Backward Compatibility

- Config loading from static files only (no API dependency for loading)
- Save operations require API backend to be running
- API is optional for initial dashboard load, required for persistence
- Static config files serve as single source of truth for defaults
- Can be rolled back by reverting Docker image

### Future Enhancements

- **Database backend**: Replace file storage with MongoDB/PostgreSQL
- **Multi-user profiles**: Add user-specific configurations
- **Version control**: Git-like history with rollback UI
- **Real-time sync**: WebSocket for live config push to multiple clients
- **OAuth integration**: Use Home Assistant credentials

---

**Status**: ✓ Plan Complete & Ready for Review

Last Updated: 2026-03-18
