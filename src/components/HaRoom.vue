<template>
  <div class="col-lg-4 col-md-6">
    <div class="card card-display h-100 rounded-4 shadow-lg border-info">
      <div class="card-body p-3 d-flex justify-content-between h-100 text-start">
        <!-- Left Side: Room Info -->
        <div class="room-left d-flex flex-column text-start">
          <!-- Room Header -->
          <div class="room-header mb-3">
            <h6 class="ha-entity-name">{{ roomName }}</h6>
            <!-- Temperature and Humidity on same row -->
            <div v-if="temperatureEntity || humidityEntity" class="d-flex gap-3 align-items-baseline">
              <div v-if="temperatureEntity" class="small">
                <span class="fw-bold">{{ temperatureValue }}</span>
                <small class="ha-entity-unit ms-1">{{ temperatureUnit }}</small>
              </div>
              <div v-if="humidityEntity" class="small">
                <span class="fw-bold">{{ humidityValue }}</span>
                <small class="ha-entity-unit ms-1">{{ humidityUnit }}</small>
              </div>
            </div>
          </div>

          <!-- Icon Circle: Bottom Left -->
          <div class="mt-auto">
            <div class="room-icon-wrapper ha-icon-circle-large">
              <svg width="80" height="80" viewBox="0 0 80 80" class="ha-icon-circle">
                <circle cx="40" cy="40" r="40" :fill="circleColor" />
              </svg>
              <i :class="roomIconClass" class="ha-icon-overlay"></i>
            </div>
          </div>
        </div>

        <!-- Right Side: Control Objects -->
        <div v-if="controlObjects.length > 0" class="room-right">
          <div class="room-controls-grid">
            <div
              v-for="(obj, index) in controlObjects"
              :key="index"
              class="control-object"
              :class="{ 'control-object-disabled': isEntityUnavailable(obj.entity_id) }"
              :title="getEntityLabel(obj.entity_id)"
              @click="!isEntityUnavailable(obj.entity_id) && toggleEntity(obj.entity_id)"
            >
              <div class="ha-control-circle-wrapper">
                <svg width="50" height="50" viewBox="0 0 50 50" class="ha-control-circle">
                  <circle cx="25" cy="25" r="22" :fill="getObjectColor(obj.entity_id)" />
                </svg>
                <i :class="getObjectIcon(obj.entity_id)" class="ha-control-icon" :style="{ color: getIconColor(obj.entity_id) }"></i>
              </div>
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
import { useServiceCall } from '@/composables/useServiceCall';

const props = defineProps({
  entity: {
    type: [Array, String],
    required: true,
    description: 'Entity ID or array of entity IDs (first is room/area, rest are control objects)',
  },
  color: {
    type: String,
    default: 'blue',
    description: 'CSS color name for the room circle',
  },
});

const store = useHaStore();
const normalizeIcon = useNormalizeIcon();
const { callService } = useServiceCall();

// Normalize entity to always be an array
const entityArray = computed(() => {
  if (typeof props.entity === 'string') {
    return [props.entity];
  }
  return props.entity || [];
});

// First entity should be the room/area entity (starts with area.)
const roomEntityId = computed(() => {
  const entities = entityArray.value || [];
  // Find the first entity that starts with 'area.'
  const areaEntity = entities.find((e) => typeof e === 'string' && e.startsWith('area.'));
  return areaEntity || '';
});

// Helper to check if entity is temperature or humidity sensor
const isTempOrHumiditySensor = (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return false;
  const deviceClass = entity.attributes?.device_class;
  return deviceClass === 'temperature' || deviceClass === 'humidity';
};

// Remaining entities are control objects (excluding the area entity and temp/humidity sensors)
const controlObjects = computed(() => {
  return entityArray.value
    .filter((entityId) => !entityId.startsWith('area.') && !isTempOrHumiditySensor(entityId))
    .slice(0, 6) // Limit to 6 additional entities
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

// Find temperature sensor in area's entities, fallback to entity list
const temperatureEntity = computed(() => {
  // Get the area entity
  const areaEntity = store.sensors.find((s) => s.entity_id === roomEntityId.value);
  
  // First, search for temperature sensor in the area's entities
  if (areaEntity && areaEntity.entities) {
    for (const entityId of areaEntity.entities) {
      const entity = store.sensors.find((s) => s.entity_id === entityId);
      if (entity && entity.attributes?.device_class === 'temperature') {
        return entity;
      }
    }
  }
  
  // Fallback: search in the provided entity list
  for (const entityId of entityArray.value) {
    if (entityId.startsWith('area.')) continue;
    const entity = store.sensors.find((s) => s.entity_id === entityId);
    if (entity && entity.attributes?.device_class === 'temperature') {
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

// Find humidity sensor in area's entities, fallback to entity list
const humidityEntity = computed(() => {
  // Get the area entity
  const areaEntity = store.sensors.find((s) => s.entity_id === roomEntityId.value);
  
  // First, search for humidity sensor in the area's entities
  if (areaEntity && areaEntity.entities) {
    for (const entityId of areaEntity.entities) {
      const entity = store.sensors.find((s) => s.entity_id === entityId);
      if (entity && entity.attributes?.device_class === 'humidity') {
        return entity;
      }
    }
  }
  
  // Fallback: search in the provided entity list
  for (const entityId of entityArray.value) {
    if (entityId.startsWith('area.')) continue;
    const entity = store.sensors.find((s) => s.entity_id === entityId);
    if (entity && entity.attributes?.device_class === 'humidity') {
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
  const state = entity.state?.toLowerCase();
  
  // Media player uses play when paused, pause when playing
  if (domain === 'media_player') {
    const isPlaying = state === 'playing';
    return isPlaying ? 'mdi mdi-pause' : 'mdi mdi-play';
  }

  const domainIcons = {
    light: 'mdi mdi-lightbulb',
    switch: 'mdi mdi-power-plug',
    fan: 'mdi mdi-fan',
    binary_sensor: 'mdi mdi-eye',
    sensor: 'mdi mdi-gauge',
  };

  return domainIcons[domain] || 'mdi mdi-help-circle';
};

// Get icon color for control object (matches circle color when on, darker when off)
const getIconColor = (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return '#333333';

  const state = entity.state?.toLowerCase();
  const isOn = state === 'on' || state === 'open' || state === 'active' || state === 'playing';

  if (isOn) {
    // White icon as default
    return 'white';
  } else {
    // Darker gray when off
    return '#999999';
  }
};

// Get color for control object based on state
const getObjectColor = (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return '#cccccc';

  const domain = entityId.split('.')[0];
  const state = entity.state?.toLowerCase();
  const isOn = state === 'on' || state === 'open' || state === 'active' || state === 'playing';

  if (isOn) {
    // Use domain-specific colors when on
    if (domain === 'light') {
      return '#ffc107'; // Yellow for lights
    }
    if (domain === 'fan') {
      return '#007bff'; // Blue for fans
    }
    // Green for media players and other entities
    return '#28a745';
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

// Check if entity is unavailable
const isEntityUnavailable = (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return true;
  const state = entity.state?.toLowerCase();
  return state === 'unavailable' || state === 'unknown';
};

// Toggle entity on/off
const toggleEntity = async (entityId) => {
  const entity = store.sensors.find((s) => s.entity_id === entityId);
  if (!entity) return;

  const domain = entityId.split('.')[0];
  const state = entity.state?.toLowerCase();

  try {
    // Media players use play/pause service instead of on/off
    if (domain === 'media_player') {
      if (state === 'playing') {
        await callService('media_player', 'media_pause', {
          entity_id: entityId,
        });
      } else {
        await callService('media_player', 'media_play', {
          entity_id: entityId,
        });
      }
    } else {
      // Standard on/off toggle for other entities
      const service = state === 'on' ? 'turn_off' : 'turn_on';
      await callService(domain, service, {
        entity_id: entityId,
      });
    }
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
}

.room-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  gap: 0.5rem;
  direction: rtl;
}

.room-controls-grid .control-object {
  direction: ltr;
}

.room-header {
  padding-bottom: 0.75rem;
}

.room-icon-wrapper {
  position: relative;
  margin: 0;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-icon-wrapper .ha-icon-circle {
  background-color: transparent;
}

.room-icon-wrapper .ha-icon-overlay {
  font-size: 2.5rem;
}

.control-object {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.control-object:hover:not(.control-object-disabled) {
  transform: scale(1.1);
}

.control-object.control-object-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.control-object.control-object-disabled .ha-control-circle {
  filter: grayscale(100%) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
}

.control-object:hover .ha-control-circle {
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
}
</style>
