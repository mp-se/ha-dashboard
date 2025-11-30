<template>
  <div class="col-6 col-sm-4 col-md-2">
    <div
      :class="[
        'card',
        'card-display',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : 'border-info',
      ]"
    >
      <div
        :class="[
          'card-body',
          !resolvedEntity
            ? 'text-center text-warning p-2'
            : 'd-flex align-items-center justify-content-center p-2',
        ]"
      >
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-1"></i>
        <div v-if="!resolvedEntity" class="small">Entity not found</div>

        <div v-else class="d-flex align-items-center">
          <i v-if="iconClass" :class="iconClass" style="font-size: 1.875rem"></i>
          <div class="ms-2">
            <div class="fw-bold small">
              {{ formattedValue }} <small v-if="unit" class="text-muted">{{ unit }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useEntityResolver } from '@/composables/useEntityResolver';

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
});

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');
const unit = computed(() => resolvedEntity.value?.attributes?.unit_of_measurement || '');

// Format numbers if possible, otherwise show raw state
const formattedValue = computed(() => {
  const s = state.value;
  if (s === 'unknown' || s === 'unavailable') return s;
  // try parse as number
  const n = Number(s);
  if (!Number.isNaN(n)) {
    // If unit indicates temperature or percent, show one decimal, else show up to 2 decimals
    if ((unit.value && /°|°C|°F|%|percent/i.test(unit.value)) || Math.abs(n) < 100) {
      return n.toFixed(1);
    }
    return n.toFixed(0);
  }
  return s;
});

const iconClass = computed(() => {
  if (!resolvedEntity.value) return null;
  const icon = resolvedEntity.value.attributes?.icon;
  if (icon && icon.startsWith('mdi:')) {
    return `mdi mdi-${icon.split(':')[1]}`;
  }
  return null;
});
</script>

<style scoped>
.badge {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}
</style>
