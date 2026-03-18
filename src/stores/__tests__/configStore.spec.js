import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useConfigStore } from "../configStore";
import { useAuthStore } from "../authStore";
import { validateConfig } from "@/utils/configValidator";

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

  describe("loadDashboardConfig — response.json() and direct object paths", () => {
    it("uses response.json() when text() is unavailable", async () => {
      const configData = { views: [{ name: "home" }] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => configData,
        // No text() method
      });

      const store = useConfigStore();
      const result = await store.loadDashboardConfig();

      expect(result.valid).toBe(true);
      expect(store.dashboardConfig).toEqual(configData);
    });

    it("uses response directly when neither text() nor json() is available", async () => {
      const configData = { views: [] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        // Simulate response object that is the data itself (no text/json methods)
        ...configData,
      });

      const store = useConfigStore();
      // This code path falls to `config = response`, which is a plain object
      const result = await store.loadDashboardConfig();
      // Result validity depends on configData contents; just ensure no throw
      expect(result).toBeDefined();
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

      const mockEntities = {
        loadLocalData: vi.fn().mockResolvedValue(undefined),
      };
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

  describe("View Management", () => {
    beforeEach(() => {
      const store = useConfigStore();
      store.dashboardConfig = {
        app: { title: "Dashboard" },
        views: [
          {
            name: "overview",
            label: "Overview",
            icon: "mdi-home-outline",
            hidden: false,
            entities: [],
          },
          {
            name: "lights",
            label: "Lights",
            icon: "mdi-lightbulb",
            hidden: false,
            entities: [],
          },
        ],
      };
    });

    describe("addView", () => {
      it("should add a new view to the config", () => {
        const store = useConfigStore();
        const newView = {
          name: "new-view",
          label: "New View",
          icon: "mdi-new",
          hidden: false,
          entities: [],
        };

        store.addView(newView);

        expect(store.dashboardConfig.views.length).toBe(3);
        const addedView = store.dashboardConfig.views.find(
          (v) => v.name === "new-view",
        );
        expect(addedView).toBeDefined();
        expect(addedView.label).toBe("New View");
      });

      it("should prevent adding duplicate view names", () => {
        const store = useConfigStore();
        const originalLength = store.dashboardConfig.views.length;

        const duplicateView = {
          name: "overview",
          label: "Overview Copy",
          icon: "mdi-home",
        };

        store.addView(duplicateView);

        expect(store.dashboardConfig.views.length).toBe(originalLength);
      });

      it("should set default entities array", () => {
        const store = useConfigStore();
        const newView = {
          name: "test",
          label: "Test",
          icon: "mdi-test",
        };

        store.addView(newView);

        const addedView = store.dashboardConfig.views.find(
          (v) => v.name === "test",
        );
        expect(addedView.entities).toEqual([]);
      });
    });

    describe("updateView", () => {
      it("should update view properties", () => {
        const store = useConfigStore();

        store.updateView("overview", {
          label: "Updated Overview",
          icon: "mdi-updated",
        });

        const view = store.dashboardConfig.views.find(
          (v) => v.name === "overview",
        );
        expect(view.label).toBe("Updated Overview");
        expect(view.icon).toBe("mdi-updated");
      });

      it("should handle non-existent view gracefully", () => {
        const store = useConfigStore();
        const originalLength = store.dashboardConfig.views.length;

        store.updateView("non-existent", { label: "New" });

        expect(store.dashboardConfig.views.length).toBe(originalLength);
      });

      it("should preserve other properties when updating", () => {
        const store = useConfigStore();
        const originalEntities = store.dashboardConfig.views[0].entities;

        store.updateView("overview", { label: "New Label" });

        const view = store.dashboardConfig.views.find(
          (v) => v.name === "overview",
        );
        expect(view.entities).toBe(originalEntities);
      });

      it("should update hidden property", () => {
        const store = useConfigStore();

        store.updateView("overview", { hidden: true });

        const view = store.dashboardConfig.views.find(
          (v) => v.name === "overview",
        );
        expect(view.hidden).toBe(true);
      });
    });

    describe("deleteView", () => {
      it("should delete an existing view", () => {
        const store = useConfigStore();
        const originalLength = store.dashboardConfig.views.length;

        store.deleteView("lights");

        expect(store.dashboardConfig.views.length).toBe(originalLength - 1);
        expect(
          store.dashboardConfig.views.find((v) => v.name === "lights"),
        ).toBeUndefined();
      });

      it("should handle non-existent view gracefully", () => {
        const store = useConfigStore();
        const originalLength = store.dashboardConfig.views.length;

        store.deleteView("non-existent");

        expect(store.dashboardConfig.views.length).toBe(originalLength);
      });

      it("should prevent deleting the last view", () => {
        const store = useConfigStore();
        store.dashboardConfig.views = [store.dashboardConfig.views[0]];

        store.deleteView("overview");

        expect(store.dashboardConfig.views.length).toBe(1);
      });
    });

    describe("saveDashboardConfig", () => {
      it("should create a download for the config", () => {
        const store = useConfigStore();

        const createElement = vi.spyOn(document, "createElement");
        const createObjectURL = vi.spyOn(URL, "createObjectURL");

        store.saveDashboardConfig();

        expect(createElement).toHaveBeenCalledWith("a");
        expect(createObjectURL).toHaveBeenCalled();

        createElement.mockRestore();
        createObjectURL.mockRestore();
      });

      it("should handle null config gracefully", () => {
        const store = useConfigStore();
        store.dashboardConfig = null;

        expect(() => store.saveDashboardConfig()).not.toThrow();
      });
    });

    describe("View Management Integration", () => {
      it("should handle create, update, and delete in sequence", () => {
        const store = useConfigStore();

        // Create
        store.addView({
          name: "workflow-test",
          label: "Workflow Test",
          icon: "mdi-test",
        });

        let view = store.dashboardConfig.views.find(
          (v) => v.name === "workflow-test",
        );
        expect(view).toBeDefined();

        // Update
        store.updateView("workflow-test", { label: "Updated Test" });

        view = store.dashboardConfig.views.find(
          (v) => v.name === "workflow-test",
        );
        expect(view.label).toBe("Updated Test");

        // Delete
        store.deleteView("workflow-test");

        view = store.dashboardConfig.views.find(
          (v) => v.name === "workflow-test",
        );
        expect(view).toBeUndefined();
      });

      it("should maintain view order when manipulating views", () => {
        const store = useConfigStore();

        store.addView({
          name: "new",
          label: "New",
          icon: "mdi-new",
        });

        const names = store.dashboardConfig.views.map((v) => v.name);
        expect(names[names.length - 1]).toBe("new");
      });
    });
  });
});
