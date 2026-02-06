import { computed } from "vue";
import { useEntityResolver } from "./useEntityResolver";
import { useHaStore } from "../stores/haStore";
import { formatAttributeValue, formatKey } from "../utils/attributeFormatters";

/**
 * Composable to resolve and format entity attributes for display
 * Supports both direct attributes (e.g., "brightness") and sensor references (e.g., "sensor.power")
 *
 * @param {String|Object|Ref} entity - The primary entity (string ID, object, or ref)
 * @param {Array<String>} attributes - Array of attribute keys or sensor IDs to display
 * @returns {Object} Object with requestedAttributes computed property returning [label, value] tuples
 */
export const useAttributeResolver = (entity, attributes) => {
  const { resolvedEntity } = useEntityResolver(entity);
  const haStore = useHaStore();

  const requestedAttributes = computed(() => {
    if (!attributes || attributes.length === 0) return [];
    if (!resolvedEntity.value) return [];

    const result = [];
    const entityAttrs = resolvedEntity.value.attributes || {};

    for (const key of attributes) {
      // Check if this is a sensor reference (starts with "sensor.")
      if (typeof key === "string" && key.startsWith("sensor.")) {
        // Look up the sensor in the store
        const referencedSensor = haStore.sensors.find(
          (s) => s.entity_id === key,
        );

        if (referencedSensor) {
          if (referencedSensor.state === "unavailable") {
            // Show unavailable state
            const label = referencedSensor.attributes?.friendly_name || key;
            result.push([label, "unavailable"]);
          } else {
            // Format the sensor state using the same formatter
            const label = referencedSensor.attributes?.friendly_name || key;
            const formattedValue = formatAttributeValue(referencedSensor.state);
            const unit = referencedSensor.attributes?.unit_of_measurement || "";
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
