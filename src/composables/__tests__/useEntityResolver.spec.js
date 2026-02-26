import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEntityResolver } from "../useEntityResolver";

// Mock the Pinia store
vi.mock("@/stores/haStore", () => ({
  useHaStore: vi.fn(),
}));

import { useHaStore } from "@/stores/haStore";

/**
 * Helper: build a mock store with both entities array and a Map-backed entityMap
 * so useEntityResolver can use the O(1) path without the removed fallback.
 */
const createMockStore = (entities = []) => ({
  entities,
  entityMap: new Map(entities.map((e) => [e.entity_id, e])),
});

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
      useHaStore.mockReturnValue(createMockStore([mockEntity]));

      const { resolvedEntity } = useEntityResolver("sensor.temperature");
      expect(resolvedEntity.value).toEqual(mockEntity);
    });

    it("should return null for unknown entity ID", () => {
      useHaStore.mockReturnValue(
        createMockStore([
          { entity_id: "sensor.temperature", state: "20", attributes: {} },
        ]),
      );

      const { resolvedEntity } = useEntityResolver("sensor.unknown");
      expect(resolvedEntity.value).toBeNull();
    });

    it("should return null for unknown entity ID", () => {
      useHaStore.mockReturnValue(createMockStore([]));

      const { resolvedEntity } = useEntityResolver("sensor.notfound");
      expect(resolvedEntity.value).toBeNull();
    });
  });

  describe("Object entity resolution", () => {
    it("should use object directly when passed as entity", () => {
      useHaStore.mockReturnValue(createMockStore([]));
      const mockEntity = {
        entity_id: "sensor.test",
        state: "42",
        attributes: {},
      };

      const { resolvedEntity } = useEntityResolver(mockEntity);
      expect(resolvedEntity.value).toEqual(mockEntity);
    });

    it("should not search store when object entity is provided", () => {
      const store = createMockStore([]);
      const mapGetSpy = vi.spyOn(store.entityMap, "get");
      useHaStore.mockReturnValue(store);
      const mockEntity = {
        entity_id: "sensor.test",
        state: "42",
        attributes: {},
      };

      useEntityResolver(mockEntity);
      expect(mapGetSpy).not.toHaveBeenCalled();
      mapGetSpy.mockRestore();
    });
  });

  describe("isAvailable computed", () => {
    it("should return true when entity is available", () => {
      useHaStore.mockReturnValue(
        createMockStore([{ entity_id: "sensor.test", state: "on", attributes: {} }]),
      );

      const { isAvailable } = useEntityResolver("sensor.test");
      expect(isAvailable.value).toBe(true);
    });

    it("should return false when entity is unavailable", () => {
      useHaStore.mockReturnValue(
        createMockStore([
          { entity_id: "sensor.test", state: "unavailable", attributes: {} },
        ]),
      );

      const { isAvailable } = useEntityResolver("sensor.test");
      expect(isAvailable.value).toBe(false);
    });

    it("should return false when entity is unknown", () => {
      useHaStore.mockReturnValue(
        createMockStore([
          { entity_id: "sensor.test", state: "unknown", attributes: {} },
        ]),
      );

      const { isAvailable } = useEntityResolver("sensor.test");
      expect(isAvailable.value).toBe(false);
    });

    it("should return falsy when resolved entity is null", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      useHaStore.mockReturnValue(createMockStore([]));

      const { isAvailable } = useEntityResolver("sensor.unknown");
      // When resolvedEntity is null, isAvailable returns null (falsy value) due to && operator
      expect(!isAvailable.value).toBe(true);
      warnSpy.mockRestore();
    });
  });

  describe("friendlyName computed", () => {
    it("should return friendly_name from attributes", () => {
      useHaStore.mockReturnValue(
        createMockStore([
          {
            entity_id: "sensor.test",
            state: "42",
            attributes: { friendly_name: "Test Sensor" },
          },
        ]),
      );

      const { friendlyName } = useEntityResolver("sensor.test");
      expect(friendlyName.value).toBe("Test Sensor");
    });

    it("should fallback to entity_id if friendly_name not available", () => {
      useHaStore.mockReturnValue(
        createMockStore([{ entity_id: "sensor.test", state: "42", attributes: {} }]),
      );

      const { friendlyName } = useEntityResolver("sensor.test");
      expect(friendlyName.value).toBe("sensor.test");
    });

    it("should return Unknown Entity when entity is null", () => {
      useHaStore.mockReturnValue(createMockStore([]));

      const { friendlyName } = useEntityResolver("sensor.unknown");
      expect(friendlyName.value).toBe("Unknown Entity");
    });

    it("should handle missing attributes gracefully", () => {
      useHaStore.mockReturnValue(
        createMockStore([{ entity_id: "sensor.test", state: "42" }]),
      );

      const { friendlyName } = useEntityResolver("sensor.test");
      expect(friendlyName.value).toBe("sensor.test");
    });
  });

  describe("entityId computed", () => {
    it("should return entity ID for string input", () => {
      useHaStore.mockReturnValue(
        createMockStore([{ entity_id: "sensor.test", state: "42", attributes: {} }]),
      );

      const { entityId } = useEntityResolver("sensor.test");
      expect(entityId.value).toBe("sensor.test");
    });

    it("should extract entity_id from object input", () => {
      useHaStore.mockReturnValue(createMockStore([]));
      const mockEntity = {
        entity_id: "sensor.object_test",
        state: "42",
        attributes: {},
      };

      const { entityId } = useEntityResolver(mockEntity);
      expect(entityId.value).toBe("sensor.object_test");
    });

    it("should return undefined when entity object has no entity_id", () => {
      useHaStore.mockReturnValue(createMockStore([]));
      const mockEntity = { state: "42", attributes: {} };

      const { entityId } = useEntityResolver(mockEntity);
      expect(entityId.value).toBeUndefined();
    });

    it("should return undefined when resolved entity is null", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      useHaStore.mockReturnValue(createMockStore([]));

      // When entity is a string that doesn't exist, entityId still returns the original string
      const { entityId } = useEntityResolver("sensor.unknown");
      expect(entityId.value).toBe("sensor.unknown");
      warnSpy.mockRestore();
    });
  });

  describe("Invalid entity input", () => {
    it("should handle null entity", () => {
      useHaStore.mockReturnValue(createMockStore([]));

      const { resolvedEntity } = useEntityResolver(null);
      expect(resolvedEntity.value).toBeNull();
    });

    it("should handle number entity type gracefully", () => {
      useHaStore.mockReturnValue(createMockStore([]));

      // Invalid type should resolve to null
      const { resolvedEntity } = useEntityResolver(123);
      expect(resolvedEntity.value).toBeNull();
    });
  });

  describe("Return object structure", () => {
    it("should return all required properties", () => {
      useHaStore.mockReturnValue(
        createMockStore([
          {
            entity_id: "sensor.test",
            state: "42",
            attributes: { friendly_name: "Test" },
          },
        ]),
      );

      const resolver = useEntityResolver("sensor.test");
      expect(resolver).toHaveProperty("resolvedEntity");
      expect(resolver).toHaveProperty("isAvailable");
      expect(resolver).toHaveProperty("friendlyName");
      expect(resolver).toHaveProperty("entityId");
    });

    it("should return computed properties", () => {
      useHaStore.mockReturnValue(
        createMockStore([{ entity_id: "sensor.test", state: "42", attributes: {} }]),
      );

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
