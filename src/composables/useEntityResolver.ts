/*
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { computed, unref, ComputedRef, Ref } from "vue";
import { useHaStore } from "@/stores/haStore";
import { createLogger } from "@/utils/logger";
import type { Entity } from "@/types";

const logger = createLogger("useEntityResolver");

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
