<template>
  <div class="editor-canvas p-4">
    <div v-if="entityCount === 0" class="alert alert-info">
      <i class="mdi mdi-information-outline me-2"></i>
      No entities in this view. Add entities from the palette on the left.
    </div>

    <!-- Draggable grid layout - matches main view structure -->
    <draggable
      v-if="entityCount > 0"
      v-model="localEntities"
      tag="div"
      class="row g-3"
      ghost-class="ghost-entity"
      animation="200"
      @change="handleDragEnd"
      @start="isDragging = true"
      @end="isDragging = false"
    >
      <template #default>
        <!-- Grid wrapper with layout from componentLayouts constants -->
        <div
          v-for="(entity, index) in localEntities"
          :key="`entity-${index}`"
          :class="getComponentClasses(entity)"
        >
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
            <!-- Drag handle -->
            <div class="drag-handle" title="Drag to reorder">
              <i class="mdi mdi-drag-vertical"></i>
            </div>
            
            <!-- Component preview -->
            <div class="component-wrapper">
              <component
                :is="getComponentForEntity(entity)"
                v-if="getComponentForEntity(entity)"
                :entity="getEntityDataForComponent(entity)"
                :editor-mode="isConditionalComponent(entity)"
                class="editor-component"
                :class="{ 'editor-conditional': isConditionalComponent(entity) }"
              />
            </div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { VueDraggableNext as draggable } from "vue-draggable-next";
import { useHaStore } from "../../stores/haStore";
import { getComponentLayoutClasses } from "../../utils/componentLayouts";

// Import all Ha* components
import HaAlarmPanel from "../HaAlarmPanel.vue";
import HaBeerTap from "../HaBeerTap.vue";
import HaBinarySensor from "../HaBinarySensor.vue";
import HaButton from "../HaButton.vue";
import HaChip from "../HaChip.vue";
import HaEnergy from "../HaEnergy.vue";
import HaEntityAttributeList from "../HaEntityAttributeList.vue";
import HaEntityList from "../HaEntityList.vue";
import HaError from "../HaError.vue";
import HaGauge from "../HaGauge.vue";
import HaGlance from "../HaGlance.vue";
import HaHeader from "../HaHeader.vue";
import HaIconCircle from "../HaIconCircle.vue";
import HaImage from "../HaImage.vue";
import HaLight from "../HaLight.vue";
import HaLink from "../HaLink.vue";
import HaMediaPlayer from "../HaMediaPlayer.vue";
import HaPerson from "../HaPerson.vue";
import HaPrinter from "../HaPrinter.vue";
import HaRoom from "../HaRoom.vue";
import HaRowSpacer from "../HaRowSpacer.vue";
import HaSelect from "../HaSelect.vue";
import HaSensor from "../HaSensor.vue";
import HaSensorGraph from "../HaSensorGraph.vue";
import HaSpacer from "../HaSpacer.vue";
import HaSun from "../HaSun.vue";
import HaSwitch from "../HaSwitch.vue";
import HaWarning from "../HaWarning.vue";
import HaWeather from "../HaWeather.vue";

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

const emit = defineEmits(["select-entity", "reorder-entities", "remove-entity"]);

const store = useHaStore();
const isDragging = ref(false);
const localEntities = ref(Array.isArray(props.entities) ? [...props.entities] : []);

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
  HaEntityAttributeList,
  HaEntityList,
  HaError,
  HaGauge,
  HaGlance,
  HaHeader,
  HaIconCircle,
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
    console.log("[EditorCanvas] Watch fired - newEntities:", newEntities, "isArray:", Array.isArray(newEntities));
    if (Array.isArray(newEntities)) {
      localEntities.value = [...newEntities];
    } else {
      localEntities.value = [];
    }
  },
  { deep: true }
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
  
  // If entity has explicit type, use it
  if (entity.type && componentMap[entity.type]) {
    return componentMap[entity.type];
  }
  
  // Special cases for non-entity items
  if (entity.type === "HaRowSpacer" || entity.type === "HaSpacer") {
    return componentMap.HaSpacer;
  }
  if (entity.type === "HaHeader") {
    return componentMap.HaHeader;
  }
  if (entity.type === "HaLink") {
    return componentMap.HaLink;
  }
  
  // If no type, try to auto-detect from entity class
  if (entity.entity && store.entityMap) {
    const entityState = store.entityMap[entity.entity];
    if (entityState?.attributes?.class) {
      const entityClass = entityState.attributes.class;
      // Map entity classes to component types
      const classMap = {
        "light": "HaLight",
        "switch": "HaSwitch",
        "sensor": "HaSensor",
        "binary_sensor": "HaBinarySensor",
        "weather": "HaWeather",
        "climate": "HaSelect",
      };
      const componentType = classMap[entityClass];
      if (componentType && componentMap[componentType]) {
        return componentMap[componentType];
      }
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
  
  // For non-entity types (spacer, header, link), pass the full config
  if (entity.type && ["HaRowSpacer", "HaSpacer", "HaHeader", "HaLink"].includes(entity.type)) {
    return entity;
  }
  
  // Safety fallback: if we have no valid entity data, return empty string to prevent errors
  console.warn("[EditorCanvas] Warning: entity config has no entity or entities property:", entity);
  return "";
};

const handleDragEnd = () => {
  emit("reorder-entities", localEntities.value);
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
</script>

<style scoped>
.editor-canvas {
  min-height: 400px;
  background-color: #f8f9fa;
  padding: 1rem;
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

.drag-handle {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  cursor: grab;
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-size: 1rem;
  color: #6c757d;
}

.drag-handle:active {
  cursor: grabbing;
}

.editor-component {
  pointer-events: none;
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
</style>
