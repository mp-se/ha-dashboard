import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useConfigStore } from "../configStore";
import { useAuthStore } from "../authStore";

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
});
