<template>
  <template
    v-for="item in displayedEntities"
    :key="item.entity?.entity_id || `spacer-${item.index}`"
  >
    <!-- Spacer card - rendered as grid item -->
    <div v-if="item.isSpacer" class="col-lg-4 col-md-6 col-sm-12">
      <HaSpacer />
    </div>
    <!-- Regular entity card with dynamic component - rendered as grid item -->
    <div v-else-if="item.entity" class="col-lg-4 col-md-6 col-sm-12">
      <component
        :is="
          item.component ||
          getComponentForDomain(item.entity.entity_id) ||
          'HaSensor'
        "
        :entity="item.entity"
      />
    </div>
  </template>
</template>

<script setup>
import { computed } from "vue";
import { useHaStore } from "@/stores/haStore";
import HaSpacer from "../cards/HaSpacer.vue";
import { createLogger } from "@/utils/logger";

const props = defineProps({
  // Array of { entityId: string, component?: Component } OR { getter: string, component?: Component }
  // e.g. [{ entityId: 'switch.outlet', component: HaSwitch }] or [{ getter: 'getBatterySensors' }]
  entities: { type: Array, required: true },
  // Optional per-domain component map, e.g. { switch: MySwitchComponent }
  componentMap: { type: Object, default: () => ({}) },
  attributes: { type: Array, default: () => [] },
});

// Default mapping for domains -> components
const defaultDomainMap = {
  switch: "HaSwitch",
  binary_sensor: "HaBinarySensor",
  sensor: "HaSensor",
  light: "HaLight",
  alarm_control_panel: "HaAlarmPanel",
  weather: "HaWeather",
  update: "HaBinarySensor",
  sun: "HaSun",
  device_tracker: "HaSensor",
  fan: "HaLight",
  media_player: "HaMediaPlayer",
  select: "HaSelect",
  button: "HaButton",
};

const store = useHaStore();
const logger = createLogger("EntityList");

const domainMap = computed(() => ({
  ...defaultDomainMap,
  ...props.componentMap,
}));

const getComponentForDomain = (entityId) => {
  const domain = entityId.split(".")[0];
  return domainMap.value[domain] || "HaSensor";
};

const displayedEntities = computed(() => {
  try {
    const allEntities = [];

    // Process each item - could be direct entityId or a getter
    for (const item of props.entities) {
      // Check if this is a getter function
      if (item.getter && typeof store[item.getter] === "function") {
        // Call the getter to get array of entities
        const getterResult = store[item.getter]();
        const component = item.component; // Optional component override

        for (const entity of getterResult) {
          allEntities.push({
            entity,
            component,
            isSpacer: false,
            index: allEntities.length,
          });
        }
      } else if (item.entityId) {
        // Direct entityId reference
        // Check if this is a spacer (empty entityId)
        if (!item.entityId || item.entityId.trim() === "") {
          allEntities.push({
            entity: null,
            component: null,
            isSpacer: true,
            index: allEntities.length,
          });
          continue;
        }

        // Try to find entity in sensors array
        let entity = store.entityMap.get(item.entityId);

        // Create fallback entity if not found
        if (!entity) {
          entity = {
            entity_id: item.entityId,
            state: "unknown",
            attributes: { friendly_name: item.entityId },
          };
        }

        allEntities.push({
          entity,
          component: item.component,
          isSpacer: false,
          index: allEntities.length,
        });
      }
    }

    // Filter out invalid entities
    return allEntities.filter((item) => {
      // Skip entities with invalid or missing attributes
      if (item.isSpacer) return true;
      if (!item.entity) {
        logger.warn("Skipping null entity at index", item.index);
        return false;
      }
      if (!item.entity.entity_id) {
        logger.warn("Skipping entity without entity_id at index", item.index);
        return false;
      }
      if (
        item.entity.attributes === null ||
        item.entity.attributes === undefined
      ) {
        logger.warn(`Skipping entity ${item.entity.entity_id} - no attributes`);
        return false;
      }
      return true;
    });
  } catch (error) {
    logger.error("Error processing entities in EntityList:", error);
    return [];
  }
});
</script>
