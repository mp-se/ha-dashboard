import { computed, unref, ComputedRef, Ref } from "vue";
import { useHaStore } from "@/stores/haStore";
import { createLogger } from "@/utils/logger";

const logger = createLogger("useEntityResolver");

interface Entity {
  entity_id: string;
  state: string;
  attributes?: Record<string, unknown>;
}

interface EntityResolverReturn {
  resolvedEntity: ComputedRef<Entity | null>;
  isAvailable: ComputedRef<boolean>;
  friendlyName: ComputedRef<string>;
  entityId: ComputedRef<string | undefined>;
}

/**
 * Composable for resolving Home Assistant entities
 * Handles both string entity IDs and full entity objects
 * Supports both direct values and reactive refs/computed
 *
 * @param entity - Entity ID string, entity object, or reactive ref
 * @returns Object containing resolved entity data and computed properties
 */
export const useEntityResolver = (
  entity:
    | string
    | Record<string, unknown>
    | Ref<string | Record<string, unknown>>
    | ComputedRef<string | Record<string, unknown>>,
): EntityResolverReturn => {
  const store = useHaStore();

  /**
   * Resolves the entity from string ID or uses object directly
   * Performs O(1) lookup using entityMap for string IDs
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
      return found as Entity;
    }

    // If it's already an object, return it directly
    if (entityValue && typeof entityValue === "object") {
      return entityValue as Entity;
    }

    logger.warn(`Invalid entity format: ${entityValue}`);
    return null;
  });

  /**
   * Checks if the entity is available (not unavailable or unknown)
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
   */
  const friendlyName = computed(() => {
    if (!resolvedEntity.value) return "Unknown Entity";
    return (
      (resolvedEntity.value.attributes?.friendly_name as string) ||
      resolvedEntity.value.entity_id ||
      "Unknown"
    );
  });

  /**
   * Gets the entity ID string, works for both string and object inputs
   */
  const entityId = computed(() => {
    const entityValue = unref(entity);
    if (typeof entityValue === "string") {
      return entityValue;
    }
    return (resolvedEntity.value?.entity_id as string) || undefined;
  });

  return {
    resolvedEntity,
    isAvailable,
    friendlyName,
    entityId,
  };
};
