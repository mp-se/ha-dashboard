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
                <i v-if="weatherIcon" :class="weatherIcon" class="weather-icon me-1"></i>
                <div class="weather-condition text-capitalize fw-bold me-2">{{ state }}</div>
                <span v-if="windSpeedMs" class="text-primary me-2"
                  >{{ windSpeedMs.toFixed(1) }} m/s</span
                >
                <span v-if="windBearing" class="text-primary">{{ windDirectionArrow }}</span>
              </div>
            </div>
            <div class="text-end small">
              <div v-if="pressure" class="mb-1">
                <span class="text-muted">Pressure:</span>
                <span class="fw-bold">{{ pressure }} {{ pressureUnit }}</span>
              </div>
              <div v-if="visibility" class="mb-1">
                <span class="text-muted">Visibility:</span>
                <span class="fw-bold">{{ visibility }} {{ visibilityUnit }}</span>
              </div>
              <div v-if="temperature">
                <span class="text-muted">Temp:</span>
                <span class="fw-bold">{{ temperature }} {{ temperatureUnit }}</span>
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
import { useEntityResolver } from '@/composables/useEntityResolver';

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  attributes: { type: Array, default: () => [] },
});

const store = useHaStore();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

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

const weatherIcon = computed(() => {
  const condition = state.value?.toLowerCase();
  const iconMap = {
    sunny: 'mdi mdi-weather-sunny',
    clear: 'mdi mdi-weather-sunny',
    'clear-night': 'mdi mdi-weather-night',
    partlycloudy: 'mdi mdi-weather-partly-cloudy',
    'partly-cloudy': 'mdi mdi-weather-partly-cloudy',
    cloudy: 'mdi mdi-weather-cloudy',
    rainy: 'mdi mdi-weather-rainy',
    rain: 'mdi mdi-weather-rainy',
    pouring: 'mdi mdi-weather-pouring',
    snowy: 'mdi mdi-weather-snowy',
    snow: 'mdi mdi-weather-snowy',
    sleet: 'mdi mdi-weather-snowy-rainy',
    hail: 'mdi mdi-weather-hail',
    thunderstorm: 'mdi mdi-weather-lightning',
    lightning: 'mdi mdi-weather-lightning',
    foggy: 'mdi mdi-weather-fog',
    fog: 'mdi mdi-weather-fog',
    windy: 'mdi mdi-weather-windy',
    wind: 'mdi mdi-weather-windy',
    exceptional: 'mdi mdi-alert-circle-outline',
  };
  return iconMap[condition] || 'mdi mdi-weather-cloudy';
});

// Weather-specific attributes
const temperature = computed(() => resolvedEntity.value?.attributes?.temperature);
const temperatureUnit = computed(() => resolvedEntity.value?.attributes?.temperature_unit || 'C');

const pressure = computed(() => resolvedEntity.value?.attributes?.pressure);
const pressureUnit = computed(() => resolvedEntity.value?.attributes?.pressure_unit || 'hPa');

const visibility = computed(() => resolvedEntity.value?.attributes?.visibility);
const visibilityUnit = computed(() => resolvedEntity.value?.attributes?.visibility_unit || 'km');

const windSpeed = computed(() => resolvedEntity.value?.attributes?.wind_speed);
const windBearing = computed(() => resolvedEntity.value?.attributes?.wind_bearing);

const windSpeedMs = computed(() => {
  const speed = windSpeed.value;
  if (!speed && speed !== 0) return null;
  // Convert to m/s assuming input is km/h
  return speed / 3.6;
});

const windDirectionArrow = computed(() => {
  const bearing = windBearing.value;
  if (!bearing && bearing !== 0) return '';
  const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
});
</script>

<style scoped>
.weather-condition {
  font-size: 1rem;
  color: var(--bs-primary);
}

.weather-icon {
  font-size: 1.5rem;
  color: var(--bs-primary);
}

.weather-details {
  font-size: 0.85rem;
}
</style>
