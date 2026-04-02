<template>
  <div class="editor-container">
    <div
      class="row g-0 resizable-layout"
      style="min-height: calc(100vh - 200px)"
    >
      <!-- Entity Palette (Left) -->
      <div
        class="border-end resizable-panel"
        :style="{
          width: leftPanelWidth + '%',
          height: '100%',
          overflow: 'auto',
        }"
      >
        <ViewManager
          :views="availableViews"
          :selected-view-name="selectedViewName"
          @view-created="handleViewCreated"
          @view-deleted="handleViewDeleted"
          @view-updated="handleViewUpdated"
          @view-selected="selectedViewName = $event"
        />
        <EntityPalette
          :entities-in-view="currentViewEntities"
          @add-entity="handleAddEntity"
          @remove-entity="handleRemoveEntityByEntityId"
        />
        <StaticComponentPalette />
      </div>

      <!-- Resize Handle (Left-Center) -->
      <div
        class="resize-handle resize-handle-left"
        @mousedown="startResize('left', $event)"
      >
        <div class="resize-handle-icon">⋮</div>
      </div>

      <!-- Canvas (Center) -->
      <div
        class="resizable-panel"
        :style="{
          width: centerPanelWidth + '%',
          height: '100%',
          overflow: 'auto',
        }"
      >
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

      <!-- Resize Handle (Center-Right) -->
      <div
        class="resize-handle resize-handle-right"
        @mousedown="startResize('right', $event)"
      >
        <div class="resize-handle-icon">⋮</div>
      </div>

      <!-- Inspector (Right) -->
      <div
        class="border-start resizable-panel"
        :style="{
          width: rightPanelWidth + '%',
          height: '100%',
          overflow: 'auto',
        }"
      >
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useHaStore } from "../stores/haStore";
import { useConfigStore } from "../stores/configStore";
import {
  resetVisualEditorToolbar,
  useVisualEditorToolbar,
} from "../composables/useVisualEditorToolbar";
import EditorCanvas from "../components/visual-editor/EditorCanvas.vue";
import EntityPalette from "../components/visual-editor/EntityPalette.vue";
import EntityInspector from "../components/visual-editor/EntityInspector.vue";
import StaticComponentPalette from "../components/visual-editor/StaticComponentPalette.vue";
import ViewManager from "../components/visual-editor/ViewManager.vue";
import { createLogger } from "../utils/logger";
import "../styles/editor-styles.css";

const logger = createLogger("VisualEditorView");
defineProps({
  viewName: {
    type: String,
    default: "editor",
  },
});

const store = useHaStore();
const configStore = useConfigStore();

const selectedViewName = ref("");
const selectedEntityId = ref(null);
const saveTimeout = ref(null);

// Draft management
const originalConfig = ref(null);
const { setHasChanges, setIsSaving, setSaveStatus, setSaveHandler } =
  useVisualEditorToolbar();

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
  { immediate: true },
);

const currentView = computed(() => {
  const view = availableViews.value.find(
    (v) => v.name === selectedViewName.value,
  );
  return view;
});

const currentViewEntities = computed(() => {
  const entities = currentView.value?.entities;
  // Ensure entities is always an array
  if (!Array.isArray(entities)) {
    return [];
  }
  return entities;
});

const selectedEntity = computed(() => {
  if (selectedEntityId.value == null) return null;
  const entities = currentViewEntities.value;
  if (!Array.isArray(entities)) {
    return null;
  }
  return entities.find((_, idx) => idx === selectedEntityId.value);
});

/**
 * Debounced save function - waits 500ms before saving to allow user to finish editing
 */
const debouncedSave = () => {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  setHasChanges(true);

  saveTimeout.value = setTimeout(() => {
    saveDraftToLocalStorage();
  }, 500);
};

/**
 * Save draft to localStorage
 */
const saveDraftToLocalStorage = () => {
  try {
    if (!store.dashboardConfig) return;

    const draft = JSON.stringify(store.dashboardConfig);
    localStorage.setItem("dashboardConfigDraft", draft);
    logger.log("Draft saved to localStorage");
  } catch (error) {
    logger.error("Error saving draft to localStorage:", error);
  }
};

/**
 * Save config to backend server
 */
const saveConfigToBackend = async () => {
  try {
    if (!store.dashboardConfig) return;

    setIsSaving(true);
    setSaveStatus("Saving...");

    const success = await configStore.saveConfigToBackend(
      store.dashboardConfig,
    );

    if (success) {
      setSaveStatus("Saved!");
      setHasChanges(false);
      originalConfig.value = JSON.parse(JSON.stringify(store.dashboardConfig));
      logger.log("Config saved to backend successfully");

      setTimeout(() => {
        setSaveStatus("");
      }, 2000);
    } else {
      setSaveStatus("Error saving");
      logger.error("Failed to save config to backend");

      setTimeout(() => {
        setSaveStatus("");
      }, 3000);
    }
  } catch (error) {
    logger.error("Error saving config to backend:", error);
    setSaveStatus("Error saving");

    setTimeout(() => {
      setSaveStatus("");
    }, 3000);
  } finally {
    setIsSaving(false);
  }
};

const onSelectEntity = (entityId) => {
  selectedEntityId.value = entityId;
};

const handleAddEntity = (entityIdOrComponent) => {
  if (!currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  // Ensure entities is an array
  if (!Array.isArray(currentView.value.entities)) {
    currentView.value.entities = [];
  }

  // Handle both entity ID (string) and static component (object with type)
  let newEntity;
  if (typeof entityIdOrComponent === "string") {
    // Entity ID - create entry with entity property
    newEntity = {
      entity: entityIdOrComponent,
      type: undefined, // Will auto-detect based on entity type
    };
  } else if (
    entityIdOrComponent &&
    typeof entityIdOrComponent === "object" &&
    entityIdOrComponent.type
  ) {
    // Static component - create entry with just the type
    newEntity = {
      type: entityIdOrComponent.type,
    };
  } else {
    return;
  }

  currentView.value.entities.push(newEntity);
  // Trigger reactivity by reassigning the array
  currentView.value.entities = [...currentView.value.entities];
  debouncedSave();
};

const handleAddEntityAtIndex = (payload) => {
  if (!currentView.value || !payload) return;

  const { entity: entityIdOrComponent, index } = payload;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  // Ensure entities is an array
  if (!Array.isArray(currentView.value.entities)) {
    currentView.value.entities = [];
  }

  // Handle both entity ID (string) and static component (object with type)
  let newEntity;
  if (typeof entityIdOrComponent === "string") {
    // Entity ID - create entry with entity property
    newEntity = {
      entity: entityIdOrComponent,
      type: undefined, // Will auto-detect based on entity type
    };
  } else if (
    entityIdOrComponent &&
    typeof entityIdOrComponent === "object" &&
    entityIdOrComponent.type
  ) {
    // Static component - create entry with just the type
    newEntity = {
      type: entityIdOrComponent.type,
    };
  } else {
    return;
  }

  // Clamp the index to valid range [0, array.length]
  const clampedIndex = Math.max(
    0,
    Math.min(index, currentView.value.entities.length),
  );
  currentView.value.entities.splice(clampedIndex, 0, newEntity);
  // Trigger reactivity by reassigning the array
  currentView.value.entities = [...currentView.value.entities];
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

/**
 * Handle view creation
 */
const handleViewCreated = (newView) => {
  logger.log("View created:", newView);
  setSaveStatus("Saved");
  setTimeout(() => {
    setSaveStatus("");
  }, 2000);
  // Auto-select the new view
  selectedViewName.value = newView.name;
};

/**
 * Handle view deletion
 */
const handleViewDeleted = (deletedView) => {
  logger.log("View deleted:", deletedView);
  // Auto-select first available view
  const views = store.dashboardConfig?.views ?? [];
  if (views.length > 0) {
    selectedViewName.value = views[0].name;
  }
  setSaveStatus("Saved");
  setTimeout(() => {
    setSaveStatus("");
  }, 2000);
};

/**
 * Handle view update
 */
const handleViewUpdated = (updatedView) => {
  logger.log("View updated:", updatedView);
  setSaveStatus("Saved");
  setTimeout(() => {
    setSaveStatus("");
  }, 2000);
};

// Resizable panel state
const leftPanelWidth = ref(25);
const centerPanelWidth = ref(50);
const rightPanelWidth = ref(25);
const isResizing = ref(false);
const resizeMode = ref(null); // 'left' or 'right'
const startX = ref(0);
const startWidths = ref({ left: 25, center: 50, right: 25 });

const normalizePanelWidths = (widths) => {
  const left = Number(widths?.left);
  const center = Number(widths?.center);
  const right = Number(widths?.right);

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(center) ||
    !Number.isFinite(right)
  ) {
    return { left: 25, center: 50, right: 25 };
  }

  const total = left + center + right;
  if (total <= 0) {
    return { left: 25, center: 50, right: 25 };
  }

  return {
    left: (left / total) * 100,
    center: (center / total) * 100,
    right: (right / total) * 100,
  };
};

/**
 * Initialize panel widths from localStorage
 */
const initializePanelWidths = () => {
  const saved = localStorage.getItem("editor-panel-widths");
  if (saved) {
    try {
      const widths = normalizePanelWidths(JSON.parse(saved));
      leftPanelWidth.value = widths.left;
      centerPanelWidth.value = widths.center;
      rightPanelWidth.value = widths.right;
    } catch {
      // Use defaults if parsing fails
    }
  }
};

/**
 * Save panel widths to localStorage
 */
const savePanelWidths = () => {
  localStorage.setItem(
    "editor-panel-widths",
    JSON.stringify({
      left: leftPanelWidth.value,
      center: centerPanelWidth.value,
      right: rightPanelWidth.value,
    }),
  );
};

/**
 * Start resizing panels
 */
const startResize = (mode, mouseEvent) => {
  isResizing.value = true;
  resizeMode.value = mode;
  startX.value = mouseEvent.clientX;
  startWidths.value = {
    left: leftPanelWidth.value,
    center: centerPanelWidth.value,
    right: rightPanelWidth.value,
  };
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.body.style.userSelect = "none";
};

/**
 * Handle mouse move during resize
 */
const handleMouseMove = (event) => {
  if (!isResizing.value) return;

  const delta = event.clientX - startX.value;
  const percentDelta = (delta / window.innerWidth) * 100;

  if (resizeMode.value === "left") {
    // Resizing between left and center panels
    // Dragging right (positive delta) grows left, shrinks center
    const newLeft = Math.max(
      15,
      Math.min(55, startWidths.value.left + percentDelta),
    );
    const diff = newLeft - startWidths.value.left;
    leftPanelWidth.value = newLeft;
    centerPanelWidth.value = startWidths.value.center - diff;
  } else if (resizeMode.value === "right") {
    // Resizing between center and right panels
    // Dragging right (positive delta) grows center, shrinks right
    const newCenter = Math.max(
      20,
      Math.min(70, startWidths.value.center + percentDelta),
    );
    const diff = newCenter - startWidths.value.center;
    centerPanelWidth.value = newCenter;
    rightPanelWidth.value = startWidths.value.right - diff;
  }
};

/**
 * Handle mouse up to end resize
 */
const handleMouseUp = () => {
  if (isResizing.value) {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "auto";
    isResizing.value = false;
    savePanelWidths();
  }
};

// Initialize panel widths on mount
onMounted(() => {
  initializePanelWidths();
  setSaveHandler(saveConfigToBackend);
});

onBeforeUnmount(() => {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  setSaveHandler(null);
  resetVisualEditorToolbar();
});
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 132px);
  width: 100%;
  margin: 0;
}

.resizable-layout {
  display: flex;
  gap: 0;
  min-width: 0;
  width: 100%;
  height: calc(100vh - 132px);
  margin: 0;
}

.resizable-panel {
  display: flex;
  flex-direction: column;
  min-width: 100px;
  min-height: 0;
  transition: width 0.1s ease;
}

.resize-handle {
  width: 6px;
  height: 100%;
  background-color: #ccc;
  cursor: col-resize !important;
  flex-shrink: 0;
  user-select: none;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #999;
  border-right: 1px solid #999;
  transition: background-color 0.2s ease;
}

.resize-handle:hover {
  background-color: #0d6efd;
  width: 8px;
}

.resize-handle-icon {
  color: #666;
  font-size: 12px;
  letter-spacing: -2px;
  font-weight: bold;
  cursor: col-resize !important;
}

.resize-handle:hover .resize-handle-icon {
  color: white;
}
</style>
