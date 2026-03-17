<template>
  <!-- Tab Navigation -->
  <div class="sticky-top bg-body shadow-sm p-3 border-bottom">
    <div class="container-fluid">
      <div class="row align-items-center">
        <div class="col-auto">
          <h5 class="mb-0">Visual Editor</h5>
        </div>
        <div class="col-auto ms-3">
          <div class="btn-group" role="tablist">
            <button
              :class="[
                'btn',
                activeTab === 'editor'
                  ? 'btn-primary'
                  : 'btn-outline-primary',
              ]"
              type="button"
              :aria-pressed="activeTab === 'editor'"
              @click="activeTab = 'editor'"
            >
              <i class="mdi mdi-pencil me-2"></i>Editor
            </button>
            <button
              :class="[
                'btn',
                activeTab === 'preview'
                  ? 'btn-primary'
                  : 'btn-outline-primary',
              ]"
              type="button"
              :aria-pressed="activeTab === 'preview'"
              @click="activeTab = 'preview'"
            >
              <i class="mdi mdi-eye me-2"></i>Preview
            </button>
          </div>
        </div>
        <div class="col-auto ms-auto">
          <div class="input-group" style="max-width: 250px">
            <label class="input-group-text" for="viewSelector">View:</label>
            <select
              id="viewSelector"
              v-model="selectedViewName"
              class="form-select"
              @change="handleViewChange"
            >
              <option v-for="view in availableViews" :key="view.name" :value="view.name">
                {{ view.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="col-auto ms-2">
          <div v-if="saveStatus" class="badge" :class="saveStatusClass">
            <i :class="saveStatusIcon" class="me-1"></i>
            {{ saveStatus }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Editor Tab -->
  <div v-if="activeTab === 'editor'" class="editor-container">
    <div class="row g-0" style="min-height: calc(100vh - 200px)">
      <!-- Entity Palette (Left) -->
      <div class="col-lg-3 border-end" style="overflow-y: auto; max-height: calc(100vh - 200px)">
        <EntityPalette
          :entities-in-view="currentViewEntities"
          @add-entity="handleAddEntity"
        />
      </div>

      <!-- Canvas (Center) -->
      <div class="col-lg-6" style="overflow-y: auto; max-height: calc(100vh - 200px)">
        <EditorCanvas
          :entities="currentViewEntities"
          :selected-entity-id="selectedEntityId"
          @select-entity="selectedEntityId = $event"
          @reorder-entities="handleReorderEntities"
          @remove-entity="handleRemoveEntity"
        />
      </div>

      <!-- Inspector (Right) -->
      <div class="col-lg-3 border-start" style="overflow-y: auto; max-height: calc(100vh - 200px)">
        <EntityInspector
          v-if="selectedEntity"
          :entity="selectedEntity"
          :entity-id="selectedEntityId"
          @update-type="handleUpdateEntityType"
          @update-attributes="handleUpdateEntityAttributes"
          @remove-entity="handleRemoveEntity(selectedEntityId)"
        />
        <div v-else class="p-3 text-muted text-center">
          <i class="mdi mdi-information-outline me-2"></i>
          Select an entity to edit
        </div>
      </div>
    </div>
  </div>

  <!-- Preview Tab -->
  <div v-if="activeTab === 'preview'">
    <JsonConfigView :view-name="selectedViewName" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useHaStore } from "../stores/haStore";
import EditorCanvas from "../components/VisualEditor/EditorCanvas.vue";
import EntityPalette from "../components/VisualEditor/EntityPalette.vue";
import EntityInspector from "../components/VisualEditor/EntityInspector.vue";
import JsonConfigView from "./JsonConfigView.vue";
import { createLogger } from "../utils/logger";

const logger = createLogger("VisualEditorView");
const store = useHaStore();

const activeTab = ref("editor");
const selectedViewName = ref("");
const selectedEntityId = ref(null);
const saveStatus = ref("");
const saveTimeout = ref(null);

const availableViews = computed(() => {
  return store.dashboardConfig?.views ?? [];
});

const currentView = computed(() => {
  return availableViews.value.find((v) => v.name === selectedViewName.value);
});

const currentViewEntities = computed(() => {
  return currentView.value?.entities ?? [];
});

const selectedEntity = computed(() => {
  if (!selectedEntityId.value) return null;
  return currentViewEntities.value.find((_, idx) => idx === selectedEntityId.value);
});

const saveStatusClass = computed(() => {
  if (saveStatus.value.includes("Saving")) return "bg-info text-white";
  if (saveStatus.value.includes("Saved")) return "bg-success text-white";
  if (saveStatus.value.includes("Error")) return "bg-danger text-white";
  return "bg-secondary text-white";
});

const saveStatusIcon = computed(() => {
  if (saveStatus.value.includes("Saving")) return "mdi mdi-loading mdi-spin";
  if (saveStatus.value.includes("Saved")) return "mdi mdi-check-circle";
  if (saveStatus.value.includes("Error")) return "mdi mdi-alert-circle";
  return "mdi mdi-information-outline";
});

/**
 * Debounced save function - waits 500ms before saving to allow user to finish editing
 */
const debouncedSave = () => {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  saveStatus.value = "Saving...";

  saveTimeout.value = setTimeout(() => {
    handleSave();
  }, 500);
};

/**
 * Save the current view config to the store
 */
const handleSave = async () => {
  try {
    if (!currentView.value) return;

    saveStatus.value = "Saving...";
    logger.log(`Saving view: ${selectedViewName.value}`, currentView.value);

    // For now, just update the store - in Phase 5 we'll add persistence
    // store.dashboardConfig.views[viewIndex].entities = currentView.value.entities;

    saveStatus.value = "Saved";
    setTimeout(() => {
      saveStatus.value = "";
    }, 2000);
  } catch (error) {
    logger.error("Error saving view config:", error);
    saveStatus.value = "Error saving";
    setTimeout(() => {
      saveStatus.value = "";
    }, 3000);
  }
};

const handleViewChange = () => {
  selectedEntityId.value = null;
};

const handleAddEntity = (entityId) => {
  if (!currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  // Create a new entity entry
  const newEntity = {
    entity: entityId,
    type: undefined, // Will auto-detect based on entity type
  };

  currentView.value.entities.push(newEntity);
  debouncedSave();
};

const handleReorderEntities = (reorderedEntities) => {
  if (!currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  store.dashboardConfig.views[viewIndex].entities = reorderedEntities;
  debouncedSave();
};

const handleRemoveEntity = (entityIndex) => {
  if (entityIndex === null || !currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  store.dashboardConfig.views[viewIndex].entities.splice(entityIndex, 1);
  selectedEntityId.value = null;
  debouncedSave();
};

const handleUpdateEntityType = (newType) => {
  if (selectedEntityId.value === null || !currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  currentView.value.entities[selectedEntityId.value].type = newType;
  debouncedSave();
};

const handleUpdateEntityAttributes = (attributes) => {
  if (selectedEntityId.value === null || !currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  currentView.value.entities[selectedEntityId.value].attributes = attributes;
  debouncedSave();
};

onMounted(() => {
  // Set default view to first available view
  if (availableViews.value.length > 0) {
    selectedViewName.value = availableViews.value[0].name;
  }
});
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
}
</style>
