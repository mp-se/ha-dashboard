<template>
  <div class="col-md-4">
    <div :class="['card', 'card-control', cardBorderClass, 'h-100', 'rounded-4', 'shadow-lg']">
      <div class="card-body">
        <div class="text-center mb-3">
          <h6 class="card-title mb-2">{{ name }}</h6>
          <div class="d-flex align-items-center justify-content-center mb-2">
            <i :class="selectIcon" class="select-icon me-2"></i>
            <div class="select-state text-capitalize fw-bold">{{ state }}</div>
          </div>
        </div>

        <div v-if="options && options.length > 0" class="select-control mb-3">
          <select
            class="form-select"
            :value="state"
            :disabled="isUnavailable"
            @change="setSelectValue($event.target.value)"
          >
            <option v-for="option in options" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <div v-if="deviceName" class="mt-3 pt-2 border-top">
          <small class="text-muted">{{ deviceName }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';
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
  attributes: {
    type: Array,
    default: () => [],
  },
});

const store = useHaStore();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  return 'border-info';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

const deviceName = computed(() => {
  if (!resolvedEntity.value) return null;
  const deviceId = resolvedEntity.value.attributes?.device_id;
  if (deviceId) {
    const device = store.devices.find((d) => d.id === deviceId);
    return device?.name || device?.name_by_user || `Device ${deviceId}`;
  }
  return null;
});

const selectIcon = computed(() => {
  return 'mdi mdi-format-list-bulleted';
});

// Select-specific attributes
const options = computed(() => resolvedEntity.value?.attributes?.options || []);

const setSelectValue = (value) => {
  if (!resolvedEntity.value) return;
  const domain = resolvedEntity.value.entity_id.split('.')[0];
  store.callService(domain, 'select_option', {
    entity_id: resolvedEntity.value.entity_id,
    option: value,
  });
};
</script>

<style scoped>
.select-state {
  font-size: 1.1rem;
  color: var(--bs-primary);
}

.select-icon {
  font-size: 1.5rem;
  color: var(--bs-info);
}

.select-control {
  max-width: 250px;
  margin: 0 auto;
}
</style>
