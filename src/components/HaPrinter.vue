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
      <div :class="['card-body', !resolvedEntity ? 'text-center text-warning' : '']">
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>

        <div v-else>
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h6 class="card-title mb-0">{{ name }}</h6>
            </div>
            <div class="text-end">
              <span class="badge bg-success">{{ getHighestTonerLevel }}%</span>
              <div class="small text-muted mt-1">Toner</div>
            </div>
          </div>
          <!-- Toner Progress Bars with Labels -->
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div>
              <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; text-align: left;">Black</div>
              <div class="progress" style="height: 12px;">
                <div
                  class="progress-bar bg-dark"
                  :style="{ width: blackLevel + '%' }"
                  :title="'Black: ' + blackLevel + '%'"
                ></div>
              </div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; text-align: left;">Cyan</div>
              <div class="progress" style="height: 12px;">
                <div
                  class="progress-bar bg-info"
                  :style="{ width: cyanLevel + '%' }"
                  :title="'Cyan: ' + cyanLevel + '%'"
                ></div>
              </div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; text-align: left;">Magenta</div>
              <div class="progress" style="height: 12px;">
                <div
                  class="progress-bar bg-danger"
                  :style="{ width: magentaLevel + '%' }"
                  :title="'Magenta: ' + magentaLevel + '%'"
                ></div>
              </div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; text-align: left;">Yellow</div>
              <div class="progress" style="height: 12px;">
                <div
                  class="progress-bar bg-warning"
                  :style="{ width: yellowLevel + '%' }"
                  :title="'Yellow: ' + yellowLevel + '%'"
                ></div>
              </div>
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
  black: {
    type: String,
    required: true,
  },
  cyan: {
    type: String,
    required: true,
  },
  magenta: {
    type: String,
    required: true,
  },
  yellow: {
    type: String,
    required: true,
  },
});

const store = useHaStore();

// Smart entity resolution for main entity
const resolvedEntity = computed(() => {
  if (typeof props.entity === 'string') {
    const found = store.sensors.find((s) => s.entity_id === props.entity);
    if (!found) {
      console.warn(`Entity "${props.entity}" not found`);
      return null;
    }
    return found;
  } else {
    return props.entity;
  }
});

// Helper to get toner level
const getTonerLevel = (entityId) => {
  const toner = store.sensors.find((s) => s.entity_id === entityId);
  if (!toner) return 0;
  const level = Number(toner.state);
  return Number.isNaN(level) ? 0 : Math.max(0, Math.min(100, level));
};

const blackLevel = computed(() => getTonerLevel(props.black));
const cyanLevel = computed(() => getTonerLevel(props.cyan));
const magentaLevel = computed(() => getTonerLevel(props.magenta));
const yellowLevel = computed(() => getTonerLevel(props.yellow));

const getHighestTonerLevel = computed(() => {
  return Math.max(blackLevel.value, cyanLevel.value, magentaLevel.value, yellowLevel.value);
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);
</script>

<style scoped>
/* Sensor value should be slightly smaller than the name but still prominent */
.ha-sensor-value {
  font-size: 0.95rem;
}
</style>
