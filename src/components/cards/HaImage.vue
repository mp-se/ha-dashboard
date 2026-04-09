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
    :class="['card', 'card-display', 'rounded-4', 'shadow-lg', 'border-info']"
    :style="{
      width: `${scale * 100}%`,
      margin: '0 auto',
      transition: 'width 0.2s ease-out',
    }"
  >
    <div
      class="card-body d-flex align-items-center justify-content-center p-0 overflow-hidden"
    >
      <div
        v-if="resolvedUrl"
        class="w-100 d-flex align-items-center justify-content-center"
      >
        <img
          :src="resolvedUrl"
          :alt="title"
          class="ha-image-img"
          style="width: 100%; height: auto; display: block"
        />
      </div>
      <div v-else class="text-center text-muted p-4">
        <i class="mdi mdi-image-off mdi-48px mb-2"></i>
        <div class="small">No image selected</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  url: {
    type: String,
    default: "",
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

const getApiServerUrl = () => {
  // Try to get API server from localStorage config first
  const stored = localStorage.getItem("ha-dashboard-server-config");
  if (stored) {
    try {
      const config = JSON.parse(stored);
      if (config.api_url) return config.api_url;
    } catch {
      // Ignore parse errors, fall through to next option
    }
  }
  // In development environments, return the current origin
  // The Vite dev server proxies /api/* to the backend
  // In production, Nginx proxies /api/* to the backend
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    // Dev environment - use current origin which includes Vite dev server proxy
    return window.location.origin;
  }
  // Return empty string - browser will use relative URLs which work with Nginx proxy
  return "";
};

// Resolve relative URLs to absolute URLs for bundled assets or data directory
const resolvedUrl = computed(() => {
  // Guard against undefined or empty url
  if (!props.url || typeof props.url !== "string" || props.url.trim() === "") {
    return "";
  }

  // Absolute URLs - use as-is
  if (
    props.url.startsWith("http://") ||
    props.url.startsWith("https://") ||
    props.url.startsWith("data:")
  ) {
    return props.url;
  }

  // Handle /data/ paths (served directly by nginx) - use as-is
  if (props.url.startsWith("/data/")) {
    return props.url;
  }

  // Handle API endpoints (e.g., /api/images/)
  if (props.url.startsWith("/api/")) {
    const apiServer = getApiServerUrl();
    // Only prepend apiServer if it's not empty and doesn't duplicate the protocol
    if (apiServer && !apiServer.includes("://")) {
      return apiServer + props.url;
    }
    // Use as-is (relative URL that will be proxied by dev server or Nginx)
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
