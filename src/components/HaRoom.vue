<template>
  <div class="col-lg-4 col-md-6">
    <div class="card card-display h-100 rounded-4 shadow-lg border-info">
      <div class="card-body p-3 d-flex justify-content-between h-100 text-start">
        <!-- Left Side: Room Info -->
        <div class="room-left d-flex flex-column text-start">
          <!-- Room Header -->
          <div class="room-header mb-3">
            <h6 class="card-title mb-1">{{ roomName }}</h6>
            <!-- Temperature and Humidity on same row -->
            <div v-if="temperatureEntity || humidityEntity" class="d-flex gap-3 align-items-baseline">
              <div v-if="temperatureEntity" class="small">
                <span class="fw-bold">{{ temperatureValue }}</span>
                <small class="text-muted ms-1">{{ temperatureUnit }}</small>
              </div>
              <div v-if="humidityEntity" class="small">
                <span class="fw-bold">{{ humidityValue }}</span>
                <small class="text-muted ms-1">{{ humidityUnit }}</small>
              </div>
            </div>
          </div>

          <!-- Icon Circle: Bottom Left -->
          <div class="mt-auto">
            <div class="icon-circle-wrapper">
              <svg width="80" height="80" viewBox="0 0 80 80" class="icon-circle">
                <circle cx="40" cy="40" r="36" :fill="circleColor" />
              </svg>
              <i :class="roomIconClass" class="icon-overlay"></i>
            </div>
          </div>
        </div>

        <!-- Right Side: Control Objects -->
        <div v-if="controlObjects.length > 0" class="room-right d-flex flex-column gap-2">
          <div
            v-for="(obj, index) in controlObjects"
            :key="index"
            class="control-object"
            :title="getEntityLabel(obj.entity_id)"
            @click="toggleEntity(obj.entity_id)"
          >
            <div class="control-circle-wrapper">
              <svg width="50" height="50" viewBox="0 0 50 50" class="control-circle">
                <circle cx="25" cy="25" r="22" :fill="getObjectColor(obj.entity_id)" />
              </svg>
              <i :class="getObjectIcon(obj.entity_id)" class="control-icon-overlay"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';
import { useNormalizeIcon } from '@/composables/useNormalizeIcon';

const props = defineProps({
  entity: {
    type: Array,
    required: true,
    description: 'Array of entity IDs (first is room/area, rest are control objects)',
  },
  color: {
    type: String,
    default: 'blue',
    description: 'CSS color name for the room circle',
  },
});

const store = useHaStore();
const normalizeIcon = useNormalizeIcon();

// First entity should be the room/area entity (starts with area.)
const roomEntityId = computed(() => {
  const entities = props.entity || [];
  // Find the first entity that starts with 'area.'
  const areaEntity = entities.find((e) => typeof e === 'string' && e.startsWith('area.'));
  return areaEntity || '';
});

// Remaining entities are control objects (excluding the area entity)
const controlObjects = computed(() => {
  return (props.entity || [])
    .filter((entityId) => !entityId.startsWith('area.'))
    .map((entityId) => ({
      entity_id: entityId,
    }));
});

// Get room name from first entity
const roomName = computed(() => {
  const roomEntity = store.sensors.find((s) => s.entity_id === roomEntityId.value);
  if (roomEntity) {
    return roomEntity.attributes?.friendly_name || roomEntity.state || 'Room';
  }
  return 'Room';
});

// Find temperature sensor in area's entities
const temperatureEntity = computed(() => {
  // Get the area entity (first one)
  const areaEntity = store.sensors.find((s) => s.entity_id === roomEntityId.value);
  console.log('[HaRoom] Area entity found:', areaEntity?.entity_id, 'has entities:', Array.isArray(areaEntity?.entities), 'count:', areaEntity?.entities?.length);
  
  if (!areaEntity || !areaEntity.entities) {
    return null;
  }
  
  // Search for temperature sensor in the area's entities
  for (const entityId of areaEntity.entities) {
    const entity = store.sensors.find((s) => s.entity_id === entityId);
    if (entity) {
      console.log('[HaRoom] Checking entity:', entityId, 'device_class:', entity.attributes?.device_class);
    }
    if (entity && entity.attributes?.device_class === 'temperature') {
      console.log('[HaRoom] Found temperature:', entityId);
      return entity;
    }
  }
  return null;
});

const temperatureValue = computed(() => {
  if (!temperatureEntity.value) return null;
  const state = temperatureEntity.value.state;
  if (state === 'unknown' || state === 'unavailable') return state;
  const num = Number(state);
  if (!Number.isNaN(num)) {
    return num.toFixed(1);
  }
  return state;
});

const temperatureUnit = computed(() => {
  if (!temperatureEntity.value) return null;
  return temperatureEntity.value.attributes?.unit_of_measurement || '°C';
});

// Find humidity sensor in area's entities
const humidityEntity = computed(() => {
  // Get the area entity (first one)
  const areaEntity = store.sensors.find((s) => s.entity_id === roomEntityId.value);
  if (!areaEntity || !areaEntity.entities) {
    return null;
  }
  
  // Search for humidity sensor in the area's entities
  for (const entityId of areaEntity.entities) {
    const entity = store.sensors.find((s) => s.entity_id === entityId);
    if (entity && entity.attributes?.device_class === 'humidity') {
      console.log('[HaRoom] Found humidity:', entityId);
      return entity;
    }
  }
  return null;
});

const humidityValue = computed(() => {
  if (!humidityEntity.value) return null;
  const state = humidityEntity.value.state;
  if (state === 'unknown' || state === 'unavailable') return state;
  const num = Number(state);
  if (!Number.isNaN(num)) {
    return num.toFixed(0);
  }
  return state;
});

const humidityUnit = computed(() => {
  if (!humidityEntity.value) return null;
  return humidityEntity.value.attributes?.unit_of_measurement || '%';
});

// Room icon (from first entity or default)
const roomIconClass = computed(() => {
  const roomEntity = store.sensors.find((s) => s.entity_id === roomEntityId.value);
  if (roomEntity?.attributes?.icon) {
    return normalizeIcon(roomEntity.attributes.icon);
  }
  return 'mdi mdi-door';
});

const circleColor = computed(() => {
  return props.color || 'blue';
});

// Get icon for control object
const getObjectIcon = (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return 'mdi mdi-help-circle';

  const icon = entity.attributes?.icon;
  if (icon) {
    return normalizeIcon(icon);
  }

  // Default icons by domain
  const domain = entityId.split('.')[0];
  const domainIcons = {
    light: 'mdi mdi-lightbulb',
    switch: 'mdi mdi-power-plug',
    fan: 'mdi mdi-fan',
    binary_sensor: 'mdi mdi-eye',
    sensor: 'mdi mdi-gauge',
  };

  return domainIcons[domain] || 'mdi mdi-help-circle';
};

// Get color for control object based on state
const getObjectColor = (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return 'gray';

  const state = entity.state?.toLowerCase();
  const isOn = state === 'on' || state === 'open' || state === 'active';

  if (isOn) {
    // Use the room color when on
    return props.color || 'blue';
  } else {
    // Gray when off
    return '#cccccc';
  }
};

// Get entity label/name
const getEntityLabel = (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (entity) {
    return entity.attributes?.friendly_name || entityId;
  }
  return entityId;
};

// Toggle entity on/off
const toggleEntity = async (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return;

  const domain = entityId.split('.')[0];
  const service = entity.state?.toLowerCase() === 'on' ? 'turn_off' : 'turn_on';

  try {
    await store.callService(domain, service, {
      entity_id: entityId,
    });
  } catch (error) {
    console.error(`Failed to toggle ${entityId}:`, error);
  }
};
</script>

<style scoped>
.room-left {
  flex: 1;
  min-width: 0;
}

.room-right {
  margin-left: 1rem;
  justify-content: flex-start;
}

.room-header {
  padding-bottom: 0.75rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  word-break: break-word;
}

.icon-circle-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.icon-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: filter 0.3s ease;
}

.card:hover .icon-circle {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
}

.icon-overlay {
  position: relative;
  z-index: 1;
  font-size: 2.5rem;
  color: white;
  font-weight: 500;
}

.control-object {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.control-object:hover {
  transform: scale(1.1);
}

.control-circle-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.control-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
  transition: filter 0.2s ease;
}

.control-object:hover .control-circle {
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
}

.control-icon-overlay {
  position: relative;
  z-index: 1;
  font-size: 1.5rem;
  color: white;
  font-weight: 400;
}
</style>
