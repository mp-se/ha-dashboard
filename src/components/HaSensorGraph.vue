<template>
  <div v-if="entity" class="col-lg-4 col-md-6">
    <div class="ha-sensor-graph card card-display h-100 rounded-4 shadow-lg">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="card-title mb-0 d-flex justify-content-between align-items-center">
            <span>{{ title }}</span>
          </h6>
          <div class="d-flex align-items-center gap-2">
            <small class="text-muted">{{ unit }}</small>
            <button class="btn btn-sm btn-outline-secondary" @click="cycleHours">
              {{ hoursLocal }}h
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-center py-4">Loading history…</div>
        <div v-else-if="error" class="text-danger">{{ error }}</div>
        <div
          v-else-if="points.length === 0"
          class="text-muted text-center d-flex align-items-center justify-content-center"
          style="height: 150px"
        >
          No numeric history available for this sensor.
        </div>
        <div v-else class="position-relative" style="padding-left: 2rem">
          <svg
            :width="width"
            :height="height"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            class="w-100"
          >
            <!-- Filled area under first line -->
            <path
              v-if="polylinePoints"
              :d="`${getAreaPath(polylinePoints)}`"
              fill="#0d6efd"
              opacity="0.15"
            />
            <!-- Filled area under second line -->
            <path
              v-if="polylinePoints2"
              :d="`${getAreaPath(polylinePoints2)}`"
              fill="#dc3545"
              opacity="0.15"
            />
            <!-- Filled area under third line -->
            <path
              v-if="polylinePoints3"
              :d="`${getAreaPath(polylinePoints3)}`"
              fill="#198754"
              opacity="0.15"
            />
            
            <!-- Line graphs -->
            <polyline
              :points="polylinePoints"
              fill="none"
              stroke="#0d6efd"
              stroke-width="0.9"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <polyline
              v-if="polylinePoints2"
              :points="polylinePoints2"
              fill="none"
              stroke="#dc3545"
              stroke-width="0.9"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <polyline
              v-if="polylinePoints3"
              :points="polylinePoints3"
              fill="none"
              stroke="#198754"
              stroke-width="0.9"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
          <!-- Min and max on the value axis (y-axis) -->
          <div class="position-absolute start-0 top-0 small text-muted">{{ maxDisplay }}</div>
          <div class="position-absolute start-0 bottom-0 small text-muted">{{ minDisplay }}</div>
        </div>
        <!-- Legend for multi-graph comparison -->
        <div v-if="entityList.length > 1" class="mt-2 d-flex justify-content-center small flex-wrap gap-2">
          <span v-for="(ent, idx) in entityList" :key="idx" class="d-flex align-items-center">
            <span
              class="badge me-1"
              :style="`background-color: ${['#0d6efd', '#dc3545', '#198754'][idx]}`"
            >
              &nbsp;
            </span>
            {{ getEntityLabel(ent) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useHaStore } from '@/stores/haStore';

const props = defineProps({
  entity: {
    type: [Object, String, Array],
    required: true,
    validator: (value) => {
      // Handle array: up to 3 entities
      if (Array.isArray(value)) {
        if (value.length === 0 || value.length > 3) {
          console.warn('HaSensorGraph: entity array must contain 1-3 items, got', value.length);
          return false;
        }
        return value.every((ent) => {
          if (typeof ent === 'string') {
            return /^[\w]+\.[\w_-]+$/.test(ent);
          } else if (typeof ent === 'object') {
            return ent && ent.entity_id && ent.state && ent.attributes;
          }
          return false;
        });
      }
      // Handle single entity: string or object
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  hours: { type: Number, default: 24 },
  maxPoints: { type: Number, default: 200 },
  attributes: { type: Array, default: () => [] },
});

const store = useHaStore();

// Entity list: convert single entity to array, handle existing arrays
const entityList = computed(() => {
  if (Array.isArray(props.entity)) {
    return props.entity;
  }
  return [props.entity];
});

// Resolve all entities in list
const resolvedEntities = computed(() => {
  return entityList.value.map((ent) => {
    if (typeof ent === 'string') {
      const found = store.sensors.find((s) => s.entity_id === ent);
      if (!found) {
        console.warn(`Entity "${ent}" not found`);
        return null;
      }
      return found;
    }
    return ent;
  });
});

const resolvedEntity = computed(() => resolvedEntities.value[0]);

const loading = ref(false);
const error = ref(null);
const points = ref([]);
const points2 = ref([]);
const points3 = ref([]);

const width = 600;
const height = 200;

const title = computed(() => {
  if (entityList.value.length === 1) {
    return (
      resolvedEntity.value?.attributes?.friendly_name ||
      resolvedEntity.value?.entity_id ||
      'Unknown'
    );
  }
  return ''; // Empty header for multi-entity graphs (shown in legend instead)
});

const unit = computed(() => resolvedEntity.value?.attributes?.unit_of_measurement || '');

const minVal = computed(() => {
  const allPoints = [...points.value, ...points2.value, ...points3.value];
  if (allPoints.length === 0) return null;
  return Math.min(...allPoints.map((p) => p.v));
});

const maxVal = computed(() => {
  const allPoints = [...points.value, ...points2.value, ...points3.value];
  if (allPoints.length === 0) return null;
  return Math.max(...allPoints.map((p) => p.v));
});

const formatValue = (val) => {
  if (val == null) return '';
  const num = Number(val);
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
};

const minDisplay = computed(() => formatValue(minVal.value));

const maxDisplay = computed(() => formatValue(maxVal.value));

// Helper to get entity label for legend
const getEntityLabel = (ent) => {
  if (typeof ent === 'string') {
    const resolved = store.sensors.find((s) => s.entity_id === ent);
    return resolved?.attributes?.friendly_name || ent;
  }
  return ent?.attributes?.friendly_name || ent?.entity_id || 'Unknown';
};

// Helper to calculate polyline points from data array
const calculatePolylinePoints = (data) => {
  if (data.length === 0) return '';
  // Get time range from all data
  const allPoints = [...points.value, ...points2.value, ...points3.value];
  if (allPoints.length === 0) return '';
  
  const t0 = Math.min(...allPoints.map((p) => p.t));
  const t1 = Math.max(...allPoints.map((p) => p.t));
  const dx = t1 - t0 || 1;
  const vmin = minVal.value;
  const vmax = maxVal.value;
  const vrange = vmax - vmin || 1;
  
  return data
    .map((p) => {
      const x = ((p.t - t0) / dx) * 100;
      const y = 40 - ((p.v - vmin) / vrange) * 36 - 2;
      return `${x},${y}`;
    })
    .join(' ');
};

const polylinePoints = computed(() => calculatePolylinePoints(points.value));

const polylinePoints2 = computed(() => calculatePolylinePoints(points2.value));

const polylinePoints3 = computed(() => calculatePolylinePoints(points3.value));

const hoursLocal = ref(24);

// Helper to create a filled area path from polyline points
const getAreaPath = (polylinePointsStr) => {
  if (!polylinePointsStr) return '';
  
  const points = polylinePointsStr.split(' ');
  if (points.length < 2) return '';
  
  // Create path: M (move to first point) + line points + L (line down) + line back + Z (close)
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const [lastX, lastY] = lastPoint.split(',');
  
  const path = `M ${firstPoint} L ${polylinePointsStr} L ${lastX},40 L ${firstPoint.split(',')[0]},40 Z`;
  return path;
};

let intervalId = null;

async function loadHistory() {
  loading.value = true;
  error.value = null;
  points.value = [];
  points2.value = [];
  points3.value = [];
  
  try {
    const entitiesToLoad = resolvedEntities.value.filter((e) => e && e.entity_id);
    
    if (entitiesToLoad.length === 0) {
      throw new Error('No valid entities provided');
    }

    console.log('Loading history for entities:', entitiesToLoad.map((e) => e.entity_id));
    
    const results = await Promise.all(
      entitiesToLoad.map((ent) =>
        store.fetchHistory(ent.entity_id, hoursLocal.value, props.maxPoints)
      )
    );

    if (results[0]) points.value = results[0];
    if (results[1]) points2.value = results[1];
    if (results[2]) points3.value = results[2];

    results.forEach((result, idx) => {
      console.log(`Received ${result.length} points for entity ${idx + 1}`);
    });
  } catch (e) {
    console.error(e);
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
}

function cycleHours() {
  if (hoursLocal.value === 24) {
    hoursLocal.value = 48;
  } else if (hoursLocal.value === 48) {
    hoursLocal.value = 72;
  } else if (hoursLocal.value === 72) {
    hoursLocal.value = 96;
  } else {
    hoursLocal.value = 24;
  }
  console.log('Cycling hours to:', hoursLocal.value);
  loadHistory();
}

onMounted(() => {
  loadHistory();
  // Auto-refresh every 5 minutes
  intervalId = setInterval(
    () => {
      loadHistory();
    },
    5 * 60 * 1000
  );
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

watch(
  () => props.entity,
  () => loadHistory()
);

watch(
  () => hoursLocal.value,
  () => {
    console.log('Hours changed to:', hoursLocal.value, 'loading history');
    loadHistory();
  }
);

// expose some internals if needed
const api = { loadHistory, points };
defineExpose(api);
</script>

<style scoped>
.h-250 {
  height: 250px !important;
}
.ha-sensor-graph .card-body {
  padding: 0.75rem;
}
.ha-sensor-graph svg {
  height: 160px;
}
</style>
