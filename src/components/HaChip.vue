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
          <div class="icon-circle-wrapper">
            <svg width="40" height="40" viewBox="0 0 40 40" class="icon-circle">
              <circle cx="20" cy="20" r="18" :fill="iconCircleColor" />
            </svg>
            <i v-if="iconClass" :class="iconClass" class="icon-overlay"></i>
          </div>
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
import { useHaStore } from '@/stores/haStore';
import { useEntityResolver } from '@/composables/useEntityResolver';
import { useIconCircleColor } from '@/composables/useIconCircleColor';

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

const store = useHaStore();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(computed(() => props.entity));

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');
const unit = computed(() => resolvedEntity.value?.attributes?.unit_of_measurement || '');

// Get entity ID for icon circle color calculation
const entityId = computed(() => {
  if (typeof props.entity === 'string') {
    return props.entity;
  }
  return resolvedEntity.value?.entity_id || '';
});

// Calculate icon circle color
const iconCircleColor = computed(() => {
  return useIconCircleColor(resolvedEntity.value, entityId.value);
});

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

const deviceName = computed(() => {
  if (!resolvedEntity.value) return null;
  const deviceId = resolvedEntity.value.attributes?.device_id;
  if (deviceId) {
    const device = store.devices.find((d) => d.id === deviceId);
    return device?.name || device?.name_by_user || `Device ${deviceId}`;
  }
  return null;
});
</script>

<style scoped>
.badge {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}

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
