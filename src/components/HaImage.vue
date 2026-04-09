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
  <div class="col-lg-4 col-md-6">
    <div
      :class="[
        'card',
        'card-display',
        'h-100',
        'rounded-4',
        'shadow-lg',
        'border-info',
        'mx-auto',
      ]"
      :style="{
        width: `${scale * 100}%`,
        transition: 'width 0.2s ease-out',
      }"
    >
      <div
        class="card-body d-flex align-items-center justify-content-center p-0"
      >
        <img :src="resolvedUrl" :alt="title" class="ha-image-img w-100" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "Image",
  },
  scale: {
    type: Number,
    default: 1,
    validator: (value) => value > 0 && value <= 1,
  },
});

// Resolve relative URLs to absolute URLs for bundled assets or data directory
const resolvedUrl = computed(() => {
  if (
    props.url.startsWith("http://") ||
    props.url.startsWith("https://") ||
    props.url.startsWith("data:")
  ) {
    return props.url;
  }

  // For relative paths, prepend the data/ directory base path
  const baseUrl = import.meta.env.BASE_URL || "/";
  const dataBasePath = baseUrl + "data/";

  // If URL is already absolute (starts with /), treat it as relative to data/
  if (props.url.startsWith("/")) {
    return dataBasePath + props.url.substring(1);
  }

  // For relative paths, prepend data/ directory
  return dataBasePath + props.url;
});
</script>
