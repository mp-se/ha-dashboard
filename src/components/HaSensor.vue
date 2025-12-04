<template>
  <div v-if="entityList.length === 1 && !resolvedEntity" class="col-lg-4 col-md-6">
    <div class="card card-display h-100 rounded-4 shadow-lg border-warning">
      <div class="card-body text-center text-warning">
        <i class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div>Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found</div>
      </div>
    </div>
  </div>

  <div v-else-if="entityList.length === 1" class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', cardBorderClass, 'h-100', 'rounded-4', 'shadow-lg']">
      <div :class="['card-body', 'd-flex', requestedAttributes.length === 0 ? 'align-items-center' : 'align-items-start', 'gap-3']">
        <div v-if="iconClass" class="icon-circle-wrapper flex-shrink-0">
          <div class="icon-bg" :style="{ backgroundColor: iconCircleColor }">
            <i :class="iconClass" class="icon-overlay"></i>
          </div>
        </div>
        <div class="flex-grow-1">
          <div class="text-start">
            <h6 class="card-title">{{ name }}</h6>
            <!-- Display requested attributes if provided -->
            <div v-if="requestedAttributes.length > 0" class="mt-1">
              <div v-for="[key, value] in requestedAttributes" :key="key" class="small d-flex gap-2 mb-0">
                <div class="text-muted" style="font-size: 0.75rem; min-width: 70px;">{{ formatKey(key) }}:</div>
                <div>{{ formatAttributeValue(value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-shrink-0">
          <div class="ha-sensor-value fw-bold text-end">
            {{ formattedValue }}<span class="ha-sensor-unit ms-1">{{ unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', 'h-100', 'rounded-4', 'shadow-lg', 'border-info']">
      <div class="card-body">
        <div v-for="ent in entityList" :key="ent" class="mb-2">
          <div class="d-flex align-items-center gap-2">
            <div v-if="getIconClass(ent)" class="icon-circle-wrapper">
              <div class="icon-bg-small" :style="{ backgroundColor: getIconCircleColor(ent) }">
                <i :class="getIconClass(ent)" class="icon-overlay-small"></i>
              </div>
            </div>
            <div class="flex-grow-1 text-start">
              <h6 class="card-title-small">{{ getName(ent) }}</h6>
            </div>
            <div class="text-end flex-shrink-0">
              <div class="ha-sensor-value-small fw-bold">
                {{ getFormattedValue(ent) }}<span class="ha-sensor-unit-small ms-1">{{ getUnit(ent) }}</span>
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
import { useEntityResolver } from '@/composables/useEntityResolver';
import { useIconClass } from '@/composables/useIconClass';
import { useIconCircleColor } from '@/composables/useIconCircleColor';

const props = defineProps({
  entity: {
    type: [Object, String, Array],
    required: true,
    validator: (value) => {
      if (Array.isArray(value)) {
        return value.every((ent) => {
          if (typeof ent === 'string') {
            return /^[\w]+\.[\w_-]+$/.test(ent);
          } else if (typeof ent === 'object') {
            return ent && ent.entity_id && ent.state && ent.attributes;
          }
          return false;
        });
      } else if (typeof value === 'string') {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  attributes: {
    type: Array,
    default: () => [],
  },
});

const store = useHaStore();

// Entity list: if entity is array, use it, else [entity]
const entityList = computed(() => {
  if (Array.isArray(props.entity)) {
    return props.entity;
  }
  return [props.entity];
});

// Use composable for single entity resolution
const { resolvedEntity } = useEntityResolver(
  Array.isArray(props.entity) ? props.entity[0] : props.entity
);

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');
const unit = computed(() => resolvedEntity.value?.attributes?.unit_of_measurement || '');

// Get entity ID for icon circle color calculation
const entityId = computed(() => {
  const firstEntity = Array.isArray(props.entity) ? props.entity[0] : props.entity;
  if (typeof firstEntity === 'string') {
    return firstEntity;
  }
  return resolvedEntity.value?.entity_id || '';
});

// Calculate icon circle color
const iconCircleColor = computed(() => {
  return useIconCircleColor(resolvedEntity.value, entityId.value);
});

// Format numbers if possible, otherwise show raw state
const formattedValue = computed(() => {
  const s = state.value;
  if (s === 'unknown' || s === 'unavailable') return s;
  // try parse as number
  const n = Number(s);
  if (!Number.isNaN(n)) {
    // If unit indicates temperature or percent, show one decimal, else show up to 2 decimals
    if ((unit.value && /°|°C|°F|%|percent/i.test(unit.value)) || Math.abs(n) < 100) {
      return n.toFixed(1);
    }
    return n.toFixed(0);
  }
  return s;
});

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  return 'border-info';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

const iconClass = computed(() => {
  if (!resolvedEntity.value) return null;
  const firstEntity = Array.isArray(props.entity) ? props.entity[0] : props.entity;
  const entityId = typeof firstEntity === 'string' ? firstEntity : resolvedEntity.value.entity_id;
  return useIconClass(resolvedEntity.value, entityId);
});

// Return requested attributes as [key, value] pairs
const requestedAttributes = computed(() => {
  if (!props.attributes || props.attributes.length === 0) return [];
  if (!resolvedEntity.value) return [];
  
  const attrs = resolvedEntity.value.attributes || {};
  const result = [];
  
  for (const key of props.attributes) {
    if (key in attrs) {
      result.push([key, attrs[key]]);
    }
  }
  
  return result;
});

const formatKey = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatAttributeValue = (value) => {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

// Return an array of [key, value] for the attributes to show
// (Removed - no longer showing attributes, just icon, name, and value)

const getResolved = (ent) => {
  if (typeof ent === 'string') {
    return store.sensors.find((s) => s.entity_id === ent);
  } else {
    return ent;
  }
};

const getName = (ent) => {
  try {
    const res = getResolved(ent);
    return res?.attributes?.friendly_name || res?.entity_id || 'Unknown';
  } catch (error) {
    console.warn('Error getting name for entity:', ent, error);
    return 'Unknown';
  }
};

const getFormattedValue = (ent) => {
  try {
    const res = getResolved(ent);
    const s = res?.state ?? 'unknown';
    const u = res?.attributes?.unit_of_measurement || '';
    if (s === 'unknown' || s === 'unavailable') return s;
    const n = Number(s);
    if (!Number.isNaN(n)) {
      if ((u && /°|°C|°F|%|percent/i.test(u)) || Math.abs(n) < 100) {
        return n.toFixed(1);
      }
      return n.toFixed(0);
    }
    return s;
  } catch (error) {
    console.warn('Error formatting value for entity:', ent, error);
    return 'unknown';
  }
};

const getUnit = (ent) => {
  try {
    const res = getResolved(ent);
    return res?.attributes?.unit_of_measurement || '';
  } catch (error) {
    console.warn('Error getting unit for entity:', ent, error);
    return '';
  }
};

const getIconClass = (ent) => {
  try {
    const res = getResolved(ent);
    if (!res || !res.attributes) return null;
    const entityId = typeof ent === 'string' ? ent : res.entity_id;
    return useIconClass(res, entityId);
  } catch (error) {
    console.warn('Error getting icon class for entity:', ent, error);
    return null;
  }
};

const getIconCircleColor = (ent) => {
  try {
    const res = getResolved(ent);
    if (!res) return '#6c757d';
    const entityId = typeof ent === 'string' ? ent : res.entity_id;
    return useIconCircleColor(res, entityId);
  } catch (error) {
    console.warn('Error getting icon circle color for entity:', ent, error);
    return '#6c757d';
  }
};
</script>

<style scoped>
/* Sensor value and unit styling */
.ha-sensor-value {
  font-size: 1.25rem;
  line-height: 1;
}

.ha-sensor-unit {
  font-size: 0.75rem;
  color: #999;
}

.ha-sensor-value-small {
  font-size: 0.9rem;
  line-height: 1;
}

.ha-sensor-unit-small {
  font-size: 0.65rem;
  color: #999;
}

/* Icon background circle */
.icon-circle-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.icon-bg-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.icon-bg-wrapper-small {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.icon-bg-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.icon-overlay {
  position: relative;
  z-index: 1;
  font-size: 1.5rem;
  color: white;
}

.icon-overlay-small {
  position: relative;
  z-index: 1;
  font-size: 1.1rem;
  color: white;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.card-title-small {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0;
}
</style>
