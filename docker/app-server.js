import express from "express";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import multer from "multer";
import sharp from "sharp";
import { randomBytes, timingSafeEqual } from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration remains on the mounted data volume and is never served as a static file.
function loadConfig() {
  const dataDir = process.env.DATA_DIR || "/usr/share/nginx/html/data";
  const configPath = path.join(dataDir, "dashboard-config.json");

  // FAIL if config file missing - required at startup
  let editorPassword = "";
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    editorPassword =
      process.env.EDITOR_PASSWORD || configData.app?.password || "";
  } catch (error) {
    console.error("[ERROR] Failed to load config:", error.message);
    process.exit(1); // Exit if config file missing or invalid
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
    editorPassword: editorPassword, // Cached from dashboard-config.json
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
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map();
const loginFailures = new Map();

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
app.use(bodyParser.json({ limit: "2mb" }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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
      const sanitized = name.replace(/[^a-z0-9-_]/gi, "_").toLowerCase();
      cb(null, `${sanitized}${ext}`);
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
          `Invalid file type: ${file.mimetype}. Allowed: jpeg, png, gif, webp, svg`,
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
    maxAge: SESSION_TTL_MS,
  });
}

const authenticate = (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!config.editorPassword) {
    return res.status(503).json({
      success: false,
      error: "Server authentication is not configured",
    });
  }

  const token = getCookie(req, SESSION_COOKIE);
  const expiresAt = sessions.get(token);
  if (!token || !expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  sessions.set(token, Date.now() + SESSION_TTL_MS);
  next();
};

function privateConfigResponse() {
  const configPath = path.join(config.dataDir, "dashboard-config.json");
  const dashboardConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  if (dashboardConfig.app) delete dashboardConfig.app.password;
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
  if (!config.editorPassword) {
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
  if (!safeEqual(password, config.editorPassword)) {
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
  for (const [session, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(session);
  }
  const token = randomBytes(32).toString("base64url");
  sessions.set(token, now + SESSION_TTL_MS);
  setSessionCookie(req, res, token);
  res.set("Cache-Control", "no-store").json({ success: true });
});

app.post("/api/session/logout", verifyRequestOrigin, (req, res) => {
  const token = getCookie(req, SESSION_COOKIE);
  if (token) sessions.delete(token);
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
    .json({ success: true, authenticated: true });
});

app.get("/api/config", authenticate, (req, res) => {
  try {
    res
      .set("Cache-Control", "no-store")
      .json({ success: true, data: privateConfigResponse() });
  } catch (error) {
    log.error("Error loading dashboard config:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load configuration" });
  }
});

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
app.post("/api/config", verifyRequestOrigin, authenticate, async (req, res) => {
  try {
    // Validate that the body is a plain object (not a string, array, etc.)
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: "Config must be a JSON object",
      });
    }

    // Enqueue save operation to serialize concurrent requests
    const result = await enqueueSave(async () => {
      const filePath = path.join(config.dataDir, "dashboard-config.json");
      const nextConfig = structuredClone(req.body);
      const existingConfig = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (existingConfig.app?.password) {
        nextConfig.app = {
          ...(nextConfig.app || {}),
          password: existingConfig.app.password,
        };
      } else if (nextConfig.app) {
        delete nextConfig.app.password;
      }
      if (existingConfig.haConfig?.accessToken) {
        nextConfig.haConfig = {
          ...(nextConfig.haConfig || {}),
          accessToken: existingConfig.haConfig.accessToken,
        };
      }

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
        backupPath: result.backupPath ? path.basename(result.backupPath) : null,
      },
    });
  } catch (error) {
    log.error("Error saving config:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Image upload endpoint
app.post(
  "/api/images/upload",
  verifyRequestOrigin,
  authenticate,
  upload.array("images", 20),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files provided",
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
        error: error.message || "Failed to upload images",
      });
    }
  },
);

// Get list of available images
app.get("/api/images", (req, res) => {
  log.info("=== GET /api/images endpoint called ===");
  log.info(`Images directory: ${config.imagesDir}`);
  log.info(`Images directory exists: ${fs.existsSync(config.imagesDir)}`);

  try {
    if (!fs.existsSync(config.imagesDir)) {
      log.info("Images directory does not exist, returning empty list");
      return res.json({
        success: true,
        data: {
          images: [],
        },
      });
    }

    const files = fs.readdirSync(config.imagesDir);
    log.info(`Found ${files.length} files in images directory`);
    log.info(`Files: ${files.join(", ")}`);

    const images = files
      .filter((file) => {
        // Filter only image files
        const mimes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
        return mimes.some((ext) => file.toLowerCase().endsWith(ext));
      })
      .map((file) => {
        const filePath = path.join(config.imagesDir, file);
        const stats = fs.statSync(filePath);
        return {
          id: file,
          url: `/data/images/${file}`,
          name: path.parse(file).name,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

    log.info(`Returning ${images.length} images`);
    res.json({
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
    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
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

    const { width, height, quality, format } = req.query;
    let transform = sharp(filePath);

    // Apply resizing if requested
    if (width || height) {
      const resizeOptions = {};
      if (width) resizeOptions.width = parseInt(width, 10);
      if (height) resizeOptions.height = parseInt(height, 10);
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
        if (quality) {
          opts.quality = Math.min(100, Math.max(1, parseInt(quality, 10)));
        }
        transform = transform.toFormat(
          outputFormat === "jpg" ? "jpeg" : outputFormat,
          opts,
        );
      }
    } else if (quality) {
      // Apply quality to original format
      const ext = path.extname(filename).toLowerCase();
      if ([".jpg", ".jpeg"].includes(ext)) {
        transform = transform.jpeg({
          quality: Math.min(100, Math.max(1, parseInt(quality, 10))),
        });
      } else if (ext === ".webp") {
        transform = transform.webp({
          quality: Math.min(100, Math.max(1, parseInt(quality, 10))),
        });
      }
    }

    // Set cache headers for public images
    res.set("Cache-Control", "public, max-age=31536000");
    res.set("ETag", `"${filename}"`);

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
      res.set(
        "Content-Type",
        `image/${path.extname(filename).slice(1).toLowerCase()}`,
      );
    }

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
app.delete("/api/images/:id", verifyRequestOrigin, authenticate, (req, res) => {
  try {
    const filename = req.params.id;
    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
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
});

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
      `🔐 Authentication: ${config.editorPassword ? "Enabled" : "Disabled (development mode)"}`,
    );
    console.log(
      `\n[INFO] Logs are output to stdout/stderr. Docker's log driver handles log rotation.\n`,
    );
  });
}

export default app;
