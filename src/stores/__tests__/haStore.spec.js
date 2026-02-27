import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHaStore } from "../haStore";
import { useAuthStore } from "../authStore";
import { useConfigStore } from "../configStore";
import { useEntitiesStore } from "../entitiesStore";

// Mock sub-stores so we can test the bridge logic in isolation
const mockAuth = {
  haUrl: "",
  accessToken: "",
  isConnected: false,
  lastError: null,
  isLocalMode: false,
  developerMode: false,
  credentialsFromConfig: false,
  needsCredentials: false,
  isLoading: true,
  isInitialized: false,
  loadCredentials: vi.fn(async () => true),
  connectWebSocket: vi.fn(async () => ({})),
  clearError: vi.fn(),
  setError: vi.fn(),
};

const mockEntities = {
  entities: [],
  devices: [],
  areas: [],
  entityMap: new Map(),
  fetchStates: vi.fn(async () => {}),
  fetchEntityRegistry: vi.fn(async () => {}),
  fetchAreaRegistry: vi.fn(async () => {}),
  fetchDevicesAfterAuth: vi.fn(async () => {}),
  mapEntitiesToDevices: vi.fn(),
  loadLocalData: vi.fn(async () => {}),
  unsubscribeEntities: vi.fn(),
  getWeatherEntities: vi.fn(() => []),
};

const mockForecast = {
  forecasts: {},
  forecastSubscriptions: {},
  forecastSupport: {},
  forecastErrors: {},
  forecastLoading: {},
  subscribeToWeatherForecast: vi.fn(),
};

const mockConfig = {
  dashboardConfig: null,
  configValidationError: null,
  configErrorCount: 0,
  loadDashboardConfig: vi.fn(async () => ({
    valid: true,
    errors: [],
    errorCount: 0,
  })),
  reloadConfig: vi.fn(async () => ({ valid: true })),
};

vi.mock("../authStore", () => ({
  useAuthStore: vi.fn(() => mockAuth),
}));

vi.mock("../entitiesStore", () => ({
  useEntitiesStore: vi.fn(() => mockEntities),
}));

vi.mock("../forecastStore", () => ({
  useForecastStore: vi.fn(() => mockForecast),
}));

vi.mock("../configStore", () => ({
  useConfigStore: vi.fn(() => mockConfig),
}));

describe("useHaStore (Bridge)", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset mock properties that might have been changed in tests
    mockAuth.isLocalMode = false;
    mockAuth.isInitialized = false;
    mockAuth.isLoading = true;
    mockAuth.needsCredentials = false;
    mockAuth.lastError = null;
    mockConfig.dashboardConfig = null;
    mockConfig.configValidationError = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize by linking to sub-store properties", () => {
    const bridge = useHaStore();
    const auth = useAuthStore();
    const entities = useEntitiesStore();
    const config = useConfigStore();

    // Verify properties are exposed through the bridge
    expect(bridge.isLoading).toBe(auth.isLoading);
    expect(bridge.entities).toEqual(entities.entities);
    expect(bridge.dashboardConfig).toBe(config.dashboardConfig);
  });

  describe("init() sequence", () => {
    it("should coordinate successful initialization across sub-stores", async () => {
      const bridge = useHaStore();

      // Mock some return values
      mockConfig.loadDashboardConfig.mockResolvedValue({ valid: true });
      mockAuth.loadCredentials.mockResolvedValue(true);
      mockAuth.connectWebSocket.mockResolvedValue({ some: "connection" });

      await bridge.init();

      // Check the sequence
      expect(mockConfig.loadDashboardConfig).toHaveBeenCalled();
      expect(mockAuth.loadCredentials).toHaveBeenCalled();
      expect(mockAuth.connectWebSocket).toHaveBeenCalled();
      expect(mockEntities.fetchStates).toHaveBeenCalled();

      expect(mockAuth.isInitialized).toBe(true);
      expect(mockAuth.isLoading).toBe(false);
    });

    it("should handle initialization failure in local mode if data load fails", async () => {
      const bridge = useHaStore();

      mockAuth.isLocalMode = true;
      mockEntities.loadLocalData.mockRejectedValue(
        new Error("Local data not found"),
      );

      await bridge.init();

      // Check failure handling
      expect(mockEntities.loadLocalData).toHaveBeenCalled();
      expect(mockAuth.setError).toHaveBeenCalledWith("Local data not found");
      expect(mockAuth.isInitialized).toBe(false);
      expect(mockAuth.isLoading).toBe(false);
    });

    it("should stop if credentials are missing and not in local mode", async () => {
      const bridge = useHaStore();

      mockAuth.isLocalMode = false;
      mockAuth.loadCredentials.mockResolvedValue(false);

      await bridge.init();

      expect(mockAuth.needsCredentials).toBe(true);
      expect(mockAuth.isLoading).toBe(false);
      expect(mockAuth.connectWebSocket).not.toHaveBeenCalled();
    });

    it("should throw and catch when connectWebSocket returns null", async () => {
      const bridge = useHaStore();

      mockAuth.isLocalMode = false;
      mockAuth.loadCredentials.mockResolvedValue(true);
      mockAuth.connectWebSocket.mockResolvedValue(null); // null → throws

      await bridge.init();

      expect(mockAuth.isLoading).toBe(false);
      expect(mockAuth.isInitialized).toBe(false);
      expect(mockAuth.setError).toHaveBeenCalledWith(
        "Connection failed: connection object is null",
      );
    });

    it("should set needsCredentials on websocket failure when not in local mode", async () => {
      const bridge = useHaStore();

      mockAuth.isLocalMode = false;
      mockAuth.loadCredentials.mockResolvedValue(true);
      mockAuth.connectWebSocket.mockRejectedValue(
        new Error("Connection refused"),
      );

      await bridge.init();

      expect(mockAuth.needsCredentials).toBe(true);
      expect(mockAuth.isLoading).toBe(false);
      expect(mockAuth.setError).toHaveBeenCalledWith("Connection refused");
    });

    it("should not set needsCredentials when error occurs in local mode", async () => {
      const bridge = useHaStore();

      mockAuth.isLocalMode = true;
      mockEntities.loadLocalData.mockRejectedValue(new Error("IO error"));

      await bridge.init();

      expect(mockAuth.needsCredentials).toBe(false);
    });

    it("should format error message when error is a number code", async () => {
      const bridge = useHaStore();

      mockAuth.isLocalMode = false;
      mockAuth.loadCredentials.mockResolvedValue(true);
      // Reject with a number (HA error code pattern)
      mockAuth.connectWebSocket.mockRejectedValue(3); // typeof === 'number'

      await bridge.init();

      expect(mockAuth.setError).toHaveBeenCalledWith(
        "Connection failed (code 3). Please check your URL and network.",
      );
    });

    it("should not overwrite a pre-existing lastError", async () => {
      const bridge = useHaStore();

      mockAuth.isLocalMode = false;
      mockAuth.lastError = "Pre-existing auth error";
      mockAuth.loadCredentials.mockResolvedValue(true);
      mockAuth.connectWebSocket.mockRejectedValue(new Error("New error"));

      await bridge.init();

      // setError should NOT be called since lastError is already set
      expect(mockAuth.setError).not.toHaveBeenCalled();
    });

    it("should sync developerMode from dashboardConfig", async () => {
      const bridge = useHaStore();

      mockConfig.dashboardConfig = {
        app: { developerMode: true, localMode: false },
      };
      mockConfig.loadDashboardConfig.mockImplementation(async () => {
        // simulate setting dashboardConfig during load
        return { valid: true };
      });
      mockAuth.isLocalMode = true; // skip WS path

      await bridge.init();

      // developerMode was synced from config during init()
      expect(mockAuth.developerMode).toBe(true);
    });

    it("should stop early when config has a JSON validation error", async () => {
      const bridge = useHaStore();

      mockConfig.configValidationError = [
        { message: "JSON syntax error line 5" },
      ];
      mockConfig.loadDashboardConfig.mockResolvedValue({ valid: false });

      await bridge.init();

      // Should stop before loading credentials
      expect(mockAuth.loadCredentials).not.toHaveBeenCalled();
      expect(mockAuth.isLoading).toBe(false);
    });
  });

  describe("retryConnection()", () => {
    it("should clear error, reset connection, unsubscribe and re-init", async () => {
      const bridge = useHaStore();

      mockAuth.loadCredentials.mockResolvedValue(true);
      mockAuth.connectWebSocket.mockResolvedValue({ conn: true });

      await bridge.retryConnection();

      expect(mockAuth.clearError).toHaveBeenCalled();
      expect(mockEntities.unsubscribeEntities).toHaveBeenCalled();
      // init() runs successfully
      expect(mockAuth.isInitialized).toBe(true);
    });
  });

  describe("reloadConfig()", () => {
    it("should delegate to configStore.reloadConfig with auth and entities", async () => {
      const bridge = useHaStore();

      await bridge.reloadConfig();

      expect(mockConfig.reloadConfig).toHaveBeenCalledWith(
        mockAuth,
        mockEntities,
      );
    });
  });

  describe("autoFetchWeatherForecasts()", () => {
    it("should subscribe to daily forecast when supported_features has bit 1", () => {
      const bridge = useHaStore();

      mockEntities.getWeatherEntities.mockReturnValue([
        { entity_id: "weather.home", attributes: { supported_features: 1 } },
      ]);

      bridge.autoFetchWeatherForecasts();

      expect(mockForecast.subscribeToWeatherForecast).toHaveBeenCalledWith(
        "weather.home",
        "daily",
      );
    });

    it("should subscribe to hourly forecast when supported_features has bit 2", () => {
      const bridge = useHaStore();

      mockEntities.getWeatherEntities.mockReturnValue([
        { entity_id: "weather.office", attributes: { supported_features: 2 } },
      ]);

      bridge.autoFetchWeatherForecasts();

      expect(mockForecast.subscribeToWeatherForecast).toHaveBeenCalledWith(
        "weather.office",
        "hourly",
      );
    });

    it("should subscribe to twice_daily forecast when supported_features has bit 4", () => {
      const bridge = useHaStore();

      mockEntities.getWeatherEntities.mockReturnValue([
        { entity_id: "weather.garage", attributes: { supported_features: 4 } },
      ]);

      bridge.autoFetchWeatherForecasts();

      expect(mockForecast.subscribeToWeatherForecast).toHaveBeenCalledWith(
        "weather.garage",
        "twice_daily",
      );
    });

    it("should default to daily when supported_features is 0", () => {
      const bridge = useHaStore();

      mockEntities.getWeatherEntities.mockReturnValue([
        {
          entity_id: "weather.fallback",
          attributes: { supported_features: 0 },
        },
      ]);

      bridge.autoFetchWeatherForecasts();

      expect(mockForecast.subscribeToWeatherForecast).toHaveBeenCalledWith(
        "weather.fallback",
        "daily",
      );
    });

    it("should handle weather entities with no supported_features attribute", () => {
      const bridge = useHaStore();

      mockEntities.getWeatherEntities.mockReturnValue([
        { entity_id: "weather.bare", attributes: {} },
      ]);

      bridge.autoFetchWeatherForecasts();

      expect(mockForecast.subscribeToWeatherForecast).toHaveBeenCalledWith(
        "weather.bare",
        "daily",
      );
    });

    it("should do nothing when there are no weather entities", () => {
      const bridge = useHaStore();

      mockEntities.getWeatherEntities.mockReturnValue([]);

      bridge.autoFetchWeatherForecasts();

      expect(mockForecast.subscribeToWeatherForecast).not.toHaveBeenCalled();
    });
  });
});
