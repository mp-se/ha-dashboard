<template>
  <div class="col-md-4">
    <div
      :class="[
        'card',
        'card-display',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : cardBorderClass,
      ]"
    >
      <div :class="['card-body', !resolvedEntity ? 'text-center text-warning' : 'py-2']">
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>
        <template v-else>
          <div class="d-flex align-items-center">
            <div class="flex-grow-1 text-start">
              <h6 class="card-title mb-1">{{ name }}</h6>
              <div class="d-flex align-items-center mb-1">
                <i :class="sunIcon" class="sun-icon me-2"></i>
                <div class="sun-condition text-capitalize fw-bold">
                  {{ state.replace('_', ' ') }}
                </div>
              </div>
            </div>
            <div class="text-end small">
              <div class="mb-1">
                <span class="text-muted">Dawn:</span>
                <span class="fw-bold">{{ formatTime24h(nextRising) }}</span>
              </div>
              <div>
                <span class="text-muted">Dusk:</span>
                <span class="fw-bold">{{ formatTime24h(nextSetting) }}</span>
              </div>
            </div>
          </div>
          <div v-if="deviceName" class="mt-2 pt-1 border-top">
            <small class="text-muted">{{ deviceName }}</small>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';

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

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  return 'border-info';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

const deviceName = computed(() => {
  if (!resolvedEntity.value) return null;
  const deviceId = resolvedEntity.value.attributes?.device_id;
  if (deviceId) {
    const device = store.devices.find((d) => d.id === deviceId);
    return device?.name || device?.name_by_user || `Device ${deviceId}`;
  }
  return null;
});

const sunIcon = computed(() => {
  const currentState = state.value?.toLowerCase();
  if (currentState === 'above_horizon') {
    return 'mdi mdi-weather-sunny';
  } else if (currentState === 'below_horizon') {
    return 'mdi mdi-weather-night';
  }
  return 'mdi mdi-weather-sunset';
});

// Sun-specific attributes
const nextRising = computed(() => resolvedEntity.value?.attributes?.next_rising);
const nextSetting = computed(() => resolvedEntity.value?.attributes?.next_setting);

const formatTime24h = (dateString) => {
  if (!dateString) return '--:--';
  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '--:--';
  }
};
</script>

<style scoped>
.sun-condition {
  font-size: 1rem;
  color: var(--bs-primary);
}

.sun-icon {
  font-size: 1.5rem;
  color: var(--bs-warning);
}

.sun-times {
  font-size: 0.85rem;
}
</style>
