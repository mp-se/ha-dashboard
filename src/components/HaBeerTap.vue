<template>
  <div v-if="entityList.length === 0" class="col-lg-4 col-md-6">
    <div class="card card-display h-100 rounded-4 shadow-lg border-warning">
      <div class="card-body text-center text-warning">
        <i class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div>No beer tap entities found</div>
      </div>
    </div>
  </div>

  <div v-else class="col-lg-4 col-md-6">
    <div
      class="card card-display h-100 rounded-4 shadow-lg"
      :style="{ borderColor: beerColor, borderWidth: '2px' }"
    >
      <div class="card-body d-flex align-items-start gap-3">
        <!-- Beer icon with color circle -->
        <div class="ha-icon-circle-wrapper flex-shrink-0">
          <div class="ha-icon-circle" :style="{ backgroundColor: beerColor }">
            <i
              :class="isEmpty ? 'mdi mdi-beer-off' : 'mdi mdi-beer'"
              class="ha-icon-overlay"
            ></i>
          </div>
        </div>

        <!-- Beer info section -->
        <div class="flex-grow-1">
          <div class="text-start">
            <h6 class="card-title">{{ beerName }}</h6>
            <!-- Display beer attributes -->
            <div class="mt-1">
              <div class="small d-flex gap-2 mb-0">
                <div
                  class="text-muted"
                  style="font-size: 0.75rem; min-width: 70px"
                >
                  ABV: <span class="fw-bold">{{ abv }}%</span>
                </div>
              </div>
              <div class="small d-flex gap-2 mb-0">
                <div
                  class="text-muted"
                  style="font-size: 0.75rem; min-width: 70px"
                >
                  EBC: <span class="fw-bold">{{ ebc }}</span>
                </div>
              </div>
              <div class="small d-flex gap-2 mb-0">
                <div
                  class="text-muted"
                  style="font-size: 0.75rem; min-width: 70px"
                >
                  IBU: <span class="fw-bold">{{ ibu }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Volume on the right -->
        <div class="flex-shrink-0">
          <div class="ha-sensor-value fw-bold text-end">
            {{ volume }}<span class="ha-sensor-unit ms-1">L</span>
          </div>
        </div>
      </div>

      <!-- Volume Progress Bar -->
      <div class="px-3 pb-3">
        <div class="progress" style="height: 8px; background-color: #e9ecef">
          <div
            class="ha-progress-bar"
            role="progressbar"
            :style="{ width: percentage + '%', backgroundColor: beerColor }"
            :aria-valuenow="percentage"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useHaStore } from "@/stores/haStore";

const props = defineProps({
  entity: {
    type: [Object, String, Array],
    required: true,
    validator: (value) => {
      if (Array.isArray(value)) {
        return value.every((ent) => {
          if (typeof ent === "string") {
            return /^[\w]+\.[\w_-]+$/.test(ent);
          } else if (typeof ent === "object") {
            return ent && ent.entity_id;
          }
          return false;
        });
      } else if (typeof value === "string") {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === "object") {
        return value && value.entity_id;
      }
      return false;
    },
  },
});

const store = useHaStore();

// Convert single entity to array
const entityArray = computed(() => {
  if (Array.isArray(props.entity)) {
    return props.entity;
  }
  return [props.entity];
});

// Get list of entity IDs/objects
const entityList = computed(() => {
  try {
    if (!props.entity) return [];
    return entityArray.value.map((ent) =>
      typeof ent === "string" ? ent : ent.entity_id,
    );
  } catch (error) {
    console.error("Error in entityList:", error);
    return [];
  }
});

// Get resolved entities from store
const resolvedEntities = computed(() => {
  try {
    if (!store || !store.sensors) {
      console.warn("Store or sensors not yet loaded");
      return [];
    }
    if (!entityList.value || entityList.value.length === 0) {
      return [];
    }
    return entityList.value
      .map((entityId) => {
        const entity = store.sensors.find((s) => s.entity_id === entityId);
        return entity !== undefined ? entity : null;
      })
      .filter((e) => e !== null);
  } catch (error) {
    console.error("Error in resolvedEntities:", error);
    return [];
  }
});

// Find and cache both volume and beer entities in one go
const detectedEntities = computed(() => {
  try {
    if (!resolvedEntities.value || resolvedEntities.value.length === 0) {
      return { volumeEntity: null, beerEntity: null };
    }

    const volumeEnt =
      resolvedEntities.value.find(
        (e) =>
          e &&
          (e.attributes?.device_class === "volume" ||
            e.attributes?.unit_of_measurement === "L" ||
            e.entity_id?.includes("volume")),
      ) || null;

    const beerEnt =
      resolvedEntities.value.find(
        (e) =>
          e &&
          e.entity_id?.includes("beer") &&
          (!volumeEnt || e.entity_id !== volumeEnt.entity_id),
      ) || null;

    return { volumeEntity: volumeEnt, beerEntity: beerEnt };
  } catch (error) {
    console.error("Error in detectedEntities:", error);
    return { volumeEntity: null, beerEntity: null };
  }
});

// Auto-detect volume and beer entities
const volumeEntity = computed(() => {
  return detectedEntities.value.volumeEntity;
});

const beerEntity = computed(() => {
  return detectedEntities.value.beerEntity;
});

// Volume data
const volume = computed(() => {
  try {
    if (!volumeEntity.value || !volumeEntity.value.state) return "0";
    const val = parseFloat(volumeEntity.value.state);
    return isNaN(val) ? "0" : val.toFixed(2);
  } catch (error) {
    console.error("Error in volume:", error);
    return "0";
  }
});

const percentage = computed(() => {
  try {
    if (!volumeEntity.value || !volumeEntity.value.state) return 0;
    const kegVol = volumeEntity.value.attributes?.keg_volume || 19;
    const vol = parseFloat(volumeEntity.value.state);
    if (isNaN(vol)) return 0;
    return Math.min(100, Math.round((vol / kegVol) * 100));
  } catch (error) {
    console.error("Error in percentage:", error);
    return 0;
  }
});

// Beer data
const beerName = computed(() => {
  try {
    if (!beerEntity.value || !beerEntity.value.state) return "No Beer";
    return beerEntity.value.state || "Unknown";
  } catch (error) {
    console.error("Error in beerName:", error);
    return "No Beer";
  }
});

const abv = computed(() => {
  try {
    if (!beerEntity.value || !beerEntity.value.attributes) return "-";
    const val = beerEntity.value.attributes?.abv;
    return val ? val.toFixed(1) : "-";
  } catch (error) {
    console.error("Error in abv:", error);
    return "-";
  }
});

const ibu = computed(() => {
  try {
    if (!beerEntity.value || !beerEntity.value.attributes) return "-";
    return beerEntity.value.attributes?.ibu || "-";
  } catch (error) {
    console.error("Error in ibu:", error);
    return "-";
  }
});

const ebc = computed(() => {
  try {
    if (!beerEntity.value || !beerEntity.value.attributes) return "-";
    return beerEntity.value.attributes?.ebc || "-";
  } catch (error) {
    console.error("Error in ebc:", error);
    return "-";
  }
});

// Determine if tap is empty
const isEmpty = computed(() => {
  try {
    if (!volumeEntity.value || !beerEntity.value) return true;
    return (
      parseFloat(volume.value) === 0 || beerEntity.value.state === "unknown"
    );
  } catch (error) {
    console.error("Error in isEmpty:", error);
    return true;
  }
});

// Beer color based on EBC value (European Brewery Convention color scale)
const beerColor = computed(() => {
  try {
    if (isEmpty.value) return "#C0C0C0"; // Gray for empty

    const ebcValue = parseFloat(ebc.value);
    if (isNaN(ebcValue)) return "#D4A574"; // Default beer color

    // EBC color scale approximation
    if (ebcValue < 10) return "#F4D03F"; // Very light (Pilsner)
    if (ebcValue < 20) return "#F9E79F"; // Light
    if (ebcValue < 30) return "#F5B041"; // Amber
    if (ebcValue < 50) return "#DC7633"; // Brown
    if (ebcValue < 100) return "#8B4513"; // Dark brown
    return "#3D2817"; // Very dark (Stout)
  } catch (error) {
    console.error("Error in beerColor:", error);
    return "#D4A574"; // Default beer color on error
  }
});
</script>

<style scoped>
.card {
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.progress {
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}
</style>
