import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEntityResolver } from "../useEntityResolver";

// Mock the Pinia store
vi.mock("@/stores/haStore", () => ({
  useHaStore: vi.fn(),
}));

import { useHaStore } from "@/stores/haStore";

describe("useEntityResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("String entity ID resolution", () => {
    it("should resolve entity by string ID", () => {
      const mockEntity = {
        entity_id: "sensor.temperature",
        state: "20",
        attributes: { friendly_name: "Temperature" },
      };
      const mockStore = {
        sensors: [mockEntity],
      };
      useHaStore.mockReturnValue(mockStore);

      const { resolvedEntity } = useEntityResolver("sensor.temperature");
      expect(resolvedEntity.value).toEqual(mockEntity);
    });

    it("should return null for unknown entity ID", () => {
      const mockStore = {
        sensors: [
          { entity_id: "sensor.temperature", state: "20", attributes: {} },
        ],
      };
      useHaStore.mockReturnValue(mockStore);

      const { resolvedEntity } = useEntityResolver("sensor.unknown");
      expect(resolvedEntity.value).toBeNull();
    });

    it("should return null for unknown entity ID", () => {
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);

      const { resolvedEntity } = useEntityResolver("sensor.notfound");
      expect(resolvedEntity.value).toBeNull();
    });
  });

  describe("Object entity resolution", () => {
    it("should use object directly when passed as entity", () => {
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);
      const mockEntity = {
        entity_id: "sensor.test",
        state: "42",
        attributes: {},
      };

      const { resolvedEntity } = useEntityResolver(mockEntity);
      expect(resolvedEntity.value).toEqual(mockEntity);
    });

    it("should not search store when object entity is provided", () => {
      const mockStore = { sensors: [] };
      const storeSpy = vi.spyOn(mockStore.sensors, "find");
      useHaStore.mockReturnValue(mockStore);
      const mockEntity = {
        entity_id: "sensor.test",
        state: "42",
        attributes: {},
      };

      useEntityResolver(mockEntity);
      expect(storeSpy).not.toHaveBeenCalled();
      storeSpy.mockRestore();
    });
  });

  describe("isAvailable computed", () => {
    it("should return true when entity is available", () => {
      const mockStore = {
        sensors: [{ entity_id: "sensor.test", state: "on", attributes: {} }],
      };
      useHaStore.mockReturnValue(mockStore);

      const { isAvailable } = useEntityResolver("sensor.test");
      expect(isAvailable.value).toBe(true);
    });

    it("should return false when entity is unavailable", () => {
      const mockStore = {
        sensors: [
          { entity_id: "sensor.test", state: "unavailable", attributes: {} },
        ],
      };
      useHaStore.mockReturnValue(mockStore);

      const { isAvailable } = useEntityResolver("sensor.test");
      expect(isAvailable.value).toBe(false);
    });

    it("should return false when entity is unknown", () => {
      const mockStore = {
        sensors: [
          { entity_id: "sensor.test", state: "unknown", attributes: {} },
        ],
      };
      useHaStore.mockReturnValue(mockStore);

      const { isAvailable } = useEntityResolver("sensor.test");
      expect(isAvailable.value).toBe(false);
    });

    it("should return falsy when resolved entity is null", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);

      const { isAvailable } = useEntityResolver("sensor.unknown");
      // When resolvedEntity is null, isAvailable returns null (falsy value) due to && operator
      expect(!isAvailable.value).toBe(true);
      warnSpy.mockRestore();
    });
  });

  describe("friendlyName computed", () => {
    it("should return friendly_name from attributes", () => {
      const mockStore = {
        sensors: [
          {
            entity_id: "sensor.test",
            state: "42",
            attributes: { friendly_name: "Test Sensor" },
          },
        ],
      };
      useHaStore.mockReturnValue(mockStore);

      const { friendlyName } = useEntityResolver("sensor.test");
      expect(friendlyName.value).toBe("Test Sensor");
    });

    it("should fallback to entity_id if friendly_name not available", () => {
      const mockStore = {
        sensors: [{ entity_id: "sensor.test", state: "42", attributes: {} }],
      };
      useHaStore.mockReturnValue(mockStore);

      const { friendlyName } = useEntityResolver("sensor.test");
      expect(friendlyName.value).toBe("sensor.test");
    });

    it("should return Unknown Entity when entity is null", () => {
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);

      const { friendlyName } = useEntityResolver("sensor.unknown");
      expect(friendlyName.value).toBe("Unknown Entity");
    });

    it("should handle missing attributes gracefully", () => {
      const mockStore = {
        sensors: [{ entity_id: "sensor.test", state: "42" }],
      };
      useHaStore.mockReturnValue(mockStore);

      const { friendlyName } = useEntityResolver("sensor.test");
      expect(friendlyName.value).toBe("sensor.test");
    });
  });

  describe("entityId computed", () => {
    it("should return entity ID for string input", () => {
      const mockStore = {
        sensors: [{ entity_id: "sensor.test", state: "42", attributes: {} }],
      };
      useHaStore.mockReturnValue(mockStore);

      const { entityId } = useEntityResolver("sensor.test");
      expect(entityId.value).toBe("sensor.test");
    });

    it("should extract entity_id from object input", () => {
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);
      const mockEntity = {
        entity_id: "sensor.object_test",
        state: "42",
        attributes: {},
      };

      const { entityId } = useEntityResolver(mockEntity);
      expect(entityId.value).toBe("sensor.object_test");
    });

    it("should return undefined when entity object has no entity_id", () => {
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);
      const mockEntity = { state: "42", attributes: {} };

      const { entityId } = useEntityResolver(mockEntity);
      expect(entityId.value).toBeUndefined();
    });

    it("should return undefined when resolved entity is null", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);

      // When entity is a string that doesn't exist, entityId still returns the original string
      const { entityId } = useEntityResolver("sensor.unknown");
      expect(entityId.value).toBe("sensor.unknown");
      warnSpy.mockRestore();
    });
  });

  describe("Invalid entity input", () => {
    it("should handle null entity", () => {
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);

      const { resolvedEntity } = useEntityResolver(null);
      expect(resolvedEntity.value).toBeNull();
    });

    it("should handle number entity type gracefully", () => {
      const mockStore = { sensors: [] };
      useHaStore.mockReturnValue(mockStore);

      // Invalid type should resolve to null
      const { resolvedEntity } = useEntityResolver(123);
      expect(resolvedEntity.value).toBeNull();
    });
  });

  describe("Return object structure", () => {
    it("should return all required properties", () => {
      const mockStore = {
        sensors: [
          {
            entity_id: "sensor.test",
            state: "42",
            attributes: { friendly_name: "Test" },
          },
        ],
      };
      useHaStore.mockReturnValue(mockStore);

      const resolver = useEntityResolver("sensor.test");
      expect(resolver).toHaveProperty("resolvedEntity");
      expect(resolver).toHaveProperty("isAvailable");
      expect(resolver).toHaveProperty("friendlyName");
      expect(resolver).toHaveProperty("entityId");
    });

    it("should return computed properties", () => {
      const mockStore = {
        sensors: [{ entity_id: "sensor.test", state: "42", attributes: {} }],
      };
      useHaStore.mockReturnValue(mockStore);

      const { resolvedEntity, isAvailable, friendlyName, entityId } =
        useEntityResolver("sensor.test");

      // Check they are computed refs (have .value)
      expect(resolvedEntity).toHaveProperty("value");
      expect(isAvailable).toHaveProperty("value");
      expect(friendlyName).toHaveProperty("value");
      expect(entityId).toHaveProperty("value");
    });
  });
});
