<template>
  <div class="entity-inspector p-3">
    <h6 class="mb-3">Entity Inspector</h6>

    <div class="inspector-section mb-3">
      <label class="form-label small mb-1"><strong>Entity ID</strong></label>
      <div class="form-control-static text-monospace small">
        {{ entity.entity || entity.getter || "N/A" }}
      </div>
    </div>

    <!-- Component Type Selector -->
    <div class="inspector-section mb-3">
      <label for="componentType" class="form-label small mb-1">
        <strong>Component Type</strong>
      </label>
      <select
        id="componentType"
        :value="entity.type || 'auto'"
        class="form-select form-select-sm"
        @change="handleComponentTypeChange"
      >
        <option value="auto">Auto-detect</option>
        <optgroup label="Recommended">
          <option v-if="recommendedType" :value="recommendedType">
            {{ recommendedType }} (Recommended)
          </option>
        </optgroup>
        <optgroup label="Available Components">
          <option v-for="type in availableComponentTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Attributes Editor -->
    <div class="inspector-section mb-3">
      <label class="form-label small mb-2"><strong>Attributes</strong></label>
      <div class="attributes-form">
        <div v-for="(value, key, idx) in localAttributes" :key="`attr-${key}-${idx}`" class="mb-2">
          <div class="input-group input-group-sm">
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Key"
              :value="key"
              disabled
            />
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Value"
              :value="value"
              @input="updateAttribute(key, $event.target.value)"
            />
            <button
              type="button"
              class="btn btn-outline-danger btn-sm"
              title="Remove attribute"
              @click="removeAttribute(key)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Add New Attribute -->
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary w-100"
          @click="showAddAttribute = true"
        >
          <i class="mdi mdi-plus me-1"></i>Add Attribute
        </button>

        <!-- New Attribute Form (Hidden by default) -->
        <div v-if="showAddAttribute" class="mt-2 p-2 bg-light rounded">
          <div class="mb-2">
            <input
              v-model="newAttributeKey"
              type="text"
              class="form-control form-control-sm mb-2"
              placeholder="Attribute name"
            />
            <input
              v-model="newAttributeValue"
              type="text"
              class="form-control form-control-sm"
              placeholder="Attribute value"
            />
          </div>
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-primary"
              @click="addNewAttribute"
            >
              Add
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="cancelAddAttribute"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="inspector-section">
      <button
        type="button"
        class="btn btn-danger w-100 btn-sm"
        title="Remove this entity from the view"
        @click="$emit('remove-entity')"
      >
        <i class="mdi mdi-trash-can me-2"></i>Remove Entity
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { getDefaultComponentType } from "../../composables/useDefaultComponentType";

const props = defineProps({
  entity: {
    type: Object,
    required: true,
  },
  entityId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["update-type", "update-attributes", "remove-entity"]);

const localAttributes = ref({});
const showAddAttribute = ref(false);
const newAttributeKey = ref("");
const newAttributeValue = ref("");

// Sync local attributes with prop
watch(
  () => props.entity?.attributes,
  (newAttributes) => {
    localAttributes.value = { ...newAttributes };
  },
  { immediate: true, deep: true }
);

const recommendedType = computed(() => {
  if (props.entity?.getter) {
    return "HaEntityList";
  }
  return getDefaultComponentType(
    props.entity?.entity,
    props.entity?.getter
  );
});

// List of available component types (can be imported from a constant)
const availableComponentTypes = computed(() => {
  return [
    "HaAlarmPanel",
    "HaBeerTap",
    "HaBinarySensor",
    "HaButton",
    "HaChip",
    "HaEnergy",
    "HaEntityAttributeList",
    "HaEntityList",
    "HaGauge",
    "HaGlance",
    "HaHeader",
    "HaIconCircle",
    "HaImage",
    "HaLight",
    "HaLink",
    "HaMediaPlayer",
    "HaPerson",
    "HaPrinter",
    "HaRoom",
    "HaRowSpacer",
    "HaSelect",
    "HaSensor",
    "HaSensorGraph",
    "HaSpacer",
    "HaSun",
    "HaSwitch",
    "HaWarning",
    "HaWeather",
  ].sort();
});

const handleComponentTypeChange = (event) => {
  const value = event.target.value;
  emit("update-type", value === "auto" ? undefined : value);
};

const updateAttribute = (key, value) => {
  localAttributes.value[key] = value;
  emit("update-attributes", localAttributes.value);
};

const removeAttribute = (key) => {
  delete localAttributes.value[key];
  emit("update-attributes", { ...localAttributes.value });
};

const addNewAttribute = () => {
  if (newAttributeKey.value.trim()) {
    localAttributes.value[newAttributeKey.value] = newAttributeValue.value;
    emit("update-attributes", { ...localAttributes.value });
    newAttributeKey.value = "";
    newAttributeValue.value = "";
    showAddAttribute.value = false;
  }
};

const cancelAddAttribute = () => {
  showAddAttribute.value = false;
  newAttributeKey.value = "";
  newAttributeValue.value = "";
};
</script>

<style scoped>
.entity-inspector {
  background-color: #f8f9fa;
  border-left: 1px solid #dee2e6;
  min-height: 100%;
}

.inspector-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.inspector-section:last-child {
  border-bottom: none;
}

.form-control-static {
  display: block;
  padding: 0.375rem 0.75rem;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  word-break: break-all;
}

.attributes-form {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.attributes-form .input-group {
  margin-bottom: 0.5rem;
}

.attributes-form .input-group:last-child {
  margin-bottom: 0;
}
</style>
