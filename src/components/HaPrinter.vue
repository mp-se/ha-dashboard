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
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="card-title mb-0">{{ name }}</h6>
            </div>
            <div class="text-end">
              <span class="badge bg-secondary">{{ formattedValue }}</span>
              <div v-if="unit" class="small text-muted mt-1">{{ unit }}</div>
            </div>
          </div>
          <!-- Toner Progress Bars -->
          <div>
            <div class="d-flex flex-column">
              <div class="progress mb-1" style="height: 12px">
                <div
                  class="progress-bar bg-dark"
                  :style="{ width: blackLevel + '%' }"
                  :title="'Black: ' + blackLevel + '%'"
                ></div>
              </div>
              <div class="progress mb-1" style="height: 12px">
                <div
                  class="progress-bar bg-info"
                  :style="{ width: cyanLevel + '%' }"
                  :title="'Cyan: ' + cyanLevel + '%'"
                ></div>
              </div>
              <div class="progress mb-1" style="height: 12px">
                <div
                  class="progress-bar bg-danger"
                  :style="{ width: magentaLevel + '%' }"
                  :title="'Magenta: ' + magentaLevel + '%'"
                ></div>
              </div>
              <div class="progress mb-1" style="height: 12px">
                <div
                  class="progress-bar bg-warning"
                  :style="{ width: yellowLevel + '%' }"
                  :title="'Yellow: ' + yellowLevel + '%'"
                ></div>
              </div>
            </div>
          </div>
          <div v-if="extraAttributes.length" class="mt-2 small text-muted">
            <ul class="list-unstyled mb-0">
              <li v-for="[k, v] in extraAttributes" :key="k">
                <strong>{{ attributeLabel(k) }}:</strong>
                <span>{{ formatAttributeValue(v) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';
import { formatAttributeValue, attributeLabel } from '@/utils/attributeFormatters';

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
  // Optional list of attribute keys to display below the name
  attributes: {
    type: Array,
    default: () => [],
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

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');
const unit = computed(() => resolvedEntity.value?.attributes?.unit_of_measurement || '');

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

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  return 'border-info';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

// Return an array of [key, value] for the attributes to show
const extraAttributes = computed(() => {
  if (!resolvedEntity.value) return [];
  const attrs = resolvedEntity.value.attributes || {};
  return (props.attributes || []).filter((k) => k in attrs).map((k) => [k, attrs[k]]);
});
</script>

<style scoped>
/* Sensor value should be slightly smaller than the name but still prominent */
.ha-sensor-value {
  font-size: 0.95rem;
}
</style>
