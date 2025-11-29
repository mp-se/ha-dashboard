<template>
  <div class="col-md-4">
    <div :class="['card', 'card-control', cardBorderClass, 'h-100', 'rounded-4', 'shadow-lg']">
      <div class="card-body">
        <div class="text-center mb-3">
          <h6 class="card-title mb-3">{{ name }}</h6>
        </div>

        <div class="d-flex justify-content-center mb-3">
          <button
            class="btn btn-outline-primary"
            :disabled="isUnavailable"
            title="Press Button"
            @click="pressButton"
          >
            <i :class="buttonIcon + ' me-2'"></i>
            Press
          </button>
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
import { useServiceCall } from '@/composables/useServiceCall';

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
const { callService } = useServiceCall();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  return 'border-primary';
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

const buttonIcon = computed(() => {
  return 'mdi mdi-gesture-tap-button';
});

const pressButton = async () => {
  if (!resolvedEntity.value) return;
  const domain = resolvedEntity.value.entity_id.split('.')[0];
  await callService(domain, 'press', {
    entity_id: resolvedEntity.value.entity_id,
  });
};
</script>

<style scoped>
.button-icon {
  font-size: 1.5rem;
  color: var(--bs-primary);
}
</style>
