<template>
  <div v-if="shouldShowError" class="col-lg-4 col-md-6">
    <div
      :class="[
        'h-100',
        'rounded-4',
        'shadow-lg',
        'p-3',
        'border',
        'border-danger',
        'border-3',
        'card-status',
        'error',
      ]"
    >
      <div class="card-body d-flex align-items-center">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-1">Error</h6>
          <div class="text-muted small">{{ message }}</div>
        </div>
        <div class="d-flex align-items-center">
          <div class="icon-circle-wrapper">
            <svg width="40" height="40" viewBox="0 0 40 40" class="icon-circle">
              <circle cx="20" cy="20" r="18" fill="#DC3545" />
            </svg>
            <i class="mdi mdi-exclamation icon-overlay"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useEntityResolver } from "@/composables/useEntityResolver";

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === "string") {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === "object") {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  attribute: {
    type: String,
    default: "state", // Use 'state' by default, or specify attribute name
  },
  operator: {
    type: String,
    required: true,
    validator: (value) =>
      [
        "=",
        "!=",
        ">",
        "<",
        ">=",
        "<=",
        "contains",
        "not_contains",
        "in",
        "not_in",
      ].includes(value),
  },
  value: {
    type: [String, Number, Boolean, Array],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const { resolvedEntity } = useEntityResolver(computed(() => props.entity));

// Get the current value to check
const currentValue = computed(() => {
  if (!resolvedEntity.value) return null;

  if (props.attribute === "state") {
    return resolvedEntity.value.state;
  } else {
    return resolvedEntity.value.attributes[props.attribute] || null;
  }
});

// Evaluate the condition
const shouldShowError = computed(() => {
  if (!resolvedEntity.value || currentValue.value === null) return false;

  const current = currentValue.value;
  const expected = props.value;

  switch (props.operator) {
    case "=":
      return current == expected; // Loose equality for type coercion
    case "!=":
      return current != expected;
    case ">":
      return Number(current) > Number(expected);
    case "<":
      return Number(current) < Number(expected);
    case ">=":
      return Number(current) >= Number(expected);
    case "<=":
      return Number(current) <= Number(expected);
    case "contains":
      return String(current).includes(String(expected));
    case "not_contains":
      return !String(current).includes(String(expected));
    case "in":
      if (Array.isArray(expected)) {
        return expected.includes(current);
      }
      return String(expected).includes(String(current));
    case "not_in":
      if (Array.isArray(expected)) {
        return !expected.includes(current);
      }
      return !String(expected).includes(String(current));
    default:
      return false;
  }
});
</script>

<style scoped>
.icon-circle-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.icon-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.icon-overlay {
  position: relative;
  z-index: 1;
  font-size: 1.5rem;
  color: white;
}
</style>
