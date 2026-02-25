import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "../authStore";
import { useConfigStore } from "../configStore";

// Mock home-assistant-js-websocket library
vi.mock("home-assistant-js-websocket", () => {
  const mockConnection = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
  };

  return {
    createConnection: vi.fn(async () => mockConnection),
    createLongLivedTokenAuth: vi.fn((url, token) => ({
      access_token: token,
      hassUrl: url,
    })),
    ERR_CANNOT_CONNECT: 1,
    ERR_INVALID_AUTH: 2,
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useAuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const store = useAuthStore();
    expect(store.haUrl).toBe("");
    expect(store.accessToken).toBe("");
    expect(store.isConnected).toBe(false);
    expect(store.lastError).toBe(null);
    expect(store.isLoading).toBe(true);
    expect(store.isInitialized).toBe(false);
  });

  describe("Credentials management", () => {
    it("should load credentials from localStorage", async () => {
      const store = useAuthStore();
      localStorage.setItem("ha_url", "http://192.168.1.100:8123");
      localStorage.setItem("ha_token", "saved-token");

      const result = await store.loadCredentials();

      expect(result).toBe(true);
      expect(store.haUrl).toBe("http://192.168.1.100:8123");
      expect(store.accessToken).toBe("saved-token");
      expect(store.credentialsFromConfig).toBe(false);
    });

    it("should load credentials from configStore", async () => {
      const auth = useAuthStore();
      const config = useConfigStore();

      config.dashboardConfig = {
        haConfig: {
          haUrl: "http://config-url:8123",
          accessToken: "config-token",
        },
      };

      const result = await auth.loadCredentials();

      expect(result).toBe(true);
      expect(auth.haUrl).toBe("http://config-url:8123");
      expect(auth.accessToken).toBe("config-token");
      expect(auth.credentialsFromConfig).toBe(true);
    });

    it("should save credentials to localStorage", () => {
      const store = useAuthStore();
      store.saveCredentials("http://new-url:8123", "new-token");

      expect(localStorage.getItem("ha_url")).toBe("http://new-url:8123");
      expect(localStorage.getItem("ha_token")).toBe("new-token");
      expect(store.haUrl).toBe("http://new-url:8123");
      expect(store.accessToken).toBe("new-token");
    });

    it("should clear credentials from localStorage", () => {
      const store = useAuthStore();
      localStorage.setItem("ha_url", "url");
      localStorage.setItem("ha_token", "token");

      store.clearCredentials();

      expect(localStorage.getItem("ha_url")).toBeNull();
      expect(localStorage.getItem("ha_token")).toBeNull();
      expect(store.haUrl).toBe("");
      expect(store.accessToken).toBe("");
    });
  });

  describe("Error handling", () => {
    it("should set and clear errors", () => {
      const store = useAuthStore();
      store.setError("Something went wrong");
      expect(store.lastError).toBe("Something went wrong");

      store.clearError();
      expect(store.lastError).toBeNull();
    });

    it("should wrap library errors correctly", () => {
      const store = useAuthStore();

      // Invalid auth
      let msg = store.wrapLibraryError(2); // ERR_INVALID_AUTH
      expect(msg).toContain("Authentication failed");

      // Connection failure
      store.haUrl = "http://localhost:8123";
      msg = store.wrapLibraryError(1); // ERR_CANNOT_CONNECT
      expect(msg).toContain("Failed to connect");
    });
  });

  describe("Service calls", () => {
    it("should carry out POST requests for service calls", async () => {
      const store = useAuthStore();
      store.haUrl = "http://ha-url:8123";
      store.accessToken = "token";

      global.fetch.mockResolvedValueOnce({ ok: true });

      await store.callService("light", "turn_on", { entity_id: "light.test" });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://ha-url:8123/api/services/light/turn_on",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ entity_id: "light.test" }),
        }),
      );
    });

    it("should handle service call failures", async () => {
      const store = useAuthStore();
      store.haUrl = "http://ha-url:8123";
      store.accessToken = "token";

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(store.callService("light", "turn_on", {})).rejects.toThrow(
        "Authentication failed",
      );
    });
  });

  describe("API fetch with timeout", () => {
    it("should successfully fetch before timeout", async () => {
      const store = useAuthStore();
      global.fetch.mockResolvedValueOnce({ ok: true });

      const response = await store.fetchWithTimeout("http://test.com");
      expect(response.ok).toBe(true);
    });
  });
});
