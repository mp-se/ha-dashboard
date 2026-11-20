import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import multer from "multer";
import sharp from "sharp";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// quiet: dotenv otherwise logs "injected env (0) from .env" on every start, which is
// noise in Docker (there is no .env inside the container).
dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration remains on the mounted data volume and is never served as a static file.
function loadConfig() {
  const dataDir = process.env.DATA_DIR || "/app/data";
  const configPath = path.join(dataDir, "dashboard-config.json");

  // Credentials come from the environment only, never from dashboard-config.json:
  //   VIEWER_PASSWORD  required: the sign-in password (read-only when an editor
  //                    password exists)
  //   EDITOR_PASSWORD  optional: second password for editing; without it everyone
  //                    who signs in may edit
  //   HA_URL, HA_ACCESS_TOKEN  required unless app.localMode is true
  const editorPassword = process.env.EDITOR_PASSWORD || "";
  const viewerPassword = process.env.VIEWER_PASSWORD || "";
  const haUrl = (process.env.HA_URL || "").trim();
  const haAccessToken = (process.env.HA_ACCESS_TOKEN || "").trim();

  // FAIL if config file missing - required at startup
  let localMode = false;
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    localMode = configData.app?.localMode === true;
    const leftovers = [
      ["app.password", configData.app?.password],
      ["app.viewerPassword", configData.app?.viewerPassword],
      [
        "haConfig",
        configData.haConfig?.accessToken || configData.haConfig?.haUrl,
      ],
    ]
      .filter(([, value]) => value)
      .map(([key]) => key);
    if (leftovers.length) {
      console.warn(
        `[WARN] ${configPath} still contains ${leftovers.join(", ")}. ` +
          "These are no longer read or served: set VIEWER_PASSWORD, EDITOR_PASSWORD, " +
          "HA_URL and HA_ACCESS_TOKEN in the environment instead, and remove them " +
          "(the next save from the editor removes them from the file).",
      );
    }
  } catch (error) {
    console.error("[ERROR] Failed to load config:", error.message);
    process.exit(1); // Exit if config file missing or invalid
  }

  // Fail closed in every mode: the config response contains the Home Assistant
  // token, so the server must never run without a sign-in password.
  if (!viewerPassword) {
    console.error(
      "[ERROR] No sign-in password configured. Set the VIEWER_PASSWORD environment variable. " +
        "EDITOR_PASSWORD is the optional extra password for editing and is not a sign-in replacement.",
    );
    process.exit(1);
  }
  const loginPassword = viewerPassword;
  // The Home Assistant connection is served to signed-in users from the
  // environment. Local-data mode never talks to HA, so it needs neither.
  if (!localMode) {
    const missing = [
      ["HA_URL", haUrl],
      ["HA_ACCESS_TOKEN", haAccessToken],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);
    if (missing.length) {
      console.error(
        `[ERROR] Missing required environment variable(s): ${missing.join(", ")} ` +
          "(not needed when app.localMode is true).",
      );
      process.exit(1);
    }
  }
  if (haUrl) {
    let validUrl = false;
    try {
      validUrl = /^https?:$/.test(new URL(haUrl).protocol);
    } catch {
      // handled below
    }
    if (!validUrl) {
      console.error("[ERROR] HA_URL must be an http:// or https:// URL.");
      process.exit(1);
    }
  }
  for (const [label, value] of [
    ["Viewer", viewerPassword],
    ["Editor", editorPassword],
  ]) {
    if (value && !value.startsWith("scrypt$") && value.length < 8) {
      console.warn(`[WARN] ${label} password is shorter than 8 characters.`);
    }
  }
  if (viewerPassword && viewerPassword === editorPassword) {
    console.error(
      "[ERROR] The viewer password must differ from the editor password.",
    );
    process.exit(1);
  }

  // Create backup directory if it doesn't exist at startup
  const backupDir = path.join(dataDir, "backups");
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`[INFO] Created backup directory: ${backupDir}`);
    }
  } catch (error) {
    console.error("[ERROR] Failed to create backup directory:", error.message);
    process.exit(1);
  }

  // Create images directory if it doesn't exist at startup
  const imagesDir = path.join(dataDir, "images");
  try {
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      console.log(`[INFO] Created images directory: ${imagesDir}`);
    }
  } catch (error) {
    console.error("[ERROR] Failed to create images directory:", error.message);
    process.exit(1);
  }

  return {
    port: process.env.SERVER_PORT || 3000,
    dataDir: dataDir,
    backupDir: backupDir,
    imagesDir: imagesDir,
    backupLimit: process.env.BACKUP_LIMIT
      ? parseInt(process.env.BACKUP_LIMIT)
      : 30,
    haUrl, // Home Assistant connection, from the environment only
    haAccessToken,
    loginPassword, // required sign-in
    editorPassword, // optional; when set it is the only password that can edit
  };
}

// Simple logging utility
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg, err) =>
    console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err || ""),
};

const config = loadConfig();
const SESSION_COOKIE = "ha_dashboard_session";
const loginFailures = new Map();

// A sign-in lasts SESSION_DAYS days (default 30, max 365) and so does its cookie.
const DEFAULT_SESSION_DAYS = 30;
const requestedDays = Number.parseInt(process.env.SESSION_DAYS ?? "", 10);
if (process.env.SESSION_DAYS && !(requestedDays >= 1)) {
  console.warn(
    `[WARN] Ignoring invalid SESSION_DAYS="${process.env.SESSION_DAYS}"; using ${DEFAULT_SESSION_DAYS}.`,
  );
}
const SESSION_DAYS = Math.min(
  requestedDays >= 1 ? requestedDays : DEFAULT_SESSION_DAYS,
  365,
);
const SESSION_MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// Sessions are mirrored to a file so a restart or container update does not sign
// everyone out. Only a hash of each session id is stored (the file cannot be used
// to sign in), together with a fingerprint of the configured passwords so that
// changing a password invalidates the sessions it issued.
const SESSIONS_FILE = path.join(config.dataDir, "sessions.json");
const hashToken = (token) =>
  createHash("sha256").update(String(token)).digest("hex");
const PASSWORD_FINGERPRINT = createHash("sha256")
  .update(`${config.loginPassword}\0${config.editorPassword}`)
  .digest("hex");
const sessionIsValid = (session, now) =>
  Boolean(session) &&
  session.expiresAt > now &&
  session.fingerprint === PASSWORD_FINGERPRINT;

function loadSessions() {
  const loaded = new Map();
  try {
    const now = Date.now();
    const stored = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
    for (const [id, session] of Object.entries(stored)) {
      if (sessionIsValid(session, now)) loaded.set(id, session);
    }
  } catch {
    // No file yet (or unreadable): start without sessions.
  }
  return loaded;
}

function saveSessions() {
  try {
    const temporaryPath = `${SESSIONS_FILE}.${randomBytes(4).toString("hex")}.tmp`;
    fs.writeFileSync(
      temporaryPath,
      JSON.stringify(Object.fromEntries(sessions)),
      { mode: 0o600 },
    );
    fs.renameSync(temporaryPath, SESSIONS_FILE);
  } catch (error) {
    // Sessions keep working in memory; they just won't survive a restart.
    console.warn("[WARN] Could not persist sessions:", error.message);
  }
}

const sessions = loadSessions(); // sha256(token) -> { createdAt, expiresAt, role, fingerprint }

// Backup sequence tracking (must be declared BEFORE initializeBackupSequence is called)
let nextBackupSequence = 1;

initializeBackupSequence(config.backupDir);
const app = express();
app.set("trust proxy", 1);

// Apply middleware
const allowedOrigins = new Set(
  [
    process.env.APP_ORIGIN,
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"]),
  ].filter(Boolean),
);
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const MAX_INPUT_PIXELS = 50_000_000; // ~7000x7000, guards against decompression bombs
const MAX_OUTPUT_DIMENSION = 4096;
const RASTER_FORMATS = new Set(["jpeg", "png", "gif", "webp"]);
const clampQuality = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : undefined;
};
const IMAGE_FILENAME = /^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|gif|webp|svg)$/i;

// Configure multer for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.imagesDir);
    },
    filename: (req, file, cb) => {
      // Use a known raster extension rather than trusting the uploaded suffix.
      const mimeExtensions = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
      };
      const ext = mimeExtensions[file.mimetype];
      const name = path.basename(file.originalname, ext);
      const sanitized =
        name.replace(/[^a-z0-9-_]/gi, "_").toLowerCase() || "image";
      // Never overwrite an existing image silently.
      let candidate = `${sanitized}${ext}`;
      while (fs.existsSync(path.join(config.imagesDir, candidate))) {
        candidate = `${sanitized}-${randomBytes(3).toString("hex")}${ext}`;
      }
      cb(null, candidate);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
    fields: 10,
    parts: 20,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: jpeg, png, gif, webp`,
        ),
      );
    }
  },
});

// Save queue to serialize concurrent save requests, preventing race conditions
let saveQueue = Promise.resolve();
function enqueueSave(fn) {
  const result = saveQueue.then(() => fn());
  // Reset queue so subsequent saves still execute even if the current one fails
  saveQueue = result.catch(() => {});
  return result;
}

// Initialize backup sequence based on existing files
function initializeBackupSequence(backupDir) {
  if (!fs.existsSync(backupDir)) return;
  try {
    const files = fs.readdirSync(backupDir);
    const sequences = files
      .filter(
        (f) =>
          f.startsWith("dashboard-config.json.backup.") && f.endsWith(".json"),
      )
      .map((f) => {
        const parts = f.split(".");
        // Format: dashboard-config.json.backup.[sequence].json
        // Sequence is at index 3: [dashboard-config, json, backup, sequence, json]
        const seqStr = parts[3];
        return parseInt(seqStr, 10);
      })
      .filter((seq) => !isNaN(seq));

    if (sequences.length > 0) {
      nextBackupSequence = Math.max(...sequences) + 1;
      log.info(`Initialized next backup sequence: ${nextBackupSequence}`);
    }
  } catch (error) {
    log.error("Error initializing backup sequence:", error);
  }
}

// Backup cleanup utility - sorts by sequence number
// Only dashboard-config backups are cleaned up; local-data is not backed up
// Backups stored in /data/backups/ directory (Nginx denies direct HTTP access)
function cleanupOldBackups(filePath) {
  const filename = path.basename(filePath);
  const backupDir = path.join(path.dirname(filePath), "backups");
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
        sequence: parseInt(f.split(".")[3], 10),
      }))
      .filter((b) => !isNaN(b.sequence))
      .sort((a, b) => b.sequence - a.sequence);

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
    log.error("Error cleaning up backups:", error);
  }
}

// Authentication middleware
function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Passwords may be stored as plain text or as "scrypt$<salt hex>$<hash hex>"
// (generate one with `node docker/hash-password.js`).
function passwordMatches(candidate, stored) {
  if (!stored.startsWith("scrypt$")) return safeEqual(candidate, stored);
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const derived = scryptSync(
    candidate,
    Buffer.from(salt, "hex"),
    hash.length / 2,
  );
  return safeEqual(derived.toString("hex"), hash);
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  for (const item of cookies.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) {
      return item.slice(separator + 1).trim();
    }
  }
  return "";
}

function verifyRequestOrigin(req, res, next) {
  const origin = req.get("origin");
  if (!origin) return next();
  try {
    const parsed = new URL(origin);
    if (parsed.host === req.get("host") || allowedOrigins.has(origin)) {
      return next();
    }
  } catch {
    // Reject malformed Origin headers below.
  }
  return res
    .status(403)
    .json({ success: false, error: "Invalid request origin" });
}

function setSessionCookie(req, res, token) {
  const secure = req.secure || process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

const authenticate = (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!config.loginPassword) {
    return res.status(503).json({
      success: false,
      error: "Server authentication is not configured",
    });
  }

  const token = getCookie(req, SESSION_COOKIE);
  const id = token ? hashToken(token) : "";
  const session = sessions.get(id);
  if (!sessionIsValid(session, Date.now())) {
    if (session) {
      sessions.delete(id);
      saveSessions();
    }
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  req.role = session.role;
  next();
};

// Mutating routes need the editor password; a viewer session is read-only.
const requireEditor = (req, res, next) => {
  if (req.role !== "editor") {
    return res
      .status(403)
      .json({ success: false, error: "Editor access required" });
  }
  next();
};

// Credentials live only in the environment (VIEWER_PASSWORD, EDITOR_PASSWORD,
// HA_URL, HA_ACCESS_TOKEN). They are never read from, served from or written to
// dashboard-config.json: a leftover in an old file, or anything a client or an
// old backup sends back, is dropped.
function stripCredentials(target) {
  if (target.app && typeof target.app === "object") {
    delete target.app.password;
    delete target.app.viewerPassword;
  }
  delete target.haConfig;
  return target;
}

function privateConfigResponse() {
  const configPath = path.join(config.dataDir, "dashboard-config.json");
  const dashboardConfig = stripCredentials(
    JSON.parse(fs.readFileSync(configPath, "utf-8")),
  );
  const haConfig = {
    ...(config.haUrl && { haUrl: config.haUrl }),
    ...(config.haAccessToken && { accessToken: config.haAccessToken }),
  };
  if (Object.keys(haConfig).length) dashboardConfig.haConfig = haConfig;
  return dashboardConfig;
}

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

app.post("/api/session/login", verifyRequestOrigin, (req, res) => {
  if (!config.loginPassword) {
    return res.status(503).json({
      success: false,
      error: "Server authentication is not configured",
    });
  }

  const now = Date.now();
  const client = req.ip || req.socket.remoteAddress || "unknown";
  const failure = loginFailures.get(client);
  if (failure && failure.resetAt <= now) loginFailures.delete(client);
  if (failure && failure.count >= 10 && failure.resetAt > now) {
    return res
      .status(429)
      .json({ success: false, error: "Too many login attempts" });
  }

  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  // Check both without short-circuiting on the first so timing doesn't reveal which matched.
  // Both checks always run so timing doesn't reveal which password matched.
  const isEditorPassword =
    config.editorPassword && passwordMatches(password, config.editorPassword);
  const isLoginPassword = passwordMatches(password, config.loginPassword);
  // The editor password always edits. The sign-in password only reads when a
  // separate editor password exists; otherwise there is nothing to protect editing.
  const role = isEditorPassword
    ? "editor"
    : isLoginPassword
      ? config.editorPassword
        ? "viewer"
        : "editor"
      : null;
  if (!role) {
    const current = loginFailures.get(client);
    loginFailures.set(client, {
      count: current && current.resetAt > now ? current.count + 1 : 1,
      resetAt:
        current && current.resetAt > now
          ? current.resetAt
          : now + 15 * 60 * 1000,
    });
    return res.status(401).json({ success: false, error: "Invalid password" });
  }

  loginFailures.delete(client);
  for (const [id, session] of sessions) {
    if (!sessionIsValid(session, now)) sessions.delete(id);
  }
  const token = randomBytes(32).toString("base64url");
  sessions.set(hashToken(token), {
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS,
    role,
    fingerprint: PASSWORD_FINGERPRINT,
  });
  saveSessions();
  setSessionCookie(req, res, token);
  res.set("Cache-Control", "no-store").json({ success: true, role });
});

app.post("/api/session/logout", verifyRequestOrigin, (req, res) => {
  const token = getCookie(req, SESSION_COOKIE);
  if (token && sessions.delete(hashToken(token))) saveSessions();
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: req.secure || process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  res.set("Cache-Control", "no-store").json({ success: true });
});

app.get("/api/session", authenticate, (req, res) => {
  res
    .set("Cache-Control", "no-store")
    .json({ success: true, authenticated: true, role: req.role });
});

app.get("/api/config", authenticate, (req, res) => {
  try {
    res.set("Cache-Control", "no-store").json({
      success: true,
      role: req.role,
      data: privateConfigResponse(),
    });
  } catch (error) {
    log.error("Error loading dashboard config:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load configuration" });
  }
});

app.get("/api/config/backups", authenticate, requireEditor, (req, res) => {
  try {
    const backups = fs
      .readdirSync(config.backupDir)
      .map((name) => {
        const match = /^dashboard-config\.json\.backup\.(\d+)\.json$/.exec(
          name,
        );
        if (!match) return null;
        const sequence = Number(match[1]);
        const backupPath = path.join(config.backupDir, name);
        return {
          sequence,
          createdAt: fs.statSync(backupPath).mtime.toISOString(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.sequence - a.sequence);

    res.set("Cache-Control", "no-store").json({
      success: true,
      data: { backups },
    });
  } catch (error) {
    log.error("Error listing configuration backups:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to list configuration backups" });
  }
});

app.post(
  "/api/config/restore",
  verifyRequestOrigin,
  authenticate,
  requireEditor,
  async (req, res) => {
    const sequence = req.body?.sequence;
    if (!Number.isSafeInteger(sequence) || sequence < 1) {
      return res
        .status(400)
        .json({ success: false, error: "A valid backup sequence is required" });
    }

    try {
      await enqueueSave(async () => {
        const backupPath = path.join(
          config.backupDir,
          `dashboard-config.json.backup.${sequence}.json`,
        );
        if (!fs.existsSync(backupPath)) {
          const error = new Error("Configuration backup not found");
          error.statusCode = 404;
          throw error;
        }

        const filePath = path.join(config.dataDir, "dashboard-config.json");
        const restoredConfig = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
        if (
          !restoredConfig ||
          typeof restoredConfig !== "object" ||
          Array.isArray(restoredConfig) ||
          !Array.isArray(restoredConfig.views) ||
          (restoredConfig.app !== undefined &&
            (!restoredConfig.app ||
              typeof restoredConfig.app !== "object" ||
              Array.isArray(restoredConfig.app))) ||
          (restoredConfig.haConfig !== undefined &&
            (!restoredConfig.haConfig ||
              typeof restoredConfig.haConfig !== "object" ||
              Array.isArray(restoredConfig.haConfig)))
        ) {
          const error = new Error("Configuration backup is invalid");
          error.statusCode = 400;
          throw error;
        }

        // Credentials come from the environment only: an old backup must not
        // bring any back into the file.
        stripCredentials(restoredConfig);

        const recoveryBackupPath = path.join(
          config.backupDir,
          `dashboard-config.json.backup.${nextBackupSequence++}.json`,
        );
        fs.copyFileSync(filePath, recoveryBackupPath);
        const temporaryPath = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
        fs.writeFileSync(
          temporaryPath,
          JSON.stringify(restoredConfig, null, 2),
          {
            mode: 0o600,
          },
        );
        fs.renameSync(temporaryPath, filePath);
        cleanupOldBackups(filePath);
      });

      res.set("Cache-Control", "no-store").json({
        success: true,
        data: { restored: true },
      });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 400) {
        return res
          .status(error.statusCode)
          .json({ success: false, error: error.message });
      }
      log.error("Error restoring configuration backup:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to restore configuration" });
    }
  },
);

app.get("/api/data/local", authenticate, (req, res) => {
  const localDataPath = path.join(config.dataDir, "local-data.json");
  try {
    if (!fs.existsSync(localDataPath)) {
      return res
        .status(404)
        .json({ success: false, error: "Local data not found" });
    }
    const data = JSON.parse(fs.readFileSync(localDataPath, "utf-8"));
    res.set("Cache-Control", "no-store").json({ success: true, data });
  } catch (error) {
    log.error("Error loading local data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load local data" });
  }
});

// Save config (with timestamped backup including milliseconds)
// Save requests are queued - only one save at a time to prevent race conditions
app.post(
  "/api/config",
  verifyRequestOrigin,
  authenticate,
  requireEditor,
  async (req, res) => {
    try {
      // Validate that the body is a plain object (not a string, array, etc.)
      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          error: "Config must be a JSON object",
        });
      }

      // Enqueue save operation to serialize concurrent requests
      const result = await enqueueSave(async () => {
        const filePath = path.join(config.dataDir, "dashboard-config.json");
        // Credentials come from the environment only: whatever the client sends
        // back (it receives the HA connection in GET /api/config) is dropped.
        const nextConfig = stripCredentials(structuredClone(req.body));

        // Create backup if file exists (in /backups/ subdirectory, Nginx protected)
        let backupPath = null;
        if (fs.existsSync(filePath)) {
          // Use sequence number instead of timestamp
          const sequence = nextBackupSequence++;
          backupPath = path.join(
            config.backupDir,
            `dashboard-config.json.backup.${sequence}.json`,
          );

          // Move existing file to backup before writing new one
          fs.copyFileSync(filePath, backupPath);
          log.info(
            `Archived existing config to backup: ${path.basename(backupPath)}`,
          );
        }

        // Write new config to main file
        const temporaryPath = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
        fs.writeFileSync(temporaryPath, JSON.stringify(nextConfig, null, 2), {
          mode: 0o600,
        });
        fs.renameSync(temporaryPath, filePath);
        log.info(`Config saved successfully to ${filePath}`);

        // Cleanup old backups (enforces BACKUP_LIMIT=30)
        try {
          cleanupOldBackups(filePath);
        } catch (err) {
          log.warn("Error cleaning up backups (continuing):", err);
        }

        return { backupPath };
      });

      res.json({
        success: true,
        data: {
          saved: true,
          backupPath: result.backupPath
            ? path.basename(result.backupPath)
            : null,
        },
      });
    } catch (error) {
      log.error("Error saving config:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

// Image upload endpoint
app.post(
  "/api/images/upload",
  verifyRequestOrigin,
  authenticate,
  requireEditor,
  upload.array("images", 20),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files provided",
        });
      }

      // The declared MIME type is client-controlled: verify the real content
      // and discard anything that is not a decodable raster image.
      const verified = [];
      for (const file of req.files) {
        try {
          const meta = await sharp(file.path, {
            limitInputPixels: MAX_INPUT_PIXELS,
          }).metadata();
          if (!RASTER_FORMATS.has(meta.format)) throw new Error("bad format");
          verified.push(file);
        } catch {
          fs.rmSync(file.path, { force: true });
        }
      }
      if (verified.length !== req.files.length) {
        verified.forEach((file) => fs.rmSync(file.path, { force: true }));
        return res.status(400).json({
          success: false,
          error: "Upload rejected: file is not a valid image",
        });
      }

      const uploadedImages = req.files.map((file) => ({
        id: file.filename,
        url: `/api/images/${file.filename}`,
        name: path.parse(file.filename).name,
        size: file.size,
      }));

      log.info(`Uploaded ${uploadedImages.length} image(s)`);
      res.json({
        success: true,
        data: {
          images: uploadedImages,
        },
      });
    } catch (error) {
      log.error("Error uploading images:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload images",
      });
    }
  },
);

// Get list of available images (editor only; the images themselves stay public
// so dashboards render without logging in)
app.get("/api/images", authenticate, requireEditor, (req, res) => {
  try {
    if (!fs.existsSync(config.imagesDir)) {
      return res.json({
        success: true,
        data: {
          images: [],
        },
      });
    }

    const files = fs.readdirSync(config.imagesDir);

    const images = files
      // .svg is allowed here for admin-provided files (uploads reject it)
      .filter((file) => IMAGE_FILENAME.test(file))
      .map((file) => {
        const filePath = path.join(config.imagesDir, file);
        const stats = fs.statSync(filePath);
        return {
          id: file,
          url: `/api/images/${encodeURIComponent(file)}`,
          name: path.parse(file).name,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

    res.set("Cache-Control", "no-store").json({
      success: true,
      data: {
        images: images,
      },
    });
  } catch (error) {
    log.error("Error listing images:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list images",
    });
  }
});

// Serve image with optional resizing
// Usage: /api/images/filename.jpg or /api/images/filename.jpg?width=300&height=200&quality=80
app.get("/api/images/:id", async (req, res) => {
  try {
    const filename = req.params.id;
    // Strict allow-list: also prevents directory traversal
    if (!IMAGE_FILENAME.test(filename)) {
      return res.status(400).json({
        success: false,
        error: "Invalid filename",
      });
    }

    const filePath = path.join(config.imagesDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    // Query values must be plain strings (not arrays/objects from ?a[]=1)
    const { width, height, quality, format } = Object.fromEntries(
      ["width", "height", "quality", "format"].map((key) => [
        key,
        typeof req.query[key] === "string" ? req.query[key] : undefined,
      ]),
    );
    const dimension = (value) => {
      const n = parseInt(value, 10);
      return Number.isFinite(n) && n > 0
        ? Math.min(n, MAX_OUTPUT_DIMENSION)
        : undefined;
    };
    let transform = sharp(filePath, { limitInputPixels: MAX_INPUT_PIXELS });

    // Apply resizing if requested
    if (dimension(width) || dimension(height)) {
      const resizeOptions = {};
      if (width) resizeOptions.width = dimension(width);
      if (height) resizeOptions.height = dimension(height);
      // Use contain to maintain aspect ratio
      transform = transform.resize(resizeOptions.width, resizeOptions.height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      });
    }

    // Apply quality/format if requested
    if (format) {
      const outputFormat = format.toLowerCase();
      if (["jpg", "jpeg", "png", "webp", "gif"].includes(outputFormat)) {
        const opts = {};
        if (clampQuality(quality)) opts.quality = clampQuality(quality);
        transform = transform.toFormat(
          outputFormat === "jpg" ? "jpeg" : outputFormat,
          opts,
        );
      }
    } else if (quality) {
      // Apply quality to original format
      const ext = path.extname(filename).toLowerCase();
      if ([".jpg", ".jpeg"].includes(ext) && clampQuality(quality)) {
        transform = transform.jpeg({ quality: clampQuality(quality) });
      } else if (ext === ".webp" && clampQuality(quality)) {
        transform = transform.webp({ quality: clampQuality(quality) });
      }
    }

    // Set cache headers for public images; never let a browser execute content
    res.set("Cache-Control", "public, max-age=31536000");
    res.set("ETag", `"${filename}"`);
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Security-Policy", "default-src 'none'; sandbox");

    // Set content type based on actual format
    if (format) {
      const outFormat = format.toLowerCase();
      if (outFormat === "jpeg" || outFormat === "jpg") {
        res.set("Content-Type", "image/jpeg");
      } else if (outFormat === "webp") {
        res.set("Content-Type", "image/webp");
      } else if (outFormat === "png") {
        res.set("Content-Type", "image/png");
      } else if (outFormat === "gif") {
        res.set("Content-Type", "image/gif");
      }
    } else {
      const ext = path.extname(filename).slice(1).toLowerCase();
      res.set(
        "Content-Type",
        { jpg: "image/jpeg", svg: "image/svg+xml" }[ext] || `image/${ext}`,
      );
    }

    transform.on("error", (err) => {
      log.error("Error processing image:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to process image",
        });
      } else {
        res.destroy();
      }
    });
    transform.pipe(res).on("error", (err) => {
      log.error("Error processing image:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to process image",
        });
      }
    });
  } catch (error) {
    log.error("Error serving image:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Failed to serve image",
      });
    }
  }
});

// Delete image
app.delete(
  "/api/images/:id",
  verifyRequestOrigin,
  authenticate,
  requireEditor,
  (req, res) => {
    try {
      const filename = req.params.id;
      if (!IMAGE_FILENAME.test(filename)) {
        return res.status(400).json({
          success: false,
          error: "Invalid filename",
        });
      }

      const filePath = path.join(config.imagesDir, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: "Image not found",
        });
      }

      // Delete the file
      fs.unlinkSync(filePath);
      log.info(`Deleted image: ${filename}`);

      res.json({
        success: true,
        data: {
          message: "Image deleted",
        },
      });
    } catch (error) {
      log.error("Error deleting image:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete image",
      });
    }
  },
);

// Error handler for multer validation errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  }

  if (err && err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Client errors raised by body parsing (too large, malformed JSON, ...)
  if (err?.status === 413) {
    return res
      .status(413)
      .json({ success: false, error: "Request body too large" });
  }
  if (err?.status === 400 && err.type?.startsWith("entity.")) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid request body" });
  }

  next(err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  log.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Start server only if run directly, not when imported for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(config.port, () => {
    console.log(`✓ API server listening on port ${config.port}`);
    console.log(`📁 Data directory: ${config.dataDir}`);
    console.log(`🔒 Backup directory: ${config.backupDir}`);
    console.log(`🖼️  Images directory: ${config.imagesDir}`);
    console.log(
      `🔐 Authentication: ${config.loginPassword ? `Enabled (editing ${config.editorPassword ? "needs the editor password" : "allowed for everyone signed in"})` : "NOT CONFIGURED (protected API routes return 503)"}`,
    );
    console.log(`🕒 Sign-ins last ${SESSION_DAYS} days (SESSION_DAYS)`);
    console.log(
      `\n[INFO] Logs are output to stdout/stderr. Docker's log driver handles log rotation.\n`,
    );
  });
}

export default app;
