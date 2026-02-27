import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "../authStore";
import { useConfigStore } from "../configStore";
import * as secureStorage from "@/utils/secureStorage";

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

      // Store encrypted credentials
      await secureStorage.setSecureItem("ha_url", "http://192.168.1.100:8123");
      await secureStorage.setSecureItem("ha_token", "saved-token");

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

    it("should save credentials to localStorage", async () => {
      const store = useAuthStore();
      await store.saveCredentials("http://new-url:8123", "new-token");

      // Verify credentials are encrypted in storage
      const savedUrl = await secureStorage.getSecureItem("ha_url");
      const savedToken = await secureStorage.getSecureItem("ha_token");

      expect(savedUrl).toBe("http://new-url:8123");
      expect(savedToken).toBe("new-token");
      expect(store.haUrl).toBe("http://new-url:8123");
      expect(store.accessToken).toBe("new-token");
      expect(store.credentialsFromConfig).toBe(false);
      expect(store.needsCredentials).toBe(false);
    });

    it("should clear credentials from localStorage", async () => {
      const store = useAuthStore();

      // Set up encrypted credentials first
      await secureStorage.setSecureItem("ha_url", "url");
      await secureStorage.setSecureItem("ha_token", "token");

      store.clearCredentials();

      expect(await secureStorage.getSecureItem("ha_url")).toBeNull();
      expect(await secureStorage.getSecureItem("ha_token")).toBeNull();
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

    it("should throw a timeout error when fetch takes too long", async () => {
      const store = useAuthStore();
      global.fetch.mockRejectedValueOnce(
        Object.assign(new Error("aborted"), { name: "AbortError" }),
      );
      await expect(
        store.fetchWithTimeout("http://test.com", {}, 1),
      ).rejects.toThrow("Request timeout after 1ms");
    });

    it("should re-throw non-abort fetch errors", async () => {
      const store = useAuthStore();
      global.fetch.mockRejectedValueOnce(new Error("Network crash"));
      await expect(store.fetchWithTimeout("http://test.com")).rejects.toThrow(
        "Network crash",
      );
    });
  });

  describe("wrapLibraryError edge cases", () => {
    it("wraps HTTPS + IP address connection failure with a certificate hint", () => {
      const store = useAuthStore();
      store.haUrl = "https://192.168.1.100:8123";
      const msg = store.wrapLibraryError(1); // ERR_CANNOT_CONNECT
      expect(msg).toContain("certificate");
    });

    it("wraps TypeError with 'Failed to fetch' as a CORS error", () => {
      const store = useAuthStore();
      store.haUrl = "http://ha:8123";
      const typeErr = new TypeError("Failed to fetch");
      const msg = store.wrapLibraryError(typeErr);
      expect(msg).toContain("CORS");
    });

    it("returns the error message for generic Error objects", () => {
      const store = useAuthStore();
      const msg = store.wrapLibraryError(new Error("something weird"));
      expect(msg).toBe("something weird");
    });

    it("returns generic fallback for unknown numeric codes", () => {
      const store = useAuthStore();
      const msg = store.wrapLibraryError(99);
      expect(typeof msg).toBe("string");
    });

    it("wraps string 'invalid_auth' error code", () => {
      const store = useAuthStore();
      const msg = store.wrapLibraryError("invalid_auth");
      expect(msg).toContain("Authentication failed");
    });

    it("wraps string 'cannot_connect' error code", () => {
      const store = useAuthStore();
      store.haUrl = "http://ha:8123";
      const msg = store.wrapLibraryError("cannot_connect");
      expect(msg).toContain("Failed to connect");
    });
  });

  describe("connectWebSocket", () => {
    it("returns early (undefined) in local mode", async () => {
      const store = useAuthStore();
      store.isLocalMode = true;
      const result = await store.connectWebSocket();
      expect(result).toBeUndefined();
    });

    it("throws when credentials are missing", async () => {
      const store = useAuthStore();
      store.isLocalMode = false;
      store.haUrl = "";
      store.accessToken = "";
      await expect(store.connectWebSocket()).rejects.toThrow(
        "Missing credentials",
      );
    });

    it("establishes connection and sets isConnected = true", async () => {
      const { createConnection } = await import("home-assistant-js-websocket");
      const mockConn = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
      };
      createConnection.mockResolvedValueOnce(mockConn);

      const store = useAuthStore();
      store.isLocalMode = false;
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";

      const conn = await store.connectWebSocket();

      expect(store.isConnected).toBe(true);
      expect(conn).toBe(mockConn);
      expect(store.getConnection()).toBe(mockConn);
    });

    it("returns existing connection when already connected", async () => {
      const { createConnection } = await import("home-assistant-js-websocket");
      const mockConn = { addEventListener: vi.fn(), close: vi.fn() };
      createConnection.mockResolvedValue(mockConn);

      const store = useAuthStore();
      store.isLocalMode = false;
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";

      await store.connectWebSocket();
      const secondResult = await store.connectWebSocket();

      expect(secondResult).toBe(mockConn);
      expect(createConnection).toHaveBeenCalledTimes(1);
    });

    it("sets lastError and rethrows on connection failure", async () => {
      const { createConnection } = await import("home-assistant-js-websocket");
      createConnection.mockRejectedValueOnce(new Error("conn failed"));

      const store = useAuthStore();
      store.isLocalMode = false;
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";

      await expect(store.connectWebSocket()).rejects.toThrow("conn failed");
      expect(store.isConnected).toBe(false);
      expect(store.lastError).toBeTruthy();
    });

    it("registers ready/disconnected event listeners", async () => {
      const { createConnection } = await import("home-assistant-js-websocket");
      const listeners = {};
      const mockConn = {
        addEventListener: vi.fn((event, handler) => {
          listeners[event] = handler;
        }),
        close: vi.fn(),
      };
      createConnection.mockResolvedValueOnce(mockConn);

      const store = useAuthStore();
      store.isLocalMode = false;
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";
      await store.connectWebSocket();

      // Simulate reconnect event
      listeners["ready"]?.();
      expect(store.isConnected).toBe(true);

      // Simulate disconnect event
      listeners["disconnected"]?.();
      expect(store.isConnected).toBe(false);
      expect(store.lastError).toBeTruthy();
    });
  });

  describe("callService extended", () => {
    it("returns early in local mode", async () => {
      const store = useAuthStore();
      store.isLocalMode = true;
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";
      await store.callService("light", "turn_on", {});
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns early when haUrl or accessToken is missing", async () => {
      const store = useAuthStore();
      store.isLocalMode = false;
      store.haUrl = "";
      store.accessToken = "";
      await store.callService("light", "turn_on", {});
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("throws a 403 forbidden error with correct message", async () => {
      const store = useAuthStore();
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });
      await expect(store.callService("light", "turn_on", {})).rejects.toThrow(
        "Access forbidden",
      );
    });

    it("throws a 404 not found error with correct message", async () => {
      const store = useAuthStore();
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });
      await expect(store.callService("light", "turn_on", {})).rejects.toThrow(
        "Service not found",
      );
    });

    it("throws a CORS error when fetch rejects with 'Failed to fetch'", async () => {
      const store = useAuthStore();
      store.haUrl = "http://ha:8123";
      store.accessToken = "tok";
      global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      await expect(store.callService("light", "turn_on", {})).rejects.toThrow(
        "CORS error",
      );
    });
  });

  describe("loadCredentials", () => {
    it("returns false when no credentials available", async () => {
      const store = useAuthStore();
      // localStorage is empty, no config, no env vars
      const result = await store.loadCredentials();
      expect(result).toBe(false);
      expect(store.haUrl).toBe("");
      expect(store.accessToken).toBe("");
    });
  });
});
