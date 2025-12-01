<template>
  <div class="col-lg-4 col-md-6">
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
          !resolvedEntity ? 'text-center text-warning' : 'd-flex align-items-center',
        ]"
      >
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>

        <div v-else class="text-start flex-grow-1">
          <h6 class="card-title mb-0">{{ name }}</h6>
          <div class="mt-1 small text-muted">
            <div><strong>Location:</strong> {{ location }}</div>
            <div v-if="lastSeen"><strong>Last Seen:</strong> {{ formattedLastSeen }}</div>
          </div>
        </div>
        <div class="d-flex align-items-center ms-2">
          <i :class="iconClass" style="font-size: 2rem"></i>
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
        return /^person\.[\w_]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
});

const { resolvedEntity } = useEntityResolver(computed(() => props.entity));

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');

const location = computed(() => {
  const loc = state.value;
  if (loc === 'home') return 'Home';
  if (loc === 'not_home') return 'Away';
  return loc.charAt(0).toUpperCase() + loc.slice(1);
});

const lastSeen = computed(() => resolvedEntity.value?.attributes?.last_seen);

const formattedLastSeen = computed(() => {
  if (!lastSeen.value) return null;
  const date = new Date(lastSeen.value);
  return date.toLocaleString();
});

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  if (state.value === 'home') return 'border-success';
  return 'border-info';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

const iconClass = computed(() => {
  if (!resolvedEntity.value) return 'mdi mdi-account-question';
  const icon = resolvedEntity.value.attributes?.icon;
  if (icon && icon.startsWith('mdi:')) {
    return `mdi mdi-${icon.split(':')[1]}`;
  }
  // Default person icon
  return 'mdi mdi-account';
});
</script>

<style scoped>
/* Person card specific styles if needed */
</style>
