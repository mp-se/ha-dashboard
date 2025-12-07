<template>
  <div class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', 'h-100', 'rounded-4', 'shadow-lg', 'border-info']">
      <div class="card-body">
        <!-- Entities Grid -->
        <div :class="['glance-grid', `glance-cols-${gridColumns}`]">
          <div v-for="ent in entityList" :key="getEntityId(ent)" class="glance-item">
            <!-- Icon with circle background -->
            <div v-if="getIconClass(ent)" class="ha-icon-circle-wrapper">
              <svg width="44" height="44" viewBox="0 0 40 40" class="ha-icon-circle">
                <circle cx="20" cy="20" r="18" :fill="getIconCircleColor(ent)" />
              </svg>
              <i :class="getIconClass(ent)" class="ha-icon-overlay"></i>
            </div>

            <!-- Name and State -->
            <div class="glance-content">
              <div class="ha-entity-name">{{ getName(ent) }}</div>
              <div class="ha-entity-value">
                {{ getFormattedValue(ent) }}
                <small v-if="getUnit(ent)" class="ha-entity-unit ms-1">{{ getUnit(ent) }}</small>
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
import { useIconCircleColor } from '@/composables/useIconCircleColor';

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

// Dynamic grid columns based on entity count
// 1 entity = 1 column, 2-3 = fill row with equal width, 4+ = 4 columns
const gridColumns = computed(() => {
  const count = entityList.value.length;
  if (count === 1) return 1;
  if (count === 2 || count === 3) return count;
  return 4;
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

// Get icon circle color
const getIconCircleColor = (ent) => {
  const res = getResolved(ent);
  const entityId = getEntityId(ent);
  return useIconCircleColor(res, entityId);
};
</script>

<style scoped>
.glance-grid {
  display: grid;
  gap: 0.75rem;
  grid-auto-flow: dense;
}

.glance-cols-1 {
  grid-template-columns: 1fr;
}

.glance-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.glance-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.glance-cols-4 {
  grid-template-columns: repeat(4, 1fr);
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

.icon-circle-wrapper-glance {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}

.icon-circle-wrapper-glance {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}

.glance-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  width: 100%;
}
</style>
