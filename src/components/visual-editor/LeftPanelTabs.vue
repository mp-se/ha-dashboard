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
  <div class="left-panel-tabs d-flex flex-column">
    <!-- Tab Navigation -->
    <div class="tab-navigation border-bottom d-flex align-items-center bg-body">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button flex-fill py-2 px-1 text-center"
        :class="{ active: activeTab === tab.id }"
        :title="tab.label"
        @click="
          activeTab = tab.id;
          $emit('tab-changed', tab.id);
        "
      >
        <i
          :class="`mdi ${tab.icon} fs-4 ${
            activeTab === tab.id ? 'text-primary' : 'text-secondary'
          }`"
        ></i>
        <div
          class="tab-label small d-none d-lg-block mt-1"
          :class="activeTab === tab.id ? 'text-primary' : 'text-secondary'"
        >
          {{ tab.label }}
        </div>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content flex-grow-1 overflow-hidden d-flex flex-column">
      <!-- Views Tab -->
      <div
        v-show="activeTab === 'views'"
        class="tab-pane flex-grow-1 overflow-auto"
      >
        <ViewManager
          ref="viewManagerRef"
          :views="views"
          :selected-view-name="selectedViewName"
          @view-created="$emit('view-created', $event)"
          @view-deleted="$emit('view-deleted', $event)"
          @view-updated="$emit('view-updated', $event)"
          @view-selected="$emit('view-selected', $event)"
          @view-index-selected="$emit('view-index-selected', $event)"
        />
      </div>

      <!-- Entities Tab -->
      <div
        v-show="activeTab === 'entities'"
        class="tab-pane flex-grow-1 overflow-auto"
      >
        <EntityPalette
          :entities-in-view="entitiesInView"
          :mobile-mode="mobileMode"
          @add-entity="$emit('add-entity', $event)"
          @remove-entity="$emit('remove-entity', $event)"
        />
      </div>

      <!-- Components Tab -->
      <div
        v-show="activeTab === 'components'"
        class="tab-pane flex-grow-1 overflow-auto"
      >
        <StaticComponentPalette
          :mobile-mode="mobileMode"
          @add-entity="$emit('add-entity', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import ViewManager from "./ViewManager.vue";
import EntityPalette from "./EntityPalette.vue";
import StaticComponentPalette from "./StaticComponentPalette.vue";

const viewManagerRef = ref(null);
defineExpose({ viewManagerRef });

defineEmits([
  "view-created",
  "view-deleted",
  "view-updated",
  "view-selected",
  "view-index-selected",
  "add-entity",
  "remove-entity",
  "entity-index-selected",
  "tab-changed",
]);

const props = defineProps({
  views: {
    type: Array,
    required: true,
  },
  selectedViewName: {
    type: String,
    default: "",
  },
  entitiesInView: {
    type: Array,
    default: () => [],
  },
  mobileMode: {
    type: Boolean,
    default: false,
  },
  initialTab: {
    type: String,
    default: "views",
  },
});

const activeTab = ref(props.initialTab);

watch(
  () => props.initialTab,
  (tab) => {
    if (tab) activeTab.value = tab;
  },
);

const tabs = [
  {
    id: "views",
    label: "Views",
    icon: "mdi-view-dashboard",
  },
  {
    id: "entities",
    label: "Entities",
    icon: "mdi-cube-outline",
  },
  {
    id: "components",
    label: "Components",
    icon: "mdi-puzzle-outline",
  },
];
</script>

<style scoped>
.left-panel-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-navigation {
  flex-shrink: 0;
  z-index: 10;
}

.tab-button {
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  outline: none;
}

.tab-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.tab-button.active {
  border-bottom: 2px solid var(--bs-primary);
  background-color: rgba(var(--bs-primary-rgb), 0.05);
}

.tab-content {
  background-color: var(--bs-body-bg);
}

.tab-pane:not([style*="display: none"]) {
  display: flex !important;
  flex-direction: column;
  width: 100%;
}

.tab-pane[style*="display: none"] {
  display: none !important;
}

.tab-pane > * {
  flex: 1;
  min-height: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tab-button {
    color: var(--bs-secondary);
  }

  .tab-button:hover {
    background-color: var(--bs-tertiary);
    color: var(--bs-body-color);
  }

  .tab-button.active {
    color: var(--bs-primary);
  }
}
</style>
