<template>
  <div class="col-md-4">
    <div :class="['card', 'card-display', cardBorderClass, 'h-75', 'rounded-4', 'shadow-lg']">
      <div class="card-body p-0 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center p-2">
          <div v-if="iconClass" class="me-2">
            <i :class="iconClass" style="font-size: 1.5rem"></i>
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
</style>
