<template>
  <div class="editor-container">
    <!-- ============================================================
         DESKTOP: three-column resizable layout
         ============================================================ -->
    <div
      v-if="!isMobile"
      class="row g-0 resizable-layout"
      style="height: calc(100vh - 100px); min-height: 400px"
    >
      <!-- Left Panel with Tabs -->
      <div
        class="border-end resizable-panel"
        :style="{
          width: leftPanelWidth + '%',
          height: '100%',
          overflow: 'hidden',
        }"
      >
        <LeftPanelTabs
          ref="desktopLeftPanelRef"
          :views="availableViews"
          :selected-view-name="selectedViewName"
          :entities-in-view="currentViewEntities"
          @view-created="handleViewCreated"
          @view-deleted="handleViewDeleted"
          @view-updated="handleViewUpdated"
          @view-selected="selectedViewName = $event"
          @view-index-selected="onViewIndexSelected"
          @tab-changed="onPanelTabChanged"
          @add-entity="handleAddEntity"
          @remove-entity="handleRemoveEntityByEntityId"
        />
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
          :on-move-up="handleMoveUp"
          :on-move-down="handleMoveDown"
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
          :entity-list-selected-index="inspectorEntityListIndex"
          @update-type="handleUpdateEntityType"
          @update-attributes="handleUpdateEntityAttributes"
          @update-properties="handleUpdateEntityProperties"
          @remove-entity="handleRemoveEntity(selectedEntityId)"
          @deselect="selectedEntityId = null; inspectorEntityListIndex = null"
          @entity-index-selected="inspectorEntityListIndex = $event"
        />
        <div v-else class="p-3 text-muted text-center">
          <i class="mdi mdi-information-outline me-2"></i>
          Select an entity to edit
        </div>
      </div>
    </div>

    <!-- ============================================================
         MOBILE: full-width canvas + FAB + bottom sheets
         ============================================================ -->
    <div v-else class="mobile-editor-canvas" :class="{ 'canvas-dimmed': showMobilePanel || showMobileInspector }">
      <EditorCanvas
        :entities="currentViewEntities"
        :selected-entity-id="selectedEntityId"
        :mobile-inspect-mode="true"
        :on-move-up="handleMoveUp"
        :on-move-down="handleMoveDown"
        @select-entity="onSelectEntity"
        @reorder-entities="handleReorderEntities"
        @remove-entity="handleRemoveEntity"
        @add-entity="handleAddEntity"
        @add-entity-at-index="handleAddEntityAtIndex"
        @inspect-entity="onMobileInspectEntity"
      />
    </div>

    <!-- Floating toolbar: [Up] [Down] [Delete] [Edit] [+/×]
         EditorActionBar handles Up/Down/Delete/Edit. Main FAB stays here
         because it has context-aware open/close logic specific to this view.
         @touchstart.stop on the wrapper prevents touch bleed to canvas cards. -->
    <!-- ============================================================
         UNIFIED FLOATING TOOLBAR — all screen sizes
         Context-aware buttons based on what is selected/open.
         Priority: entity-list > inspector > view > card > default
         ============================================================ -->
    <div v-if="isMobile && !isDialogOpen" class="floating-toolbar" @touchstart.stop @touchend.stop>
      <EditorActionBar
        :show-up="toolbarShowUp"
        :show-down="toolbarShowDown"
        :show-edit="toolbarShowEdit"
        :show-delete="toolbarShowDelete"
        :show-add="toolbarShowAdd"
        :show-close="toolbarShowClose"
        :can-move-up="toolbarCanMoveUp"
        :can-move-down="toolbarCanMoveDown"
        edit-label="Edit card properties"
        delete-label="Delete"
        add-label="Add"
        close-label="Close"
        @move-up="handleToolbarMoveUp"
        @move-down="handleToolbarMoveDown"
        @edit="handleToolbarEdit"
        @delete="handleToolbarDelete"
        @add="handleToolbarAdd"
        @close="handleToolbarClose"
      />
    </div>

    <!-- Mobile Panel bottom sheet (palette / views) -->
    <Transition name="bottom-sheet">
      <div v-if="isMobile && showMobilePanel" class="mobile-bottom-sheet">
        <div class="bottom-sheet-handle">
          <div class="bottom-sheet-handle-bar" />
        </div>
        <div class="bottom-sheet-content">
          <LeftPanelTabs
            ref="mobileLeftPanelRef"
            :views="availableViews"
            :selected-view-name="selectedViewName"
            :entities-in-view="currentViewEntities"
            :mobile-mode="true"
            initial-tab="entities"
            @view-created="handleViewCreated"
            @view-deleted="handleViewDeleted"
            @view-updated="handleViewUpdated"
            @view-selected="selectedViewName = $event"
            @view-index-selected="onViewIndexSelected"
            @tab-changed="onPanelTabChanged"
            @add-entity="onMobilePaletteAdd"
            @remove-entity="handleRemoveEntityByEntityId"
          />
        </div>
      </div>
    </Transition>

    <!-- Mobile Inspector bottom sheet -->
    <Transition name="bottom-sheet">
      <div v-if="isMobile && showMobileInspector" class="mobile-bottom-sheet">
        <div class="bottom-sheet-handle">
          <div class="bottom-sheet-handle-bar" />
        </div>
        <div class="bottom-sheet-content px-3">
          <EntityInspector
            v-if="selectedEntity"
            :entity="selectedEntity"
            :entity-id="selectedEntityId"
            :entity-list-selected-index="inspectorEntityListIndex"
            @update-type="handleUpdateEntityType"
            @update-attributes="handleUpdateEntityAttributes"
            @update-properties="handleUpdateEntityProperties"
            @remove-entity="handleRemoveEntity(selectedEntityId)"
            @deselect="onMobileInspectorDeselect"
            @entity-index-selected="inspectorEntityListIndex = $event"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useHaStore } from "../stores/haStore";
import { useConfigStore } from "../stores/configStore";
import { useIsMobile } from "../composables/useIsMobile";
import {
  resetVisualEditorToolbar,
  useVisualEditorToolbar,
} from "../composables/useVisualEditorToolbar";
import EditorCanvas from "../components/visual-editor/EditorCanvas.vue";
import EntityInspector from "../components/visual-editor/EntityInspector.vue";
import LeftPanelTabs from "../components/visual-editor/LeftPanelTabs.vue";
import EditorActionBar from "../components/visual-editor/EditorActionBar.vue";
import { createLogger } from "../utils/logger";
import { supportsMultipleEntities } from "../utils/cardPropertyMetadata";
import "../styles/editor-styles.css";

const logger = createLogger("VisualEditorView");
const props = defineProps({
  viewName: {
    type: String,
    default: "editor",
  },
  previousView: {
    type: String,
    default: "",
  },
});

const store = useHaStore();
const configStore = useConfigStore();
const { isMobile } = useIsMobile();
const { isDialogOpen } = useVisualEditorToolbar();

const selectedViewName = ref("");
const selectedEntityId = ref(null);
const saveTimeout = ref(null);

// Left panel refs (desktop + mobile) — used to call ViewManager methods
const desktopLeftPanelRef = ref(null);
const mobileLeftPanelRef = ref(null);

// Active ViewManager proxy — resolves to whichever panel is currently mounted/visible
const activeViewManager = computed(() =>
  isMobile.value
    ? mobileLeftPanelRef.value?.viewManagerRef
    : desktopLeftPanelRef.value?.viewManagerRef
);

// Index of the view selected in ViewManager (for toolbar up/down/edit/delete)
const selectedViewIndex = ref(null);

const onViewIndexSelected = (index) => {
  selectedViewIndex.value = index;
};

const onPanelTabChanged = (tab) => {
  if (tab !== 'views') selectedViewIndex.value = null;
};

watch(
  () => selectedViewName.value,
  (name) => {
    if (!name) {
      selectedViewIndex.value = null;
      return;
    }
    const idx = availableViews.value.findIndex((v) => v.name === name);
    selectedViewIndex.value = idx !== -1 ? idx : null;
  },
  { immediate: true }
);

// Mobile bottom sheet state
const showMobilePanel = ref(false);
const showMobileInspector = ref(false);
// When true, selecting from palette adds entity to the current card's entity list
const addToInspectorMode = ref(false);
// Index of the entity selected within the inspector's EntityListEditor
const inspectorEntityListIndex = ref(null);

// Reset view and entity list selection when panel closes
watch(showMobilePanel, (val) => {
  if (!val) {
    selectedViewIndex.value = null;
    activeViewManager.value?.triggerDeselect?.();
  }
});

// Reset entity list selection when inspector closes
watch(showMobileInspector, (val) => {
  if (!val) inspectorEntityListIndex.value = null;
});

/**
 * Toolbar state machine — determines which context is active.
 * Priority: entity-list > inspector > panel-view-selected > panel > card > default
 */
const toolbarContext = computed(() => {
  const panelOpen = showMobilePanel.value;
  const inspectorOpen = showMobileInspector.value || (!isMobile.value && selectedEntityId.value !== null);
  if (inspectorOpen && inspectorEntityListIndex.value !== null) return 'entity-list';
  if (inspectorOpen) return 'inspector';
  if (panelOpen && selectedViewIndex.value !== null) return 'view-selected';
  if (panelOpen) return 'panel';
  if (!isMobile.value && selectedViewIndex.value !== null) return 'view-selected';
  if (selectedEntityId.value !== null) return 'card-selected';
  return 'default';
});

// --- Toolbar visibility ---
const toolbarShowUp     = computed(() => ['entity-list', 'card-selected', 'view-selected'].includes(toolbarContext.value));
const toolbarShowDown   = computed(() => ['entity-list', 'card-selected', 'view-selected'].includes(toolbarContext.value));
const toolbarShowEdit   = computed(() => ['card-selected', 'view-selected'].includes(toolbarContext.value));
const toolbarShowDelete = computed(() => {
  const ctx = toolbarContext.value;
  if (ctx === 'view-selected') return (availableViews.value || []).length > 1;
  return ['entity-list', 'card-selected', 'inspector'].includes(ctx);
});
const toolbarShowAdd    = computed(() => {
  const ctx = toolbarContext.value;
  if (ctx === 'inspector') return selectedEntitySupportsMultiple.value;
  return ['card-selected', 'view-selected', 'panel', 'default'].includes(ctx);
});
const toolbarShowClose  = computed(() => toolbarContext.value !== 'default');

// --- Toolbar disabled states ---
const toolbarCanMoveUp = computed(() => {
  const ctx = toolbarContext.value;
  if (ctx === 'entity-list') return inspectorEntityListIndex.value > 0;
  if (ctx === 'card-selected') return selectedEntityId.value !== null && selectedEntityId.value !== 0;
  if (ctx === 'view-selected') return selectedViewIndex.value > 0;
  return false;
});
const toolbarCanMoveDown = computed(() => {
  const ctx = toolbarContext.value;
  if (ctx === 'entity-list') return inspectorEntityListIndex.value !== null && inspectorEntityListIndex.value < inspectorEntityList.value.length - 1;
  if (ctx === 'card-selected') return selectedEntityId.value !== null && selectedEntityId.value < currentViewEntities.value.length - 1;
  if (ctx === 'view-selected') return selectedViewIndex.value !== null && selectedViewIndex.value < (availableViews.value.length - 1);
  return false;
});

// --- Toolbar handlers ---
const handleToolbarMoveUp = () => {
  const ctx = toolbarContext.value;
  if (ctx === 'entity-list') handleInspectorEntityMoveUp();
  else if (ctx === 'card-selected') handleMoveUp();
  else if (ctx === 'view-selected') activeViewManager.value?.triggerMoveUp(selectedViewIndex.value);
};
const handleToolbarMoveDown = () => {
  const ctx = toolbarContext.value;
  if (ctx === 'entity-list') handleInspectorEntityMoveDown();
  else if (ctx === 'card-selected') handleMoveDown();
  else if (ctx === 'view-selected') activeViewManager.value?.triggerMoveDown(selectedViewIndex.value);
};
const handleToolbarEdit = () => {
  const ctx = toolbarContext.value;
  if (ctx === 'card-selected') {
    if (isMobile.value) { showMobileInspector.value = true; showMobilePanel.value = false; }
  } else if (ctx === 'view-selected') {
    activeViewManager.value?.triggerEdit(selectedViewIndex.value);
  }
};
const handleToolbarDelete = () => {
  const ctx = toolbarContext.value;
  if (ctx === 'entity-list') handleInspectorEntityDelete();
  else if (ctx === 'card-selected' || ctx === 'inspector') handleRemoveEntity(selectedEntityId.value);
  else if (ctx === 'view-selected') activeViewManager.value?.triggerDelete(selectedViewIndex.value);
};
const handleToolbarAdd = () => {
  const ctx = toolbarContext.value;
  if (ctx === 'inspector' && selectedEntitySupportsMultiple.value) {
    openAddToInspectorPalette();
  } else if (ctx === 'view-selected' || ctx === 'panel') {
    activeViewManager.value?.triggerAdd();
  } else {
    // card-selected or default — open entity palette
    if (isMobile.value) { showMobilePanel.value = true; showMobileInspector.value = false; }
  }
};
const handleToolbarClose = () => {
  const ctx = toolbarContext.value;
  if (ctx === 'entity-list') {
    inspectorEntityListIndex.value = null;
  } else if (ctx === 'inspector') {
    if (isMobile.value) { showMobileInspector.value = false; }
    else { selectedEntityId.value = null; inspectorEntityListIndex.value = null; }
  } else if (ctx === 'panel' || ctx === 'view-selected') {
    showMobilePanel.value = false;
    selectedViewIndex.value = null;
    activeViewManager.value?.triggerDeselect?.();
  } else if (ctx === 'card-selected') {
    selectedEntityId.value = null;
  }
};

/**
 * Open palette in add-to-inspector mode (adds entity to current card's array).
 */
const openAddToInspectorPalette = () => {
  addToInspectorMode.value = true;
  showMobilePanel.value = true;
  showMobileInspector.value = false;
  inspectorEntityListIndex.value = null;
};

/**
 * Get the entity array from the currently selected card (multi-entity cards).
 */
const inspectorEntityList = computed(() => {
  if (selectedEntityId.value === null) return [];
  const card = currentViewEntities.value[selectedEntityId.value];
  if (!card) return [];
  if (Array.isArray(card.entities)) return card.entities;
  if (Array.isArray(card.entity)) return card.entity;
  return [];
});

/**
 * Update the entity array on the selected card via the config store.
 */
const updateInspectorEntityList = (newArr) => {
  const viewIndex = store.dashboardConfig?.views?.findIndex(
    (v) => v.name === selectedViewName.value
  );
  if (viewIndex === -1 || viewIndex === undefined) return;
  const card = store.dashboardConfig.views[viewIndex].entities[selectedEntityId.value];
  if (!card) return;
  if (Array.isArray(card.entities)) {
    card.entities = newArr;
  } else {
    card.entity = newArr;
  }
  store.dashboardConfig.views[viewIndex].entities = [...store.dashboardConfig.views[viewIndex].entities];
};

const handleInspectorEntityMoveUp = () => {
  const idx = inspectorEntityListIndex.value;
  if (idx === null || idx <= 0) return;
  const arr = [...inspectorEntityList.value];
  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
  updateInspectorEntityList(arr);
  inspectorEntityListIndex.value = idx - 1;
};

const handleInspectorEntityMoveDown = () => {
  const idx = inspectorEntityListIndex.value;
  if (idx === null || idx >= inspectorEntityList.value.length - 1) return;
  const arr = [...inspectorEntityList.value];
  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
  updateInspectorEntityList(arr);
  inspectorEntityListIndex.value = idx + 1;
};

const handleInspectorEntityDelete = () => {
  const idx = inspectorEntityListIndex.value;
  if (idx === null) return;
  const arr = [...inspectorEntityList.value];
  arr.splice(idx, 1);
  updateInspectorEntityList(arr);
  inspectorEntityListIndex.value = null;
};

const onMobileInspectEntity = (entityId) => {
  selectedEntityId.value = entityId;
  showMobileInspector.value = true;
  showMobilePanel.value = false;
};

const onMobileInspectorDeselect = () => {
  showMobileInspector.value = false;
  selectedEntityId.value = null;
};

/**
 * Called when the user taps an entity in the mobile palette.
 * If addToInspectorMode, appends the entity to the current card's entity array.
 * Otherwise, inserts a new card after the selected card.
 */
const onMobilePaletteAdd = (entityIdOrComponent) => {
  console.log('[VisualEditorView] onMobilePaletteAdd', entityIdOrComponent, 'currentView:', currentView.value?.name, 'selectedEntityId:', selectedEntityId.value);
  // If no view is selected yet, auto-select the first available one
  if (!currentView.value && availableViews.value.length > 0) {
    selectedViewName.value = availableViews.value[0].name;
  }
  if (addToInspectorMode.value) {
    // Add entity to the current card's entity list
    handleAddEntityToInspector(entityIdOrComponent);
    showMobilePanel.value = false;
    showMobileInspector.value = true;
    addToInspectorMode.value = false;
    return;
  }
  if (selectedEntityId.value !== null && currentView.value?.entities) {
    // Insert after the currently selected card
    handleAddEntityAtIndex({
      entity: entityIdOrComponent,
      index: selectedEntityId.value + 1,
    });
    selectedEntityId.value = selectedEntityId.value + 1;
  } else {
    // Nothing selected — append to end
    handleAddEntity(entityIdOrComponent);
  }
  showMobilePanel.value = false;
};

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
      if (props.previousView && views.some(v => v.name === props.previousView)) {
        selectedViewName.value = props.previousView;
        logger.log("Auto-selected previous view:", props.previousView);
      } else {
        selectedViewName.value = views[0].name;
        logger.log("Auto-selected first view:", views[0].name);
      }
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

/** True if the currently selected card supports multiple entities */
const selectedEntitySupportsMultiple = computed(() => {
  if (!selectedEntity.value) return false;
  return supportsMultipleEntities(selectedEntity.value.type || "");
});

/**
 * Append an entity ID to the currently selected card's entity array.
 * Handles single-entity cards by converting them to an array first.
 */
const handleAddEntityToInspector = (entityId) => {
  if (selectedEntityId.value === null || !selectedEntity.value) return;
  const card = selectedEntity.value;
  const current = Array.isArray(card.entity)
    ? [...card.entity]
    : card.entity
      ? [card.entity]
      : [];
  handleUpdateEntityProperties({ entity: [...current, entityId] });
};

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

/**
 * Returns default properties for static components that need them to be visible.
 */
const getStaticComponentDefaults = (type) => {
  const defaults = {
    HaHeader: { name: 'Header' },
  };
  return defaults[type] ?? {};
};

const handleAddEntity = (entityIdOrComponent) => {
  // Auto-select first view if none is selected (e.g. editor opened before view selection)
  if (!currentView.value && availableViews.value.length > 0) {
    selectedViewName.value = availableViews.value[0].name;
  }
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
    // Static component - create entry with type + defaults for required props
    newEntity = {
      type: entityIdOrComponent.type,
      ...getStaticComponentDefaults(entityIdOrComponent.type),
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
    // Static component - create entry with type + defaults for required props
    newEntity = {
      type: entityIdOrComponent.type,
      ...getStaticComponentDefaults(entityIdOrComponent.type),
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

const handleMoveUp = () => {
  if (selectedEntityId.value === null || !currentView.value) return;
  if (selectedEntityId.value === 0) return; // Already at top

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  const entities = store.dashboardConfig.views[viewIndex].entities;
  if (!Array.isArray(entities)) return;

  // Swap with previous item using splice for Vue reactivity
  const currentIndex = selectedEntityId.value;
  const [removed] = entities.splice(currentIndex, 1);
  entities.splice(currentIndex - 1, 0, removed);
  
  // Reassign array to trigger Vue reactivity
  store.dashboardConfig.views[viewIndex].entities = [...entities];
  
  selectedEntityId.value = currentIndex - 1;
  debouncedSave();
};

const handleMoveDown = () => {
  if (selectedEntityId.value === null || !currentView.value) return;

  const viewIndex = store.dashboardConfig.views.findIndex(
    (v) => v.name === selectedViewName.value,
  );
  if (viewIndex === -1) return;

  const entities = store.dashboardConfig.views[viewIndex].entities;
  if (!Array.isArray(entities)) return;
  if (selectedEntityId.value >= entities.length - 1) return; // Already at bottom

  // Swap with next item using splice for Vue reactivity
  const currentIndex = selectedEntityId.value;
  const [removed] = entities.splice(currentIndex, 1);
  entities.splice(currentIndex + 1, 0, removed);
  
  // Reassign array to trigger Vue reactivity
  store.dashboardConfig.views[viewIndex].entities = [...entities];
  
  selectedEntityId.value = currentIndex + 1;
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
