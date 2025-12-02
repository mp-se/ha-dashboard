<template>
  <div class="container-fluid overflow-hidden text-center">
    <p>&nbsp;</p>
    <div class="row g-3">
      <component
        :is="item.component"
        v-for="item in entitiesList"
        :key="item.entity || item.entityId"
        v-bind="getComponentProps(item)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '../stores/haStore';
import { getDefaultComponentType } from '../composables/useDefaultComponentType';

const props = defineProps({
  viewName: {
    type: String,
    required: true,
  },
});

const store = useHaStore();

// Filter out control props that shouldn't be passed to components
const getComponentProps = (item) => {
  // eslint-disable-next-line no-unused-vars
  const { component, ...props } = item;
  return props;
};

// Load entities from dashboard config for the specified view
const entitiesList = computed(() => {
  const view = store.dashboardConfig?.views?.find((v) => v.name === props.viewName);
  if (!view?.entities) {
    return [];
  }

  let entities = [];

  // Process each entity configuration
  for (const entity of view.entities) {
    // Handle entity that might be string or array - get first one for type detection
    const entityValue = Array.isArray(entity.entity) ? entity.entity[0] : entity.entity;
    
    // Determine component type (explicit or default)
    const componentType = entity.type || getDefaultComponentType(entityValue, entity.getter);
    
    // Special handling for components that don't require an entity (spacers, links, headers)
    if (!entity.entity && !entity.getter && (componentType === 'HaRowSpacer' || componentType === 'HaSpacer' || componentType === 'HaLink')) {
      entities.push({
        ...entity,
        component: componentType,
      });
    }
    // Special handling for HaEntityList - pass getter/entities array directly to component
    else if (componentType === 'HaEntityList') {
      // For HaEntityList, we need to provide entities array in the format it expects
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
    else if (entity.getter && typeof store[entity.getter] === 'function') {
      // Call the getter function to get filtered entities
      const getterResult = store[entity.getter]();
      const converted = getterResult.map((sensor) => ({
        entity: sensor.entity_id,
        attributes: entity.attributes || [],
        component: componentType,
      }));
      entities.push(...converted);
    } else if (entity.entity && entity.entity.includes('*')) {
      // Wildcard pattern - filter sensors
      const pattern = entity.entity;
      const regex = new RegExp(
        '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
      );

      const matchedSensors = store.sensors.filter((sensor) =>
        regex.test(sensor.entity_id)
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
