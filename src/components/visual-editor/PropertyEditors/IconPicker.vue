<!--
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<template>
  <div class="property-editor">
    <label class="form-label small mb-1">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div class="icon-picker">
      <!-- Search input -->
      <div class="input-group input-group-sm mb-2">
        <input
          v-model="searchText"
          type="text"
          class="form-control"
          placeholder="Search icons (e.g., home, light, switch)..."
        />
        <button
          v-if="searchText"
          type="button"
          class="btn btn-outline-secondary"
          @click="searchText = ''"
        >
          ✕
        </button>
      </div>

      <!-- Selected icon display -->
      <div
        v-if="modelValue"
        class="d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded"
      >
        <i :class="`mdi ${modelValue}`" style="font-size: 1.5rem"></i>
        <div class="small">
          <div class="fw-bold">{{ modelValue }}</div>
          <button
            type="button"
            class="btn btn-link btn-sm p-0 text-danger"
            @click="$emit('update:modelValue', '')"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Icon grid -->
      <div class="icon-grid">
        <button
          v-for="icon in filteredIcons"
          :key="icon"
          type="button"
          class="icon-btn"
          :class="{ active: modelValue === icon }"
          :title="icon"
          @click="$emit('update:modelValue', icon)"
        >
          <i :class="`mdi ${icon}`"></i>
        </button>
      </div>

      <small v-if="filteredIcons.length === 0" class="text-muted d-block mt-2">
        No icons found. Try different search terms.
      </small>
    </div>

    <small v-if="help" class="text-muted d-block mt-2">{{ help }}</small>
    <small v-if="error" class="text-danger d-block mt-2">{{ error }}</small>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

// Common MDI icons for dashboard - expanded selection
const COMMON_ICONS = [
  "mdi-home",
  "mdi-lightbulb",
  "mdi-lightbulb-on",
  "mdi-lightbulb-off",
  "mdi-toggle-switch",
  "mdi-toggle-switch-off",
  "mdi-power-socket",
  "mdi-fan",
  "mdi-thermostat",
  "mdi-thermometer",
  "mdi-water-percent",
  "mdi-water",
  "mdi-cloud",
  "mdi-cloud-sun",
  "mdi-cloud-rain",
  "mdi-sun",
  "mdi-moon",
  "mdi-weather-cloudy",
  "mdi-weather-rainy",
  "mdi-weather-sunny",
  "mdi-alert-circle",
  "mdi-alert-outline",
  "mdi-check-circle",
  "mdi-check-circle-outline",
  "mdi-lock",
  "mdi-lock-open",
  "mdi-door",
  "mdi-door-open",
  "mdi-window-closed",
  "mdi-window-open",
  "mdi-blinds-vertical",
  "mdi-blinds-vertical-closed",
  "mdi-garage",
  "mdi-garage-open",
  "mdi-camera",
  "mdi-motion-sensor",
  "mdi-bell",
  "mdi-bell-outline",
  "mdi-phone",
  "mdi-speaker",
  "mdi-speaker-off",
  "mdi-volume-high",
  "mdi-volume-mute",
  "mdi-music",
  "mdi-play",
  "mdi-pause",
  "mdi-stop",
  "mdi-skip-next",
  "mdi-skip-previous",
  "mdi-heart",
  "mdi-heart-outline",
  "mdi-star",
  "mdi-star-outline",
  "mdi-information-outline",
  "mdi-help-circle",
  "mdi-help-circle-outline",
  "mdi-settings",
  "mdi-cog",
  "mdi-calendar",
  "mdi-clock",
  "mdi-clock-outline",
  "mdi-timer",
  "mdi-battery",
  "mdi-battery-high",
  "mdi-battery-medium",
  "mdi-battery-low",
  "mdi-power",
  "mdi-power-on",
  "mdi-power-off",
  "mdi-wifi",
  "mdi-wifi-off",
  "mdi-radio",
  "mdi-signal-2g",
  "mdi-signal-3g",
  "mdi-signal-4g",
  "mdi-printer",
  "mdi-laptop",
  "mdi-desktop",
  "mdi-television",
  "mdi-tablet",
  "mdi-phone-outline",
  "mdi-car",
  "mdi-bike",
  "mdi-walk",
  "mdi-run",
  "mdi-tree",
  "mdi-flower",
  "mdi-fireplace",
  "mdi-fire",
  "mdi-bed",
  "mdi-sofa",
  "mdi-table-furniture",
  "mdi-chart-line",
  "mdi-chart-bar",
  "mdi-chart-pie",
  "mdi-percent",
  "mdi-plus",
  "mdi-minus",
  "mdi-close",
  "mdi-menu",
  "mdi-dots-vertical",
  "mdi-arrow-up",
  "mdi-arrow-down",
  "mdi-arrow-left",
  "mdi-arrow-right",
];

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    required: true,
  },
  help: {
    type: String,
    default: "",
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

defineEmits(["update:modelValue"]);

const searchText = ref("");

const filteredIcons = computed(() => {
  if (!searchText.value) return COMMON_ICONS;
  const search = searchText.value.toLowerCase();
  return COMMON_ICONS.filter((icon) => icon.includes(search));
});
</script>

<style scoped>
.icon-picker {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  background-color: #f8f9fa;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background-color: #e9ecef;
  border-color: #0d6efd;
}

.icon-btn.active {
  background-color: #0d6efd;
  color: white;
  border-color: #0d6efd;
}
</style>
