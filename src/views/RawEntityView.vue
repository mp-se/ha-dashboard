<template>
  <div class="container-fluid overflow-hidden text-center">
    <p>&nbsp;</p>
    <p class="h3">Entity Dashboard</p>

    <div class="row g-3">
      <div class="col-md-12">
        <div class="d-flex align-items-end gap-3 mb-3">
          <div class="flex-grow-1">
            <select v-model="selectedType" class="form-select">
              <option value="">All Types</option>
              <option v-for="type in uniqueTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
          <div class="" style="width: 260px">
            <div class="input-group">
              <input
                v-model="searchText"
                class="form-control"
                type="text"
                placeholder="Filter by name or ID"
                aria-label="Filter entities by name or id"
              />
              <button
                v-if="searchText"
                class="btn btn-outline-secondary"
                type="button"
                aria-label="Clear search"
                @click="searchText = ''"
              >
                ✕
              </button>
            </div>
          </div>
          <div>
            <div
              class="form-check form-switch d-flex align-items-center"
              style="padding-top: 0.375rem; height: 48px"
            >
              <input
                id="hideUnavailable"
                v-model="hideUnavailable"
                class="form-check-input"
                type="checkbox"
                style="transform: scale(1.2)"
              />
              <label class="form-check-label ms-2" for="hideUnavailable"> Hide Unavailable </label>
            </div>
          </div>
        </div>
      </div>
      <div v-for="entity in filteredEntities" :key="entity.entity_id" class="col-lg-4 col-md-6">
        <div
          :class="[
            'card h-100 rounded-4',
            ['unavailable', 'unknown'].includes(entity.state) ? 'border-warning' : 'border-info',
          ]"
        >
          <div class="card-body text-start">
            <h6 class="card-title">{{ entity.attributes?.friendly_name || entity.entity_id }}</h6>
            <small class="text-muted">{{ entity.entity_id }}</small>
            <p class="mt-2 mb-1"><strong>State:</strong> {{ entity.state }}</p>
            <div class="mt-2">
              <small class="text-muted">Attributes</small>
              <ul class="list-unstyled small mb-0">
                <li v-for="[k, v] in displayAttributes(entity)" :key="k">
                  <strong>{{ k }}:</strong>
                  <span class="text-wrap">{{ formatAttributeValue(v) }}</span>
                </li>
              </ul>
            </div>
            <!-- Actions removed for read-only dashboard view -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useHaStore } from '../stores/haStore';
import useDebouncedRef from '@/composables/useDebouncedRef';

const store = useHaStore();
const selectedType = ref('');
const hideUnavailable = ref(false);
const { input: searchText, debounced: debouncedSearch } = useDebouncedRef('', 300);

const uniqueTypes = computed(() => {
  const types = new Set(store.sensors.map((entity) => entity.entity_id.split('.')[0]));
  return Array.from(types).sort();
});

const filteredEntities = computed(() => {
  let entities = store.sensors;

  // Filter by type if selected
  if (selectedType.value) {
    entities = entities.filter((entity) => entity.entity_id.startsWith(`${selectedType.value}.`));
  }

  // Filter out unavailable entities if checkbox is checked
  if (hideUnavailable.value) {
    entities = entities.filter((entity) => !['unavailable', 'unknown'].includes(entity.state));
  }

  // Filter by search text (match friendly_name or entity_id)
  if (debouncedSearch.value && debouncedSearch.value.trim().length > 0) {
    const q = debouncedSearch.value.trim().toLowerCase();
    entities = entities.filter((entity) => {
      const name = (entity.attributes?.friendly_name || '').toString().toLowerCase();
      const id = entity.entity_id.toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }

  return entities;
});

// No action handlers or action button logic in read-only dashboard

// Helper: return array of [key,value] pairs of attributes to display
const displayAttributes = (entity) => {
  if (!entity || !entity.attributes) return [];
  const blacklist = new Set([
    'friendly_name',
    'entity_picture',
    'icon',
    'unit_of_measurement',
    'device_class',
    'device_id',
  ]);
  const entries = Object.entries(entity.attributes || {})
    .filter(([k]) => !blacklist.has(k))
    .slice(0, 12);
  return entries;
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
