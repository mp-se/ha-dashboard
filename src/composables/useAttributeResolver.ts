import { computed, ComputedRef, Ref, unref } from "vue";
import { useEntityResolver } from "./useEntityResolver";
import { useHaStore } from "../stores/haStore";
import { formatAttributeValue, formatKey } from "../utils/attributeFormatters";

interface AttributeTuple extends Array<string | number> {
  0: string;
  1: string | number;
}

interface AttributeResolverReturn {
  requestedAttributes: ComputedRef<AttributeTuple[]>;
}

/**
 * Composable to resolve and format entity attributes for display
 * Supports both direct attributes (e.g., "brightness") and sensor references (e.g., "sensor.power")
 *
 * @param entity - The primary entity (string ID, object, or ref)
 * @param attributes - Array of attribute keys or sensor IDs to display
 * @returns Object with requestedAttributes computed property returning [label, value] tuples
 */
export const useAttributeResolver = (
  entity:
    | string
    | Record<string, unknown>
    | Ref<string | Record<string, unknown>>,
  attributes: string[] | Ref<string[]>,
): AttributeResolverReturn => {
  const { resolvedEntity } = useEntityResolver(entity);
  const haStore = useHaStore();

  const requestedAttributes = computed(() => {
    const attrs = unref(attributes);
    if (!attrs || attrs.length === 0) return [];
    if (!resolvedEntity.value) return [];

    const result: AttributeTuple[] = [];
    const entityAttrs = (resolvedEntity.value.attributes || {}) as Record<
      string,
      unknown
    >;

    for (const key of attrs) {
      // Check if this is a sensor reference (starts with "sensor.")
      if (typeof key === "string" && key.startsWith("sensor.")) {
        // Look up the sensor in the store
        // Use optimized entityMap if available, fallback to find for tests/stability
        const referencedSensor = haStore.entityMap?.get
          ? haStore.entityMap.get(key)
          : haStore.entities?.find(
              (s: Record<string, unknown>) => s.entity_id === key,
            );

        if (referencedSensor) {
          if (referencedSensor.state === "unavailable") {
            // Show unavailable state
            const label =
              (referencedSensor.attributes?.friendly_name as string) || key;
            result.push([label, "unavailable"]);
          } else {
            // Format the sensor state using the same formatter
            const label =
              (referencedSensor.attributes?.friendly_name as string) || key;
            const formattedValue = formatAttributeValue(referencedSensor.state);
            const unit =
              (referencedSensor.attributes?.unit_of_measurement as string) ||
              "";
            const displayValue = unit
              ? `${formattedValue} ${unit}`
              : formattedValue;
            result.push([label, displayValue]);
          }
        }
        // If sensor not found, skip it (silently)
      } else {
        // Regular attribute lookup
        if (key in entityAttrs) {
          const formattedValue = formatAttributeValue(entityAttrs[key]);
          result.push([formatKey(key), formattedValue]);
        }
      }
    }

    return result;
  });

  return {
    requestedAttributes,
  };
};
