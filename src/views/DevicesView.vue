<template>
  <div class="container overflow-hidden text-center">
    <p>&nbsp;</p>
    <p class="h3">Devices</p>

    <div class="row mb-3">
      <div class="col-md-6 offset-md-3">
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

    <div class="row g-3">
      <div v-for="device in devices" :key="device.id" class="col-md-4">
        <div class="card h-100 rounded-4 shadow-lg">
          <div class="card-body text-start">
            <h6 class="card-title">{{ device.name || 'Unnamed Device' }}</h6>
            <small class="text-muted">ID: {{ device.id }}</small>
            <p class="mt-2 mb-1">Entities: {{ device.entities?.length || 0 }}</p>
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
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';
import useDebouncedRef from '@/composables/useDebouncedRef';

const store = useHaStore();

const { input: searchText, debounced: debouncedSearch } = useDebouncedRef('', 300);

const devices = computed(() => {
  const q = (debouncedSearch.value || '').trim().toLowerCase();
  if (!q) return store.devices;
  return store.devices.filter((d) => (d.name || '').toLowerCase().includes(q));
});
</script>
