import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useForecastStore } from "../forecastStore";
import { useAuthStore } from "../authStore";

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

// Mock entitiesStore dynamically to avoid circular dependency
vi.mock("../entitiesStore", () => ({
  useEntitiesStore: vi.fn(),
}));

import { useEntitiesStore } from "../entitiesStore";

describe("useForecastStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribeToWeatherForecast", () => {
    it("does nothing if entity is not found", async () => {
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(makeMockConnection());

      useEntitiesStore.mockReturnValue({
        entityMap: new Map(),
      });

      const store = useForecastStore();
      await store.subscribeToWeatherForecast("weather.missing");
      expect(store.forecastErrors["weather.missing"]).toBe("Entity not found");
    });

    it("does nothing if WebSocket is not connected", async () => {
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(null);

      const weatherEntity = {
        entity_id: "weather.home",
        state: "sunny",
        attributes: {},
      };
      useEntitiesStore.mockReturnValue({
        entityMap: new Map([["weather.home", weatherEntity]]),
      });

      const store = useForecastStore();
      await store.subscribeToWeatherForecast("weather.home");
      expect(store.forecastErrors["weather.home"]).toBe(
        "WebSocket not connected",
      );
    });

    it("skips if already subscribed", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      const weatherEntity = {
        entity_id: "weather.home",
        state: "sunny",
        attributes: {},
      };
      useEntitiesStore.mockReturnValue({
        entityMap: new Map([["weather.home", weatherEntity]]),
      });

      const store = useForecastStore();
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
      conn.subscribeMessage.mockImplementation((cb) => {
        capturedCallback = cb;
        return Promise.resolve(unsub);
      });

      const weatherEntity = {
        entity_id: "weather.home",
        state: "sunny",
        attributes: {},
      };
      useEntitiesStore.mockReturnValue({
        entityMap: new Map([["weather.home", weatherEntity]]),
      });

      const store = useForecastStore();
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

    it("mirrors forecast data into entity attributes", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);

      let capturedCallback;
      conn.subscribeMessage.mockImplementation((cb) => {
        capturedCallback = cb;
        return Promise.resolve(vi.fn());
      });

      const weatherEntity = {
        entity_id: "weather.home",
        state: "sunny",
        attributes: {},
      };
      const mockEntitiesStore = {
        entityMap: new Map([["weather.home", weatherEntity]]),
      };
      useEntitiesStore.mockReturnValue(mockEntitiesStore);

      const store = useForecastStore();
      await store.subscribeToWeatherForecast("weather.home", "daily");

      capturedCallback({
        type: "daily",
        forecast: [{ datetime: "2026-02-26", temperature: 15 }],
      });

      // Verify forecast is mirrored into entity attributes
      expect(weatherEntity.attributes.forecast).toBeDefined();
      expect(weatherEntity.attributes.forecast.length).toBe(1);
    });

    it("handles subscription errors", async () => {
      const conn = makeMockConnection();
      const auth = useAuthStore();
      vi.spyOn(auth, "getConnection").mockReturnValue(conn);
      conn.subscribeMessage.mockRejectedValueOnce(
        new Error("subscribe failed"),
      );

      const weatherEntity = {
        entity_id: "weather.home",
        state: "sunny",
        attributes: {},
      };
      useEntitiesStore.mockReturnValue({
        entityMap: new Map([["weather.home", weatherEntity]]),
      });

      const store = useForecastStore();
      await store.subscribeToWeatherForecast("weather.home");

      expect(store.forecastErrors["weather.home"]).toBe("subscribe failed");
      expect(store.forecastLoading["weather.home"]).toBe(false);
    });
  });

  describe("initial state", () => {
    it("initializes with empty forecast refs", () => {
      useEntitiesStore.mockReturnValue({ entityMap: new Map() });

      const store = useForecastStore();
      expect(store.forecasts).toEqual({});
      expect(store.forecastSubscriptions).toEqual({});
      expect(store.forecastSupport).toEqual({});
      expect(store.forecastErrors).toEqual({});
      expect(store.forecastLoading).toEqual({});
    });
  });
});
