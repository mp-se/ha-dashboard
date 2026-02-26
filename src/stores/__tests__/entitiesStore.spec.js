import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useEntitiesStore } from "../entitiesStore";
import { useAuthStore } from "../authStore";

// Mock home-assistant-js-websocket library
vi.mock("home-assistant-js-websocket", () => {
  const mockConnection = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    sendMessagePromise: vi.fn(),
    subscribeMessage: vi.fn(),
  };

  return {
    createConnection: vi.fn(async () => mockConnection),
    createLongLivedTokenAuth: vi.fn((url, token) => ({
      access_token: token,
      hassUrl: url,
    })),
    subscribeEntities: vi.fn((connection, callback) => {
      callback({
        "sensor.test": {
          entity_id: "sensor.test",
          state: "on",
          attributes: { friendly_name: "Test Entity" },
        },
      });
      return vi.fn(); // Unsubscribe function
    }),
    ERR_CANNOT_CONNECT: 1,
    ERR_INVALID_AUTH: 2,
  };
});

// Mock fetch globally
global.fetch = vi.fn();

/** Helper: build a mock connection with jest-compatible spy methods. */
function makeMockConnection(overrides = {}) {
  return {
    sendMessagePromise: vi.fn(),
    subscribeMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...overrides,
  };
}

describe("useEntitiesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal("fetch", vi.fn());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const store = useEntitiesStore();
    expect(store.sensors).toEqual([]);
    expect(store.devices).toEqual([]);
    expect(store.areas).toEqual([]);
    expect(store.entityMap).toBeInstanceOf(Map);
    expect(store.entityMap.size).toBe(0);
  });

  describe("Sensor management", () => {
    it("should update sensors and maintain the entity map", () => {
      const store = useEntitiesStore();
      const testSensors = [
        {
          entity_id: "sensor.temp",
          state: "23",
          attributes: { friendly_name: "Temperature" },
        },
        {
          entity_id: "sensor.humidity",
          state: "65",
          attributes: { friendly_name: "Humidity" },
        },
      ];

      store.sensors = testSensors;

      expect(store.sensors).toEqual(testSensors);
      expect(store.sensors.length).toBe(2);
      expect(store.entityMap.has("sensor.temp")).toBe(true);
      expect(store.entityMap.get("sensor.temp").state).toBe("23");
    });

    it("should clear all non-virtual sensors correctly", () => {
      const store = useEntitiesStore();
      store.sensors = [
        { entity_id: "sensor.temp", state: "23", attributes: {} },
        { entity_id: "area.living_room", state: "on", attributes: {} }, // virtual entity
      ];

      store.clearAllSensors();

      expect(store.sensors.length).toBe(1);
      expect(store.sensors[0].entity_id).toBe("area.living_room");
    });
  });

  describe("Device and area registries", () => {
    it("should set device list", () => {
      const store = useEntitiesStore();
      const testDevices = [
        { id: "device1", name: "Light 1", area_id: "area1" },
        { id: "device2", name: "Light 2", area_id: "area1" },
      ];

      store.devices = testDevices;

      expect(store.devices).toEqual(testDevices);
      expect(store.devices.length).toBe(2);
    });

    it("should set area registry", () => {
      const store = useEntitiesStore();
      const testAreas = [
        { area_id: "area1", name: "Living Room", icon: "mdi:sofa" },
      ];

      store.areas = testAreas;

      expect(store.areas).toEqual(testAreas);
      expect(store.areas.length).toBe(1);
    });
  });

  describe("Local data loading", () => {
    it("should load local data from public JSON", async () => {
      const localData = {
        sensors: [
          { entity_id: "sensor.local_temp", state: "22", attributes: {} },
        ],
        devices: [{ id: "dev1", name: "Local Device" }],
        areas: [{ area_id: "living", name: "Living" }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => localData,
      });

      const store = useEntitiesStore();
      await store.loadLocalData();

      expect(store.sensors).toEqual(localData.sensors);
      expect(store.devices).toEqual(localData.devices);
      expect(store.areas).toEqual(localData.areas);
    });

    it("should handle local data load failure", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const store = useEntitiesStore();
      await expect(store.loadLocalData()).rejects.toThrow(
        "Local data file not found",
      );
    });
  });

  describe("Entity filtering and categorization", () => {
    beforeEach(() => {
      const store = useEntitiesStore();
      store.sensors = [
        {
          entity_id: "sensor.temp_battery",
          state: "45",
          attributes: { device_class: "battery" },
        },
        {
          entity_id: "light.living_room",
          state: "on",
          attributes: { friendly_name: "Light" },
        },
        { entity_id: "sun.sun", state: "above_horizon", attributes: {} },
        { entity_id: "binary_sensor.front_door", state: "on", attributes: {} },
        { entity_id: "weather.forecast_home", state: "sunny", attributes: {} },
        { entity_id: "switch.coffee_maker", state: "off", attributes: {} },
      ];
    });

    it("should filter battery sensors", () => {
      const store = useEntitiesStore();
      const batteries = store.getBatterySensors();
      expect(batteries.length).toBe(1);
      expect(batteries[0].entity_id).toBe("sensor.temp_battery");
    });

    it("should filter lights", () => {
      const store = useEntitiesStore();
      const lights = store.getLights();
      expect(lights.length).toBe(1);
      expect(lights[0].entity_id).toBe("light.living_room");
    });

    it("should provide specialized sun filtering", () => {
      const store = useEntitiesStore();
      const suns = store.getSuns();
      expect(suns.length).toBe(1);
      expect(suns[0].entity_id).toBe("sun.sun");
    });

    it("should identify binary sensors", () => {
      const store = useEntitiesStore();
      const binary = store.getBinarySensors();
      expect(binary.length).toBe(1);
      expect(binary[0].entity_id).toBe("binary_sensor.front_door");
    });

    it("should group entities by common domains", () => {
      const store = useEntitiesStore();
      expect(store.getSwitches().length).toBe(1);
      expect(store.getWeatherEntities().length).toBe(1);
      expect(store.getSensors().length).toBe(1);
    });
  });

  describe("Device and entity relationship mapping", () => {
    it("should map sensors to devices and areas", () => {
      const store = useEntitiesStore();

      // Setup devices and areas
      store.devices = [
        { id: "device1", name: "Light 1", area_id: "area1", entities: [] },
      ];
      store.areas = [{ area_id: "area1", name: "Living Room", entities: [] }];

      // Setup sensors with device_id attributes
      store.sensors = [
        {
          entity_id: "sensor.temp",
          state: "23",
          attributes: { device_id: "device1" },
        },
        {
          entity_id: "area.area1", // virtual area sensor
          state: "Living Room",
          attributes: { id: "area1" },
        },
      ];

      store.mapEntitiesToDevices();

      expect(store.devices[0].entities).toContain("sensor.temp");
      expect(store.areas[0].entities).toContain("sensor.temp");

      const virtualArea = store.entityMap.get("area.area1");
      expect(virtualArea.entities).toContain("sensor.temp");
    });

    it("should return early when devices list is empty", () => {
      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "sensor.temp", state: "20", attributes: { device_id: "d1" } }];
      store.devices = [];
      store.mapEntitiesToDevices(); // no-op, should not throw
      expect(store.sensors[0].entity_id).toBe("sensor.temp");
    });
  });

  describe("fetchStates", () => {
    it("returns early in local mode without touching connection", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = true;
      const store = useEntitiesStore();
      const getConnSpy = vi.spyOn(auth, "getConnection");
      await store.fetchStates();
      expect(getConnSpy).not.toHaveBeenCalled();
    });

    it("returns early when there is no connection", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(null);
      const store = useEntitiesStore();
      await store.fetchStates(); // should resolve without error
    });

    it("subscribes to entities, populates sensors, and resolves", async () => {
      const { subscribeEntities } = await import("home-assistant-js-websocket");
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      const store = useEntitiesStore();
      await store.fetchStates();

      expect(subscribeEntities).toHaveBeenCalled();
      expect(store.sensors.length).toBeGreaterThan(0);
      expect(store.entityMap.has("sensor.test")).toBe(true);
    });

    it("updates existing entity in-place on subsequent subscription callbacks", async () => {
      const { subscribeEntities } = await import("home-assistant-js-websocket");
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      // Make subscribeEntities call callback twice
      let callCount = 0;
      subscribeEntities.mockImplementation((connection, cb) => {
        cb({ "sensor.a": { entity_id: "sensor.a", state: "1", attributes: {} } });
        callCount++;
        if (callCount === 1) {
          cb({ "sensor.a": { entity_id: "sensor.a", state: "2", attributes: {} } });
        }
        return vi.fn();
      });

      const store = useEntitiesStore();
      await store.fetchStates();

      expect(store.entityMap.get("sensor.a").state).toBe("2");
    });

    it("removes entities that no longer exist (non-virtual)", async () => {
      const { subscribeEntities } = await import("home-assistant-js-websocket");
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      subscribeEntities.mockImplementation((connection, cb) => {
        cb({ "sensor.new": { entity_id: "sensor.new", state: "5", attributes: {} } });
        return vi.fn();
      });

      const store = useEntitiesStore();
      store.sensors = [
        { entity_id: "sensor.old", state: "3", attributes: {} },
        { entity_id: "area.living", state: "Living", attributes: {} }, // virtual — must stay
      ];

      await store.fetchStates();

      expect(store.entityMap.has("sensor.old")).toBe(false);
      expect(store.entityMap.has("area.living")).toBe(true);
    });
  });

  describe("fetchEntityRegistry", () => {
    it("returns early in local mode", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = true;
      const store = useEntitiesStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(null);
      await store.fetchEntityRegistry(); // should not throw
    });

    it("maps device_id from registry to sensor attributes", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      conn.sendMessagePromise.mockResolvedValueOnce([
        { entity_id: "sensor.temp", device_id: "device-abc" },
      ]);

      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "sensor.temp", state: "20", attributes: {} }];

      await store.fetchEntityRegistry();

      expect(store.sensors[0].attributes.device_id).toBe("device-abc");
    });

    it("handles sendMessagePromise returning result-wrapped array", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      conn.sendMessagePromise.mockResolvedValueOnce({
        result: [{ entity_id: "sensor.x", device_id: "dev-1" }],
      });

      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "sensor.x", state: "1", attributes: {} }];
      await store.fetchEntityRegistry();
      expect(store.sensors[0].attributes.device_id).toBe("dev-1");
    });

    it("handles errors gracefully", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);
      conn.sendMessagePromise.mockRejectedValueOnce(new Error("registry fail"));

      const store = useEntitiesStore();
      await expect(store.fetchEntityRegistry()).resolves.toBeUndefined();
    });
  });

  describe("fetchAreaRegistry", () => {
    it("returns early in local mode", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = true;
      const store = useEntitiesStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(null);
      await store.fetchAreaRegistry();
      expect(store.areas).toEqual([]);
    });

    it("populates areas and creates virtual area sensors", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      conn.sendMessagePromise.mockResolvedValueOnce([
        { area_id: "kitchen", name: "Kitchen", icon: "mdi:stove", picture: null, aliases: [] },
      ]);

      const store = useEntitiesStore();
      await store.fetchAreaRegistry();

      expect(store.areas.length).toBe(1);
      expect(store.areas[0].name).toBe("Kitchen");
      expect(store.entityMap.has("area.kitchen")).toBe(true);
      expect(store.entityMap.get("area.kitchen").state).toBe("Kitchen");
    });

    it("does not add duplicate virtual area sensors", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      conn.sendMessagePromise.mockResolvedValueOnce([
        { area_id: "hall", name: "Hall", icon: null, picture: null, aliases: [] },
      ]);

      const store = useEntitiesStore();
      // Pre-populate virtual entity
      store.sensors = [{ entity_id: "area.hall", state: "Hall", attributes: {} }];
      await store.fetchAreaRegistry();

      const areaEntities = store.sensors.filter((s) => s.entity_id === "area.hall");
      expect(areaEntities.length).toBe(1);
    });

    it("handles errors gracefully", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);
      conn.sendMessagePromise.mockRejectedValueOnce(new Error("area fail"));
      const store = useEntitiesStore();
      await expect(store.fetchAreaRegistry()).resolves.toBeUndefined();
    });
  });

  describe("fetchDevicesAfterAuth", () => {
    it("returns early in local mode", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = true;
      const store = useEntitiesStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(null);
      await store.fetchDevicesAfterAuth();
      expect(store.devices).toEqual([]);
    });

    it("populates devices from registry", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      conn.sendMessagePromise.mockResolvedValueOnce([
        { id: "d1", name: "Plug", model: "SP600", manufacturer: "TP-Link", sw_version: "1.0", area_id: "kitchen" },
      ]);

      const store = useEntitiesStore();
      await store.fetchDevicesAfterAuth();

      expect(store.devices.length).toBe(1);
      expect(store.devices[0].id).toBe("d1");
      expect(store.devices[0].name).toBe("Plug");
      expect(store.devices[0].entities).toEqual([]);
    });

    it("handles errors gracefully", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);
      conn.sendMessagePromise.mockRejectedValueOnce(new Error("device fail"));
      const store = useEntitiesStore();
      await expect(store.fetchDevicesAfterAuth()).resolves.toBeUndefined();
    });
  });

  describe("subscribeToWeatherForecast", () => {
    it("does nothing if entity is not found", async () => {
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(makeMockConnection());
      const store = useEntitiesStore();
      await store.subscribeToWeatherForecast("weather.missing");
      expect(store.forecastErrors["weather.missing"]).toBe("Entity not found");
    });

    it("does nothing if WebSocket is not connected", async () => {
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(null);
      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "weather.home", state: "sunny", attributes: {} }];
      await store.subscribeToWeatherForecast("weather.home");
      expect(store.forecastErrors["weather.home"]).toBe("WebSocket not connected");
    });

    it("skips if already subscribed", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);
      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "weather.home", state: "sunny", attributes: {} }];
      store.forecastSubscriptions["weather.home"] = vi.fn();

      await store.subscribeToWeatherForecast("weather.home");
      expect(conn.subscribeMessage).not.toHaveBeenCalled();
    });

    it("subscribes and updates forecast data on callback", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      let capturedCallback;
      const unsub = vi.fn();
      conn.subscribeMessage.mockImplementation((cb, _msg, _opts) => {
        capturedCallback = cb;
        return Promise.resolve(unsub);
      });

      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "weather.home", state: "sunny", attributes: {} }];

      await store.subscribeToWeatherForecast("weather.home", "daily");

      // Simulate forecast data arriving
      capturedCallback({
        type: "daily",
        forecast: [{ datetime: "2026-02-26", temperature: 15 }],
      });

      expect(store.forecasts["weather.home"]).toBeDefined();
      expect(store.forecasts["weather.home"].data.length).toBe(1);
      expect(store.forecastErrors["weather.home"]).toBeNull();
      expect(store.forecastLoading["weather.home"]).toBe(false);
    });

    it("handles subscription errors", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);
      conn.subscribeMessage.mockRejectedValueOnce(new Error("subscribe failed"));

      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "weather.home", state: "sunny", attributes: {} }];
      await store.subscribeToWeatherForecast("weather.home");

      expect(store.forecastErrors["weather.home"]).toBe("subscribe failed");
      expect(store.forecastLoading["weather.home"]).toBe(false);
    });
  });

  describe("fetchHistory", () => {
    it("returns [] in local mode", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = true;
      const store = useEntitiesStore();
      const result = await store.fetchHistory("sensor.temp");
      expect(result).toEqual([]);
    });

    it("returns [] when haUrl or accessToken missing", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "";
      auth.accessToken = "";
      const store = useEntitiesStore();
      const result = await store.fetchHistory("sensor.temp");
      expect(result).toEqual([]);
    });

    it("fetches and returns parsed history data", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      const mockHistory = [
        [
          { last_changed: "2026-02-26T10:00:00Z", state: "22.5" },
          { last_changed: "2026-02-26T11:00:00Z", state: "23.0" },
        ],
      ];

      vi.spyOn(auth, "fetchWithTimeout").mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const store = useEntitiesStore();
      const result = await store.fetchHistory("sensor.temp", 24, 200);

      expect(result.length).toBe(2);
      expect(result[0].v).toBe(22.5);
      expect(typeof result[0].t).toBe("number");
    });

    it("samples data when result exceeds maxPoints", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      const points = Array.from({ length: 500 }, (_, i) => ({
        last_changed: new Date(Date.now() - i * 1000).toISOString(),
        state: String(i),
      }));

      vi.spyOn(auth, "fetchWithTimeout").mockResolvedValueOnce({
        ok: true,
        json: async () => [points],
      });

      const store = useEntitiesStore();
      const result = await store.fetchHistory("sensor.temp", 24, 100);
      expect(result.length).toBe(100);
    });

    it("throws on HTTP error response", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      vi.spyOn(auth, "fetchWithTimeout").mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const store = useEntitiesStore();
      await expect(store.fetchHistory("sensor.temp")).rejects.toThrow("History request failed: 503");
    });

    it("returns cached result on second call within TTL", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      const mockFetch = vi.spyOn(auth, "fetchWithTimeout").mockResolvedValue({
        ok: true,
        json: async () => [[{ last_changed: "2026-02-26T10:00:00Z", state: "22" }]],
      });

      const store = useEntitiesStore();
      await store.fetchHistory("sensor.temp", 24);
      await store.fetchHistory("sensor.temp", 24);

      // fetchWithTimeout called only once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchEnergyHistory", () => {
    it("returns [] in local mode", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = true;
      const store = useEntitiesStore();
      const result = await store.fetchEnergyHistory("sensor.energy");
      expect(result).toEqual([]);
    });

    it("returns [] when haUrl or accessToken missing", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "";
      auth.accessToken = "";
      const store = useEntitiesStore();
      const result = await store.fetchEnergyHistory("sensor.energy");
      expect(result).toEqual([]);
    });

    it("groups energy entries into hourly buckets (days=1)", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      const now = new Date();
      const entries = [
        { last_changed: new Date(now.getTime() - 1800000).toISOString(), state: "10" },
        { last_changed: new Date(now.getTime() - 1200000).toISOString(), state: "20" },
      ];

      vi.spyOn(auth, "fetchWithTimeout").mockResolvedValueOnce({
        ok: true,
        json: async () => [entries],
      });

      const store = useEntitiesStore();
      const result = await store.fetchEnergyHistory("sensor.energy", 1);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(24); // 24 hourly buckets for days=1
    });

    it("groups energy entries into daily buckets (days=7)", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      const now = new Date();
      const entry = { last_changed: new Date(now.getTime() - 86400000).toISOString(), state: "5" };

      vi.spyOn(auth, "fetchWithTimeout").mockResolvedValueOnce({
        ok: true,
        json: async () => [[entry]],
      });

      const store = useEntitiesStore();
      const result = await store.fetchEnergyHistory("sensor.energy", 7);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7); // 7 daily buckets
    });

    it("returns [] for empty body", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      vi.spyOn(auth, "fetchWithTimeout").mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const store = useEntitiesStore();
      const result = await store.fetchEnergyHistory("sensor.energy");
      expect(result).toEqual([]);
    });

    it("throws on HTTP error response", async () => {
      const auth = useAuthStore();
      auth.isLocalMode = false;
      auth.haUrl = "http://ha:8123";
      auth.accessToken = "tok";

      vi.spyOn(auth, "fetchWithTimeout").mockResolvedValueOnce({ ok: false, status: 500 });

      const store = useEntitiesStore();
      await expect(store.fetchEnergyHistory("sensor.energy")).rejects.toThrow(
        "Energy history request failed: 500",
      );
    });
  });

  describe("saveLocalData", () => {
    it("triggers a download of currently loaded data as JSON", () => {
      const store = useEntitiesStore();
      store.sensors = [{ entity_id: "sensor.temp", state: "20", attributes: {} }];
      store.devices = [{ id: "d1", name: "Device" }];

      const createObjectURL = vi.fn(() => "blob:url");
      const revokeObjectURL = vi.fn();
      const clickFn = vi.fn();

      Object.defineProperty(global, "URL", {
        value: { createObjectURL, revokeObjectURL },
        writable: true,
      });
      const anchor = { href: "", download: "", click: clickFn };
      vi.spyOn(document, "createElement").mockReturnValueOnce(anchor);

      store.saveLocalData();

      expect(createObjectURL).toHaveBeenCalled();
      expect(clickFn).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:url");
    });
  });

  describe("unsubscribeEntities", () => {
    it("calls unsubscribe function if one was set by fetchStates", async () => {
      const { subscribeEntities } = await import("home-assistant-js-websocket");
      const unsubFn = vi.fn();
      subscribeEntities.mockImplementationOnce((conn, cb) => {
        cb({ "sensor.x": { entity_id: "sensor.x", state: "1", attributes: {} } });
        return unsubFn;
      });

      const conn = makeMockConnection();
      const auth = useAuthStore();
      auth.isLocalMode = false;
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      const store = useEntitiesStore();
      await store.fetchStates();
      store.unsubscribeEntities();

      expect(unsubFn).toHaveBeenCalled();
    });

    it("is safe to call when there is no active subscription", () => {
      const store = useEntitiesStore();
      expect(() => store.unsubscribeEntities()).not.toThrow();
    });
  });

  describe("Extended entity filtering", () => {
    beforeEach(() => {
      const store = useEntitiesStore();
      store.sensors = [
        { entity_id: "sensor.wifi_signal", state: "75", attributes: { icon: "mdi:wifi", device_class: null } },
        { entity_id: "sensor.power_meter", state: "100", attributes: { device_class: "power" } },
        { entity_id: "sensor.energy_meter", state: "50", attributes: { device_class: "energy", state_class: "total" } },
        { entity_id: "sensor.unavailable", state: "unavailable", attributes: { device_class: "power" } },
        { entity_id: "media_player.living_room", state: "playing", attributes: {} },
        { entity_id: "alarm_control_panel.home", state: "armed_away", attributes: {} },
        { entity_id: "device_tracker.phone", state: "home", attributes: {} },
        { entity_id: "fan.bedroom", state: "on", attributes: {} },
        { entity_id: "select.mode", state: "Auto", attributes: {} },
        { entity_id: "button.restart", state: "unknown", attributes: {} },
        { entity_id: "sensor.battery_low", state: "unknown", attributes: { device_class: "battery" } },
      ];
    });

    it("getWifiSensors returns sensors with mdi:wifi icon, excluding unavailable", () => {
      const store = useEntitiesStore();
      const results = store.getWifiSensors();
      expect(results.map((s) => s.entity_id)).toContain("sensor.wifi_signal");
    });

    it("getPowerConsumptionSensors excludes unavailable", () => {
      const store = useEntitiesStore();
      const results = store.getPowerConsumptionSensors();
      expect(results.map((s) => s.entity_id)).toContain("sensor.power_meter");
      expect(results.map((s) => s.entity_id)).not.toContain("sensor.unavailable");
    });

    it("getEnergyConsumptionSensors matches energy+total class", () => {
      const store = useEntitiesStore();
      const results = store.getEnergyConsumptionSensors();
      expect(results.map((s) => s.entity_id)).toContain("sensor.energy_meter");
    });

    it("getMediaPlayers returns media_player entities", () => {
      const store = useEntitiesStore();
      expect(store.getMediaPlayers().map((s) => s.entity_id)).toContain("media_player.living_room");
    });

    it("getAlarmPanels returns alarm_control_panel entities", () => {
      const store = useEntitiesStore();
      expect(store.getAlarmPanels().map((s) => s.entity_id)).toContain("alarm_control_panel.home");
    });

    it("getDeviceTrackers returns device_tracker entities", () => {
      const store = useEntitiesStore();
      expect(store.getDeviceTrackers().map((s) => s.entity_id)).toContain("device_tracker.phone");
    });

    it("getFans returns fan entities", () => {
      const store = useEntitiesStore();
      expect(store.getFans().map((s) => s.entity_id)).toContain("fan.bedroom");
    });

    it("getSelects returns select entities", () => {
      const store = useEntitiesStore();
      expect(store.getSelects().map((s) => s.entity_id)).toContain("select.mode");
    });

    it("getButtons returns button entities", () => {
      const store = useEntitiesStore();
      expect(store.getButtons().map((s) => s.entity_id)).toContain("button.restart");
    });

    it("getAll returns the full sensor list", () => {
      const store = useEntitiesStore();
      expect(store.getAll()).toBe(store.sensors);
    });

    it("getBatterySensors excludes unknown/unavailable states", () => {
      const store = useEntitiesStore();
      const results = store.getBatterySensors();
      expect(results.map((s) => s.entity_id)).not.toContain("sensor.battery_low");
    });
  });

  describe("getEntitiesForDevice", () => {
    it("returns empty array for unknown device", () => {
      const store = useEntitiesStore();
      store.devices = [];
      expect(store.getEntitiesForDevice("nonexistent")).toEqual([]);
    });

    it("returns entity objects for known device", () => {
      const store = useEntitiesStore();
      store.devices = [{ id: "d1", entities: ["sensor.temp"] }];
      store.sensors = [{ entity_id: "sensor.temp", state: "20", attributes: {} }];
      const result = store.getEntitiesForDevice("d1");
      expect(result.length).toBe(1);
      expect(result[0].entity_id).toBe("sensor.temp");
    });

    it("returns empty array when device has no entities array", () => {
      const store = useEntitiesStore();
      store.devices = [{ id: "d1" }]; // no entities property
      expect(store.getEntitiesForDevice("d1")).toEqual([]);
    });
  });
});
