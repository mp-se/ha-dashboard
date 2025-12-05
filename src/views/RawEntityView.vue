<template>
  <!-- Success Notification Banner (Top of viewport) -->
  <div v-if="successBanner" class="alert alert-success alert-dismissible fade show m-0 rounded-0" role="alert" style="position: sticky; top: 0; left: 0; right: 0; z-index: 1040; margin: 0 !important;">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <i class="mdi mdi-check-circle me-2"></i>
          <strong>Configuration generated!</strong> {{ successBannerMessage }}
        </div>
        <button type="button" class="btn-close" aria-label="Close" @click="successBanner = false"></button>
      </div>
    </div>
  </div>

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
          <button
            class="btn btn-primary"
            type="button"
            title="Generate configuration JSON for all supported entities"
            @click="generateConfigJson"
          >
            <i class="mdi mdi-file-json"></i> Generate Config
          </button>
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
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 class="card-title mb-0">{{ area.name || 'Unnamed' }}</h6>
                    <small class="text-muted">area.{{ area.area_id }}</small>
                    <div v-if="area.icon" class="small text-muted">Icon: <code>{{ area.icon }}</code></div>
                  </div>
                  <i v-if="area.icon" :class="getIconClass(area.icon)" style="font-size: 1.5rem"></i>
                </div>
                <div class="mt-3">
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
              <div class="position-absolute top-0 end-0 m-2 d-flex gap-1">
                <button
                  class="btn btn-sm btn-outline-secondary"
                  type="button"
                  title="Copy entity JSON to clipboard"
                  @click="copyEntityToClipboard(entity)"
                >
                  <i class="mdi mdi-content-copy"></i>
                </button>
                <button
                  v-if="DEFAULT_DOMAIN_MAP[entity.entity_id.split('.')[0]]"
                  class="btn btn-sm btn-outline-secondary"
                  type="button"
                  title="Copy config JSON to clipboard"
                  @click="generateEntityConfigJson(entity)"
                >
                  <i class="mdi mdi-code-json"></i>
                </button>
              </div>
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
import { DEFAULT_DOMAIN_MAP } from '@/composables/useDefaultComponentType';
import useDebouncedRef from '@/composables/useDebouncedRef';

defineProps({
  viewName: {
    type: String,
    required: false,
    default: '',
  },
});

const store = useHaStore();
const selectedType = ref('');
const hideUnavailable = ref(false);
const successBanner = ref(false);
const successBannerMessage = ref('');
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

const getIconClass = (icon) => {
  if (!icon) return '';
  if (icon.startsWith('mdi:')) {
    return `mdi mdi-${icon.split(':')[1]}`;
  }
  return icon;
};

const copyEntityToClipboard = async (entity) => {
  try {
    const jsonString = JSON.stringify(entity, null, 2);
    await navigator.clipboard.writeText(jsonString);
    console.log('Entity JSON copied to clipboard:', entity.entity_id);
    successBannerMessage.value = `Entity JSON for ${entity.entity_id} copied to clipboard.`;
    successBanner.value = true;
    setTimeout(() => {
      successBanner.value = false;
    }, 3000);
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
      successBannerMessage.value = `Entity JSON for ${entity.entity_id} copied to clipboard.`;
      successBanner.value = true;
      setTimeout(() => {
        successBanner.value = false;
      }, 3000);
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

const generateConfigJson = async () => {
  // Filter to only supported entities (those in DEFAULT_DOMAIN_MAP)
  const supportedEntities = store.sensors.filter((entity) => {
    const domain = entity.entity_id.split('.')[0];
    return DEFAULT_DOMAIN_MAP[domain] && entity.state !== 'unavailable' && entity.state !== 'unknown';
  });

  if (supportedEntities.length === 0) {
    successBannerMessage.value = 'No supported entities found to generate configuration.';
    successBanner.value = true;
    setTimeout(() => {
      successBanner.value = false;
    }, 5000);
    return;
  }

  // Group entities by component type
  const groupedByType = {};
  supportedEntities.forEach((entity) => {
    const domain = entity.entity_id.split('.')[0];
    const componentType = DEFAULT_DOMAIN_MAP[domain];
    
    if (!groupedByType[componentType]) {
      groupedByType[componentType] = [];
    }
    groupedByType[componentType].push({
      entity: entity.entity_id,
      type: componentType,
    });
  });

  // Create entities array sorted by type
  const entities = [];
  const sortedTypes = Object.keys(groupedByType).sort();
  for (const componentType of sortedTypes) {
    entities.push(...groupedByType[componentType]);
  }

  // Create the configuration object
  const config = {
    app: {
      title: 'My Home Assistant Dashboard',
      developerMode: true,
      localMode: false,
    },
    haConfig: {
      haUrl: store.haUrl || 'https://your-ha-instance:8123',
      accessToken: store.accessToken || 'your-long-lived-token-here',
    },
    views: [
      {
        name: 'overview',
        label: 'Overview',
        icon: 'mdi mdi-view-dashboard',
        entities: entities,
      },
    ],
  };

  // Copy to clipboard
  try {
    const jsonString = JSON.stringify(config, null, 2);
    await navigator.clipboard.writeText(jsonString);
    console.log('Configuration JSON copied to clipboard');
    successBannerMessage.value = `${supportedEntities.length} entities generated and copied to clipboard. Paste into your dashboard-config.json and customize as needed.`;
    successBanner.value = true;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      successBanner.value = false;
    }, 5000);
  } catch (error) {
    console.error('Failed to copy config to clipboard:', error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(config, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      successBannerMessage.value = `${supportedEntities.length} entities generated and copied to clipboard. Paste into your dashboard-config.json and customize as needed.`;
      successBanner.value = true;
      setTimeout(() => {
        successBanner.value = false;
      }, 5000);
    } catch (fallbackError) {
      console.error('Fallback copy also failed:', fallbackError);
      successBannerMessage.value = 'Failed to copy configuration to clipboard. Please try again.';
      successBanner.value = true;
      setTimeout(() => {
        successBanner.value = false;
      }, 5000);
    }
  }
};

const generateEntityConfigJson = async (entity) => {
  const domain = entity.entity_id.split('.')[0];
  const componentType = DEFAULT_DOMAIN_MAP[domain];
  
  if (!componentType) {
    console.warn('Unsupported entity type for config generation:', entity.entity_id);
    return;
  }

  // Base config
  const config = {
    entity: entity.entity_id,
    type: componentType,
  };

  // Add component-specific defaults
  const componentDefaults = {
    HaSensor: { attributes: [] },
    HaGauge: { min: 0, max: 100 },
    HaWarning: { attribute: 'state', operator: '=', value: '', message: '' },
    HaError: { attribute: 'state', operator: '=', value: '', message: '' },
    HaBinarySensor: {},
    HaChip: {},
    HaWeather: {},
    HaSensorGraph: { hours: 24, maxPoints: 200, attributes: [] },
    HaMediaPlayer: {},
    HaSun: { attributes: [] },
    HaPrinter: { black: '', cyan: '', magenta: '', yellow: '', attributes: [] },
    HaEnergy: {},
    HaEntityList: { componentMap: {}, attributes: [] },
    HaGlance: { attributes: [] },
    HaAlarmPanel: {},
    HaButton: {},
    HaSelect: {},
    HaSwitch: {},
    HaImage: { title: 'Image' },
    HaHeader: { icon: null, attributes: [] },
    HaLink: { url: '', name: '', header: '', entity: null, attributes: [] },
    HaPerson: {},
    HaSpacer: {},
    HaRowSpacer: {},
    HaRoom: { color: 'blue' },
    HaBeerTap: {},
  };

  const defaults = componentDefaults[componentType] || {};
  Object.assign(config, defaults);

  // Copy to clipboard
  try {
    const jsonString = JSON.stringify(config, null, 2);
    await navigator.clipboard.writeText(jsonString);
    console.log('Entity config JSON copied to clipboard:', entity.entity_id);
    successBannerMessage.value = `Config for ${entity.entity_id} copied to clipboard.`;
    successBanner.value = true;
    setTimeout(() => {
      successBanner.value = false;
    }, 3000);
  } catch (error) {
    console.error('Failed to copy config to clipboard:', error);
    // Fallback
    try {
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(config, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      successBannerMessage.value = `Config for ${entity.entity_id} copied to clipboard.`;
      successBanner.value = true;
      setTimeout(() => {
        successBanner.value = false;
      }, 3000);
    } catch (fallbackError) {
      console.error('Fallback copy also failed:', fallbackError);
      successBannerMessage.value = 'Failed to copy config to clipboard.';
      successBanner.value = true;
      setTimeout(() => {
        successBanner.value = false;
      }, 3000);
    }
  }
};
</script>
