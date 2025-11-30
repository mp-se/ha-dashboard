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
              <option value="areas">area</option>
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
      <!-- Areas Display -->
      <div v-if="selectedType === 'areas'" class="col-md-12">
        <div class="row g-3">
          <div v-for="area in filteredAreas" :key="area.id" class="col-lg-4 col-md-6">
            <div class="card h-100 rounded-4 border-info">
              <div class="card-body text-start position-relative">
                <button
                  class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2"
                  type="button"
                  title="Copy area JSON to clipboard"
                  @click="copyAreaToClipboard(area)"
                >
                  <i class="mdi mdi-content-copy"></i>
                </button>
                <h6 class="card-title">{{ area.name || area.id }}</h6>
                <small class="text-muted">{{ area.id }}</small>
                <div class="mt-3">
                  <div v-if="area.icon" class="mb-2">
                    <strong>Icon:</strong> <code>{{ area.icon }}</code>
                  </div>
                  <div v-if="area.picture" class="mb-2">
                    <strong>Picture:</strong> <code>{{ area.picture }}</code>
                  </div>
                  <div v-if="area.aliases && area.aliases.length > 0" class="mb-2">
                    <strong>Aliases:</strong>
                    <ul class="list-unstyled small mb-0">
                      <li v-for="alias in area.aliases" :key="alias">
                        <code>{{ alias }}</code>
                      </li>
                    </ul>
                  </div>
                  <small v-if="area.entities" class="text-muted">Entities ({{ area.entities.length }})</small>
                  <ul v-if="area.entities && area.entities.length > 0" class="list-unstyled small mb-0">
                    <li v-for="entity in area.entities" :key="entity">
                      <code>{{ entity }}</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Entities Display -->
      <div v-else class="row g-3 col-md-12">
        <div v-for="entity in filteredEntities" :key="entity.entity_id" class="col-lg-4 col-md-6">
          <div
            :class="[
              'card h-100 rounded-4',
              ['unavailable', 'unknown'].includes(entity.state) ? 'border-warning' : 'border-info',
            ]"
          >
            <div class="card-body text-start position-relative">
              <button
                class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2"
                type="button"
                title="Copy entity JSON to clipboard"
                @click="copyEntityToClipboard(entity)"
              >
                <i class="mdi mdi-content-copy"></i>
              </button>
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
  // Remove 'area' since it's already a hardcoded option
  types.delete('area');
  return Array.from(types).sort();
});

const filteredEntities = computed(() => {
  let entities = store.sensors;

  // Filter by type if selected (but not if "areas" is selected)
  if (selectedType.value && selectedType.value !== 'areas') {
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

const filteredAreas = computed(() => {
  let areasData = store.areas || [];

  // Filter by search text (match area id)
  if (debouncedSearch.value && debouncedSearch.value.trim().length > 0) {
    const q = debouncedSearch.value.trim().toLowerCase();
    areasData = areasData.filter((area) => {
      const id = (area.id || '').toLowerCase();
      return id.includes(q);
    });
  }

  return areasData;
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

const copyEntityToClipboard = async (entity) => {
  try {
    const jsonString = JSON.stringify(entity, null, 2);
    await navigator.clipboard.writeText(jsonString);
    // Could add a toast notification here if desired
    console.log('Entity JSON copied to clipboard:', entity.entity_id);
  } catch (error) {
    console.error('Failed to copy entity to clipboard:', error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(entity, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Entity JSON copied to clipboard (fallback):', entity.entity_id);
    } catch (fallbackError) {
      console.error('Fallback copy also failed:', fallbackError);
    }
  }
};

const copyAreaToClipboard = async (area) => {
  try {
    const jsonString = JSON.stringify(area, null, 2);
    await navigator.clipboard.writeText(jsonString);
    console.log('Area JSON copied to clipboard:', area.id);
  } catch (error) {
    console.error('Failed to copy area to clipboard:', error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(area, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Area JSON copied to clipboard (fallback):', area.id);
    } catch (fallbackError) {
      console.error('Fallback copy also failed:', fallbackError);
    }
  }
};
</script>
