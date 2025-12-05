<template>
  <div class="col-lg-4 col-md-6">
    <div :class="['card', 'card-control', cardBorderClass, 'h-100', 'rounded-4', 'shadow-lg']">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="card-title mb-0">{{ name }}</h6>
          <i :class="selectIcon" class="select-icon"></i>
        </div>

        <div v-if="options && options.length > 0" class="d-flex flex-wrap">
          <div class="btn-group" role="group">
            <template v-for="option in options" :key="option">
              <input
                :id="`${resolvedEntity.value?.entity_id}-${option}`"
                v-model="selectedOption"
                type="radio"
                :name="`${resolvedEntity.value?.entity_id}-select`"
                class="btn-check"
                :value="option"
                :disabled="isUnavailable"
              />
              <label
                :for="`${resolvedEntity.value?.entity_id}-${option}`"
                :class="['btn', 'btn-sm', isUnavailable ? 'disabled' : '', selectedOption === option ? 'btn-primary' : 'btn-outline-primary']"
              >
                {{ option }}
              </label>
            </template>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
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
});

const store = useHaStore();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');

const selectedOption = ref(state.value);

// Update selectedOption when state changes from external source
watch(state, (newState) => {
  selectedOption.value = newState;
});

// Call service when selectedOption changes
watch(selectedOption, (newOption) => {
  if (newOption !== state.value && resolvedEntity.value) {
    const domain = resolvedEntity.value.entity_id.split('.')[0];
    store.callService(domain, 'select_option', {
      entity_id: resolvedEntity.value.entity_id,
      option: newOption,
    });
  }
});

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  return 'border-info';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

const selectIcon = computed(() => {
  return 'mdi mdi-format-list-bulleted';
});

// Select-specific attributes
const options = computed(() => resolvedEntity.value?.attributes?.options || []);
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
