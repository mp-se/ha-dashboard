<template>
  <div class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', 'h-100', 'rounded-4', 'shadow-lg', 'border-info']">
      <div class="card-body">
        <!-- Entities Grid -->
        <div class="glance-grid">
          <div v-for="ent in entityList" :key="getEntityId(ent)" class="glance-item">
            <!-- Icon -->
            <i v-if="getIconClass(ent)" :class="getIconClass(ent)" class="glance-icon"></i>

            <!-- Name and State -->
            <div class="glance-content">
              <div class="glance-name">{{ getName(ent) }}</div>
              <div class="glance-state">
                {{ getFormattedValue(ent) }}
                <small v-if="getUnit(ent)" class="text-muted">{{ getUnit(ent) }}</small>
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
import { useIconClass } from '@/composables/useIconClass';

const props = defineProps({
  entity: {
    type: [Array, String],
    required: true,
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

// Get entity ID string from entity object or string
const getEntityId = (ent) => {
  return typeof ent === 'string' ? ent : ent.entity_id;
};

// Get resolved entity from store
const getResolved = (ent) => {
  if (typeof ent === 'string') {
    return store.sensors.find((s) => s.entity_id === ent) || store.entities[ent];
  }
  return ent;
};

// Get entity name
const getName = (ent) => {
  const res = getResolved(ent);
  return res?.attributes?.friendly_name || getEntityId(ent) || 'Unknown';
};

// Get formatted value
const getFormattedValue = (ent) => {
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
};

// Get unit
const getUnit = (ent) => {
  const res = getResolved(ent);
  return res?.attributes?.unit_of_measurement || '';
};

// Get icon class using composable
const getIconClass = (ent) => {
  const res = getResolved(ent);
  const entityId = getEntityId(ent);
  return useIconClass(res, entityId);
};
</script>

<style scoped>
.glance-grid {
  display: grid;
  gap: 0.75rem;
  grid-auto-flow: dense;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}

.glance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(248, 249, 250, 0.3);
  transition: all 0.2s ease;
  overflow: hidden;
  min-width: 0;
}

.glance-item:hover {
  background-color: rgba(248, 249, 250, 0.5);
  transform: translateY(-1px);
}

[data-bs-theme='dark'] .glance-item {
  background-color: rgba(52, 58, 64, 0.3);
}

[data-bs-theme='dark'] .glance-item:hover {
  background-color: rgba(52, 58, 64, 0.5);
}

.glance-icon {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: #495057;
}

[data-bs-theme='dark'] .glance-icon {
  color: #adb5bd;
}

.glance-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.glance-name {
  font-size: 0.65rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

[data-bs-theme='dark'] .glance-name {
  color: #adb5bd;
}

.glance-state {
  font-size: 0.875rem;
  color: #212529;
  font-weight: 500;
}

[data-bs-theme='dark'] .glance-state {
  color: #f8f9fa;
}
</style>
