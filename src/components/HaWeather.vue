<template>
  <div class="col-lg-4 col-md-6">
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
      <div
        :class="[
          'card-body',
          !resolvedEntity ? 'text-center text-warning' : 'py-2',
        ]"
      >
        <i
          v-if="!resolvedEntity"
          class="mdi mdi-alert-circle mdi-24px mb-2"
        ></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === "string" ? entity : entity?.entity_id }}"
          not found
        </div>
        <template v-else>
          <div class="d-flex align-items-center">
            <div class="flex-grow-1 text-start">
              <h6 class="card-title mb-1">{{ name }}</h6>
              <div class="d-flex align-items-center mb-1">
                <i
                  v-if="weatherIcon"
                  :class="weatherIcon"
                  class="weather-icon me-1"
                ></i>
                <div class="weather-condition fw-bold me-2">
                  {{ formatCondition(state) }}
                </div>
                <span v-if="windSpeedMs" class="text-primary me-2"
                  >{{ windSpeedMs.toFixed(1) }} m/s</span
                >
                <span v-if="windBearing" class="text-primary">{{
                  windDirectionArrow
                }}</span>
              </div>
            </div>
            <div class="text-end small">
              <div v-if="humidity" class="mb-1">
                <span class="text-muted">Humidity:</span>
                <span class="fw-bold">{{ humidity }}%</span>
              </div>
              <div v-if="pressure" class="mb-1">
                <span class="text-muted">Pressure:</span>
                <span class="fw-bold">{{ pressure }} {{ pressureUnit }}</span>
              </div>
              <div v-if="visibility" class="mb-1">
                <span class="text-muted">Visibility:</span>
                <span class="fw-bold"
                  >{{ visibility }} {{ visibilityUnit }}</span
                >
              </div>
              <div v-if="temperature">
                <span class="text-muted">Temp:</span>
                <span class="fw-bold"
                  >{{ temperature }} {{ temperatureUnit }}</span
                >
              </div>
            </div>
          </div>

          <!-- Forecast Section -->
          <div
            v-if="forecastData.length > 0 && !isForecastHourly && forecast"
            class="mt-2 mb-2"
          >
            <div class="forecast-container">
              <div
                v-for="(item, index) in displayForecast"
                :key="index"
                class="forecast-item"
              >
                <div class="forecast-time">
                  {{ formatDate(item.datetime) }}
                </div>
                <div class="forecast-temp">
                  {{ Math.round(item.temperature) }}° /
                  {{ Math.round(item.templow) }}°
                </div>
                <div class="forecast-condition">
                  {{ formatCondition(item.condition) }}
                </div>
                <div v-if="item.wind_speed !== undefined" class="forecast-wind">
                  <i
                    class="mdi mdi-weather-windy"
                    style="font-size: 0.75rem"
                  ></i>
                  {{
                    Math.round(convertToMs(item.wind_speed, windSpeedUnit))
                  }}
                  m/s
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useEntityResolver } from "@/composables/useEntityResolver";

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === "string") {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === "object") {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  attributes: { type: Array, default: () => [] },
  forecast: { type: Boolean, default: true },
});

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? "unknown");

const isUnavailable = computed(() =>
  ["unavailable", "unknown"].includes(state.value),
);

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return "border-warning";
  return "border-info";
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name ||
    resolvedEntity.value?.entity_id ||
    "Unknown",
);

const weatherIcon = computed(() => {
  const condition = state.value?.toLowerCase();
  const iconMap = {
    sunny: "mdi mdi-weather-sunny",
    clear: "mdi mdi-weather-sunny",
    "clear-night": "mdi mdi-weather-night",
    partlycloudy: "mdi mdi-weather-partly-cloudy",
    "partly-cloudy": "mdi mdi-weather-partly-cloudy",
    cloudy: "mdi mdi-weather-cloudy",
    rainy: "mdi mdi-weather-rainy",
    rain: "mdi mdi-weather-rainy",
    pouring: "mdi mdi-weather-pouring",
    snowy: "mdi mdi-weather-snowy",
    snow: "mdi mdi-weather-snowy",
    sleet: "mdi mdi-weather-snowy-rainy",
    hail: "mdi mdi-weather-hail",
    thunderstorm: "mdi mdi-weather-lightning",
    lightning: "mdi mdi-weather-lightning",
    foggy: "mdi mdi-weather-fog",
    fog: "mdi mdi-weather-fog",
    windy: "mdi mdi-weather-windy",
    wind: "mdi mdi-weather-windy",
    exceptional: "mdi mdi-alert-circle-outline",
  };
  return iconMap[condition] || "mdi mdi-weather-cloudy";
});

// Weather-specific attributes
const temperature = computed(
  () => resolvedEntity.value?.attributes?.temperature,
);
const temperatureUnit = computed(
  () => resolvedEntity.value?.attributes?.temperature_unit || "C",
);

const pressure = computed(() => resolvedEntity.value?.attributes?.pressure);
const pressureUnit = computed(
  () => resolvedEntity.value?.attributes?.pressure_unit || "hPa",
);

const visibility = computed(() => resolvedEntity.value?.attributes?.visibility);
const visibilityUnit = computed(
  () => resolvedEntity.value?.attributes?.visibility_unit || "km",
);

const humidity = computed(() => resolvedEntity.value?.attributes?.humidity);

const windSpeed = computed(() => resolvedEntity.value?.attributes?.wind_speed);
const windBearing = computed(
  () => resolvedEntity.value?.attributes?.wind_bearing,
);
const windSpeedUnit = computed(
  () => resolvedEntity.value?.attributes?.wind_speed_unit || "km/h",
);

const convertToMs = (speed, unit) => {
  if (speed === null || speed === undefined) return null;
  const conversions = {
    "km/h": (v) => v / 3.6,
    "m/s": (v) => v,
    "mi/h": (v) => v * 0.44704,
    "ft/s": (v) => v * 0.3048,
    kn: (v) => v * 0.51444,
  };
  const converter = conversions[unit] || conversions["km/h"];
  return converter(speed);
};

const windSpeedMs = computed(() => {
  const speed = windSpeed.value;
  if (!speed && speed !== 0) return null;
  // Convert to m/s based on the entity's wind speed unit
  return convertToMs(speed, windSpeedUnit.value);
});

const windDirectionArrow = computed(() => {
  const bearing = windBearing.value;
  if (!bearing && bearing !== 0) return "";
  const directions = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
});

// Forecast data
const forecastData = computed(
  () => resolvedEntity.value?.attributes?.forecast || [],
);

const isForecastHourly = computed(() => {
  if (forecastData.value.length === 0) return false;
  const firstItem = forecastData.value[0];
  // If it has templow, it's daily forecast; otherwise it's hourly
  return !("templow" in firstItem);
});

const displayForecast = computed(() => {
  // Show 3 days forecast
  return forecastData.value.slice(0, 3);
});

const formatCondition = (text) => {
  return text
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (isoDatetime) => {
  if (!isoDatetime) return "";
  try {
    const date = new Date(isoDatetime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};
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

.forecast-container {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0;
  margin-left: -1.5rem;
  margin-right: -1.5rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 0;
  margin-bottom: -1rem;
}

.forecast-item {
  flex: 1;
  text-align: center;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem;
  background: transparent;
  font-size: 0.75rem;
}

.forecast-time {
  font-weight: 600;
  color: #666;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forecast-temp {
  font-weight: 600;
  font-size: 0.875rem;
  color: #333;
  margin: 0.25rem 0;
}

.forecast-condition {
  font-size: 0.7rem;
  color: #555;
  margin: 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forecast-wind {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  color: #0078d4;
  margin-top: 0.25rem;
  font-size: 0.65rem;
}
</style>
