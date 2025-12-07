<template>
  <div class="col-lg-4 col-md-6">
    <div
      :class="[
        'card',
        'card-control',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : cardBorderClass,
        isOn && !isDisabled ? 'card-active' : '',
      ]"
    >
      <div
        :class="['card-body', !resolvedEntity ? 'text-center text-warning' : 'd-flex flex-column']"
      >
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>

        <template v-else>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="text-start flex-grow-1">
              <h6 class="ha-entity-name mb-0">
                {{ resolvedEntity.attributes?.friendly_name || resolvedEntity.entity_id }}
              </h6>
            </div>
            <button
              class="ha-control-button"
              :class="{ 'control-button-on': isOn && !isDisabled }"
              :disabled="isDisabled || isLoading"
              :title="isOn ? 'Turn off' : 'Turn on'"
              @click="isOn = !isOn"
            >
              <div class="ha-control-circle-wrapper">
                <svg width="50" height="50" viewBox="0 0 50 50" class="ha-control-circle">
                  <circle cx="25" cy="25" r="22" :fill="controlCircleColor" />
                </svg>
                <i :class="switchIconClass" class="ha-control-icon" :style="{ color: iconColor }"></i>
              </div>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useEntityResolver } from '@/composables/useEntityResolver';
import { useServiceCall } from '@/composables/useServiceCall';
import { useNormalizeIcon } from '@/composables/useNormalizeIcon';

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
  mock: { type: Boolean, required: false, default: false },
});
const emit = defineEmits(['mockToggle']);

const { callService, isLoading } = useServiceCall();
const normalizeIcon = useNormalizeIcon();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const isDisabled = computed(() => {
  if (!resolvedEntity.value) return true;
  const state = props.mock ? localState.value : resolvedEntity.value.state;
  return ['unavailable', 'unknown'].includes(state);
});

// Local state used for mocking so we can toggle without calling HA
const localState = ref(resolvedEntity.value?.state || 'unknown');

const isOn = computed({
  get() {
    if (!resolvedEntity.value) return false;
    return (props.mock ? localState.value : resolvedEntity.value.state) === 'on';
  },
  async set(value) {
    if (!resolvedEntity.value || isLoading.value) return;

    if (props.mock) {
      localState.value = value ? 'on' : 'off';
      emit('mockToggle', localState.value);
    } else {
      const domain = resolvedEntity.value.entity_id.split('.')[0];
      const service = value ? 'turn_on' : 'turn_off';
      await callService(domain, service, {
        entity_id: resolvedEntity.value.entity_id,
      });
    }
  },
});

// Control circle color based on switch state
const controlCircleColor = computed(() => {
  if (isDisabled.value) return '#6c757d'; // Gray for unavailable
  if (!isOn.value) return '#e9ecef'; // Light gray for off
  return '#0078d4'; // Blue for on
});

// Icon color - white when on, dark gray when off
const iconColor = computed(() => {
  if (!isOn.value) return '#333'; // Dark gray icon when off
  return 'white'; // White icon when on
});

// Get switch icon - from entity attributes or domain-specific defaults
const switchIconClass = computed(() => {
  if (!resolvedEntity.value) return 'mdi mdi-help-circle';

  const icon = resolvedEntity.value.attributes?.icon;
  if (icon) {
    return normalizeIcon(icon);
  }

  // Default icons by domain
  const domain = resolvedEntity.value.entity_id.split('.')[0];
  
  const domainIcons = {
    light: 'mdi mdi-lightbulb',
    switch: 'mdi mdi-power',
    fan: 'mdi mdi-fan',
    binary_sensor: 'mdi mdi-eye',
    sensor: 'mdi mdi-gauge',
  };

  return domainIcons[domain] || 'mdi mdi-power';
});

// Compute a bootstrap border class depending on state
const cardBorderClass = computed(() => {
  if (!resolvedEntity.value) return 'border-warning';
  const state = props.mock ? localState.value : resolvedEntity.value.state;
  if (['unavailable', 'unknown'].includes(state)) return 'border-warning';
  return 'border-info';
});
</script>
