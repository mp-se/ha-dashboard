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
  <div>
    <h1 class="h3 mb-4 text-center">
      <i v-if="normalizedIcon" :class="normalizedIcon" class="me-2"></i>
      {{ name }}
    </h1>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useNormalizeIcon } from "@/composables/useNormalizeIcon";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: null,
  },
});

const normalizeIcon = useNormalizeIcon();

const normalizedIcon = computed(() => {
  return normalizeIcon(props.icon);
});
</script>
