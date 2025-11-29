import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';

/**
 * Composable for resolving Home Assistant entities
 * Handles both string entity IDs and full entity objects
 * @param {string|object} entity - Entity ID string or entity object
 * @returns {object} - Computed ref with resolved entity and helper methods
 */
export const useEntityResolver = (entity) => {
  const store = useHaStore();

  // Resolve entity from string ID or use object directly
  const resolvedEntity = computed(() => {
    if (typeof entity === 'string') {
      const found = store.sensors.find((s) => s.entity_id === entity);
      if (!found) {
        console.warn(`Entity "${entity}" not found in store`);
        return null;
      }
      return found;
    }

    // If it's already an object, return it directly
    if (entity && typeof entity === 'object') {
      return entity;
    }

    console.warn(`Invalid entity format: ${entity}`);
    return null;
  });

  // Check if entity is available
  const isAvailable = computed(() => {
    return (
      resolvedEntity.value &&
      resolvedEntity.value.state !== 'unavailable' &&
      resolvedEntity.value.state !== 'unknown'
    );
  });

  // Get friendly name with fallback
  const friendlyName = computed(() => {
    if (!resolvedEntity.value) return 'Unknown Entity';
    return (
      resolvedEntity.value.attributes?.friendly_name || resolvedEntity.value.entity_id || 'Unknown'
    );
  });

  // Get entity ID (works for both string and object)
  const entityId = computed(() => {
    if (typeof entity === 'string') {
      return entity;
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
