import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    editorPassword = configData.app?.password || ''; // Empty password is acceptable
  } catch (error) {
    console.error('[ERROR] Failed to load config:', error.message);
    process.exit(1); // Exit if config file missing or invalid
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
    editorPassword: editorPassword // Cached from dashboard-config.json
  };
}

const config = loadConfig();
const app = express();

// Queue for serializing save requests (only one save at a time)
// This prevents race conditions when multiple saves happen concurrently
let saveInProgress = false;
const saveQueue = [];

// Helper function to create a configuration object
// This allows tests to create fresh app instances with different data directories
function createConfig() {
  return loadConfig();
}

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
  info: (msg) =>
    console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg) =>
    console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg, err) =>
    console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err || '')
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
      .filter((f) => f.startsWith(backupPattern))
      .map((f) => ({
        name: f,
        // Extract timestamp: filename.backup.YYYY-MM-DDTHH-MM-SS.FFFZ.json
        timestamp: f.substring(backupPattern.length)
          .replace(/\.json$/, '')
          .replace(/-/g, (m, i) => (i < 10 ? m : ':'))
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Delete backups beyond the limit (keep most recent BACKUP_LIMIT=30)
    if (backups.length > config.backupLimit) {
      const toDelete = backups.slice(config.backupLimit);
      toDelete.forEach((backup) => {
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
          .slice(0, -1); // Keep .FFF, remove final Z, will add Z after
        const fullTimestamp = timestamp + 'Z';

        backupPath = path.join(
          config.backupDir,
          `dashboard-config.json.backup.${fullTimestamp}.json`
        );
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
        backupPath: result.backupPath
          ? `dashboard-config.json.backup.${result.backupPath.split('backup.')[1]}`
          : null
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

// Load local data (read-only)
app.get('/api/data/local', (req, res) => {
  try {
    const filePath = path.join(config.dataDir, 'local-data.json');

    if (!fs.existsSync(filePath)) {
      return res.json({
        success: true,
        data: {}
      });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    log.info('Local data loaded successfully');

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    log.error('Error loading local data:', error);
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

// Start server only if run directly, not when imported for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(config.port, () => {
    console.log(`✓ API server listening on port ${config.port}`);
    console.log(`📁 Data directory: ${config.dataDir}`);
    console.log(`🔒 Backup directory: ${config.backupDir}`);
    console.log(
      `🔐 Authentication: ${config.editorPassword ? 'Enabled' : 'Disabled (development mode)'}`
    );
    console.log(
      `\n[INFO] Logs are output to stdout/stderr. Docker's log driver handles log rotation.\n`
    );
  });
}

export default app;
