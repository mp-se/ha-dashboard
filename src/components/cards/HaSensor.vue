<template>
  <div v-if="entityList.length === 1 && !resolvedEntity">
    <div class="card card-display h-100 rounded-4 shadow-lg border-warning">
      <div class="card-body text-center text-warning">
        <i class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div>
          Entity "{{ typeof entity === "string" ? entity : entity?.entity_id }}"
          not found
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="entityList.length === 1">
    <div
      :class="[
        'card',
        'card-display',
        cardBorderClass,
        'h-100',
        'rounded-4',
        'shadow-lg',
      ]"
    >
      <div
        :class="[
          'card-body',
          'd-flex',
          requestedAttributes.length === 0
            ? 'align-items-center'
            : 'align-items-start',
          'gap-3',
        ]"
      >
        <IconCircle :entity-id="entityId" :resolved-entity="resolvedEntity" />
        <div class="flex-grow-1">
          <div class="text-start">
            <h6 class="ha-entity-name">{{ name }}</h6>
            <!-- Display requested attributes if provided -->
            <EntityAttributeList :attributes="requestedAttributes" />
          </div>
        </div>
        <div class="flex-shrink-0">
          <div class="ha-entity-value fw-bold text-end">
            {{ formattedValue
            }}<span class="ha-entity-unit ms-1">{{ unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <div
      :class="[
        'card',
        'card-display',
        'h-100',
        'rounded-4',
        'shadow-lg',
        'border-info',
      ]"
    >
      <div class="card-body">
        <div
          v-for="ent in entityList"
          :key="typeof ent === 'string' ? ent : ent.entity_id"
          class="mb-2"
        >
          <div class="d-flex align-items-center gap-2">
            <IconCircle
              size="small"
              :entity-id="typeof ent === 'string' ? ent : ent.entity_id"
              :resolved-entity="getResolved(ent)"
            />
            <div class="flex-grow-1 text-start">
              <h6 class="ha-entity-name">{{ getName(ent) }}</h6>
            </div>
            <div class="text-end flex-shrink-0">
              <div class="ha-sensor-value fw-bold">
                {{ getFormattedValue(ent)
                }}<span class="ha-sensor-unit ms-1">{{ getUnit(ent) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useHaStore } from "@/stores/haStore";
import { useEntityResolver } from "@/composables/useEntityResolver";
import { useAttributeResolver } from "@/composables/useAttributeResolver";
import { createLogger } from "@/utils/logger";

const props = defineProps({
  entity: {
    type: [Object, String, Array],
    required: true,
    validator: (value) => {
      if (Array.isArray(value)) {
        return value.every((ent) => {
          if (typeof ent === "string") {
            return /^[\w]+\.[\w_-]+$/.test(ent);
          } else if (typeof ent === "object") {
            return ent && ent.entity_id && ent.state && ent.attributes;
          }
          return false;
        });
      } else if (typeof value === "string") {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === "object") {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  attributes: {
    type: Array,
    default: () => [],
  },
});

const store = useHaStore();
const logger = createLogger("HaSensor");

// Entity list: if entity is array, use it, else [entity]
const entityList = computed(() => {
  if (Array.isArray(props.entity)) {
    return props.entity;
  }
  return [props.entity];
});

// Use composable for single entity resolution
const { resolvedEntity } = useEntityResolver(
  Array.isArray(props.entity) ? props.entity[0] : props.entity,
);

const state = computed(() => resolvedEntity.value?.state ?? "unknown");
const unit = computed(
  () => resolvedEntity.value?.attributes?.unit_of_measurement || "",
);

// Get entity ID for icon circle color calculation
const entityId = computed(() => {
  const firstEntity = Array.isArray(props.entity)
    ? props.entity[0]
    : props.entity;
  if (typeof firstEntity === "string") {
    return firstEntity;
  }
  return resolvedEntity.value?.entity_id || "";
});

// Format numbers if possible, otherwise show raw state
const formattedValue = computed(() => {
  const s = state.value;
  if (s === "unknown" || s === "unavailable") return s;
  // try parse as number
  const n = Number(s);
  if (!Number.isNaN(n)) {
    // If unit indicates temperature or percent, show one decimal, else show up to 2 decimals
    if (
      (unit.value && /°|°C|°F|%|percent/i.test(unit.value)) ||
      Math.abs(n) < 100
    ) {
      return n.toFixed(1);
    }
    return n.toFixed(0);
  }
  return s;
});

const isUnavailable = computed(() =>
  ["unavailable", "unknown"].includes(state.value),
);

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return "border-warning";
  return "border-info";
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name ||
    resolvedEntity.value?.entity_id ||
    "Unknown",
);

// Use attribute resolver composable to get formatted attributes
const { requestedAttributes } = useAttributeResolver(
  Array.isArray(props.entity) ? props.entity[0] : props.entity,
  props.attributes,
);

// Return an array of [key, value] for the attributes to show
// (Removed - no longer showing attributes, just icon, name, and value)

const getResolved = (ent) => {
  if (typeof ent === "string") {
    return store.entityMap.get(ent);
  } else {
    return ent;
  }
};

const getName = (ent) => {
  try {
    const res = getResolved(ent);
    return res?.attributes?.friendly_name || res?.entity_id || "Unknown";
  } catch (error) {
    logger.warn("Error getting name for entity:", ent, error);
    return "Unknown";
  }
};

const getFormattedValue = (ent) => {
  try {
    const res = getResolved(ent);
    const s = res?.state ?? "unknown";
    const u = res?.attributes?.unit_of_measurement || "";
    if (s === "unknown" || s === "unavailable") return s;
    const n = Number(s);
    if (!Number.isNaN(n)) {
      if ((u && /°|°C|°F|%|percent/i.test(u)) || Math.abs(n) < 100) {
        return n.toFixed(1);
      }
      return n.toFixed(0);
    }
    return s;
  } catch (error) {
    logger.warn("Error formatting value for entity:", ent, error);
    return "unknown";
  }
};

const getUnit = (ent) => {
  try {
    const res = getResolved(ent);
    return res?.attributes?.unit_of_measurement || "";
  } catch (error) {
    logger.warn("Error getting unit for entity:", ent, error);
    return "";
  }
};
</script>
