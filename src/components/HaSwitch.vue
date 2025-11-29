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
        { 'card-active': isOn && !isDisabled },
      ]"
    >
      <div
        :class="[
          'card-body',
          !resolvedEntity
            ? 'text-center text-warning'
            : 'd-flex align-items-center justify-content-between',
        ]"
      >
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>

        <template v-else>
          <div class="text-start">
            <h6 class="card-title mb-0">
              {{ resolvedEntity.attributes?.friendly_name || resolvedEntity.entity_id }}
            </h6>
          </div>
          <div>
            <div class="form-check form-switch m-0">
              <input
                :id="`ha-switch-${resolvedEntity.entity_id}`"
                v-model="isOn"
                class="form-check-input ha-switch-large"
                type="checkbox"
                :disabled="isDisabled || isToggling"
              />
            </div>
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
  attributes: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['mockToggle']);

const { callService, isLoading } = useServiceCall();

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

// displayState intentionally removed (unused)

// Compute a bootstrap border class depending on state
const cardBorderClass = computed(() => {
  if (!resolvedEntity.value) return 'border-warning';
  const state = props.mock ? localState.value : resolvedEntity.value.state;
  if (['unavailable', 'unknown'].includes(state)) return 'border-warning';
  return 'border-info';
});
</script>

<style scoped>
.ha-switch-large {
  transform: scale(1.45);
  transform-origin: center;
  /* Nudge vertically for better alignment with text */
  margin-top: 0.08rem;
}
.form-check.form-switch {
  /* Keep the switch container compact so scaling doesn't add extra gap */
  padding: 0;
}
</style>
