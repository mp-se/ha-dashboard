import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useConfigStore } from "../configStore";
import { useAuthStore } from "../authStore";
import { validateConfig } from "../../utils/configValidator";

// Mock fetch globally
global.fetch = vi.fn();

// Mock configValidator since we are unit testing the store
vi.mock("../../utils/configValidator", () => ({
  validateConfig: vi.fn(() => ({
    valid: true,
    errors: [],
    errorCount: 0,
  })),
}));

describe("useConfigStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal("fetch", vi.fn());
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const store = useConfigStore();
    expect(store.dashboardConfig).toBeNull();
    expect(store.configValidationError).toBeNull();
    expect(store.configErrorCount).toBe(0);
  });

  describe("Dashboard configuration loading", () => {
    it("should load dashboard configuration from network", async () => {
      const configData = {
        views: [{ name: "Living Room", entities: ["sensor.temperature"] }],
        app: {
          developerMode: true,
          localMode: false,
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(configData),
      });

      const store = useConfigStore();
      const auth = useAuthStore();

      const result = await store.loadDashboardConfig();

      expect(result.valid).toBe(true);
      expect(store.dashboardConfig).toEqual(configData);
      expect(auth.developerMode).toBe(true);
      expect(auth.isLocalMode).toBe(false);
    });

    it("should handle configuration load failure", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const store = useConfigStore();
      const result = await store.loadDashboardConfig();

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("404 Not Found");
      expect(store.dashboardConfig).toBeNull();
    });

    it("should handle syntactically invalid JSON", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "{ invalid json }",
      });

      const store = useConfigStore();
      const result = await store.loadDashboardConfig();

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("JSON syntax error");
      expect(store.dashboardConfig).toBeNull();
    });
  });

  describe("Config state management", () => {
    it("should manually set configuration and validation results", () => {
      const store = useConfigStore();
      const testConfig = { views: [] };
      const testErrors = [{ message: "Test error" }];

      store.dashboardConfig = testConfig;
      store.configValidationError = testErrors;
      store.configErrorCount = 1;

      expect(store.dashboardConfig).toEqual(testConfig);
      expect(store.configValidationError).toEqual(testErrors);
      expect(store.configErrorCount).toBe(1);
    });
  });

  describe("loadDashboardConfig — additional paths", () => {
    it("stores validation errors when config is invalid", async () => {
      validateConfig.mockReturnValueOnce({
        valid: false,
        errors: [{ message: "Missing required field: views" }],
        errorCount: 1,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ app: {} }),
      });

      const store = useConfigStore();
      const result = await store.loadDashboardConfig();

      expect(result.valid).toBe(false);
      expect(store.configValidationError).toHaveLength(1);
      expect(store.configErrorCount).toBe(1);
    });

    it("does not sync app flags when config has no app key", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ views: [] }),
      });

      const store = useConfigStore();
      const auth = useAuthStore();
      auth.developerMode = false;
      auth.isLocalMode = false;

      await store.loadDashboardConfig();

      // flags should remain unchanged since config has no app key
      expect(auth.developerMode).toBe(false);
      expect(auth.isLocalMode).toBe(false);
    });

    it("handles a network fetch exception gracefully", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network is down"));

      const store = useConfigStore();
      const result = await store.loadDashboardConfig();

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("Network is down");
    });
  });

  describe("reloadConfig", () => {
    it("preserves existing credentials after reload in non-local mode", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ views: [] }),
      });

      const store = useConfigStore();
      const auth = useAuthStore();
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "existing-token";
      auth.isLocalMode = false;

      const mockEntities = { loadLocalData: vi.fn() };
      const result = await store.reloadConfig(auth, mockEntities);

      expect(result.valid).toBe(true);
      expect(auth.haUrl).toBe("http://ha:8123");
      expect(auth.accessToken).toBe("existing-token");
      expect(mockEntities.loadLocalData).not.toHaveBeenCalled();
    });

    it("reloads local data when in local mode", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ views: [] }),
      });

      const store = useConfigStore();
      const auth = useAuthStore();
      auth.isLocalMode = true;

      const mockEntities = { loadLocalData: vi.fn().mockResolvedValue(undefined) };
      await store.reloadConfig(auth, mockEntities);

      expect(mockEntities.loadLocalData).toHaveBeenCalled();
    });

    it("returns error result when loadDashboardConfig throws internally", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Unexpected failure"));

      const store = useConfigStore();
      const auth = useAuthStore();
      auth.haUrl = "";
      auth.accessToken = "";
      auth.isLocalMode = false;

      const mockEntities = { loadLocalData: vi.fn() };
      const result = await store.reloadConfig(auth, mockEntities);

      // reloadConfig catches and returns error shape
      expect(result.valid).toBe(false);
    });
  });
});
