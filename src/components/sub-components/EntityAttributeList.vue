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
  <div
    v-if="attributes && attributes.length > 0"
    class="ha-attribute-list-container mt-1"
  >
    <div
      v-for="[label, value] in attributes"
      :key="label"
      class="small d-flex gap-2 mb-0"
    >
      <div class="ha-attribute-key">
        {{ label }}:
        <span class="ha-attribute-value">{{ value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  attributes: {
    type: Array, // Array of [label, value] pairs
    default: () => [],
  },
});
</script>
