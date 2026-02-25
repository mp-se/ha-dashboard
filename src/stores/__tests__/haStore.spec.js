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
  sensors: [],
  devices: [],
  areas: [],
  entityMap: new Map(),
  fetchStates: vi.fn(async () => {}),
  fetchEntityRegistry: vi.fn(async () => {}),
  fetchAreaRegistry: vi.fn(async () => {}),
  fetchDevicesAfterAuth: vi.fn(async () => {}),
  mapEntitiesToDevices: vi.fn(),
  loadLocalData: vi.fn(async () => {}),
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
};

vi.mock("../authStore", () => ({
  useAuthStore: vi.fn(() => mockAuth),
}));

vi.mock("../entitiesStore", () => ({
  useEntitiesStore: vi.fn(() => mockEntities),
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
    expect(bridge.sensors).toEqual(entities.sensors);
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
  });
});
