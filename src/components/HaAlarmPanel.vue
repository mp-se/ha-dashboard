<template>
  <div class="col-md-12">
    <div
      :class="[
        'card',
        'card-control',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : cardBorderClass,
      ]"
    >
      <div :class="['card-body', !resolvedEntity ? 'text-center text-warning' : '']">
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>

        <div v-else>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="card-title mb-0">{{ name }}</h6>
            <span :class="stateBadgeClass">{{ displayState }}</span>
          </div>
          <form @submit.prevent>
            <input type="text" autocomplete="username" style="display: none" />
            <div class="mb-2 text-start">
              <label for="alarm-code" class="form-label small">Code</label>
              <div class="input-group input-group-sm">
                <input
                  id="alarm-code"
                  v-model="code"
                  :type="inputType"
                  class="form-control"
                  placeholder="Enter code"
                  autocomplete="current-password"
                />
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  @click="togglePasswordVisibility"
                >
                  <i :class="passwordVisible ? 'mdi mdi-eye-off' : 'mdi mdi-eye'"></i>
                </button>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button
                class="btn btn-sm btn-success"
                :disabled="!canArm || isLoading"
                @click="armHome"
              >
                Arm Home
              </button>
              <button
                class="btn btn-sm btn-primary"
                :disabled="!canArm || isLoading"
                @click="armAway"
              >
                Arm Away
              </button>
              <button
                class="btn btn-sm btn-secondary"
                :disabled="!canDisarm || isLoading"
                @click="disarm"
              >
                Disarm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useHaStore } from '@/stores/haStore';
import { useEntityResolver } from '@/composables/useEntityResolver';

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === 'string') {
        // Validate entity ID format
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === 'object') {
        // Validate entity object structure
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  attributes: { type: Array, default: () => [] },
});

const store = useHaStore();
const { resolvedEntity } = useEntityResolver(computed(() => props.entity));
const code = ref('');
const isLoading = ref(false);
const passwordVisible = ref(false);

const inputType = computed(() => (passwordVisible.value ? 'text' : 'password'));

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');
const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

const displayState = computed(() => {
  const s = state.value;
  switch (s) {
    case 'disarmed':
      return 'Disarmed';
    case 'armed_home':
      return 'Armed Home';
    case 'armed_away':
      return 'Armed Away';
    case 'arming':
      return 'Arming...';
    case 'disarming':
      return 'Disarming...';
    case 'triggered':
      return 'Triggered';
    default:
      return s;
  }
});

const stateBadgeClass = computed(() => {
  const s = state.value;
  if (s === 'disarmed') return 'badge bg-success';
  if (s.startsWith('armed')) return 'badge bg-danger';
  if (s === 'triggered') return 'badge bg-warning text-dark';
  return 'badge bg-secondary';
});

const canArm = computed(() => state.value === 'disarmed' && code.value.length > 0);
const canDisarm = computed(() => state.value !== 'disarmed' && code.value.length > 0);

const cardBorderClass = computed(() => {
  const s = state.value;
  if (s === 'disarmed') return 'border-success';
  if (s.startsWith('armed')) return 'border-danger';
  if (s === 'triggered') return 'border-warning';
  return 'border-secondary';
});

async function armHome() {
  await callService('alarm_arm_home');
}

async function armAway() {
  await callService('alarm_arm_away');
}

async function disarm() {
  await callService('alarm_disarm');
}

async function callService(service) {
  if (!code.value || !resolvedEntity.value) return;
  isLoading.value = true;
  try {
    await store.callService('alarm_control_panel', service, {
      entity_id: resolvedEntity.value.entity_id,
      code: code.value,
    });
  } catch (error) {
    console.error('Alarm service error:', error);
  } finally {
    isLoading.value = false;
  }
}

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value;
}
</script>

<style scoped>
/* Custom styles if needed */
</style>
