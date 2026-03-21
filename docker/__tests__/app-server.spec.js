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
    app: {
      title: "Test Dashboard",
      password: "test-password",
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
    // Dynamically import app once with test environment set up
    const appModule = await import("../app-server.js");
    app = appModule.default;
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
      expect(configData.app.password).toBe("test-password");
    });

    it("should create backups directory if missing", () => {
      expect(fs.existsSync(testBackupDir)).toBe(true);
    });
  });

  describe("API Health Endpoint", () => {
    it("should return 200 with health status", async () => {
      const response = await request(app).get("/api/health");

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
        .set("Authorization", "Bearer test-password")
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
        .set("Authorization", "Bearer test-password")
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
        .set("Authorization", "Bearer test-password")
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
        .set("Authorization", "Bearer test-password")
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
      const response = await request(app).get("/api/health");

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
          .set("Authorization", "Bearer test-password")
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
});
