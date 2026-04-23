<!--
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<template>
  <div v-if="entity">
    <div class="ha-sensor-graph card card-display h-100 rounded-4 shadow-lg">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6
            class="card-title mb-0 d-flex justify-content-between align-items-center"
          >
            <span>{{ title }}</span>
          </h6>
          <div class="d-flex align-items-center gap-2">
            <small class="text-muted">{{ unit }}</small>
            <button
              class="btn btn-sm btn-outline-secondary"
              @click="cycleHours"
            >
              {{ hoursLocal }}h
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-center py-4">Loading history…</div>
        <div
          v-else-if="!loading && points.length === 0"
          class="text-muted text-center d-flex align-items-center justify-content-center"
          style="height: 150px"
        >
          No numeric history available for this sensor.
        </div>
        <div v-else class="position-relative" style="padding-left: 2rem">
          <svg
            :width="width"
            :height="height"
            :viewBox="`0 0 ${GRAPH_CONFIG.VIEW_BOX_WIDTH} ${GRAPH_CONFIG.VIEW_BOX_HEIGHT}`"
            preserveAspectRatio="none"
            class="w-100"
          >
            <template v-for="(dataset, idx) in datasetList" :key="idx">
              <!-- Filled area under line -->
              <path
                v-if="dataset"
                :d="getAreaPath(dataset)"
                :fill="GRAPH_COLORS[idx]"
                opacity="0.15"
              />
              <!-- Line graph with smooth curve -->
              <path
                v-if="dataset"
                :d="getSmoothPath(dataset)"
                fill="none"
                :stroke="GRAPH_COLORS[idx]"
                stroke-width="0.9"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </template>
          </svg>
          <!-- Min and max on the value axis (y-axis) -->
          <div class="position-absolute start-0 top-0 small text-muted">
            {{ maxDisplay }}
          </div>
          <div class="position-absolute start-0 bottom-0 small text-muted">
            {{ minDisplay }}
          </div>
        </div>
        <!-- Legend for multi-graph comparison -->
        <div
          v-if="entityList.length > 1"
          class="mt-2 d-flex justify-content-center small flex-wrap gap-2"
        >
          <span
            v-for="(ent, idx) in entityList"
            :key="idx"
            class="d-flex align-items-center"
          >
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
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useHaStore } from "@/stores/haStore";
import { createLogger } from "@/utils/logger";

// Constants
const GRAPH_CONFIG = {
  WIDTH: 600,
  HEIGHT: 200,
  VIEW_BOX_WIDTH: 100,
  VIEW_BOX_HEIGHT: 40,
  Y_PADDING: 2,
  Y_RANGE: 36,
  AUTO_REFRESH_MS: 5 * 60 * 1000,
};

const HOURS_CYCLE = [24, 48, 72, 96];
const GRAPH_COLORS = ["#0d6efd", "#dc3545", "#198754"];

const props = defineProps({
  entity: {
    type: [Object, String, Array],
    required: true,
    validator: (value) => {
      // Handle array: up to 3 entities
      if (Array.isArray(value)) {
        if (value.length === 0 || value.length > 3) {
          return false;
        }
        return value.every((ent) => {
          if (typeof ent === "string") {
            return /^[\w]+\.[\w_-]+$/.test(ent);
          } else if (typeof ent === "object") {
            return ent && ent.entity_id && ent.state && ent.attributes;
          }
          return false;
        });
      }
      // Handle single entity: string or object
      if (typeof value === "string") {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === "object") {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  hours: { type: Number, default: 24 },
  maxPoints: {
    type: Number,
    default: 200,
    validator: (value) => value > 0 && value <= 10000,
  },
  attributes: { type: Array, default: () => [] },
});

const store = useHaStore();
const logger = createLogger("HaSensorGraph");

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
    if (typeof ent === "string") {
      const found = store.entityMap.get(ent);
      if (!found) {
        logger.warn(`Entity "${ent}" not found`);
        return null;
      }
      return found;
    }
    return ent;
  });
});

const resolvedEntity = computed(() => resolvedEntities.value[0]);

const loading = ref(false);
const points = ref([]);
const points2 = ref([]);
const points3 = ref([]);

const width = GRAPH_CONFIG.WIDTH;
const height = GRAPH_CONFIG.HEIGHT;

const title = computed(() => {
  if (entityList.value.length === 1) {
    return (
      resolvedEntity.value?.attributes?.friendly_name ||
      resolvedEntity.value?.entity_id ||
      "Unknown"
    );
  }
  return ""; // Empty header for multi-entity graphs (shown in legend instead)
});

const unit = computed(
  () => resolvedEntity.value?.attributes?.unit_of_measurement || "",
);

/**
 * Computes the minimum value across all data points
 * @returns {number|null} Minimum value or null if no points
 */
const minVal = computed(() => {
  const allPoints = [...points.value, ...points2.value, ...points3.value];
  if (allPoints.length === 0) return null;
  return Math.min(...allPoints.map((p) => p.v));
});

/**
 * Computes the maximum value across all data points
 * @returns {number|null} Maximum value or null if no points
 */
const maxVal = computed(() => {
  const allPoints = [...points.value, ...points2.value, ...points3.value];
  if (allPoints.length === 0) return null;
  return Math.max(...allPoints.map((p) => p.v));
});

import { formatNumericValue } from "@/utils/attributeFormatters";

const minDisplay = computed(() => formatNumericValue(minVal.value));

const maxDisplay = computed(() => formatNumericValue(maxVal.value));

/**
 * Pre-computed graph metrics for performance optimization
 * Calculates time and value ranges once instead of per-entity
 * @returns {Object} Graph scaling metrics (t0, t1, dx, vmin, vmax, vrange)
 */
const graphMetrics = computed(() => {
  const allPoints = [...points.value, ...points2.value, ...points3.value];
  if (allPoints.length === 0) {
    return { t0: 0, t1: 1, dx: 1, vmin: 0, vmax: 1, vrange: 1 };
  }
  const t0 = Math.min(...allPoints.map((p) => p.t));
  const t1 = Math.max(...allPoints.map((p) => p.t));
  const vmin = minVal.value;
  const vmax = maxVal.value;
  return {
    t0,
    t1,
    dx: t1 - t0 || 1,
    vmin,
    vmax,
    vrange: vmax - vmin || 1,
  };
});

/**
 * Aggregated list of all datasets for v-for rendering
 */
const datasetList = computed(() => {
  const datasets = [];
  if (polylinePoints.value) datasets.push(polylinePoints.value);
  if (polylinePoints2.value) datasets.push(polylinePoints2.value);
  if (polylinePoints3.value) datasets.push(polylinePoints3.value);
  return datasets;
});

// Helper to get entity label for legend
/**
 * Gets display label for an entity (friendly name or entity_id)
 * @param {string|Object} ent - Entity string or object
 * @returns {string} Display label
 */
const getEntityLabel = (ent) => {
  if (typeof ent === "string") {
    const resolved = store.entityMap.get(ent);
    return resolved?.attributes?.friendly_name || ent;
  }
  return ent?.attributes?.friendly_name || ent?.entity_id || "Unknown";
};

/**
 * Calculates polyline points for SVG path from time-value data
 * Uses pre-computed graphMetrics for performance optimization
 * @param {Array<{t: number, v: number}>} data - Time-value data points
 * @returns {string} Space-separated x,y coordinates
 */
const calculatePolylinePoints = (data) => {
  if (data.length === 0) return "";

  const { t0, dx, vmin, vrange } = graphMetrics.value;

  return data
    .map((p) => {
      const x = ((p.t - t0) / dx) * GRAPH_CONFIG.VIEW_BOX_WIDTH;
      const y =
        GRAPH_CONFIG.VIEW_BOX_HEIGHT -
        ((p.v - vmin) / vrange) * GRAPH_CONFIG.Y_RANGE -
        GRAPH_CONFIG.Y_PADDING;
      return `${x},${y}`;
    })
    .join(" ");
};

const polylinePoints = computed(() => calculatePolylinePoints(points.value));

const polylinePoints2 = computed(() => calculatePolylinePoints(points2.value));

const polylinePoints3 = computed(() => calculatePolylinePoints(points3.value));

const hoursLocal = ref(HOURS_CYCLE[0]);

/**
 * Creates a filled area path from polyline points
 * @param {string} polylinePointsStr - Space-separated x,y coordinates
 * @returns {string} SVG path data for filled area
 */
const getAreaPath = (polylinePointsStr) => {
  if (!polylinePointsStr) return "";

  const points = polylinePointsStr.split(" ");
  if (points.length < 2) return "";

  // Create path: M (move to first point) + line points + L (line down) + line back + Z (close)
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const [lastX] = lastPoint.split(",");

  const path = `M ${firstPoint} L ${polylinePointsStr} L ${lastX},${GRAPH_CONFIG.VIEW_BOX_HEIGHT} L ${firstPoint.split(",")[0]},${GRAPH_CONFIG.VIEW_BOX_HEIGHT} Z`;
  return path;
};

/**
 * Creates smooth curves using quadratic Bézier curves
 * @param {string} polylinePointsStr - Space-separated x,y coordinates
 * @returns {string} SVG path data for smooth curve
 */
const getSmoothPath = (polylinePointsStr) => {
  if (!polylinePointsStr) return "";

  const pointsArray = polylinePointsStr.split(" ").map((p) => {
    const [x, y] = p.split(",");
    return { x: parseFloat(x), y: parseFloat(y) };
  });

  if (pointsArray.length < 2) return "";

  // Start with move to first point
  let path = `M ${pointsArray[0].x},${pointsArray[0].y}`;

  // If only 2 points, just draw a line
  if (pointsArray.length === 2) {
    path += ` L ${pointsArray[1].x},${pointsArray[1].y}`;
    return path;
  }

  // Use quadratic Bézier curves through control points
  for (let i = 1; i < pointsArray.length; i++) {
    const curr = pointsArray[i];

    if (i === pointsArray.length - 1) {
      // For last point, draw directly to it
      path += ` L ${curr.x},${curr.y}`;
    } else {
      const next = pointsArray[i + 1];
      // Control point is midpoint between current and next point
      // This creates smooth quadratic Bézier curves connecting all points
      const controlX = (curr.x + next.x) / 2;
      const controlY = (curr.y + next.y) / 2;
      // Draw quadratic Bézier curve to current point using control point
      path += ` Q ${curr.x},${curr.y} ${controlX},${controlY}`;
    }
  }

  return path;
};

let intervalId = null;

/**
 * Loads history data for all entities from Home Assistant
 * @async
 */
async function loadHistory() {
  loading.value = true;
  points.value = [];
  points2.value = [];
  points3.value = [];

  try {
    const entitiesToLoad = resolvedEntities.value.filter(
      (e) => e && e.entity_id,
    );

    if (entitiesToLoad.length === 0) {
      // Missing entities should not be treated as connection errors
      // Just log a warning and stop loading
      logger.warn(
        `No valid entities available. Received: ${JSON.stringify(props.entity)}`,
      );
      return;
    }

    logger.log(
      "Loading history for entities:",
      entitiesToLoad.map((e) => e.entity_id),
    );

    const results = await Promise.all(
      entitiesToLoad.map((ent) =>
        store.fetchHistory(ent.entity_id, hoursLocal.value, props.maxPoints),
      ),
    );

    if (results[0]) points.value = results[0];
    if (results[1]) points2.value = results[1];
    if (results[2]) points3.value = results[2];

    results.forEach((result, idx) => {
      logger.log(`Received ${result.length} points for entity ${idx + 1}`);
    });
  } catch (e) {
    logger.error("Error loading history:", e);
    // Don't report to global error store - just log locally
    // Component gracefully degrades to "No numeric history available" message
  } finally {
    loading.value = false;
  }
}

/**
 * Cycles through the available hour ranges (24, 48, 72, 96)
 */
function cycleHours() {
  const currentIndex = HOURS_CYCLE.indexOf(hoursLocal.value);
  const nextIndex = (currentIndex + 1) % HOURS_CYCLE.length;
  hoursLocal.value = HOURS_CYCLE[nextIndex];
  logger.log("Cycling hours to:", hoursLocal.value);
  // Note: loadHistory() is called by the watcher, not here
}

onMounted(() => {
  loadHistory();
  // Auto-refresh every 5 minutes
  intervalId = setInterval(() => {
    loadHistory();
  }, GRAPH_CONFIG.AUTO_REFRESH_MS);
});

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

watch(
  () => props.entity,
  () => loadHistory(),
);

watch(
  () => hoursLocal.value,
  () => {
    logger.log("Hours changed to:", hoursLocal.value, "loading history");
    loadHistory();
  },
);

// expose some internals if needed
const api = { loadHistory, points };
defineExpose(api);
</script>
