<template>
  <div class="col-md-4">
    <div v-if="!resolvedEntity" class="card card-display h-100 rounded-4 shadow-lg border-warning">
      <div class="card-body text-center text-warning">
        <i class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div>Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found</div>
      </div>
    </div>

    <div
      v-else
      :class="['card', 'card-display', 'h-100', 'rounded-4', 'shadow-lg', cardBorderClass]"
    >
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="text-start">
            <h6 class="card-title mb-0">{{ name }}</h6>
            <small v-if="deviceName" class="text-muted">{{ deviceName }}</small>
          </div>
          <i :class="iconClass" style="font-size: 1.5rem"></i>
        </div>
        <!-- Current Power/Energy Value -->
        <div class="mb-2">
          <div class="d-flex align-items-baseline">
            <span class="fw-bold fs-5">{{ formattedValue }}</span>
            <small class="text-muted ms-1">{{ unit }}</small>
          </div>
          <small class="text-muted">{{ valueLabel }}</small>
        </div>

        <!-- Additional Energy Info -->
        <div v-if="extraAttributes.length" class="small text-muted">
          <div v-for="[k, v] in extraAttributes" :key="k" class="mb-1">
            <strong>{{ attributeLabel(k) }}:</strong>
            <span>{{ formatAttributeValue(v) }}</span>
          </div>
        </div>

        <!-- Mini graph placeholder (could be enhanced with actual graph) -->
        <div v-if="showGraph" class="mt-2">
          <div class="bg-light rounded p-2 text-center" style="height: 40px">
            <small class="text-muted">Energy usage graph</small>
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
        return /^sensor\.[\w_]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  // Optional list of attribute keys to display below the name
  attributes: {
    type: Array,
    default: () => [],
  },
  // Whether to show a mini graph
  showGraph: {
    type: Boolean,
    default: false,
  },
});

const store = useHaStore();

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

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');
const unit = computed(() => resolvedEntity.value?.attributes?.unit_of_measurement || '');
const deviceClass = computed(() => resolvedEntity.value?.attributes?.device_class);

const valueLabel = computed(() => {
  if (deviceClass.value === 'power') return 'Current Power';
  if (deviceClass.value === 'energy') return 'Energy Used';
  return 'Value';
});

const formattedValue = computed(() => {
  const s = state.value;
  if (s === 'unknown' || s === 'unavailable') return s;
  const n = Number(s);
  if (!Number.isNaN(n)) {
    if (unit.value === 'W' || unit.value === 'kW') {
      return n.toFixed(1);
    }
    if (unit.value === 'kWh' || unit.value === 'Wh') {
      return n.toFixed(2);
    }
    return n.toFixed(1);
  }
  return s;
});

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  if (deviceClass.value === 'power') {
    const power = Number(state.value) || 0;
    if (power > 1000) return 'border-danger'; // High power usage
    if (power > 100) return 'border-warning'; // Medium power usage
    return 'border-success'; // Low power usage
  }
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

const iconClass = computed(() => {
  if (!resolvedEntity.value) return 'mdi mdi-flash-alert';
  const icon = resolvedEntity.value.attributes?.icon;
  if (icon && icon.startsWith('mdi:')) {
    return `mdi mdi-${icon.split(':')[1]}`;
  }
  // Default energy/power icons
  if (deviceClass.value === 'power') return 'mdi mdi-flash';
  if (deviceClass.value === 'energy') return 'mdi mdi-lightning-bolt';
  return 'mdi mdi-flash-outline';
});

// Return an array of [key, value] for the attributes to show
const extraAttributes = computed(() => {
  if (!resolvedEntity.value) return [];
  const attrs = resolvedEntity.value.attributes || {};
  return (props.attributes || []).filter((k) => k in attrs).map((k) => [k, attrs[k]]);
});

const attributeLabel = (k) => {
  const label = k.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatAttributeValue = (v) => {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }
  return String(v);
};
</script>

<style scoped>
/* Energy card specific styles */
</style>
