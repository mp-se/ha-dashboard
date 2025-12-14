<template>
  <div class="col-lg-4 col-md-6">
    <!-- Error state: no consumption sensors found -->
    <div
      v-if="!energySensor"
      class="card card-display h-100 rounded-4 shadow-lg border-warning"
    >
      <div class="card-body text-center text-warning">
        <i class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div>No energy consumption sensors found</div>
        <small class="text-muted d-block mt-2"
          >Configure energy sensors in Home Assistant</small
        >
      </div>
    </div>

    <!-- Main energy card -->
    <div v-else class="card card-display h-100 rounded-4 shadow-lg border-info">
      <!-- Header: Icon + Name + Period Button -->
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="card-title mb-0">{{ cardTitle }}</h6>
          <div class="d-flex align-items-center gap-2">
            <small class="text-muted">{{ unit }}</small>
            <button
              class="btn btn-sm btn-outline-secondary"
              @click="cyclePeriod"
            >
              {{ currentPeriodLabel }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-warning mb-0">
          <small>{{ error }}</small>
        </div>

        <!-- Bar Chart -->
        <div v-else class="energy-chart mb-3 position-relative">
          <!-- HTML Tooltip -->
          <div
            v-if="hoveredIndex >= 0"
            class="chart-tooltip"
            :style="tooltipStyle"
          >
            {{ formatValue(chartData[hoveredIndex].value) }}
          </div>

          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            class="w-100"
            style="min-height: 200px; margin: 0 -8px"
            preserveAspectRatio="none"
          >
            <!-- Y-axis scale labels -->
            <g class="chart-axis">
              <text
                x="25"
                y="20"
                font-size="12"
                text-anchor="end"
                class="text-muted"
              >
                {{ formatYAxisLabel(maxValue) }}
              </text>
              <text
                x="25"
                y="100"
                font-size="12"
                text-anchor="end"
                class="text-muted"
              >
                {{ formatYAxisLabel(maxValue / 2) }}
              </text>
              <text
                x="25"
                y="180"
                font-size="12"
                text-anchor="end"
                class="text-muted"
              >
                0
              </text>
            </g>

            <!-- Bars -->
            <g class="chart-bars">
              <rect
                v-for="(point, idx) in chartData"
                :key="idx"
                :x="25 + (idx * (chartWidth - 30)) / chartData.length"
                :y="
                  chartHeight -
                  20 -
                  (point.value / maxValue) * (chartHeight - 40)
                "
                :width="((chartWidth - 30) / chartData.length) * 0.95"
                :height="(point.value / maxValue) * (chartHeight - 40)"
                class="bar"
                fill="#007bff"
                rx="2"
                @mouseenter="hoveredIndex = idx"
                @mouseleave="hoveredIndex = -1"
              />
            </g>

            <!-- X-axis labels (every nth label to avoid crowding) -->
            <g class="chart-axis">
              <text
                v-for="(point, idx) in labelStep === 1
                  ? chartData
                  : chartData.filter((_, i) => i % labelStep === 0)"
                :key="`label-${idx}`"
                :x="
                  25 +
                  (chartData.indexOf(point) * (chartWidth - 30)) /
                    chartData.length +
                  (chartWidth - 30) / (chartData.length * 2)
                "
                :y="chartHeight - 2"
                font-size="11"
                text-anchor="middle"
                class="text-muted"
              >
                {{ point.label }}
              </text>
            </g>
          </svg>
        </div>

        <!-- Statistics Panel -->
        <div v-if="!isLoading && !error" class="small mt-2">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span class="text-muted">Peak:</span>
              <span class="fw-bold ms-1"
                >{{ formatValue(stats.max) }} {{ unit }}</span
              >
            </div>
            <div class="text-center">
              <span class="text-muted">Average:</span>
              <span class="fw-bold ms-1"
                >{{ formatValue(stats.avg) }} {{ unit }}</span
              >
            </div>
            <div class="text-end">
              <span class="text-muted">Total:</span>
              <span class="fw-bold ms-1"
                >{{ formatValue(stats.total) }}
                {{ unit === "W" ? "kWh" : unit }}</span
              >
            </div>
          </div>
          <div v-if="stats.comparison !== null">
            <i
              :class="[
                'mdi',
                stats.comparison >= 0
                  ? 'mdi-trending-up text-danger'
                  : 'mdi-trending-down text-success',
              ]"
            ></i>
            <span
              :class="stats.comparison >= 0 ? 'text-danger' : 'text-success'"
            >
              {{ Math.abs(stats.comparison) }}% vs previous
              {{ selectedPeriod }}d
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useHaStore } from "@/stores/haStore";

const store = useHaStore();

// Period definitions
const periods = [1, 3, 7, 14];
const periodLabels = ["1d", "3d", "7d", "14d"];

// Component state
const selectedPeriodIndex = ref(0);
const isLoading = ref(false);
const error = ref(null);
const chartData = ref([]);
const hoveredIndex = ref(-1);
const isFetching = ref(false);

// Current period and label
const selectedPeriod = computed(() => periods[selectedPeriodIndex.value]);
const currentPeriodLabel = computed(
  () => periodLabels[selectedPeriodIndex.value],
);

/**
 * Cycle through available periods
 */
function cyclePeriod() {
  // Prevent cycling while a fetch is in progress
  if (isFetching.value) return;

  selectedPeriodIndex.value = (selectedPeriodIndex.value + 1) % periods.length;
}

// Chart dimensions
const chartWidth = 400;
const chartHeight = 200;

// Get the primary consumption sensor (prefer energy sensor, fallback to power)
const energySensor = computed(() => {
  const energySensors = store.getEnergyConsumptionSensors();
  const powerSensors = store.getPowerConsumptionSensors();

  // Prefer energy sensor (accumulated consumption)
  if (energySensors.length > 0) {
    return energySensors[0];
  }
  // Fallback to power sensor
  if (powerSensors.length > 0) {
    return powerSensors[0];
  }
  return null;
});

// Unit of measurement
const unit = computed(() => {
  if (!energySensor.value) return "";
  return energySensor.value.attributes?.unit_of_measurement || "";
});

// Card title
const cardTitle = computed(() => {
  if (!energySensor.value) return "Energy";
  return energySensor.value.attributes?.friendly_name || "Energy Consumption";
});

// Calculate statistics from chart data
const stats = computed(() => {
  if (chartData.value.length === 0) {
    return { max: 0, min: 0, avg: 0, total: 0, comparison: null };
  }

  const values = chartData.value.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const total = values.reduce((a, b) => a + b, 0);

  return {
    max: Math.round(max * 100) / 100,
    min: Math.round(min * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    total: Math.round(total * 100) / 100,
    comparison: null, // TODO: Calculate vs previous period
  };
});

// Maximum value for Y-axis scaling
const maxValue = computed(() => {
  if (stats.value.max === 0) return 1;
  // Round up to nearest "nice" number
  const magnitude = Math.pow(10, Math.floor(Math.log10(stats.value.max)));
  return Math.ceil(stats.value.max / magnitude) * magnitude;
});

// Label step for X-axis (show every nth label to avoid crowding)
const labelStep = computed(() => {
  if (chartData.value.length <= 12) return 1;
  if (chartData.value.length <= 24) return 2;
  return Math.ceil(chartData.value.length / 12);
});

// Tooltip positioning
const tooltipStyle = computed(() => {
  if (hoveredIndex.value < 0) return {};

  const barWidth = (chartWidth - 30) / chartData.value.length;
  const barX =
    25 +
    (hoveredIndex.value * (chartWidth - 30)) / chartData.value.length +
    barWidth * 0.5;
  const percentage = (barX / chartWidth) * 100;

  return {
    left: `${percentage}%`,
  };
});

// Fetch energy history when period changes
watch(selectedPeriodIndex, async () => {
  await fetchEnergyData();
});

// Initial load
onMounted(async () => {
  await fetchEnergyData();
});

/**
 * Fetch energy consumption history
 */
async function fetchEnergyData() {
  if (!energySensor.value) return;

  // Prevent concurrent requests
  if (isFetching.value) return;

  isFetching.value = true;
  isLoading.value = true;
  error.value = null;

  try {
    const data = await store.fetchEnergyHistory(
      energySensor.value.entity_id,
      selectedPeriod.value,
    );
    chartData.value = data;

    if (data.length === 0) {
      error.value = "No data available for this period";
    }
  } catch (e) {
    error.value = `Failed to load data: ${e.message}`;
    console.error("Energy history error:", e);
  } finally {
    isLoading.value = false;
    isFetching.value = false;
  }
}

/**
 * Format value for display
 */
function formatValue(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(1);
}

/**
 * Format Y-axis label
 */
function formatYAxisLabel(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return `${Math.round(value)}`;
}
</script>

<style scoped>
.card-display {
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid var(--bs-border-color);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.energy-chart {
  border-radius: 4px;
  padding: 8px;
  position: relative;
}

.chart-tooltip {
  position: absolute;
  top: 50%;
  transform: translateY(-50%) translateX(-50%);
  background: white;
  color: #007bff;
  padding: 4px 8px;
  border: 2px solid #007bff;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

.chart-axis text {
  fill: #999;
}

.chart-bars rect {
  transition: fill 0.2s ease;
  cursor: pointer;
}

.chart-bars rect:hover {
  fill: #0056b3;
  filter: brightness(0.9);
}
</style>
