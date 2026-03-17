<template>
  <div class="editor-canvas p-4">
    <div v-if="entities.length === 0" class="alert alert-info">
      <i class="mdi mdi-information-outline me-2"></i>
      No entities in this view. Add entities from the palette on the left.
    </div>

    <draggable
      v-else
      v-model="localEntities"
      tag="div"
      class="row g-3"
      item-key="__editorKey"
      ghost-class="ghost-entity"
      animation="200"
      @change="handleDragEnd"
      @start="isDragging = true"
      @end="isDragging = false"
    >
      <template #item="{ element: entity, index }">
        <div key="`entity-${index}`" class="col-lg-6 col-md-12">
          <div
            role="button"
            class="card h-100 entity-card"
            :class="{
              'border-primary border-3': selectedEntityId === index,
              'dragging': isDragging,
            }"
            :aria-label="`${getEntityName(entity)} - click to select`"
            :tabindex="0"
            @click="$emit('select-entity', index)"
            @keydown.enter="$emit('select-entity', index)"
            @keydown.space.prevent="$emit('select-entity', index)"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div class="drag-handle flex-shrink-0" title="Drag to reorder">
                  <i class="mdi mdi-drag-vertical text-muted"></i>
                </div>
                <div class="flex-grow-1 min-width-0">
                  <h6 class="card-title mb-2 text-truncate">
                    {{ getEntityName(entity) }}
                  </h6>
                  <small class="text-muted d-block mb-2 text-truncate" :title="entity.entity || entity.getter || 'N/A'">
                    {{ entity.entity || entity.getter || "N/A" }}
                  </small>
                  <small v-if="entity.type" class="badge bg-light text-dark">
                    {{ entity.type }}
                  </small>
                  <small v-else class="badge bg-secondary text-white">
                    Auto
                  </small>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger flex-shrink-0"
                  title="Remove entity"
                  aria-label="Remove entity"
                  @click.stop="$emit('remove-entity', index)"
                >
                  <i class="mdi mdi-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { VueDraggableNext as draggable } from "vue-draggable-next";
import { useHaStore } from "../../stores/haStore";

const props = defineProps({
  entities: {
    type: Array,
    default: () => [],
  },
  selectedEntityId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["select-entity", "reorder-entities", "remove-entity"]);

const store = useHaStore();
const isDragging = ref(false);
const localEntities = ref(props.entities.length > 0 ? [...props.entities] : []);

watch(
  () => props.entities,
  (newEntities) => {
    localEntities.value = [...newEntities];
  },
  { deep: true }
);

const getEntityName = (entity) => {
  if (!entity) return "Unknown";

  // Try to get entity name from store
  if (entity.entity) {
    const entityState = store.entityMap?.[entity.entity];
    if (entityState?.attributes?.friendly_name) {
      return entityState.attributes.friendly_name;
    }
    return entity.entity.split(".")[1]?.toUpperCase() || entity.entity;
  }

  if (entity.getter) {
    return `Getter: ${entity.getter}`;
  }

  if (entity.type === "HaRowSpacer" || entity.type === "HaSpacer") {
    return "Spacer";
  }

  if (entity.type === "HaLink") {
    return entity.label || "Link";
  }

  if (entity.type === "HaHeader") {
    return entity.label || "Header";
  }

  return "Unknown";
};

const handleDragEnd = () => {
  emit("reorder-entities", localEntities.value);
};
</script>

<style scoped>
.editor-canvas {
  min-height: 400px;
  background-color: #f8f9fa;
}

.entity-card {
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.entity-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.entity-card:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.entity-card.dragging {
  opacity: 0.6;
  background-color: #e7f1ff;
}

.drag-handle {
  cursor: grab;
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:active {
  cursor: grabbing;
}

.min-width-0 {
  min-width: 0;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ghost-entity) {
  opacity: 0.5;
}

:deep(.sortable-ghost) {
  opacity: 0.5;
  background-color: #e9ecef;
}
</style>
