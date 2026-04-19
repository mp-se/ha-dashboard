<template>
  <div class="property-editor">
    <label class="form-label small mb-2">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div class="entity-list-editor">
      <!-- Entity list with drop zones -->
      <div
        v-if="entities.length > 0"
        class="list-group"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleDropOnList"
      >
        <div
          v-for="(entity, index) in entities"
          :key="`${entity}-${index}`"
          draggable="true"
          class="list-group-item list-group-item-sm d-flex justify-content-between align-items-center"
          :class="{
            'entity-item-locked': isFirstEntity(index),
            'entity-item-dragging': draggedIndex === index,
            'list-group-drop-active': isDragOver,
            'entity-item-selected':
              selectedEntityListIndex === index && !isFirstEntity(index),
          }"
          @click="selectEntityItem(index)"
          @dragstart="startDrag($event, index)"
          @dragenter.prevent="onDragEnter($event, index)"
          @dragleave.prevent="onDragLeave"
          @dragover.prevent
          @drop.prevent="onDropInList($event, index)"
          @dragend="endDrag"
        >
          <div class="d-flex align-items-center flex-grow-1 gap-2">
            <!-- Lock icon for first (room) entity -->
            <i v-if="isFirstEntity(index)" class="mdi mdi-lock text-muted"></i>
            <!-- Drag handle for reordering on desktop (always shown for non-locked) -->
            <i
              v-else
              class="mdi mdi-drag-vertical text-muted"
              style="cursor: grab"
            ></i>
            <div class="flex-grow-1">
              <div class="small fw-bold">{{ getEntityLabel(entity) }}</div>
              <div class="text-muted" style="font-size: 0.75rem">
                {{ entity }}
              </div>
            </div>
          </div>
          <span v-if="isFirstEntity(index)" class="badge bg-info">Room</span>
        </div>
      </div>

      <!-- Empty state with drop zone -->
      <div
        v-else
        class="drop-zone-empty p-3 border-2 border-dashed rounded text-center"
        :class="{ 'drop-zone-active': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleDropOnEmptyList"
      >
        <small class="text-muted d-block">
          <i class="mdi mdi-playlist-plus me-1"></i>
          No entities added
        </small>
      </div>
    </div>

    <small v-if="error" class="text-danger d-block mt-2">{{ error }}</small>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useHaStore } from "@/stores/haStore";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    required: true,
  },

  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
  lockFirstEntity: {
    type: Boolean,
    default: true,
  },
  selectedIndex: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "all-entities-removed",
  "entity-index-selected",
]);

const store = useHaStore();
const isDragOver = ref(false);
const draggedIndex = ref(null);
const dragOverIndex = ref(null);
const selectedEntityListIndex = ref(props.selectedIndex);

watch(
  () => props.selectedIndex,
  (val) => {
    selectedEntityListIndex.value = val;
  },
);

const selectEntityItem = (index) => {
  if (isFirstEntity(index)) return;
  const newIndex = selectedEntityListIndex.value === index ? null : index;
  selectedEntityListIndex.value = newIndex;
  emit("entity-index-selected", newIndex);
};

const entities = computed({
  get: () => props.modelValue || [],
  set: (value) => emit("update:modelValue", value),
});

const allEntities = computed(() => {
  const map = store.entityMap;
  if (!map || map.size === 0) return [];
  return Array.from(map.entries())
    .map(([entityId, state]) => ({
      entity_id: entityId,
      ...state,
    }))
    .sort((a, b) => {
      const nameA = a.attributes?.friendly_name || a.entity_id;
      const nameB = b.attributes?.friendly_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });
});

const getEntityLabel = (entityId) => {
  const entity = allEntities.value.find((e) => e.entity_id === entityId);
  return entity?.attributes?.friendly_name || entityId;
};

/** Check if an entity is the first one (room entity - locked) */
const isFirstEntity = (index) => {
  return props.lockFirstEntity && index === 0 && entities.value.length > 0;
};

/** Move entity up in the list */
const moveUp = (index) => {
  if (index <= (props.lockFirstEntity ? 1 : 0)) return;
  const arr = [...entities.value];
  [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
  emit("update:modelValue", arr);
};

/** Move entity down in the list */
const moveDown = (index) => {
  if (index >= entities.value.length - 1) return;
  const arr = [...entities.value];
  [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
  emit("update:modelValue", arr);
};

/** Extract entity ID from drag event */
const getEntityIdFromDragEvent = (event) => {
  let entityId = null;

  // First try plain text format (from inspector)
  entityId = event.dataTransfer.getData("text/plain");

  // If that fails, try JSON format (from canvas/palette)
  if (!entityId) {
    try {
      const json = event.dataTransfer.getData("application/json");
      if (json) {
        const data = JSON.parse(json);
        entityId = data.entity || data.entity_id;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return entityId;
};

/** Handle drop when list is not empty */
const handleDropOnList = (event) => {
  isDragOver.value = false;
  const entityId = getEntityIdFromDragEvent(event);

  if (entityId && !entities.value.includes(entityId)) {
    entities.value = [...entities.value, entityId];
  }
};

/** Handle drop when list is empty */
const handleDropOnEmptyList = (event) => {
  isDragOver.value = false;
  const entityId = getEntityIdFromDragEvent(event);

  if (entityId) {
    entities.value = [entityId];
  }
};

/** Drag operations for reordering within the list */
const startDrag = (event, index) => {
  // Don't allow dragging the first entity (room entity)
  if (isFirstEntity(index)) {
    event.preventDefault();
    return;
  }
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", entities.value[index]);
};

const onDragEnter = (event, index) => {
  if (draggedIndex.value === null) return;
  dragOverIndex.value = index;
};

const onDragLeave = () => {
  dragOverIndex.value = null;
};

const onDropInList = (event, index) => {
  if (draggedIndex.value === null) {
    // Not a reorder drag - this is a new entity being dropped
    const entityId = getEntityIdFromDragEvent(event);
    if (entityId && !entities.value.includes(entityId)) {
      // Insert before the dropped index
      const newArray = [...entities.value];
      newArray.splice(index, 0, entityId);
      entities.value = newArray;
    }
    return;
  }

  const sourceIndex = draggedIndex.value;
  // Don't allow dropping on first entity (room entity)
  if (isFirstEntity(index)) {
    draggedIndex.value = null;
    dragOverIndex.value = null;
    return;
  }

  // Don't do anything if dropped on itself
  if (sourceIndex === index) {
    draggedIndex.value = null;
    dragOverIndex.value = null;
    return;
  }

  // Reorder the array
  const newArray = [...entities.value];
  const [removed] = newArray.splice(sourceIndex, 1);
  newArray.splice(index, 0, removed);
  entities.value = newArray;

  draggedIndex.value = null;
  dragOverIndex.value = null;
};

const endDrag = () => {
  draggedIndex.value = null;
  dragOverIndex.value = null;
};

const removeEntity = (index) => {
  // Don't allow removing first entity (room entity) if lock is enabled
  if (isFirstEntity(index)) return;
  const newArray = entities.value.filter((_, i) => i !== index);
  if (newArray.length === 0) {
    emit("all-entities-removed");
  }
  entities.value = newArray;
};

// Expose internal methods for testing and parent access
defineExpose({ moveUp, moveDown, removeEntity });
</script>

<style scoped>
.list-group-item-sm {
  padding: 0.5rem 0.75rem;
}

.alert-sm {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0;
  font-size: 0.875rem;
}

.drop-zone {
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  transition: all 0.2s ease;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: copy;
}

.drop-zone-empty {
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  cursor: copy;
}

.drop-zone-empty.drop-zone-active {
  background-color: #cfe2ff;
  border-color: #0d6efd;
  border-style: solid;
  box-shadow:
    inset 0 0 0.25rem rgba(13, 110, 253, 0.5),
    0 0 0.5rem rgba(13, 110, 253, 0.2);
}

.drop-zone-empty.drop-zone-active small {
  color: #0d6efd;
  font-weight: 600;
}

.drop-zone-empty small {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

.drop-zone-active {
  background-color: #cfe2ff;
  border-color: #0d6efd;
  border-style: solid;
  box-shadow:
    inset 0 0 0.25rem rgba(13, 110, 253, 0.5),
    0 0 0.5rem rgba(13, 110, 253, 0.2);
}

.drop-zone-active small {
  color: #0d6efd;
  font-weight: 600;
}

.drop-zone small {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

.list-group.list-group-drop-active {
  background-color: #f0f8ff;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease;
}

.entity-item-locked {
  background-color: #f0f8ff;
  border-left: 3px solid #0d6efd !important;
  cursor: not-allowed;
}

.entity-item-locked:hover {
  background-color: #f0f8ff;
}

.entity-item-dragging {
  opacity: 0.5;
  background-color: #e7f3ff;
  border: 2px dashed #0d6efd;
}

.entity-item-selected {
  background-color: #cfe2ff !important;
  border-left: 3px solid #0d6efd !important;
  cursor: pointer;
}

.entity-item-selected:hover {
  background-color: #b6d4fe !important;
}

.list-group-item {
  cursor: pointer;
  transition: all 0.15s ease;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>
