import { computed, unref } from "vue";
import { useHaStore } from "@/stores/haStore";

/**
 * Composable for resolving Home Assistant entities
 * Handles both string entity IDs and full entity objects
 * Supports both direct values and reactive refs/computed
 * @param {string|object|Ref|Computed} entity - Entity ID string, entity object, or reactive ref
 * @returns {object} - Computed ref with resolved entity and helper methods
 */
export const useEntityResolver = (entity) => {
  const store = useHaStore();

  // Resolve entity from string ID or use object directly
  const resolvedEntity = computed(() => {
    // Use unref to handle both refs and plain values
    const entityValue = unref(entity);

    if (typeof entityValue === "string") {
      const found = store.sensors.find((s) => s.entity_id === entityValue);
      if (!found) {
        console.warn(`Entity "${entityValue}" not found in store`);
        return null;
      }
      return found;
    }

    // If it's already an object, return it directly
    if (entityValue && typeof entityValue === "object") {
      return entityValue;
    }

    console.warn(`Invalid entity format: ${entityValue}`);
    return null;
  });

  // Check if entity is available
  const isAvailable = computed(() => {
    return (
      resolvedEntity.value &&
      resolvedEntity.value.state !== "unavailable" &&
      resolvedEntity.value.state !== "unknown"
    );
  });

  // Get friendly name with fallback
  const friendlyName = computed(() => {
    if (!resolvedEntity.value) return "Unknown Entity";
    return (
      resolvedEntity.value.attributes?.friendly_name ||
      resolvedEntity.value.entity_id ||
      "Unknown"
    );
  });

  // Get entity ID (works for both string and object)
  const entityId = computed(() => {
    const entityValue = unref(entity);
    if (typeof entityValue === "string") {
      return entityValue;
    }
    return resolvedEntity.value?.entity_id;
  });

  return {
    resolvedEntity,
    isAvailable,
    friendlyName,
    entityId,
  };
};
