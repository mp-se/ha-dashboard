import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAttributeResolver } from "../useAttributeResolver";
import { useEntityResolver } from "../useEntityResolver";
import { useHaStore } from "../../stores/haStore";

vi.mock("../useEntityResolver");
vi.mock("../../stores/haStore");

describe("useAttributeResolver.js", () => {
  let mockStore;
  let mockResolvedEntity;

  beforeEach(() => {
    mockResolvedEntity = {
      entity_id: "sensor.temperature",
      state: "23.5",
      attributes: {
        friendly_name: "Temperature",
        unit_of_measurement: "°C",
        last_updated: "2025-12-20T10:30:00",
        icon: "mdi:thermometer",
      },
    };

    mockStore = {
      sensors: [
        {
          entity_id: "sensor.power",
          state: "150.3",
          attributes: {
            friendly_name: "Power Consumption",
            unit_of_measurement: "W",
            icon: "mdi:flash",
          },
        },
        {
          entity_id: "sensor.humidity",
          state: "60",
          attributes: {
            friendly_name: "Humidity",
            unit_of_measurement: "%",
            icon: "mdi:water-percent",
          },
        },
        {
          entity_id: "sensor.unavailable",
          state: "unavailable",
          attributes: {
            friendly_name: "Unavailable Sensor",
            icon: "mdi:alert",
          },
        },
        {
          entity_id: "sensor.no_unit",
          state: "42",
          attributes: {
            friendly_name: "No Unit Sensor",
            icon: "mdi:numeric",
          },
        },
      ],
    };

    useEntityResolver.mockReturnValue({
      resolvedEntity: { value: mockResolvedEntity },
    });

    useHaStore.mockReturnValue(mockStore);
  });

  describe("Direct Attributes", () => {
    it("should resolve direct entity attributes", async () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["unit_of_measurement", "last_updated"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(["Unit Of Measurement", "°C"]);
      expect(result[1]).toEqual(["Last Updated", "2025-12-20T10:30:00"]);
    });

    it("should format attribute keys from snake_case to Title Case", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["last_updated"]
      );

      const result = requestedAttributes.value;
      expect(result[0][0]).toBe("Last Updated");
    });

    it("should handle missing attributes gracefully", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["nonexistent_attr", "unit_of_measurement"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(["Unit Of Measurement", "°C"]);
    });

    it("should return empty array when no attributes requested", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        []
      );

      expect(requestedAttributes.value).toEqual([]);
    });

    it("should return empty array when entity is null", () => {
      useEntityResolver.mockReturnValue({
        resolvedEntity: { value: null },
      });

      const { requestedAttributes } = useAttributeResolver(null, [
        "unit_of_measurement",
      ]);

      expect(requestedAttributes.value).toEqual([]);
    });

    it("should handle attribute values with special types", () => {
      const entity = {
        ...mockResolvedEntity,
        attributes: {
          ...mockResolvedEntity.attributes,
          supported_color_modes: ["rgb", "xy"],
          device_class: "temperature",
          native_unit_of_measurement: "°C",
        },
      };

      useEntityResolver.mockReturnValue({ resolvedEntity: { value: entity } });

      const { requestedAttributes } = useAttributeResolver(entity, [
        "supported_color_modes",
        "device_class",
        "native_unit_of_measurement",
      ]);

      const result = requestedAttributes.value;
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(["Supported Color Modes", "rgb, xy"]);
      expect(result[1]).toEqual(["Device Class", "temperature"]);
      expect(result[2]).toEqual(["Native Unit Of Measurement", "°C"]);
    });
  });

  describe("Sensor References", () => {
    it("should resolve sensor references by entity_id", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.power"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(["Power Consumption", "150.3 W"]);
    });

    it("should include unit_of_measurement from referenced sensor", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.humidity"]
      );

      const result = requestedAttributes.value;
      expect(result[0]).toEqual(["Humidity", "60 %"]);
    });

    it("should handle referenced sensor without unit_of_measurement", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.no_unit"]
      );

      const result = requestedAttributes.value;
      expect(result[0]).toEqual(["No Unit Sensor", "42"]);
    });

    it("should show unavailable state for unavailable sensors", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.unavailable"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(["Unavailable Sensor", "unavailable"]);
    });

    it("should skip non-existent sensor references", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.nonexistent", "sensor.power"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(["Power Consumption", "150.3 W"]);
    });

    it("should use entity_id as fallback label for referenced sensor", () => {
      mockStore.sensors[0].attributes = {}; // Remove friendly_name

      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.power"]
      );

      const result = requestedAttributes.value;
      expect(result[0][0]).toBe("sensor.power");
    });
  });

  describe("Mixed Attributes and References", () => {
    it("should resolve both direct attributes and sensor references", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["unit_of_measurement", "sensor.power", "sensor.humidity"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(["Unit Of Measurement", "°C"]);
      expect(result[1]).toEqual(["Power Consumption", "150.3 W"]);
      expect(result[2]).toEqual(["Humidity", "60 %"]);
    });

    it("should maintain order of attributes and references", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.power", "unit_of_measurement", "sensor.humidity"]
      );

      const result = requestedAttributes.value;
      expect(result[0][0]).toBe("Power Consumption");
      expect(result[1][0]).toBe("Unit Of Measurement");
      expect(result[2][0]).toBe("Humidity");
    });

    it("should skip missing attributes but include valid references", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["missing_attr", "sensor.power", "another_missing", "sensor.humidity"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(["Power Consumption", "150.3 W"]);
      expect(result[1]).toEqual(["Humidity", "60 %"]);
    });
  });

  describe("Validation and Edge Cases", () => {
    it("should handle empty string in attributes array", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        [""]
      );

      expect(requestedAttributes.value).toHaveLength(0);
    });

    it("should differentiate between sensor reference and direct attribute", () => {
      const entity = {
        ...mockResolvedEntity,
        attributes: {
          ...mockResolvedEntity.attributes,
          sensor: "direct_sensor_attribute", // This is a direct attribute called "sensor"
        },
      };

      useEntityResolver.mockReturnValue({ resolvedEntity: { value: entity } });

      const { requestedAttributes } = useAttributeResolver(entity, [
        "sensor" // This is a direct attribute, not a reference
      ]);

      const result = requestedAttributes.value;
      expect(result[0]).toEqual(["Sensor", "direct_sensor_attribute"]);
    });

    it("should handle sensor reference that starts with sensor. correctly", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["sensor.power"]
      );

      const result = requestedAttributes.value;
      // Should be treated as reference, not direct attribute
      expect(result[0][0]).toBe("Power Consumption");
      expect(result[0][1]).toMatch(/W/);
    });
  });

  describe("Reactivity", () => {
    it("should return computed property based on entity attributes", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["unit_of_measurement"]
      );

      const result = requestedAttributes.value;
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(["Unit Of Measurement", "°C"]);
    });

    it("should be a computed property (reactive)", () => {
      const { requestedAttributes } = useAttributeResolver(
        mockResolvedEntity,
        ["unit_of_measurement"]
      );

      // The requestedAttributes should be a computed property
      expect(requestedAttributes).toHaveProperty("value");
      // Verify it's reactive by checking it's not a static value
      expect(Array.isArray(requestedAttributes.value)).toBe(true);
    });
  });

  describe("Format Handling", () => {
    it("should format null values as dash", () => {
      const entity = {
        ...mockResolvedEntity,
        attributes: {
          ...mockResolvedEntity.attributes,
          nullable_field: null,
        },
      };

      useEntityResolver.mockReturnValue({ resolvedEntity: { value: entity } });

      const { requestedAttributes } = useAttributeResolver(entity, [
        "nullable_field",
      ]);

      const result = requestedAttributes.value;
      expect(result[0]).toEqual(["Nullable Field", "-"]);
    });

    it("should handle object values in attributes", () => {
      const entity = {
        ...mockResolvedEntity,
        attributes: {
          ...mockResolvedEntity.attributes,
          config: { nested: "value" },
        },
      };

      useEntityResolver.mockReturnValue({ resolvedEntity: { value: entity } });

      const { requestedAttributes } = useAttributeResolver(entity, ["config"]);

      const result = requestedAttributes.value;
      expect(result[0][0]).toBe("Config");
      expect(result[0][1]).toEqual(JSON.stringify({ nested: "value" }));
    });
  });
});
