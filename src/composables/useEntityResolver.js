import { computed, unref } from "vue";
import { useHaStore } from "@/stores/haStore";
import { createLogger } from "@/utils/logger";

const logger = createLogger("useEntityResolver");

/**
 * Composable for resolving Home Assistant entities
 * Handles both string entity IDs and full entity objects
 * Supports both direct values and reactive refs/computed
 *
 * @param {string|object|Ref|Computed} entity - Entity ID string, entity object, or reactive ref
 * @returns {object} Object containing:
 *   - resolvedEntity: {ComputedRef<object|null>} The resolved entity object or null if not found
 *   - isAvailable: {ComputedRef<boolean>} True if entity is available (not unavailable/unknown)
 *   - friendlyName: {ComputedRef<string>} User-friendly display name with fallbacks
 *   - entityId: {ComputedRef<string>} The entity ID string
 */
export const useEntityResolver = (entity) => {
  const store = useHaStore();

  /**
   * Resolves the entity from string ID or uses object directly
   * Performs O(1) lookup using entityMap for string IDs
   * @type {ComputedRef<object|null>}
   */
  const resolvedEntity = computed(() => {
    // Use unref to handle both refs and plain values
    const entityValue = unref(entity);

    if (typeof entityValue === "string") {
      // O(1) lookup via entityMap (a Map computed from the entities array)
      const found = store.entityMap?.get?.(entityValue);

      if (!found) {
        logger.warn(`Entity "${entityValue}" not found in store`);
        return null;
      }
      return found;
    }

    // If it's already an object, return it directly
    if (entityValue && typeof entityValue === "object") {
      return entityValue;
    }

    logger.warn(`Invalid entity format: ${entityValue}`);
    return null;
  });

  /**
   * Checks if the entity is available (not unavailable or unknown)
   * @type {ComputedRef<boolean>}
   */
  const isAvailable = computed(() => {
    return (
      resolvedEntity.value &&
      resolvedEntity.value.state !== "unavailable" &&
      resolvedEntity.value.state !== "unknown"
    );
  });

  /**
   * Gets the friendly display name with fallback to entity_id or 'Unknown'
   * @type {ComputedRef<string>}
   */
  const friendlyName = computed(() => {
    if (!resolvedEntity.value) return "Unknown Entity";
    return (
      resolvedEntity.value.attributes?.friendly_name ||
      resolvedEntity.value.entity_id ||
      "Unknown"
    );
  });

  /**
   * Gets the entity ID string, works for both string and object inputs
   * @type {ComputedRef<string>}
   */
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
