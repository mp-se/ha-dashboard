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
