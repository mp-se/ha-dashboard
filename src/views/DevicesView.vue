<template>
  <div class="container-fluid overflow-hidden text-center">
    <p>&nbsp;</p>
    <p class="h3">Devices</p>

    <div class="row mb-3">
      <div class="col-md-6 offset-md-3">
        <div class="row g-2">
          <div class="col-md-6">
            <select
              v-model="selectedArea"
              class="form-select"
              aria-label="Filter devices by area"
            >
              <option value="">All Areas</option>
              <option v-for="area in areas" :key="area.area_id" :value="area.area_id">
                {{ area.name }}
              </option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
          <div class="col-md-6">
            <div class="input-group">
              <input
                v-model="searchText"
                class="form-control"
                type="text"
                placeholder="Filter devices by name"
                aria-label="Filter devices by name"
              />
              <button
                v-if="searchText"
                class="btn btn-outline-secondary"
                type="button"
                aria-label="Clear device search"
                @click="searchText = ''"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div v-for="device in filteredDevices" :key="device.id" class="col-lg-4 col-md-6">
        <div class="card h-100 rounded-4">
          <div class="card-body text-start position-relative">
            <button
              class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2"
              type="button"
              title="Copy device JSON to clipboard"
              @click="copyDeviceToClipboard(device)"
            >
              <i class="mdi mdi-content-copy"></i>
            </button>
            <h6 class="card-title">{{ device.name || 'Unnamed Device' }}</h6>
            <small class="text-muted">ID: {{ device.id }}</small>
            <p v-if="getAreaName(device.area_id)" class="mt-2 mb-1">
              <strong>Area:</strong> {{ getAreaName(device.area_id) }}
            </p>
            <p v-else class="mt-2 mb-1">
              <strong>Area:</strong> <span class="text-muted">Unassigned</span>
            </p>
            <p class="mb-1">Entities: {{ device.entities?.length || 0 }}</p>
            <div v-if="device.entities?.length" class="mb-2">
              <small class="text-muted">Entity IDs:</small>
              <ul class="list-unstyled small">
                <li v-for="entity in device.entities" :key="entity">{{ entity }}</li>
              </ul>
            </div>
            <p v-if="device.model" class="mb-1"><strong>Model:</strong> {{ device.model }}</p>
            <p v-if="device.manufacturer" class="mb-1">
              <strong>Manufacturer:</strong> {{ device.manufacturer }}
            </p>
            <p v-if="device.sw_version" class="mb-0">
              <strong>Version:</strong> {{ device.sw_version }}
            </p>
            <p v-if="device.hw_version" class="mb-0">
              <strong>HW Version:</strong> {{ device.hw_version }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredDevices.length === 0" class="text-center mt-5">
      <p class="text-muted">No devices found matching your filters</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useHaStore } from '@/stores/haStore';
import useDebouncedRef from '@/composables/useDebouncedRef';

const store = useHaStore();

const selectedArea = ref('');
const { input: searchText, debounced: debouncedSearch } = useDebouncedRef('', 300);

const areas = computed(() => {
  return store.areas || [];
});

const getAreaName = (areaId) => {
  if (!areaId) return null;
  const area = areas.value.find((a) => a.area_id === areaId);
  return area?.name || null;
};

const filteredDevices = computed(() => {
  let filtered = store.devices || [];

  // Filter by area
  if (selectedArea.value === 'unassigned') {
    filtered = filtered.filter((d) => !d.area_id);
  } else if (selectedArea.value) {
    filtered = filtered.filter((d) => d.area_id === selectedArea.value);
  }

  // Filter by search text
  const q = (debouncedSearch.value || '').trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((d) => (d.name || '').toLowerCase().includes(q));
  }

  return filtered;
});

const copyDeviceToClipboard = async (device) => {
  try {
    // Create enriched device data with full entity information
    const enrichedDevice = {
      ...device,
      areaName: getAreaName(device.area_id) || 'Unassigned',
      entities: device.entities?.map(entityId => {
        // Find the full entity data from the store
        return store.sensors.find(sensor => sensor.entity_id === entityId);
      }).filter(Boolean) || [] // Filter out any undefined entities
    };

    const jsonString = JSON.stringify(enrichedDevice, null, 2);
    await navigator.clipboard.writeText(jsonString);
    // Could add a toast notification here if desired
    console.log('Device JSON with entities copied to clipboard:', device.id);
  } catch (error) {
    console.error('Failed to copy device to clipboard:', error);
    // Fallback for older browsers
    try {
      // Create enriched device data with full entity information
      const enrichedDevice = {
        ...device,
        areaName: getAreaName(device.area_id) || 'Unassigned',
        entities: device.entities?.map(entityId => {
          // Find the full entity data from the store
          return store.sensors.find(sensor => sensor.entity_id === entityId);
        }).filter(Boolean) || [] // Filter out any undefined entities
      };

      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(enrichedDevice, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Device JSON with entities copied to clipboard (fallback):', device.id);
    } catch (fallbackError) {
      console.error('Fallback copy also failed:', fallbackError);
    }
  }
};
</script>
