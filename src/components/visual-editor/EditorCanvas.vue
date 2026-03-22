<template>
  <div
    class="editor-canvas p-4"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <div
      v-if="entityCount === 0"
      class="alert alert-info"
      :class="{ 'drop-zone-active': isDragOver }"
    >
      <i class="mdi mdi-information-outline me-2"></i>
      No entities in this view. Drag entities from the palette on the left or
      add them by clicking.
    </div>

    <!-- Grid layout for draggable entities -->
    <div
      v-if="entityCount > 0"
      :key="`canvas-${JSON.stringify(localEntities)}`"
      class="row g-3"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <!-- Grid wrapper with layout from componentLayouts constants -->
      <template
        v-for="(entity, index) in localEntities"
        :key="`entity-${index}`"
      >
        <!-- EntityList items render as direct grid children (no col wrapper) -->
        <template v-if="entity.type === 'HaEntityList'">
          <component
            :is="getComponentForEntity(entity)"
            v-bind="getComponentCustomProps(entity)"
          />
        </template>
        <!-- Other components wrapped in col div with editor overlay -->
        <div
          v-else
          :class="[
            getComponentClasses(entity),
            { 'drop-indicator-active': dragOverIndex === index && isDropping },
          ]"
          draggable="true"
          @dragstart="handleEntityDragStart(index, $event)"
          @dragover.prevent="handleEntityDragOver(index, $event)"
          @dragleave="handleEntityDragLeave(index)"
          @drop.prevent="handleEntityDrop(index, $event)"
          @dragend="handleEntityDragEnd"
        >
          <!-- Drop indicator line (before this item) -->
          <div
            v-if="dragOverIndex === index && isDropping"
            class="drop-indicator drop-indicator-before"
          ></div>

          <!-- Editor overlay for edit controls -->
          <div
            class="editor-overlay"
            :class="{
              'border-3 border-primary': isEntitySelected(index),
              'border-1 border-light': !isEntitySelected(index),
              'editor-spacer': isSpacer(entity),
              'editor-conditional': isConditionalComponent(entity),
            }"
            @click.stop="onCardClick(index)"
          >
            <!-- Component preview -->
            <div class="component-wrapper">
              <component
                :is="getComponentForEntity(entity)"
                v-if="getComponentForEntity(entity)"
                v-bind="getComponentProps(entity)"
                :editor-mode="isConditionalComponent(entity)"
                class="editor-component"
                :class="{
                  'editor-conditional': isConditionalComponent(entity),
                }"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Drop indicator at the end -->
      <div
        v-if="dragOverIndex === localEntities.length && isDropping"
        class="drop-indicator drop-indicator-end"
        style="grid-column: 1 / -1; height: 3px"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { getComponentLayoutClasses } from "../../utils/componentLayouts";
import { getDefaultComponentType } from "../../composables/useDefaultComponentType";

// Import all Ha* components
import HaAlarmPanel from "../cards/HaAlarmPanel.vue";
import HaBeerTap from "../cards/HaBeerTap.vue";
import HaBinarySensor from "../cards/HaBinarySensor.vue";
import HaButton from "../cards/HaButton.vue";
import HaChip from "../cards/HaChip.vue";
import HaEnergy from "../cards/HaEnergy.vue";
import EntityAttributeList from "../sub-components/EntityAttributeList.vue";
import EntityList from "../containers/EntityList.vue";
import HaError from "../cards/HaError.vue";
import HaGauge from "../cards/HaGauge.vue";
import HaGlance from "../cards/HaGlance.vue";
import HaHeader from "../cards/HaHeader.vue";
import IconCircle from "../sub-components/IconCircle.vue";
import HaImage from "../cards/HaImage.vue";
import HaLight from "../cards/HaLight.vue";
import HaLink from "../cards/HaLink.vue";
import HaMediaPlayer from "../cards/HaMediaPlayer.vue";
import HaPerson from "../cards/HaPerson.vue";
import HaPrinter from "../cards/HaPrinter.vue";
import HaRoom from "../cards/HaRoom.vue";
import HaRowSpacer from "../cards/HaRowSpacer.vue";
import HaSelect from "../cards/HaSelect.vue";
import HaSensor from "../cards/HaSensor.vue";
import HaSensorGraph from "../cards/HaSensorGraph.vue";
import HaSpacer from "../cards/HaSpacer.vue";
import HaSun from "../cards/HaSun.vue";
import HaSwitch from "../cards/HaSwitch.vue";
import HaWarning from "../cards/HaWarning.vue";
import HaWeather from "../cards/HaWeather.vue";

const props = defineProps({
  entities: {
    type: Array,
    default: () => [],
  },
  selectedEntityId: {
    type: [Number, null],
    default: null,
  },
});

const emit = defineEmits([
  "select-entity",
  "reorder-entities",
  "remove-entity",
  "add-entity",
  "add-entity-at-index",
]);

// DEBUG: Listen for ALL drop events globally
if (typeof window !== "undefined") {
  window.addEventListener(
    "drop",
    (e) => {
      console.log("[GLOBAL] DROP event detected!", e.target);
    },
    true,
  ); // Use capture phase to catch events before Vue
}

const isDragging = ref(false);
const isDragOver = ref(false);
const isDropping = ref(false);
const dragOverCounter = ref(0);
const dragOverIndex = ref(null);
const localEntities = ref(
  Array.isArray(props.entities) ? [...props.entities] : [],
);

// Safe entity count
const entityCount = computed(() => {
  return Array.isArray(localEntities.value) ? localEntities.value.length : 0;
});

// Map component types to imported components
const componentMap = {
  HaAlarmPanel,
  HaBeerTap,
  HaBinarySensor,
  HaButton,
  HaChip,
  HaEnergy,
  EntityAttributeList,
  EntityList,
  HaError,
  HaGauge,
  HaGlance,
  HaHeader,
  IconCircle,
  HaImage,
  HaLight,
  HaLink,
  HaMediaPlayer,
  HaPerson,
  HaPrinter,
  HaRoom,
  HaRowSpacer,
  HaSelect,
  HaSensor,
  HaSensorGraph,
  HaSpacer,
  HaSun,
  HaSwitch,
  HaWarning,
  HaWeather,
};

watch(
  () => props.entities,
  (newEntities) => {
    if (Array.isArray(newEntities)) {
      localEntities.value = [...newEntities];
    } else {
      localEntities.value = [];
    }
  },
  { deep: true },
);

const isEntitySelected = (index) => {
  return props.selectedEntityId === index;
};

const isSpacer = (entity) => {
  return entity?.type === "HaSpacer" || entity?.type === "HaRowSpacer";
};

const isConditionalComponent = (entity) => {
  return entity?.type === "HaWarning" || entity?.type === "HaError";
};

/**
 * Get the component to render for an entity
 */
const getComponentForEntity = (entity) => {
  if (!entity) return null;

  // Special mapping for HaEntityList to EntityList component
  if (entity.type === "HaEntityList") {
    return componentMap.EntityList;
  }

  // If entity has explicit type, use it
  if (entity.type && componentMap[entity.type]) {
    return componentMap[entity.type];
  }

  // Special cases for non-entity items (when no entity ID is present)
  if (!entity.entity && !entity.getter) {
    if (entity.type === "HaRowSpacer" || entity.type === "HaSpacer") {
      return componentMap.HaSpacer;
    }
    if (entity.type === "HaHeader") {
      return componentMap.HaHeader;
    }
    if (entity.type === "HaLink") {
      return componentMap.HaLink;
    }
  }

  // If no explicit type, use getDefaultComponentType for auto-detection
  if (!entity.type) {
    const defaultType = getDefaultComponentType(
      entity.entity || entity.getter,
      entity.getter,
    );
    if (defaultType && componentMap[defaultType]) {
      return componentMap[defaultType];
    }
  }

  // Default fallback
  return componentMap.HaSensor;
};

/**
 * Get the entity data to pass to component
 * Pass just the entity ID(s) so components can resolve their own data
 */
const getEntityDataForComponent = (entity) => {
  if (!entity) return null;

  // For HaEntityList, don't pass entity data - it uses entities/getter instead
  if (entity.type === "HaEntityList") {
    return null;
  }

  // If entity has an array of entity IDs (like HaRoom, HaGlance)
  if (entity.entity && Array.isArray(entity.entity)) {
    return entity.entity;
  }

  // If entity has a single entity ID string
  if (entity.entity && typeof entity.entity === "string") {
    return entity.entity;
  }

  // Fallback: check for entities property (alternative naming)
  if (entity.entities && Array.isArray(entity.entities)) {
    return entity.entities;
  }

  // For non-entity types (spacer, header, link, image), pass the full config
  if (
    entity.type &&
    ["HaRowSpacer", "HaSpacer", "HaHeader", "HaLink", "HaImage"].includes(
      entity.type,
    )
  ) {
    return entity;
  }

  // Safety fallback: if we have no valid entity data, return empty string to prevent errors
  return "";
};

const getComponentCustomProps = (entity) => {
  if (!entity) return {};

  // Special handling for HaEntityList - construct entities array for the component
  if (entity.type === "HaEntityList") {
    const entitiesForList = entity.entities || [];
    if (entity.getter && !entitiesForList.length) {
      entitiesForList.push({ getter: entity.getter });
    }
    return {
      entities: entitiesForList,
      componentMap: entity.componentMap || {},
      attributes: entity.attributes || [],
    };
  }

  // List of standard config properties that shouldn't be passed as component props
  const standardProps = ["entity", "entities", "type", "getter", "layout"];

  // Extract custom properties (like color, operator, message, etc.)
  const customProps = {};
  for (const [key, value] of Object.entries(entity)) {
    if (!standardProps.includes(key) && value !== undefined && value !== null) {
      customProps[key] = value;
    }
  }

  // Debug logging for HaRoom color property
  if (entity.type === "HaRoom" && customProps.color) {
    // Room color property detected
  }

  return customProps;
};

/**
 * Combine entity data and custom props for a component
 * Different components need different prop structures
 */
const getComponentProps = (entity) => {
  if (!entity) return {};

  const props = {};

  // For HaImage, HaLink, HaHeader, HaSpacer - only use custom props (url, title, etc.)
  // Don't pass entity prop since these components don't use it
  if (
    ["HaImage", "HaLink", "HaHeader", "HaSpacer", "HaRowSpacer"].includes(
      entity.type,
    )
  ) {
    return getComponentCustomProps(entity);
  }

  // For other components, include both entity data and custom props
  const entityData = getEntityDataForComponent(entity);
  if (entityData) {
    props.entity = entityData;
  }

  // Merge in custom props
  Object.assign(props, getComponentCustomProps(entity));

  return props;
};

const handleSelectClick = (index) => {
  if (isEntitySelected(index)) {
    // Deselect if clicking the same entity
    emit("select-entity", null);
  } else {
    // Select the clicked entity
    emit("select-entity", index);
  }
};

const onCardClick = (index) => {
  handleSelectClick(index);
};

/**
 * Get Bootstrap grid classes for a component
 * Uses componentLayouts.js for consistent sizing across editor and views
 */
const getComponentClasses = (entity) => {
  if (!entity) return "col-lg-4 col-md-6";
  return getComponentLayoutClasses(entity.type);
};

const handleDragOver = (event) => {
  event.preventDefault();
  // Ensure we allow the drop effect matching the palette (copy)
  event.dataTransfer.dropEffect = "copy";

  // If there are no entities, or if we're dragging over the background (not specific entities)
  // we set the drop index to the end.
  if (localEntities.value.length === 0) {
    dragOverIndex.value = 0;
  } else {
    // Only update to the end if we aren't already targeting a specific entity via handleEntityDragOver
    if (dragOverIndex.value === null) {
      dragOverIndex.value = localEntities.value.length;
    }
  }
  isDropping.value = true;
};

const handleDragEnter = () => {
  dragOverCounter.value++;
  isDragOver.value = true;
  isDropping.value = true;
};

const handleDragLeave = () => {
  dragOverCounter.value--;
  if (dragOverCounter.value <= 0) {
    isDragOver.value = false;
    dragOverCounter.value = 0;
    // Don't reset dragOverIndex immediately to avoid flickering,
    // handleEntityDragOver will take care of updating it.
    isDropping.value = false;
  }
};

const handleEntityDragOver = (index, event) => {
  event.preventDefault();
  event.stopPropagation(); // Prevent handleDragOver from overriding
  event.dataTransfer.dropEffect = "copy";

  // Track the horizontal/vertical position to determine if dropping before or after
  const rect = event.currentTarget.getBoundingClientRect();

  // For grid layouts (Bootstrap rows), we should ideally check both X and Y
  // but most users expect "before" or "after" based on visual sequence.
  const midpointX = rect.left + rect.width / 2;

  // Use midpointX for horizontal flow, midpointY for vertical stack
  if (event.clientX < midpointX) {
    dragOverIndex.value = index;
  } else {
    dragOverIndex.value = index + 1;
  }
};

const handleEntityDragStart = (index, event) => {
  isDragging.value = true;
  // Store the dragged entity info for reordering
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "application/json",
    JSON.stringify({
      type: "entity-reorder",
      draggedIndex: index,
      entity: localEntities.value[index],
    }),
  );
};

const handleEntityDragEnd = () => {
  isDragging.value = false;
  dragOverIndex.value = null;
  isDropping.value = false;
};

const handleEntityDragLeave = (index) => {
  // Only reset if we're leaving this specific entity without entering another
  if (dragOverIndex.value === index || dragOverIndex.value === index + 1) {
    dragOverIndex.value = null;
  }
};

const handleEntityDrop = (index, event) => {
  event.preventDefault();
  event.stopPropagation();
  isDropping.value = false;

  try {
    let data = event.dataTransfer.getData("application/json");

    // Fallback: If application/json is empty, try text/plain
    if (!data) {
      const textData = event.dataTransfer.getData("text/plain");
      if (textData && textData.includes(".")) {
        data = JSON.stringify({ entity: textData });
      }
    }

    if (data) {
      const parsedData = JSON.parse(data);

      // Handle entity reordering (from another entity in the same canvas)
      if (parsedData.type === "entity-reorder") {
        const draggedIndex = parsedData.draggedIndex;
        const draggedEntity = parsedData.entity;

        // Determine the actual insertion index based on mouse position
        const rect = event.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        let insertIndex = event.clientY < midpoint ? index : index + 1;

        // If dragging from above, adjust the insert index
        if (draggedIndex < insertIndex) {
          insertIndex--;
        }

        // Move the entity in the local array
        localEntities.value.splice(draggedIndex, 1);
        localEntities.value.splice(insertIndex, 0, draggedEntity);
        emit("reorder-entities", localEntities.value);
        return;
      }

      // Handle static component (from palette)
      if (parsedData.isStatic && parsedData.type) {
        const rect = event.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const insertIndex = event.clientY < midpoint ? index : index + 1;

        emit("add-entity-at-index", {
          entity: { type: parsedData.type },
          index: insertIndex,
        });
        return;
      }

      // Handle entity from palette
      if (parsedData.entity) {
        const rect = event.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const insertIndex = event.clientY < midpoint ? index : index + 1;

        emit("add-entity-at-index", {
          entity: parsedData.entity,
          index: insertIndex,
        });
      }
    }
  } catch (error) {
    console.error("[EditorCanvas] Error handling entity drop:", error);
  } finally {
    dragOverIndex.value = null;
  }
};

const handleDrop = (event) => {
  console.log("[EditorCanvas] DROP event fired!", event);
  event.preventDefault();
  isDragOver.value = false;
  isDropping.value = false;
  dragOverCounter.value = 0;
  dragOverIndex.value = null;

  try {
    // Check for data in application/json (handles both entities and static components)
    let data = event.dataTransfer.getData("application/json");

    // Fallback: If application/json is empty, try text/plain (some browsers or drag sources)
    if (!data) {
      const textData = event.dataTransfer.getData("text/plain");
      if (textData) {
        // If it looks like an entity ID (contains a dot), wrap it in the expected JSON format
        if (textData.includes(".")) {
          data = JSON.stringify({ entity: textData });
        }
      }
    }

    if (data) {
      const parsedData = JSON.parse(data);

      // Handle static component
      if (parsedData.isStatic && parsedData.type) {
        emit("add-entity", {
          type: parsedData.type,
        });
        return;
      }

      // Handle entity (original behavior)
      if (parsedData.entity) {
        emit("add-entity", parsedData.entity);
        return;
      }
    }
  } catch (error) {
    console.error("[EditorCanvas] Error parsing dropped data:", error);
  }
};
</script>

<style scoped>
.editor-canvas {
  min-height: calc(100vh - 250px);
  background-color: #f8f9fa;
  padding: 1rem;
  position: relative;
  pointer-events: auto;
}

.drop-zone-active {
  background-color: #e8f4f8 !important;
  border: 2px dashed #0d6efd !important;
  border-radius: 4px;
}

.editor-overlay {
  position: relative;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: move;
}

.editor-overlay:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.editor-overlay.border-1 {
  border-width: 1px !important;
}

.editor-overlay.border-3 {
  border-width: 3px !important;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.editor-component {
  user-select: none;
}

.ghost-entity {
  opacity: 0.5;
  background-color: #e7f1ff;
}

.component-wrapper {
  width: 100%;
  height: 100%;
}

.editor-spacer .component-wrapper {
  min-height: 2rem;
  background: repeating-linear-gradient(
    45deg,
    #f0f0f0,
    #f0f0f0 10px,
    #e8e8e8 10px,
    #e8e8e8 20px
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.editor-spacer .component-wrapper::before {
  content: "Spacer";
}

.editor-conditional {
  position: relative;
}

.editor-conditional::after {
  content: "Conditional";
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 193, 7, 0.9);
  color: #333;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 11;
  pointer-events: none;
}

/* Drop indicator styling */
.drop-indicator-active {
  z-index: 30;
}

/* Grid items need position: relative for drop indicators to position correctly */
[class*="col-"] {
  position: relative;
  transition: transform 0.2s ease;
}

.drop-indicator {
  position: absolute;
  top: 0;
  bottom: 0px;
  width: 4px;
  background-color: var(--bs-primary);
  box-shadow: 0 0 8px rgba(13, 110, 253, 0.6);
  z-index: 50;
  border-radius: 2px;
  pointer-events: none;
}

.drop-indicator-before {
  left: 0;
}

.drop-indicator-end {
  top: auto;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 4px;
  width: auto;
}

.editor-overlay {
  position: relative;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: move;
  z-index: 10;
}

.drop-indicator-before {
  top: -4px;
}

.drop-indicator-end {
  margin-top: 0.5rem;
  background: linear-gradient(
    90deg,
    transparent,
    #0d6efd 10%,
    #0d6efd 90%,
    transparent
  );
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(13, 110, 253, 0.5);
}
</style>
