<template>
  <div class="entity-palette p-3 border-bottom">
    <!-- Header with Toggle -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center">
        <button
          class="btn btn-link btn-sm p-0 text-decoration-none me-2"
          :class="{ 'text-muted': !isExpanded }"
          title="Toggle Available Entities panel"
          @click="isExpanded = !isExpanded"
        >
          <i
            :class="`mdi ${isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'}`"
          ></i>
        </button>
        <h6 class="mb-0">Available Entities</h6>
      </div>
    </div>

    <!-- Search and Filter (only shown when expanded) -->
    <div v-if="isExpanded" class="mb-3">
      <div class="input-group input-group-sm">
        <input
          v-model="searchText"
          type="text"
          class="form-control"
          placeholder="Search entities..."
          aria-label="Search entities"
        />
        <button
          v-if="searchText"
          type="button"
          class="btn btn-outline-secondary"
          @click="searchText = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Entity Type Filter (only shown when expanded) -->
    <div v-if="isExpanded" class="mb-3">
      <select v-model="selectedType" class="form-select form-select-sm">
        <option value="">All Types</option>
        <option v-for="type in entityTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <!-- Entities List (only shown when expanded) -->
    <div v-if="isExpanded" class="entities-list">
      <!-- No entities at all (usually means not connected or data not loaded) -->
      <div v-if="allEntities.length === 0" class="alert alert-warning mb-0">
        <small>
          <i class="mdi mdi-alert-circle me-2"></i>
          <strong>No entities available</strong>
        </small>
        <div class="mt-2 small text-dark">
          <p class="mb-2">Entities will appear here when:</p>
          <ul class="mb-0 ps-3">
            <li>You connect to Home Assistant, OR</li>
            <li>You enable Local Mode with sample data</li>
          </ul>
        </div>
        <div class="mt-2 small text-muted">
          Check the app settings or navbar for connection options.
        </div>
      </div>

      <!-- Search/filter matched no results (but entities exist) -->
      <div
        v-else-if="filteredEntities.length === 0"
        class="alert alert-success mb-0"
      >
        <small>
          <i class="mdi mdi-check-circle me-2\"></i>
          All entities are already in this view!
        </small>
      </div>

      <!-- Display filtered entities (available to drag) -->
      <div
        v-for="entity in filteredEntities"
        v-else
        :key="entity.entity_id"
        class="entity-item mb-2"
        draggable="true"
        @dragstart="handleDragStart($event, entity)"
        @dragend="handleDragEnd"
      >
        <div
          class="btn btn-sm w-100 text-start entity-button entity-button-available"
          title="Drag to add to view"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div class="flex-grow-1">
              <div class="small">
                <i class="mdi mdi-drag-vertical me-1"></i>
                {{
                  entity.attributes?.friendly_name ||
                  entity.entity_id.split(".")[1]
                }}
              </div>
              <small class="text-muted d-block">
                {{ entity.entity_id }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useHaStore } from "../../stores/haStore";

const props = defineProps({
  entitiesInView: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["add-entity", "remove-entity"]);

const store = useHaStore();
const isExpanded = ref(true);
const searchText = ref("");
const selectedType = ref("");

const entitiesInViewIds = computed(() => {
  console.log(
    "[EntityPalette] entitiesInViewIds - entitiesInView:",
    props.entitiesInView,
    "isArray:",
    Array.isArray(props.entitiesInView),
  );
  if (!Array.isArray(props.entitiesInView)) {
    console.warn(
      "[EntityPalette] entitiesInViewIds - entitiesInView is not an array!",
    );
    return [];
  }
  return props.entitiesInView
    .map((e) => e.entity)
    .filter((e) => e !== undefined && e !== null);
});

const allEntities = computed(() => {
  const map = store.entityMap;
  if (!map || map.size === 0) return [];
  return Array.from(map.entries()).map(([entityId, state]) => ({
    entity_id: entityId,
    ...state,
  }));
});

const entityTypes = computed(() => {
  const types = new Set(
    allEntities.value.map((e) => e.entity_id.split(".")[0]).sort(),
  );
  return Array.from(types);
});

const filteredEntities = computed(() => {
  let result = allEntities.value;

  // Filter out entities already in the view
  result = result.filter((e) => !isEntityInView(e.entity_id));

  // Filter by type
  if (selectedType.value) {
    result = result.filter((e) => e.entity_id.startsWith(selectedType.value));
  }

  // Filter by search text
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(
      (e) =>
        e.entity_id.toLowerCase().includes(search) ||
        (e.attributes?.friendly_name || "").toLowerCase().includes(search),
    );
  }

  // Sort by friendly name or ID
  result.sort((a, b) => {
    const nameA = a.attributes?.friendly_name || a.entity_id;
    const nameB = b.attributes?.friendly_name || b.entity_id;
    return nameA.localeCompare(nameB);
  });

  return result;
});

const isEntityInView = (entityId) => {
  return entitiesInViewIds.value.includes(entityId);
};

const handleDragStart = (event, entity) => {
  event.dataTransfer.effectAllowed = "copy";
  // Set both JSON format (for canvas) and plain text (for inspector)
  event.dataTransfer.setData(
    "application/json",
    JSON.stringify({
      entity: entity.entity_id,
      type: "auto",
    }),
  );
  event.dataTransfer.setData("text/plain", entity.entity_id);
  const img = new Image();
  event.dataTransfer.setDragImage(img, 0, 0);
};

const handleDragEnd = () => {
  // Cleanup if needed
};
</script>

<style scoped>
.entity-palette {
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
}

.entities-list {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.entity-item {
  margin-bottom: 0.5rem;
}

.entity-item {
  cursor: move;
}

.entity-item[draggable="true"]:hover {
  opacity: 0.8;
}

.entity-item .btn {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  transition: all 0.15s ease-in-out;
}

.entity-button {
  border: 1px solid #cbd5e1 !important;
  background-color: #f8fafc !important;
  color: #1e293b !important;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
}

.entity-button-available {
  background-color: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #1e293b !important;
}

.entity-button-available:hover {
  background-color: #f1f5f9 !important;
  border-color: #94a3b8 !important;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
}

.entity-button-available:active {
  cursor: grabbing;
}

.entity-button-unselected {
  border: 1px solid #cbd5e1 !important;
  background-color: #f8fafc !important;
  color: #1e293b !important;
  box-shadow: none !important;
}

.entity-button-unselected:hover {
  background-color: #f1f5f9 !important;
  border-color: #94a3b8 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
}

.entity-button-selected {
  background-color: #e0f2fe !important;
  color: #0369a1 !important;
  border: 2px solid #0284c7 !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(2, 132, 199, 0.25) !important;
  transform: translateY(1px);
  font-weight: 600;
}

.entity-button-selected:hover {
  background-color: #cffafe !important;
  border-color: #0284c7 !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.08),
    0 3px 8px rgba(2, 132, 199, 0.3) !important;
}

.entity-button-selected:active {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 -1px 1px rgba(255, 255, 255, 0.5) !important;
  transform: translateY(2px);
}

/* Ensure text is visible in selected state */
.entity-button-selected .small,
.entity-button-selected small {
  color: #0369a1 !important;
}

.entity-button-selected i {
  color: #0284c7 !important;
}

.entity-item button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
</style>
