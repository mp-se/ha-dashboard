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
  <div class="static-component-palette p-3">
    <!-- Header -->
    <div class="mb-3">
      <h6 class="mb-3">Static Components</h6>
    </div>

    <!-- Components List -->
    <div class="components-list">
      <div
        v-for="component in staticComponents"
        :key="component.type"
        class="component-item mb-2"
        :class="{ 'component-item-tappable': mobileMode }"
        :draggable="!mobileMode"
        @dragstart="!mobileMode && handleDragStart($event, component)"
        @dragend="!mobileMode && handleDragEnd"
        @touchend.prevent="mobileMode && $emit('add-entity', { type: component.type })"
        @click="mobileMode && $emit('add-entity', { type: component.type })"
      >
        <div
          class="btn btn-sm w-100 text-start component-button"
          title="Drag to add to view"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div class="flex-grow-1">
              <div class="small fw-500">{{ component.label }}</div>
              <div class="text-muted" style="font-size: 0.75rem">
                {{ component.description }}
              </div>
            </div>
            <i :class="`mdi ${component.icon} ms-2 text-primary`"></i>
          </div>
        </div>
      </div>

      <p v-if="staticComponents.length === 0" class="text-muted small mb-0">
        No static components available
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

defineProps({
  mobileMode: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["add-entity"]);

const haImageComponent = window.__appCapabilities?.haImageComponent ?? true;

const allStaticComponents = ref([
  {
    type: "HaHeader",
    label: "Header",
    description: "Section header with title",
    icon: "mdi-text-box-outline",
  },
  {
    type: "HaLink",
    label: "Link",
    description: "Clickable link button",
    icon: "mdi-link-variant",
  },
  {
    type: "HaRowSpacer",
    label: "Row Spacer",
    description: "Horizontal spacing/break",
    icon: "mdi-minus",
  },
  {
    type: "HaSpacer",
    label: "Spacer",
    description: "Vertical spacing",
    icon: "mdi-minus-thick",
  },
  {
    type: "HaImage",
    label: "Image",
    description: "External or uploaded image",
    icon: "mdi-image-outline",
  },
]);

// When HaImage component capability is disabled (no upload backend), hide it from the palette.
// Users can still use existing HaImage cards via URL directly.
const staticComponents = computed(() =>
  haImageComponent
    ? allStaticComponents.value
    : allStaticComponents.value.filter((c) => c.type !== "HaImage"),
);

const handleDragStart = (event, component) => {
  // Store component type in application/json format (same as EntityPalette)
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(
    "application/json",
    JSON.stringify({
      type: component.type,
      isStatic: true, // Flag to indicate this is a static component
    }),
  );
  event.dataTransfer.setData("text/plain", component.type);
};

const handleDragEnd = (event) => {
  event.target.style.opacity = "1";
};
</script>

<style scoped>
.static-component-palette {
  background-color: var(--bs-light);
}

.component-button {
  padding: 0.5rem !important;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.25rem;
  background-color: var(--bs-body-bg);
  transition: all 0.2s ease;
  cursor: grab;
}

.component-button:hover {
  background-color: var(--bs-light);
  border-color: var(--bs-primary);
}

.component-button:active {
  cursor: grabbing;
}

.component-item {
  transition: opacity 0.2s ease;
}

.component-item-tappable .component-button {
  cursor: pointer;
  touch-action: manipulation;
}

.fw-500 {
  font-weight: 500;
}
</style>
