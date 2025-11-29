<template>
  <div v-if="shouldShowWarning" class="col-lg-4 col-md-6">
    <div
      :class="[
        'h-100',
        'rounded-4',
        'shadow-lg',
        'p-3',
        'border',
        'border-warning',
        'border-3',
        'card-status',
      ]"
    >
      <div class="card-body d-flex align-items-center">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-1">
            <i class="mdi mdi-alert-outline text-warning" style="margin-right: 0.5rem"></i>
            Warning
          </h6>
          <div class="text-muted small">{{ message }}</div>
        </div>
        <div class="d-flex align-items-center">
          <span class="badge bg-warning text-dark">Warning</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  attribute: {
    type: String,
    default: 'state', // Use 'state' by default, or specify attribute name
  },
  operator: {
    type: String,
    required: true,
    validator: (value) =>
      ['=', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains', 'in', 'not_in'].includes(value),
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

const store = useHaStore();

// Smart entity resolution
const resolvedEntity = computed(() => {
  if (typeof props.entity === 'string') {
    const found = store.sensors.find((s) => s.entity_id === props.entity);
    if (!found) {
      console.warn(`Entity "${props.entity}" not found`);
      return null;
    }
    return found;
  } else {
    return props.entity;
  }
});

// Get the current value to check
const currentValue = computed(() => {
  if (!resolvedEntity.value) return null;

  if (props.attribute === 'state') {
    return resolvedEntity.value.state;
  } else {
    return resolvedEntity.value.attributes[props.attribute] || null;
  }
});

// Evaluate the condition
const shouldShowWarning = computed(() => {
  if (!resolvedEntity.value || currentValue.value === null) return false;

  const current = currentValue.value;
  const expected = props.value;

  switch (props.operator) {
    case '=':
      return current == expected; // Loose equality for type coercion
    case '!=':
      return current != expected;
    case '>':
      return Number(current) > Number(expected);
    case '<':
      return Number(current) < Number(expected);
    case '>=':
      return Number(current) >= Number(expected);
    case '<=':
      return Number(current) <= Number(expected);
    case 'contains':
      return String(current).includes(String(expected));
    case 'not_contains':
      return !String(current).includes(String(expected));
    case 'in':
      if (Array.isArray(expected)) {
        return expected.includes(current);
      }
      return String(expected).includes(String(current));
    case 'not_in':
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
/* Custom styles if needed */
</style>
