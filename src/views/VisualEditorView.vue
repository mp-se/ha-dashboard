<template>
  <!-- Tab Navigation -->
  <div class="sticky-top bg-body shadow-sm p-3 border-bottom">
    <div class="container-fluid">
      <div class="row align-items-center">
        <div class="col-auto">
          <h5 class="mb-0">Visual Editor</h5>
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

  <!-- Editor Container -->
  <div class="editor-container">
    <div class="row g-0" style="min-height: calc(100vh - 200px)">
      <!-- Entity Palette (Left) -->
      <div class="col-lg-3 border-end" style="overflow-y: auto; max-height: calc(100vh - 200px)">
        <EntityPalette
          :entities-in-view="currentViewEntities"
          @add-entity="handleAddEntity"
          @remove-entity="handleRemoveEntityByEntityId"
        />
      </div>

      <!-- Canvas (Center) -->
      <div class="col-lg-6" style="overflow-y: auto; max-height: calc(100vh - 200px)">
        <EditorCanvas
          :entities="currentViewEntities"
          :selected-entity-id="selectedEntityId"
          @select-entity="onSelectEntity"
          @reorder-entities="handleReorderEntities"
          @remove-entity="handleRemoveEntity"
          @add-entity="handleAddEntity"
          @add-entity-at-index="handleAddEntityAtIndex"
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
          @update-properties="handleUpdateEntityProperties"
          @remove-entity="handleRemoveEntity(selectedEntityId)"
          @deselect="selectedEntityId = null"
        />
        <div v-else class="p-3 text-muted text-center">
          <i class="mdi mdi-information-outline me-2"></i>
          Select an entity to edit
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useHaStore } from "../stores/haStore";
import EditorCanvas from "../components/VisualEditor/EditorCanvas.vue";
import EntityPalette from "../components/VisualEditor/EntityPalette.vue";
import EntityInspector from "../components/VisualEditor/EntityInspector.vue";
import { createLogger } from "../utils/logger";

const logger = createLogger("VisualEditorView");
const store = useHaStore();

const selectedViewName = ref("");
const selectedEntityId = ref(null);
const saveStatus = ref("");
const saveTimeout = ref(null);

const availableViews = computed(() => {
  const views = store.dashboardConfig?.views ?? [];
  return views;
});

// Watch availableViews and set the first view when it becomes available
watch(
  () => availableViews.value,
  (views) => {
    if (views.length > 0 && !selectedViewName.value) {
      selectedViewName.value = views[0].name;
      logger.log("Auto-selected first view:", views[0].name);
    }
  },
  { immediate: true }
);

const currentView = computed(() => {
  const view = availableViews.value.find((v) => v.name === selectedViewName.value);
  return view;
});

const currentViewEntities = computed(() => {
  const entities = currentView.value?.entities;
  console.log("[VisualEditorView] currentViewEntities computed - currentView:", currentView.value, "entities:", entities, "isArray:", Array.isArray(entities));
  // Ensure entities is always an array
  if (!Array.isArray(entities)) {
    return [];
  }
  return entities;
});

const selectedEntity = computed(() => {
  if (selectedEntityId.value == null) return null;
  const entities = currentViewEntities.value;
  console.log("[VisualEditorView] selectedEntity computed - entities:", entities, "isArray:", Array.isArray(entities), "selectedEntityId:", selectedEntityId.value);
  if (!Array.isArray(entities)) {
    console.warn("[VisualEditorView] selectedEntity - entities is not an array!");
    return null;
  }
  return entities.find((_, idx) => idx === selectedEntityId.value);
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

const onSelectEntity = (entityId) => {
  selectedEntityId.value = entityId;
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

  // Ensure entities is an array
  if (!Array.isArray(currentView.value.entities)) {
    currentView.value.entities = [];
  }

  currentView.value.entities.push(newEntity);
  debouncedSave();
};

const handleAddEntityAtIndex = (payload) => {
  if (!currentView.value || !payload) return;

  const { entity: entityId, index } = payload;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  // Create a new entity entry
  const newEntity = {
    entity: entityId,
    type: undefined, // Will auto-detect based on entity type
  };

  // Ensure entities is an array
  if (!Array.isArray(currentView.value.entities)) {
    currentView.value.entities = [];
  }

  // Clamp the index to valid range [0, array.length]
  const clampedIndex = Math.max(0, Math.min(index, currentView.value.entities.length));
  currentView.value.entities.splice(clampedIndex, 0, newEntity);
  debouncedSave();
};

const handleRemoveEntityByEntityId = (entityId) => {
  if (!currentView.value) return;

  // Ensure entities is an array
  if (!Array.isArray(currentView.value.entities)) {
    return;
  }

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  // Find the index of the entity with this entity_id and remove it
  const entityIndex = currentView.value.entities.findIndex(
    (e) => e.entity === entityId,
  );
  if (entityIndex === -1) return;

  currentView.value.entities.splice(entityIndex, 1);
  
  // Deselect if this entity was selected
  if (selectedEntityId.value === entityIndex) {
    selectedEntityId.value = null;
  }
  
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

  // Ensure entities is an array
  if (!Array.isArray(currentView.value.entities)) {
    return;
  }

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

const handleUpdateEntityProperties = (properties) => {
  if (selectedEntityId.value === null || !currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  // Merge all properties into the entity
  Object.assign(currentView.value.entities[selectedEntityId.value], properties);
  debouncedSave();
};
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
}
</style>
