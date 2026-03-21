<template>
  <div class="entity-inspector p-3">
    <h6 class="mb-3">Entity Inspector</h6>

    <div
      v-if="entity.entity || entity.getter || entity.type === 'HaImage'"
      class="inspector-section mb-3"
    >
      <label v-if="entity.entity || entity.getter" class="form-label small mb-1"
        ><strong>Entity ID</strong></label
      >
      <label v-else class="form-label small mb-1"
        ><strong>Static Component</strong></label
      >

      <!-- Display array entities with EntityListEditor -->
      <div
        v-if="isArrayEntity"
        class="form-control-static text-monospace small"
      >
        <EntityListEditor
          :model-value="entityArray"
          :lock-first-entity="shouldLockFirstEntity"
          label="Entities"
          :help="entityListHelp"
          @update:model-value="updateEntityArray"
          @all-entities-removed="handleAllEntitiesRemoved"
        />
      </div>

      <!-- Display single entity -->
      <div
        v-else-if="entity.entity || entity.getter"
        class="form-control-static text-monospace small"
      >
        {{ entity.entity || entity.getter }}
      </div>

      <!-- Display static component name -->
      <div v-else class="form-control-static text-monospace small">
        {{ entity.type }}
      </div>
    </div>

    <!-- Component Type Selector -->
    <div v-if="currentType !== 'HaImage'" class="inspector-section mb-3">
      <label for="componentType" class="form-label small mb-1">
        <strong>Component Type</strong>
      </label>
      <select
        id="componentType"
        :value="entity.type || recommendedType"
        class="form-select form-select-sm"
        @change="handleComponentTypeChange"
      >
        <optgroup label="Recommended">
          <option :value="recommendedType">
            {{ recommendedType }} (Default)
          </option>
        </optgroup>
        <optgroup label="Available Components">
          <option
            v-for="type in availableComponentTypes"
            :key="type"
            :value="type"
          >
            {{ type }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Card-Specific Properties -->
    <div v-if="hasCardProperties" class="inspector-section mb-3">
      <label v-if="currentType !== 'HaImage'" class="form-label small mb-2"><strong>Properties</strong></label>
      <div class="properties-form">
        <PropertyEditorFactory
          v-for="(propertyDef, propName) in cardProperties"
          :key="propName"
          :property="{ ...propertyDef, label: propertyDef.label }"
          :model-value="localProperties[propName]"
          :error="propertyErrors[propName]"
          @update:model-value="updateProperty(propName, $event)"
        />
      </div>
    </div>

    <!-- Attributes Editor -->
    <div
      v-if="
        entityFromStore &&
        Object.keys(availableAttributes).length > 0 &&
        supportsAttributes(currentType)
      "
      class="inspector-section mb-3"
    >
      <label class="form-label small mb-2"><strong>Attributes</strong></label>
      <div class="attributes-form">
        <!-- Show message if no entity is selected -->
        <div
          v-if="!props.entity?.entity"
          class="alert alert-info alert-sm mb-2"
        >
          <small>Select an entity to see available attributes</small>
        </div>

        <!-- List of configured attributes -->
        <div
          v-for="(value, key, idx) in localAttributes"
          :key="`attr-${key}-${idx}`"
          class="mb-2"
        >
          <div class="attribute-row">
            <div class="attribute-key">
              <small class="text-monospace">{{ key }}</small>
              <span
                class="badge bg-secondary ms-1"
                :title="`Value type: ${getAttributeType(value)}`"
              >
                {{ getAttributeTypeShort(value) }}
              </span>
            </div>
            <div class="input-group input-group-sm">
              <input
                type="text"
                class="form-control form-control-sm attribute-input"
                placeholder="Value"
                :value="formatAttributeValue(value)"
                @input="updateAttribute(key, $event.target.value)"
              />
              <button
                type="button"
                class="btn btn-outline-danger btn-sm"
                title="Remove attribute"
                @click="removeAttribute(key)"
              >
                <i class="mdi mdi-trash-can"></i>
              </button>
            </div>
            <small v-if="attributeErrors[key]" class="text-danger d-block mt-1">
              {{ attributeErrors[key] }}
            </small>
          </div>
        </div>

        <!-- Dropdown to add attributes from available list -->
        <div v-if="unusedAttributeNames.length > 0" class="mt-2">
          <label class="form-label small mb-1"
            ><strong>Add Attribute</strong></label
          >
          <select
            class="form-select form-select-sm"
            @change="
              addAttributeFromDropdown($event.target.value);
              $event.target.value = '';
            "
          >
            <option value="">-- Select an attribute --</option>
            <option
              v-for="attrName in unusedAttributeNames"
              :key="attrName"
              :value="attrName"
            >
              {{ attrName }}
            </option>
          </select>
        </div>

        <!-- Message when all attributes are added -->
        <div
          v-else-if="Object.keys(availableAttributes).length > 0"
          class="alert alert-success alert-sm mt-2 mb-0"
        >
          <small
            ><i class="mdi mdi-check-circle me-1"></i>All available attributes
            added</small
          >
        </div>

        <!-- Message when no attributes available -->
        <div
          v-else-if="props.entity?.entity && !entityFromStore"
          class="alert alert-warning alert-sm mt-2 mb-0"
        >
          <small
            ><i class="mdi mdi-alert-circle me-1"></i>Entity not found in Home
            Assistant</small
          >
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="inspector-section">
      <div class="btn-group w-100" role="group">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          title="Deselect this entity"
          @click="$emit('deselect')"
        >
          <i class="mdi mdi-close me-1"></i>Deselect
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm"
          title="Remove this entity from the view"
          @click="$emit('remove-entity')"
        >
          <i class="mdi mdi-trash-can me-1"></i>Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useHaStore } from "../../stores/haStore";
import { getDefaultComponentType } from "../../composables/useDefaultComponentType";
import {
  getCardProperties,
  validateProperty,
  supportsAttributes,
  supportsMultipleEntities,
} from "../../utils/cardPropertyMetadata";
import PropertyEditorFactory from "./PropertyEditors/PropertyEditorFactory.vue";
import EntityListEditor from "./PropertyEditors/EntityListEditor.vue";

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

const emit = defineEmits([
  "update-type",
  "update-attributes",
  "update-properties",
  "remove-entity",
  "deselect",
]);

const store = useHaStore();
const localAttributes = ref({});
const localProperties = ref({});
const attributeErrors = ref({});
const propertyErrors = ref({});

// Sync local attributes with prop
watch(
  () => props.entity?.attributes,
  (newAttributes) => {
    localAttributes.value = { ...newAttributes };
    attributeErrors.value = {};
  },
  { immediate: true, deep: true },
);

// Sync local properties with prop
watch(
  () => props.entity,
  (newEntity) => {
    if (!newEntity) return;
    // Calculate the type (use explicit type or auto-detect)
    let entityType = newEntity.type;
    if (!entityType) {
      // Auto-detect type based on entity ID
      if (newEntity.getter) {
        entityType = "HaEntityList";
      } else {
        entityType = getDefaultComponentType(newEntity.entity, newEntity.getter);
      }
    }
    // Extract all card-specific properties from entity
    const propsDef = getCardProperties(entityType || "");
    const newProperties = {};
    for (const propName of Object.keys(propsDef)) {
      if (propName in newEntity) {
        newProperties[propName] = newEntity[propName];
      } else if (propsDef[propName].default !== undefined) {
        // Use default value if prop is missing
        newProperties[propName] = propsDef[propName].default;
      }
    }
    localProperties.value = newProperties;
    propertyErrors.value = {};
  },
  { immediate: true, deep: true },
);

/** Get available attributes from the entity state in the store */
const entityFromStore = computed(() => {
  if (!props.entity?.entity) return null;
  return store.entityMap?.get(props.entity.entity);
});

/** Get all available attributes from the entity state */
const availableAttributes = computed(() => {
  if (!entityFromStore.value?.attributes) return {};
  return entityFromStore.value.attributes;
});

/** Get attribute names that are available but not yet in the config */
const unusedAttributeNames = computed(() => {
  if (!availableAttributes.value) return [];
  return Object.keys(availableAttributes.value)
    .filter((key) => !(key in localAttributes.value))
    .sort();
});

const recommendedType = computed(() => {
  if (props.entity?.getter) {
    return "HaEntityList";
  }
  return getDefaultComponentType(props.entity?.entity, props.entity?.getter);
});

/**
 * Current type: use explicit type if defined, otherwise use recommended (auto-detected) type
 * This ensures the inspector shows correct options even for cards without explicit type in JSON
 */
const currentType = computed(() => {
  return props.entity?.type || recommendedType.value;
});

/** Check if this card type should lock the first entity (e.g., HaRoom) */
const shouldLockFirstEntity = computed(() => {
  // Only HaRoom requires locking the first entity
  return currentType.value === "HaRoom";
});

/** Dynamic help text based on card type */
const entityListHelp = computed(() => {
  if (currentType.value === "HaRoom") {
    return "Drag to reorder (except the first one). Drop entities from the left panel to add.";
  }
  return "Drag to reorder. Drop entities from the left panel to add. If all are removed the component will be deleted.";
});
const isArrayEntity = computed(() => {
  // Show EntityListEditor if:
  // 1. Entity is already an array, OR
  // 2. Card type supports multiple entities (even if currently single)
  const alreadyArray = Array.isArray(props.entity?.entity);
  const typeSupportsMultiple = supportsMultipleEntities(currentType.value);
  return alreadyArray || typeSupportsMultiple;
});

/** Get entity array for EntityListEditor */
const entityArray = computed({
  get: () => {
    if (Array.isArray(props.entity?.entity)) {
      return props.entity.entity;
    }
    // If single entity and card supports multiple entities, wrap in array
    if (
      props.entity?.entity &&
      typeof props.entity.entity === "string" &&
      supportsMultipleEntities(currentType.value)
    ) {
      return [props.entity.entity];
    }
    return [];
  },
  set: () => {
    // Handled by updateEntityArray method
  },
});

/** Update entity array and emit changes */
const updateEntityArray = (newArray) => {
  if (!props.entity) return;
  // Emit update through properties since entity structure might change
  emit("update-properties", { entity: newArray });
};
/** Handle when all entities are removed from a card */
const handleAllEntitiesRemoved = () => {
  // Only auto-remove for HaGlance, not for HaRoom
  if (props.entity?.type === "HaGlance") {
    emit("remove-entity");
  }
};
// List of available component types (can be imported from a constant)
const availableComponentTypes = computed(() => {
  return [
    "HaAlarmPanel",
    "HaBeerTap",
    "HaBinarySensor",
    "HaButton",
    "HaChip",
    "HaEnergy",
    "HaError",
    "HaEntityList",
    "HaGauge",
    "HaGlance",
    "HaHeader",
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

/** Get properties for the current component type */
const cardProperties = computed(() => {
  const type = currentType.value;
  if (!type) return {};
  return getCardProperties(type);
});

/** Check if the current card has any special properties */
const hasCardProperties = computed(() => {
  return Object.keys(cardProperties.value).length > 0;
});

/**
 * Format attribute value for display in input field
 */
const formatAttributeValue = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  // For objects/arrays, return JSON string
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/**
 * Get the type of an attribute value
 */
const getAttributeType = (value) => {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "string";
};

/**
 * Get short type indicator for badge
 */
const getAttributeTypeShort = (value) => {
  const type = getAttributeType(value);
  const typeMap = {
    string: "str",
    number: "num",
    boolean: "bool",
    object: "obj",
    array: "arr",
    null: "null",
  };
  return typeMap[type] || type;
};

const handleComponentTypeChange = (event) => {
  const value = event.target.value;
  // If the selected value is the recommended type, emit undefined to use the default
  emit("update-type", value === recommendedType.value ? undefined : value);
};

const updateProperty = (propName, value) => {
  // Validate the property
  const validation = validateProperty(
    props.entity?.type || "",
    propName,
    value,
  );
  if (!validation.valid) {
    propertyErrors.value[propName] = validation.error;
    return;
  }

  // Clear any previous error
  propertyErrors.value[propName] = "";

  // Update local property
  localProperties.value[propName] = value;

  // Emit all properties
  emit("update-properties", { ...localProperties.value });
};

const updateAttribute = (key, valueStr) => {
  const value = parseAttributeValue(valueStr);
  localAttributes.value[key] = value;
  emit("update-attributes", { ...localAttributes.value });
};

const removeAttribute = (key) => {
  delete localAttributes.value[key];
  delete attributeErrors.value[key];
  emit("update-attributes", { ...localAttributes.value });
};

/** Add attribute from dropdown - use value from store */
const addAttributeFromDropdown = (attributeName) => {
  const value = availableAttributes.value[attributeName];
  localAttributes.value[attributeName] = value;
  emit("update-attributes", { ...localAttributes.value });
};

/**
 * Parse attribute value from string input
 * Handles: strings, numbers, booleans, JSON objects/arrays
 */
const parseAttributeValue = (valueStr) => {
  if (!valueStr || typeof valueStr !== "string") return valueStr;

  const trimmed = valueStr.trim();

  // Boolean values
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;

  // Numeric values
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // JSON values
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed; // Return as string if JSON parsing fails
    }
  }

  // Default to string
  return trimmed;
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attribute-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.attribute-key {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.attribute-key .badge {
  font-size: 0.65rem;
  padding: 0.25rem 0.4rem;
  white-space: nowrap;
}

.attribute-input {
  font-family: "Courier New", monospace;
  font-size: 0.875rem;
}

.text-monospace {
  font-family: "Courier New", monospace;
  font-size: 0.875rem;
}

/* Hide spinner buttons on number inputs */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

.alert-sm {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0;
  font-size: 0.875rem;
}

.alert-sm small {
  font-size: 0.825rem;
}
</style>
