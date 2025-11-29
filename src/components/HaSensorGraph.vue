<template>
  <div v-if="entity" class="col-md-4">
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
            <polyline
              :points="polylinePoints"
              fill="none"
              stroke="#0d6efd"
              stroke-width="0.8"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <polyline
              v-if="polylinePoints2"
              :points="polylinePoints2"
              fill="none"
              stroke="#dc3545"
              stroke-width="0.8"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
          <!-- Min and max on the value axis (y-axis) -->
          <div class="position-absolute start-0 top-0 small text-muted">{{ maxDisplay }}</div>
          <div class="position-absolute start-0 bottom-0 small text-muted">{{ minDisplay }}</div>
        </div>
        <!-- Legend for dual graphs -->
        <div v-if="resolvedSecondEntity" class="mt-2 d-flex justify-content-center small">
          <span class="me-3">
            <span class="badge bg-primary me-1">&nbsp;</span>
            {{ resolvedEntity?.attributes?.friendly_name || resolvedEntity?.entity_id }}
          </span>
          <span>
            <span class="badge bg-danger me-1">&nbsp;</span>
            {{ resolvedSecondEntity?.attributes?.friendly_name || resolvedSecondEntity?.entity_id }}
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
  hours: { type: Number, default: 24 },
  maxPoints: { type: Number, default: 200 },
  attributes: { type: Array, default: () => [] },
  entityId: {
    type: [Object, String],
    required: false,
    default: null,
    validator: (value) => {
      if (value === null || value === undefined) return true; // Optional
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  secondEntity: {
    type: [Object, String],
    required: false,
    default: null,
    validator: (value) => {
      if (value === null || value === undefined) return true; // Optional
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  secondEntityId: {
    type: [Object, String],
    required: false,
    default: null,
    validator: (value) => {
      if (value === null || value === undefined) return true; // Optional
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
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

const resolvedSecondEntity = computed(() => {
  if (!props.secondEntity) return null;
  if (typeof props.secondEntity === 'string') {
    const found = store.sensors.find((s) => s.entity_id === props.secondEntity);
    if (!found) {
      console.warn(`Second entity "${props.secondEntity}" not found`);
      return null;
    }
    return found;
  } else {
    return props.secondEntity;
  }
});
const loading = ref(false);
const error = ref(null);
const points = ref([]);
const points2 = ref([]);

const width = 600;
const height = 200;

const title = computed(() => {
  if (resolvedSecondEntity.value) {
    return ''; // Empty header for dual graphs
  }
  const first =
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown';
  return first;
});

const unit = computed(() => resolvedEntity.value?.attributes?.unit_of_measurement || '');

const minVal = computed(() => {
  const allPoints = [...points.value, ...points2.value];
  if (allPoints.length === 0) return null;
  return Math.min(...allPoints.map((p) => p.v));
});

const maxVal = computed(() => {
  const allPoints = [...points.value, ...points2.value];
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

const polylinePoints = computed(() => {
  if (points.value.length === 0) return '';
  const t0 = points.value[0].t;
  const t1 = points.value[points.value.length - 1].t;
  const dx = t1 - t0 || 1;
  const vmin = minVal.value;
  const vmax = maxVal.value;
  const vrange = vmax - vmin || 1;
  // map to viewBox 0..100 x 0..40 (invert y)
  return points.value
    .map((p) => {
      const x = ((p.t - t0) / dx) * 100;
      const y = 40 - ((p.v - vmin) / vrange) * 36 - 2;
      return `${x},${y}`;
    })
    .join(' ');
});

const polylinePoints2 = computed(() => {
  if (points2.value.length === 0) return '';
  const t0 = points.value.length > 0 ? points.value[0].t : points2.value[0].t;
  const t1 =
    points.value.length > 0
      ? points.value[points.value.length - 1].t
      : points2.value[points2.value.length - 1].t;
  const dx = t1 - t0 || 1;
  const vmin = minVal.value;
  const vmax = maxVal.value;
  const vrange = vmax - vmin || 1;
  // map to viewBox 0..100 x 0..40 (invert y)
  return points2.value
    .map((p) => {
      const x = ((p.t - t0) / dx) * 100;
      const y = 40 - ((p.v - vmin) / vrange) * 36 - 2;
      return `${x},${y}`;
    })
    .join(' ');
});

const hoursLocal = ref(24);

let intervalId = null;

async function loadHistory() {
  loading.value = true;
  error.value = null;
  points.value = [];
  points2.value = [];
  try {
    if (!resolvedEntity.value || !resolvedEntity.value.entity_id) {
      throw new Error('No entity provided');
    }
    const result = await store.fetchHistory(
      resolvedEntity.value.entity_id,
      hoursLocal.value,
      props.maxPoints
    );
    points.value = result;

    if (resolvedSecondEntity.value && resolvedSecondEntity.value.entity_id) {
      const result2 = await store.fetchHistory(
        resolvedSecondEntity.value.entity_id,
        hoursLocal.value,
        props.maxPoints
      );
      points2.value = result2;
    }
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
