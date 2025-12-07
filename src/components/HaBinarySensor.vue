<template>
  <div class="col-md-4">
    <div
      :class="[
        'card',
        'card-display',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : cardBorderClass,
      ]"
    >
      <div
        :class="[
          'card-body',
          resolvedEntity ? 'd-flex align-items-center' : 'text-center text-warning',
        ]"
      >
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>

        <div v-if="resolvedEntity" class="text-start flex-grow-1">
          <h6 class="ha-entity-name mb-0">{{ name }}</h6>
        </div>
        <div v-if="resolvedEntity" class="d-flex align-items-center ms-2">
          <div
            class="binary-state-indicator"
            :class="{
              'state-on': state.toLowerCase() === 'on' || state.toLowerCase() === 'true',
              'state-off': state.toLowerCase() === 'off' || state.toLowerCase() === 'false',
              'state-unavailable': isUnavailable,
            }"
            :title="displayStateLabel"
          >
            <i :class="stateIcon" class="state-icon"></i>
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

const state = computed(() => resolvedEntity.value?.state || 'unknown');

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const displayStateLabel = computed(() => {
  if (isUnavailable.value) return 'Unavailable';
  // Handle both on/off and True/False states
  const lowerState = state.value.toLowerCase();
  return lowerState === 'on' || lowerState === 'true' ? 'Active' : 'Inactive';
});

const stateIcon = computed(() => {
  if (isUnavailable.value) return 'mdi mdi-help-circle-outline';
  // Handle both on/off and True/False states
  const lowerState = state.value.toLowerCase();
  return lowerState === 'on' || lowerState === 'true'
    ? 'mdi mdi-check-circle'
    : 'mdi mdi-circle-outline';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

// card border color
const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  const lowerState = state.value.toLowerCase();
  return lowerState === 'on' || lowerState === 'true' ? 'border-success' : 'border-secondary';
});
</script>

<style scoped>
.badge {
  font-size: 0.9rem;
  padding: 0.45em 0.6em;
}

.binary-state-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: default;
}

.binary-state-indicator.state-on {
  color: #28a745;
}

.binary-state-indicator.state-off {
  color: #6c757d;
}

.binary-state-indicator.state-unavailable {
  color: #ffc107;
}

.state-icon {
  font-size: 2rem;
  display: block;
}

.state-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
