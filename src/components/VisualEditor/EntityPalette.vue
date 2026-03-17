<template>
  <div class="entity-palette p-3">
    <h6 class="mb-3">Available Entities</h6>

    <!-- Search and Filter -->
    <div class="mb-3">
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

    <!-- Entity Type Filter -->
    <div class="mb-3">
      <select v-model="selectedType" class="form-select form-select-sm">
        <option value="">All Types</option>
        <option v-for="type in entityTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <!-- Entities List -->
    <div class="entities-list">
      <div v-if="filteredEntities.length === 0" class="alert alert-sm alert-info mb-0">
        <small>No entities match your filters</small>
      </div>

      <div
        v-for="entity in filteredEntities"
        :key="entity.entity_id"
        class="entity-item mb-2"
      >
        <button
          type="button"
          class="btn btn-sm btn-outline-primary w-100 text-start"
          :disabled="isEntityInView(entity.entity_id)"
          :title="isEntityInView(entity.entity_id) ? 'Already in this view' : 'Add to view'"
          @click="$emit('add-entity', entity.entity_id)"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div class="flex-grow-1">
              <div class="small">
                <i class="mdi mdi-plus me-1"></i>
                {{ entity.attributes?.friendly_name || entity.entity_id.split(".")[1] }}
              </div>
              <small class="text-muted d-block">
                {{ entity.entity_id }}
              </small>
            </div>
            <small v-if="isEntityInView(entity.entity_id)" class="badge bg-success">
              ✓
            </small>
          </div>
        </button>
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

defineEmits(["add-entity"]);

const store = useHaStore();
const searchText = ref("");
const selectedType = ref("");

const entitiesInViewIds = computed(() => {
  return props.entitiesInView
    .map((e) => e.entity)
    .filter((e) => e !== undefined && e !== null);
});

const allEntities = computed(() => {
  const map = store.entityMap || {};
  return Object.entries(map).map(([entityId, state]) => ({
    entity_id: entityId,
    ...state,
  }));
});

const entityTypes = computed(() => {
  const types = new Set(
    allEntities.value.map((e) => e.entity_id.split(".")[0]).sort()
  );
  return Array.from(types);
});

const filteredEntities = computed(() => {
  let result = allEntities.value;

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
        (e.attributes?.friendly_name || "").toLowerCase().includes(search)
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

.entity-item .btn {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
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
