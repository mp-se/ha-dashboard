<template>
  <div
    ref="canvasRef"
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
        <!-- EntityList items render as direct grid children (no col wrapper for full width) -->
        <template v-if="entity.type === 'HaEntityList'">
          <component
            :is="getComponentForEntity(entity)"
            v-bind="getComponentProps(entity)"
            :class="{
              'editor-component': true,
              'is-selected': isEntitySelected(index),
            }"
            draggable="true"
            @dragstart="handleEntityDragStart(index, $event)"
            @dragover.prevent="handleEntityDragOver(index, $event)"
            @dragleave="handleEntityDragLeave(index)"
            @drop.prevent="handleEntityDrop(index, $event)"
            @dragend="handleEntityDragEnd"
            @click.stop="onCardClick(index)"
            @dblclick.stop="emit('inspect-entity', index)"
            @touchstart="startLongPress($event, index, handleLongPress)"
            @touchmove="moveLongPress($event)"
            @touchend="endLongPress"
            @contextmenu.prevent
          />
          <!-- Drop indicator for EntityList -->
          <div
            v-if="dragOverIndex === index && isDropping"
            class="drop-indicator drop-indicator-before"
            style="grid-column: 1 / -1"
          ></div>
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
          @touchstart="startLongPress($event, index, handleLongPress)"
          @touchmove="moveLongPress($event)"
          @touchend="endLongPress"
          @contextmenu.prevent
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
            @dblclick.stop="emit('inspect-entity', index)"
            @touchstart="startLongPress($event, index, handleLongPress)"
            @touchmove="moveLongPress($event)"
            @touchend="endLongPress"
            @contextmenu.prevent
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
import { ref, watch } from "vue";

// Import composables
import { useEditorDragDrop } from "../../composables/editor/useEditorDragDrop";
import { useComponentResolver } from "../../composables/editor/useComponentResolver";
import { useEditorSelection } from "../../composables/editor/useEditorSelection";
import { useEditorState } from "../../composables/editor/useEditorState";
import { useEditorLongPress } from "../../composables/editor/useEditorLongPress";

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
  mobileInspectMode: {
    type: Boolean,
    default: false,
  },
  onMoveUp: {
    type: Function,
    default: null,
  },
  onMoveDown: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits([
  "select-entity",
  "reorder-entities",
  "remove-entity",
  "add-entity",
  "add-entity-at-index",
  "inspect-entity",
]);

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

// State management - use composable for ref and computed, handle watch in component for reactivity
const canvasRef = ref(null);
const { localEntities, entityCount } = useEditorState(props.entities);

// Watch for prop changes and sync local state
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

// Drag-drop functionality
const {
  isDropping,
  dragOverIndex,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleEntityDragStart,
  handleEntityDragOver,
  handleEntityDragLeave,
  handleEntityDrop,
  handleEntityDragEnd,
  handleDrop,
} = useEditorDragDrop(localEntities, emit);

// Component resolution
const { getComponentForEntity, getComponentProps, getComponentClasses } =
  useComponentResolver(componentMap);

// Selection management
const { isEntitySelected: isEntitySelectedBase, onCardClick: onCardClickBase } =
  useEditorSelection(emit);

// Long-press detection for mobile
const { startLongPress, moveLongPress, endLongPress } = useEditorLongPress();

const handleLongPress = (index) => {
  emit("inspect-entity", index);
};

// Create wrapper functions that include the reactive selectedEntityId
const isEntitySelected = (index) =>
  isEntitySelectedBase(props.selectedEntityId, index);
const onCardClick = (index) => onCardClickBase(props.selectedEntityId, index);

// Helper functions for entity type checking
const isSpacer = (entity) => {
  return entity?.type === "HaSpacer" || entity?.type === "HaRowSpacer";
};

const isConditionalComponent = (entity) => {
  return entity?.type === "HaWarning" || entity?.type === "HaError";
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

/* EntityList component styling when selected */
:deep(.entity-list.is-selected) {
  border: 3px solid #0d6efd !important;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3) !important;
  background-color: rgba(13, 110, 253, 0.05) !important;
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
