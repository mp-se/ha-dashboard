<template>
  <div class="property-editor">
    <label class="form-label small mb-2">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div class="entity-list-editor">
      <!-- Add entity input -->
      <div class="d-flex gap-2 mb-2">
        <select
          v-model="selectedEntity"
          class="form-select form-select-sm flex-grow-1"
          @change="addEntity"
        >
          <option value="">-- Select entity to add --</option>
          <option v-for="entity in availableEntities" :key="entity.entity_id" :value="entity.entity_id">
            {{ entity.attributes?.friendly_name || entity.entity_id }}
          </option>
        </select>
        <button type="button" class="btn btn-sm btn-outline-primary" @click="addEntity">
          <i class="mdi mdi-plus"></i>
        </button>
      </div>

      <!-- Entity list -->
      <div v-if="entities.length > 0" class="list-group">
        <div
          v-for="(entity, index) in entities"
          :key="entity"
          class="list-group-item list-group-item-sm d-flex justify-content-between align-items-center"
        >
          <div>
            <div class="small fw-bold">{{ getEntityLabel(entity) }}</div>
            <div class="text-muted" style="font-size: 0.75rem">{{ entity }}</div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            title="Remove entity"
            @click="removeEntity(index)"
          >
            <i class="mdi mdi-trash-can"></i>
          </button>
        </div>
      </div>

      <div v-else class="alert alert-sm alert-info mb-0">No entities added yet</div>
    </div>

    <small v-if="help" class="text-muted d-block mt-2">{{ help }}</small>
    <small v-if="error" class="text-danger d-block mt-2">{{ error }}</small>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useHaStore } from '@/stores/haStore';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    required: true,
  },
  help: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const store = useHaStore();
const selectedEntity = ref('');

const entities = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value),
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

const availableEntities = computed(() => {
  const entityIds = new Set(entities.value);
  return allEntities.value.filter((e) => !entityIds.has(e.entity_id));
});

const getEntityLabel = (entityId) => {
  const entity = allEntities.value.find((e) => e.entity_id === entityId);
  return entity?.attributes?.friendly_name || entityId;
};

const addEntity = () => {
  if (selectedEntity.value && !entities.value.includes(selectedEntity.value)) {
    entities.value = [...entities.value, selectedEntity.value];
    selectedEntity.value = '';
  }
};

const removeEntity = (index) => {
  entities.value = entities.value.filter((_, i) => i !== index);
};
</script>

<style scoped>
.property-editor {
  margin-bottom: 0.75rem;
}

.list-group-item-sm {
  padding: 0.5rem 0.75rem;
}

.alert-sm {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0;
  font-size: 0.875rem;
}
</style>
