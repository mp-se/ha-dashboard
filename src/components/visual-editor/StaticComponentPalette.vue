<template>
  <div class="static-component-palette p-3 border-bottom">
    <!-- Header with Toggle -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center">
        <button
          class="btn btn-link btn-sm p-0 text-decoration-none me-2"
          :class="{ 'text-muted': !isExpanded }"
          title="Toggle Static Components panel"
          @click="isExpanded = !isExpanded"
        >
          <i
            :class="`mdi ${isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'}`"
          ></i>
        </button>
        <h6 class="mb-0">Static Components</h6>
      </div>
    </div>

    <!-- Components List (only shown when expanded) -->
    <div v-if="isExpanded" class="components-list">
      <div
        v-for="component in staticComponents"
        :key="component.type"
        class="component-item mb-2"
        draggable="true"
        @dragstart="handleDragStart($event, component)"
        @dragend="handleDragEnd"
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
import { ref } from "vue";

const isExpanded = ref(true);

const staticComponents = ref([
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

.fw-500 {
  font-weight: 500;
}
</style>
