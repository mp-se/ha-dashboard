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
  <div class="card card-display h-100 rounded-4 shadow-lg">
    <div class="card-body d-flex align-items-center">
      <div class="text-start flex-grow-1">
        <h6 class="card-title mb-1">{{ header }}</h6>
        <a
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-decoration-none"
        >
          {{ name }}
        </a>
      </div>
      <div class="d-flex align-items-center">
        <i
          class="mdi mdi-open-in-new"
          style="font-size: 1.5rem; color: #6c757d"
        ></i>
      </div>
    </div>
  </div>
</template>

<script setup>
// eslint-disable-next-line no-unused-vars
const props = defineProps({
  entity: {
    type: [Object, String],
    required: false,
    default: null,
  },
  attributes: { type: Array, default: () => [] },
  url: { type: String, required: true },
  name: { type: String, required: true },
  header: { type: String, required: true },
});

// Note: entity and attributes props are included for consistency with other components but not currently used
</script>
