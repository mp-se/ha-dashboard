import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useEntitiesStore } from "../entitiesStore";

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
    // subscribeEntities: vi.fn((connection, callback) => {
    //   // Mock entity updates
    //   callback({
    //     "sensor.test": { entity_id: "sensor.test", state: "on", attributes: { friendly_name: "Test Entity" } }
    //   });
    //   return vi.fn(); // Unsubscribe function
    // }),
    ERR_CANNOT_CONNECT: 1,
    ERR_INVALID_AUTH: 2,
  };
});

// Mock fetch globally
global.fetch = vi.fn();

describe("useEntitiesStore", () => {
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
  });
});
