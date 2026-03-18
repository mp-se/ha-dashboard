<template>
  <div class="container-fluid overflow-hidden text-center">
    <p>&nbsp;</p>
    <div class="row g-3">
      <!-- Grid wrapper applying layout from componentLayouts constants -->
      <div
        v-for="item in entitiesList"
        :key="item.entity || item.entityId"
        :class="getComponentGridClasses(item.component)"
      >
        <component :is="componentMap[item.component]" v-bind="getComponentProps(item)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useHaStore } from "../stores/haStore";
import { getDefaultComponentType } from "../composables/useDefaultComponentType";
import { getComponentLayoutClasses } from "../utils/componentLayouts";

// Import all Ha* components
import HaAlarmPanel from "../components/cards/HaAlarmPanel.vue";
import HaBeerTap from "../components/cards/HaBeerTap.vue";
import HaBinarySensor from "../components/cards/HaBinarySensor.vue";
import HaButton from "../components/cards/HaButton.vue";
import HaChip from "../components/cards/HaChip.vue";
import HaEnergy from "../components/cards/HaEnergy.vue";
import EntityAttributeList from "../components/sub-components/EntityAttributeList.vue";
import EntityList from "../components/containers/EntityList.vue";
import HaError from "../components/cards/HaError.vue";
import HaGauge from "../components/cards/HaGauge.vue";
import HaGlance from "../components/cards/HaGlance.vue";
import HaHeader from "../components/cards/HaHeader.vue";
import IconCircle from "../components/sub-components/IconCircle.vue";
import HaImage from "../components/cards/HaImage.vue";
import HaLight from "../components/cards/HaLight.vue";
import HaLink from "../components/cards/HaLink.vue";
import HaMediaPlayer from "../components/cards/HaMediaPlayer.vue";
import HaPerson from "../components/cards/HaPerson.vue";
import HaPrinter from "../components/cards/HaPrinter.vue";
import HaRoom from "../components/cards/HaRoom.vue";
import HaRowSpacer from "../components/cards/HaRowSpacer.vue";
import HaSelect from "../components/cards/HaSelect.vue";
import HaSensor from "../components/cards/HaSensor.vue";
import HaSensorGraph from "../components/cards/HaSensorGraph.vue";
import HaSpacer from "../components/cards/HaSpacer.vue";
import HaSun from "../components/cards/HaSun.vue";
import HaSwitch from "../components/cards/HaSwitch.vue";
import HaWarning from "../components/cards/HaWarning.vue";
import HaWeather from "../components/cards/HaWeather.vue";

const props = defineProps({
  viewName: {
    type: String,
    required: true,
  },
});

const store = useHaStore();

// Map component types to imported components
const componentMap = {
  HaAlarmPanel,
  HaBeerTap,
  HaBinarySensor,
  HaButton,
  HaChip,
  HaEnergy,
  EntityAttributeList,
  EntityList,
  HaError,
  HaGauge,
  HaGlance,
  HaHeader,
  IconCircle,
  HaImage,
  HaLight,
  HaLink,
  HaMediaPlayer,
  HaPerson,
  HaPrinter,
  HaRoom,
  HaRowSpacer,
  HaSelect,
  HaSensor,
  HaSensorGraph,
  HaSpacer,
  HaSun,
  HaSwitch,
  HaWarning,
  HaWeather,
};

// Filter out control props that shouldn't be passed to components
const getComponentProps = (item) => {
  // eslint-disable-next-line no-unused-vars
  const { component, ...props } = item;
  return props;
};

/**
 * Get grid layout classes for a component
 * Uses componentLayouts constants for consistency across views and editor
 */
const getComponentGridClasses = (componentType) => {
  return getComponentLayoutClasses(componentType);
};

// Load entities from dashboard config for the specified view
const entitiesList = computed(() => {
  const view = store.dashboardConfig?.views?.find(
    (v) => v.name === props.viewName,
  );
  if (!view?.entities) {
    return [];
  }

  let entities = [];

  // Process each entity configuration
  for (const entity of view.entities) {
    // Handle entity that might be string or array - get first one for type detection
    const entityValue = Array.isArray(entity.entity)
      ? entity.entity[0]
      : entity.entity;

    // Determine component type (explicit or default)
    const componentType =
      entity.type || getDefaultComponentType(entityValue, entity.getter);

    // Special handling for components that don't require an entity (spacers, links, headers)
    if (
      !entity.entity &&
      !entity.getter &&
      (componentType === "HaRowSpacer" ||
        componentType === "HaSpacer" ||
        componentType === "HaLink")
    ) {
      entities.push({
        ...entity,
        component: componentType,
      });
    }
    // Special handling for EntityList - pass getter/entities array directly to component
    else if (componentType === "EntityList") {
      // For EntityList, we need to provide entities array in the format it expects
      // If getter is specified, convert to entities array format
      let entitiesForList = entity.entities || [];
      if (entity.getter && !entitiesForList.length) {
        entitiesForList = [{ getter: entity.getter }];
      }

      entities.push({
        component: componentType,
        entities: entitiesForList,
        componentMap: entity.componentMap,
        attributes: entity.attributes || [],
      });
    }
    // Check if using a getter (e.g., "getter": "getBatterySensors")
    else if (entity.getter && typeof store[entity.getter] === "function") {
      // Call the getter function to get filtered entities
      const getterResult = store[entity.getter]();
      const converted = getterResult.map((sensor) => ({
        entity: sensor.entity_id,
        attributes: entity.attributes || [],
        component: componentType,
      }));
      entities.push(...converted);
    } else if (entity.entity && entity.entity.includes("*")) {
      // Wildcard pattern - filter sensors
      const pattern = entity.entity;
      const regex = new RegExp(
        "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$",
      );

      const matchedSensors = store.entities.filter((sensor) =>
        regex.test(sensor.entity_id),
      );

      // Convert matched sensors to entity objects
      const converted = matchedSensors.map((sensor) => ({
        entity: sensor.entity_id,
        attributes: entity.attributes || [],
        component: componentType,
      }));

      entities.push(...converted);
    } else if (Array.isArray(entity.entity)) {
      // Multiple entities in array - pass as single item (the component handles the array)
      entities.push({
        ...entity,
        entity: entity.entity,
        component: componentType,
      });
    } else {
      // Direct entity reference - use as-is
      entities.push({
        ...entity,
        component: componentType,
      });
    }
  }

  return entities;
});
</script>
