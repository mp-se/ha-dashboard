<template>
  <div class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', cardBorderClass, 'h-75', 'rounded-4', 'shadow-lg']">
      <div class="card-body p-0 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center p-2">
          <div v-if="iconClass" class="icon-circle-wrapper-slim me-2">
            <svg width="36" height="36" viewBox="0 0 40 40" class="icon-circle">
              <circle cx="20" cy="20" r="18" :fill="iconCircleColor" />
            </svg>
            <i :class="iconClass" class="icon-overlay-slim"></i>
          </div>
          <div class="ha-sensor-value fw-bold small">{{ formattedValue }}</div>
        </div>
        <div class="text-end p-2">
          <h6 class="card-title mb-0 h6">{{ name }}</h6>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';
import { useIconClass } from '@/composables/useIconClass';
import { useIconCircleColor } from '@/composables/useIconCircleColor';

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_]+$/.test(value);
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

// Smart entity resolution
const resolvedEntity = computed(() => {
  if (typeof props.entity === 'string') {
    const found = store.sensors.find((s) => s.entity_id === props.entity);
    if (!found) {
      console.warn(`Entity "${props.entity}" not found`);
      return null;
    }
    return found;
  } else {
    return props.entity;
  }
});

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');

// Get entity ID for icon circle color calculation
const entityId = computed(() => {
  if (typeof props.entity === 'string') {
    return props.entity;
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
    const unit = resolvedEntity.value?.attributes?.unit_of_measurement || '';
    if ((unit && /°|°C|°F|%|percent/i.test(unit)) || Math.abs(n) < 100) {
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
  const entityId = typeof props.entity === 'string' ? props.entity : props.entity.entity_id;
  return useIconClass(resolvedEntity.value, entityId);
});
</script>

<style scoped>
/* Sensor value should be slightly smaller than the name but still prominent */
.ha-sensor-value {
  font-size: 0.95rem;
}

.icon-circle-wrapper-slim {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.icon-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.icon-overlay-slim {
  position: relative;
  z-index: 1;
  font-size: 1.2rem;
  color: white;
}
</style>
