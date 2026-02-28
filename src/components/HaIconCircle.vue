<template>
  <div v-if="iconClass" :class="['ha-icon-circle-wrapper', sizeClass]">
    <div
      :class="['icon-bg', variantClass]"
      :style="{ backgroundColor: iconCircleColor }"
    >
      <i :class="[iconClass, overlayClass]"></i>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useIconClass } from "@/composables/useIconClass";
import { useIconCircleColor } from "@/composables/useIconCircleColor";

const props = defineProps({
  entityId: {
    type: String,
    required: true,
  },
  resolvedEntity: {
    type: Object,
    required: false,
    default: null,
  },
  size: {
    type: String, // 'small', 'medium', 'large'
    default: "medium",
  },
});

const sizeClass = computed(() => {
  if (props.size === "small") return "flex-shrink-0";
  if (props.size === "large") return "flex-shrink-0 mb-3";
  return "flex-shrink-0";
});

const variantClass = computed(() => {
  if (props.size === "small") return "icon-bg-small";
  return "icon-bg";
});

const overlayClass = computed(() => {
  if (props.size === "small") return "icon-overlay-small";
  return "ha-icon-overlay";
});

const iconClass = computed(() => {
  return useIconClass(props.resolvedEntity, props.entityId);
});

const iconCircleColor = computed(() => {
  return useIconCircleColor(props.resolvedEntity, props.entityId);
});
</script>
