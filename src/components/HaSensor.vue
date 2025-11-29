<template>
  <div v-if="entityList.length === 1 && !resolvedEntity" class="col-lg-4 col-md-6">
    <div class="card card-display h-100 rounded-4 shadow-lg border-warning">
      <div class="card-body text-center text-warning">
        <i class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div>Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found</div>
      </div>
    </div>
  </div>

  <div v-else-if="entityList.length === 1" class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', cardBorderClass, 'h-100', 'rounded-4', 'shadow-lg']">
      <div class="card-body d-flex align-items-center">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-0">{{ name }}</h6>
          <small v-if="deviceName" class="text-muted">{{ deviceName }}</small>
          <div v-if="extraAttributes.length" class="mt-1 small text-muted">
            <ul class="list-unstyled mb-0">
              <li v-for="[k, v] in extraAttributes" :key="k">
                <strong>{{ attributeLabel(k) }}:</strong>
                <span>{{ formatAttributeValue(v) }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="d-flex align-items-center">
          <div class="text-end me-2">
            <div class="ha-sensor-value fw-bold">
              {{ formattedValue }} <small class="text-muted ms-1">{{ unit }}</small>
            </div>
          </div>
          <i v-if="iconClass" :class="iconClass" style="font-size: 1.5rem"></i>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', 'h-100', 'rounded-4', 'shadow-lg', 'border-info']">
      <div class="card-body">
        <div v-for="ent in entityList" :key="ent" class="mb-3">
          <div class="d-flex align-items-center">
            <div class="text-start flex-grow-1">
              <h6 class="card-title mb-0">{{ getName(ent) }}</h6>
              <small v-if="getDeviceName(ent)" class="text-muted">{{ getDeviceName(ent) }}</small>
            </div>
            <div class="d-flex align-items-center">
              <div class="text-end me-2">
                <div class="ha-sensor-value fw-bold">
                  {{ getFormattedValue(ent) }}
                  <small class="text-muted ms-1">{{ getUnit(ent) }}</small>
                </div>
              </div>
              <i v-if="getIconClass(ent)" :class="getIconClass(ent)" style="font-size: 1.5rem"></i>
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
import { useEntityResolver } from '@/composables/useEntityResolver';
import { useIconClass } from '@/composables/useIconClass';

const props = defineProps({
  entity: {
    type: [Object, String, Array],
    required: true,
    validator: (value) => {
      if (Array.isArray(value)) {
        return value.every((ent) => {
          if (typeof ent === 'string') {
            return /^[\w]+\.[\w_-]+$/.test(ent);
          } else if (typeof ent === 'object') {
            return ent && ent.entity_id && ent.state && ent.attributes;
          }
          return false;
        });
      } else if (typeof value === 'string') {
        return /^[\w]+\.[\w_-]+$/.test(value);
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
});

const store = useHaStore();

// Entity list: if entity is array, use it, else [entity]
const entityList = computed(() => {
  if (Array.isArray(props.entity)) {
    return props.entity;
  }
  return [props.entity];
});

// Use composable for single entity resolution
const { resolvedEntity } = useEntityResolver(
  Array.isArray(props.entity) ? props.entity[0] : props.entity
);

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
  if (!resolvedEntity.value) return null;
  const firstEntity = Array.isArray(props.entity) ? props.entity[0] : props.entity;
  const entityId = typeof firstEntity === 'string' ? firstEntity : resolvedEntity.value.entity_id;
  return useIconClass(resolvedEntity.value, entityId);
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

// Functions for multiple entities
const getResolved = (ent) => {
  if (typeof ent === 'string') {
    return store.sensors.find((s) => s.entity_id === ent);
  } else {
    return ent;
  }
};

const getName = (ent) => {
  try {
    const res = getResolved(ent);
    return res?.attributes?.friendly_name || res?.entity_id || 'Unknown';
  } catch (error) {
    console.warn('Error getting name for entity:', ent, error);
    return 'Unknown';
  }
};

const getDeviceName = (ent) => {
  const res = getResolved(ent);
  if (!res) return null;
  const deviceId = res.attributes?.device_id;
  if (deviceId) {
    const device = store.devices.find((d) => d.id === deviceId);
    return device?.name || null;
  }
  return null;
};

const getFormattedValue = (ent) => {
  try {
    const res = getResolved(ent);
    const s = res?.state ?? 'unknown';
    const u = res?.attributes?.unit_of_measurement || '';
    if (s === 'unknown' || s === 'unavailable') return s;
    const n = Number(s);
    if (!Number.isNaN(n)) {
      if ((u && /°|°C|°F|%|percent/i.test(u)) || Math.abs(n) < 100) {
        return n.toFixed(1);
      }
      return n.toFixed(0);
    }
    return s;
  } catch (error) {
    console.warn('Error formatting value for entity:', ent, error);
    return 'unknown';
  }
};

const getUnit = (ent) => {
  try {
    const res = getResolved(ent);
    return res?.attributes?.unit_of_measurement || '';
  } catch (error) {
    console.warn('Error getting unit for entity:', ent, error);
    return '';
  }
};

const getIconClass = (ent) => {
  try {
    const res = getResolved(ent);
    if (!res || !res.attributes) return null;
    const entityId = typeof ent === 'string' ? ent : res.entity_id;
    return useIconClass(res, entityId);
  } catch (error) {
    console.warn('Error getting icon class for entity:', ent, error);
    return null;
  }
};
</script>

<style scoped>
/* Sensor value should be slightly smaller than the name but still prominent */
.ha-sensor-value {
  font-size: 0.95rem;
}
</style>
