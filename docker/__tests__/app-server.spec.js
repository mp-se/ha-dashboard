/**
 * Backend Server Tests
 * Tests for Express app-server.js including:
 * - Configuration loading
 * - Authentication middleware
 * - API endpoints (health, config save, local data)
 * - File operations (backups, cleanup)
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import request from "supertest";

// Use single test directory for all tests to avoid config reload issues
let testDataDir = "";
let testBackupDir = "";
let app;
let sessionCookie;

/**
 * Setup test environment folders
 */
function setupTestEnv() {
  testDataDir = path.join(os.tmpdir(), `ha-dashboard-test-${Date.now()}`);
  testBackupDir = path.join(testDataDir, "backups");
  fs.mkdirSync(testDataDir, { recursive: true });
  fs.mkdirSync(testBackupDir, { recursive: true });

  // Create test config file
  const testConfig = {
    // No credentials in the file: they come from the environment (see beforeAll).
    app: {
      title: "Test Dashboard",
      developerMode: false,
    },
    views: [
      {
        name: "overview",
        label: "Overview",
        entities: [],
      },
    ],
  };
  fs.writeFileSync(
    path.join(testDataDir, "dashboard-config.json"),
    JSON.stringify(testConfig, null, 2),
  );
}

/**
 * Cleanup test environment
 */
function cleanupTestEnv() {
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
  delete process.env.DATA_DIR;
}

describe("Backend Server (app-server.js)", () => {
  beforeAll(async () => {
    setupTestEnv();
    process.env.DATA_DIR = testDataDir;
    // Credentials come from the environment only. The server also loads the
    // developer's real .env via dotenv, which never overrides a variable that is
    // already defined, so defining all of them keeps the tests hermetic.
    Object.assign(process.env, {
      VIEWER_PASSWORD: "viewer-password",
      EDITOR_PASSWORD: "test-password",
      HA_URL: "https://ha.local",
      HA_ACCESS_TOKEN: "active-ha-token",
      SESSION_DAYS: "",
    });
    // Dynamically import app once with test environment set up
    const appModule = await import("../app-server.js");
    app = appModule.default;
    const login = await request(app)
      .post("/api/session/login")
      .send({ password: "test-password" });
    expect(login.status).toBe(200);
    sessionCookie = login.headers["set-cookie"];
  });

  afterAll(() => {
    cleanupTestEnv();
  });

  describe("Configuration Loading", () => {
    it("should load configuration from dashboard-config.json", () => {
      const configPath = path.join(testDataDir, "dashboard-config.json");
      expect(fs.existsSync(configPath)).toBe(true);

      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      expect(configData.app.title).toBe("Test Dashboard");
      expect(configData.app.password).toBeUndefined();
    });

    it("should create backups directory if missing", () => {
      expect(fs.existsSync(testBackupDir)).toBe(true);
    });
  });

  describe("API Health Endpoint", () => {
    it("should return 200 with health status", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:5173");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("ok");
    });
  });

  describe("Authentication Middleware", () => {
    it("should reject requests without authorization header", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Content-Type", "application/json")
        .send({ app: { title: "Updated" } });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject requests with invalid token", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Authorization", "Bearer invalid-password")
        .set("Content-Type", "application/json")
        .send({ app: { title: "Updated" } });

      expect(response.status).toBe(401);
    });

    it("should reject requests with malformed auth header", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Authorization", "InvalidFormat")
        .set("Content-Type", "application/json")
        .send({ app: { title: "Updated" } });

      expect(response.status).toBe(401);
    });
  });

  describe("Config Save Endpoint (/api/config)", () => {
    it("should save config with valid token", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send({ app: { title: "Updated Dashboard" } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify config was saved
      const savedConfig = JSON.parse(
        fs.readFileSync(
          path.join(testDataDir, "dashboard-config.json"),
          "utf-8",
        ),
      );
      expect(savedConfig.app.title).toBe("Updated Dashboard");
    });

    it("should create backup before overwriting config", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send({ app: { title: "Backup Test" } });

      expect(response.status).toBe(200);

      const backups = fs.readdirSync(testBackupDir);
      expect(backups.length).toBeGreaterThan(0);
    });

    it("should reject save without authentication", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Content-Type", "application/json")
        .send({ app: { title: "Updated" } });

      expect(response.status).toBe(401);
    });

    it("should handle invalid JSON in request body", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send('"invalid json"');

      // Response should be error since we're sending a string instead of an object
      expect([400, 500]).toContain(response.status);
    });
  });

  describe("Backup Management", () => {
    it("should use sequence number for backups", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send({ app: { title: "Sequence Test" } });

      expect(response.status).toBe(200);

      const backups = fs.readdirSync(testBackupDir);
      expect(backups.length).toBeGreaterThan(0);

      // Check sequence number format (e.g., .backup.1.json)
      const hasSequenceFormat = backups.some((backup) =>
        /\.backup\.\d+\.json$/.test(backup),
      );
      expect(hasSequenceFormat).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should include CORS headers in response", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:5173");

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });

    it("should handle unknown routes gracefully", async () => {
      const response = await request(app).get("/api/unknown");

      // Expect 404 for unknown route
      expect([404, 405]).toContain(response.status);
    });
  });

  describe("Concurrent Save Operations", () => {
    it("should execute sequential save requests successfully", async () => {
      // Make 3 sequential save requests
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post("/api/config")
          .set("Cookie", sessionCookie)
          .set("Content-Type", "application/json")
          .send({ app: { title: `Update ${i}` } });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      // Verify final config was saved
      const configPath = path.join(testDataDir, "dashboard-config.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      expect(config.app.title).toBe("Update 2");
    });
  });

  describe("Configuration Backup Restore API", () => {
    it("requires an authenticated session to list saved versions", async () => {
      const response = await request(app).get("/api/config/backups");
      expect(response.status).toBe(401);
    });

    it("lists backups without exposing their configuration contents", async () => {
      const response = await request(app)
        .get("/api/config/backups")
        .set("Cookie", sessionCookie);

      expect(response.status).toBe(200);
      expect(response.body.data.backups.length).toBeGreaterThan(0);
      expect(response.body.data.backups[0]).toHaveProperty("sequence");
      expect(response.body.data.backups[0]).toHaveProperty("createdAt");
      expect(JSON.stringify(response.body)).not.toContain("test-password");
    });

    it("restores a numbered backup without bringing old credentials back", async () => {
      // An old backup written before credentials moved to the environment.
      const backupConfig = {
        app: { title: "Restored Dashboard", password: "old-password" },
        haConfig: { haUrl: "https://old-ha.local", accessToken: "old-token" },
        views: [{ name: "restored", label: "Restored", entities: [] }],
      };
      fs.writeFileSync(
        path.join(testBackupDir, "dashboard-config.json.backup.900.json"),
        JSON.stringify(backupConfig),
      );
      const currentConfigPath = path.join(testDataDir, "dashboard-config.json");

      const response = await request(app)
        .post("/api/config/restore")
        .set("Cookie", sessionCookie)
        .send({ sequence: 900 });

      expect(response.status).toBe(200);
      const raw = fs.readFileSync(currentConfigPath, "utf-8");
      const restoredConfig = JSON.parse(raw);
      expect(restoredConfig.app.title).toBe("Restored Dashboard");
      expect(restoredConfig.views[0].name).toBe("restored");
      expect(restoredConfig.app.password).toBeUndefined();
      expect(restoredConfig.haConfig).toBeUndefined();
      expect(raw).not.toContain("old-token");
      expect(raw).not.toContain("old-password");

      // The dashboard still gets the connection from the environment.
      const served = await request(app)
        .get("/api/config")
        .set("Cookie", sessionCookie);
      expect(served.body.data.app.title).toBe("Restored Dashboard");
      expect(served.body.data.haConfig).toEqual({
        haUrl: "https://ha.local",
        accessToken: "active-ha-token",
      });
    });

    it("rejects malformed backup identifiers", async () => {
      const response = await request(app)
        .post("/api/config/restore")
        .set("Cookie", sessionCookie)
        .send({ sequence: "../dashboard-config.json" });

      expect(response.status).toBe(400);
    });
  });

  describe("Image endpoints hardening", () => {
    let png;
    beforeAll(async () => {
      const { default: sharp } = await import("sharp");
      png = await sharp({
        create: {
          width: 8,
          height: 8,
          channels: 3,
          background: { r: 200, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();
    });

    it("requires a session to list images", async () => {
      const response = await request(app).get("/api/images");
      expect(response.status).toBe(401);
    });

    it("accepts a real image and never overwrites an existing file", async () => {
      const upload = () =>
        request(app)
          .post("/api/images/upload")
          .set("Cookie", sessionCookie)
          .attach("images", png, {
            filename: "dup.png",
            contentType: "image/png",
          });
      const first = await upload();
      const second = await upload();

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(first.body.data.images[0].id).toBe("dup.png");
      expect(second.body.data.images[0].id).not.toBe("dup.png");

      const list = await request(app)
        .get("/api/images")
        .set("Cookie", sessionCookie);
      expect(list.status).toBe(200);
      expect(list.body.data.images.length).toBeGreaterThanOrEqual(2);
    });

    it("rejects content that is not an image despite an image MIME type", async () => {
      const response = await request(app)
        .post("/api/images/upload")
        .set("Cookie", sessionCookie)
        .attach("images", Buffer.from("<svg onload=alert(1)>"), {
          filename: "evil.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(400);
      expect(fs.existsSync(path.join(testDataDir, "images", "evil.png"))).toBe(
        false,
      );
    });

    it("rejects SVG uploads", async () => {
      const response = await request(app)
        .post("/api/images/upload")
        .set("Cookie", sessionCookie)
        .attach("images", Buffer.from("<svg/>"), {
          filename: "a.svg",
          contentType: "image/svg+xml",
        });
      expect(response.status).toBe(400);
    });

    it("rejects unexpected filenames when serving or deleting", async () => {
      expect((await request(app).get("/api/images/.env")).status).toBe(400);
      expect((await request(app).get("/api/images/a..png")).status).toBe(404);
      const del = await request(app)
        .delete("/api/images/not-an-image.txt")
        .set("Cookie", sessionCookie);
      expect(del.status).toBe(400);
    });

    it("caps requested dimensions and sends safe headers", async () => {
      const response = await request(app)
        .get("/api/images/dup.png?width=99999&height=99999&format=png")
        .buffer(true)
        .parse((res, cb) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => cb(null, Buffer.concat(chunks)));
        });
      const { default: sharp } = await import("sharp");
      const meta = await sharp(response.body).metadata();

      expect(response.status).toBe(200);
      expect(Math.max(meta.width, meta.height)).toBeLessThanOrEqual(4096);
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["content-security-policy"]).toContain("sandbox");
    });

    it("ignores malformed query values instead of crashing", async () => {
      const response = await request(app).get(
        "/api/images/dup.png?quality=abc&width[]=1&format=png",
      );
      expect(response.status).toBe(200);
    });

    it("lists and returns images only as API URLs, never as static /data/ paths", async () => {
      const list = await request(app)
        .get("/api/images")
        .set("Cookie", sessionCookie);
      const urls = list.body.data.images.map((image) => image.url);

      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) {
        expect(url).toMatch(/^\/api\/images\/[^/]+$/);
        // Every listed URL really is served by the API.
        expect((await request(app).get(url)).status).toBe(200);
      }

      const upload = await request(app)
        .post("/api/images/upload")
        .set("Cookie", sessionCookie)
        .attach("images", png, {
          filename: "viaapi.png",
          contentType: "image/png",
        });
      expect(upload.body.data.images[0].url).toBe("/api/images/viaapi.png");
    });
  });

  describe("Viewer and editor roles", () => {
    const login = (password) =>
      request(app).post("/api/session/login").send({ password });
    let viewerCookie;

    beforeAll(async () => {
      viewerCookie = (await login("viewer-password")).headers["set-cookie"];
    });

    it("reports the role granted by each password", async () => {
      const editor = await login("test-password");
      const viewer = await login("viewer-password");
      expect(editor.body.role).toBe("editor");
      expect(viewer.body.role).toBe("viewer");
      const session = await request(app)
        .get("/api/session")
        .set("Cookie", viewerCookie);
      expect(session.body.role).toBe("viewer");
    });

    it("lets a viewer read the dashboard without any credentials of the server", async () => {
      const response = await request(app)
        .get("/api/config")
        .set("Cookie", viewerCookie);

      expect(response.status).toBe(200);
      expect(response.body.role).toBe("viewer");
      expect(response.body.data.views).toBeDefined();
      const body = JSON.stringify(response.body);
      expect(body).not.toContain("test-password");
      expect(body).not.toContain("viewer-password");
    });

    it.each([
      ["POST", "/api/config", { views: [] }],
      ["GET", "/api/config/backups"],
      ["POST", "/api/config/restore", { sequence: 1 }],
      ["GET", "/api/images"],
      ["POST", "/api/images/upload"],
      ["DELETE", "/api/images/some.png"],
    ])("forbids a viewer from %s %s", async (method, url, body) => {
      const req = request(app)
        [method.toLowerCase()](url)
        .set("Cookie", viewerCookie);
      const response = await (body ? req.send(body) : req);
      expect(response.status).toBe(403);
    });

    it("never writes credentials into the config file and ignores injected ones", async () => {
      const response = await request(app)
        .post("/api/config")
        .set("Cookie", sessionCookie)
        .send({
          app: { title: "Hijack", password: "evil", viewerPassword: "evil2" },
          haConfig: {
            haUrl: "https://evil.example",
            accessToken: "evil-token",
          },
          views: [{ name: "overview", label: "Overview", entities: [] }],
        });
      expect(response.status).toBe(200);

      const raw = fs.readFileSync(
        path.join(testDataDir, "dashboard-config.json"),
        "utf-8",
      );
      const saved = JSON.parse(raw);
      expect(saved.app.title).toBe("Hijack");
      expect(saved.app.password).toBeUndefined();
      expect(saved.app.viewerPassword).toBeUndefined();
      expect(saved.haConfig).toBeUndefined();
      for (const secret of ["evil", "evil-token", "active-ha-token"]) {
        expect(raw).not.toContain(secret);
      }
      // Logins still use the environment passwords, and the connection is unchanged.
      expect((await login("evil")).status).toBe(401);
      expect((await login("viewer-password")).body.role).toBe("viewer");
      const served = await request(app)
        .get("/api/config")
        .set("Cookie", sessionCookie);
      expect(served.body.data.haConfig.accessToken).toBe("active-ha-token");
    });

    it("never serves credentials that an old config file still contains", async () => {
      const file = path.join(testDataDir, "dashboard-config.json");
      const original = fs.readFileSync(file, "utf-8");
      const legacy = JSON.parse(original);
      legacy.app = { ...legacy.app, password: "file-password" };
      legacy.haConfig = {
        haUrl: "https://file.example",
        accessToken: "file-token",
      };
      fs.writeFileSync(file, JSON.stringify(legacy));
      try {
        const served = await request(app)
          .get("/api/config")
          .set("Cookie", sessionCookie);
        const body = JSON.stringify(served.body);
        expect(body).not.toContain("file-password");
        expect(body).not.toContain("file-token");
        expect(body).not.toContain("file.example");
        expect(served.body.data.haConfig.accessToken).toBe("active-ha-token");
      } finally {
        fs.writeFileSync(file, original);
      }
    });
  });
});
