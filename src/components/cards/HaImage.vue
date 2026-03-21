<template>
  <div
    :class="[
      'card',
      'card-display',
      'h-100',
      'rounded-4',
      'shadow-lg',
      'border-info',
    ]"
  >
    <div class="card-body d-flex align-items-center justify-content-center p-0">
      <div :style="{ transform: `scale(${scale})`, transformOrigin: 'center' }">
        <img :src="resolvedUrl" :alt="title" class="ha-image-img" />
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
  },
});

const getApiServerUrl = () => {
  // Try to get API server from localStorage config
  const stored = localStorage.getItem("ha-dashboard-server-config");
  if (stored) {
    try {
      const config = JSON.parse(stored);
      if (config.api_url) return config.api_url;
    } catch (e) {
      console.error("Error parsing server config", e);
    }
  }
  // In development, the Vite proxy will handle /api/ requests
  // In production, /api/ is proxied by Nginx
  return "";
};

// Resolve relative URLs to absolute URLs for bundled assets or data directory
const resolvedUrl = computed(() => {
  if (
    props.url.startsWith("http://") ||
    props.url.startsWith("https://") ||
    props.url.startsWith("data:")
  ) {
    return props.url;
  }

  // Handle API endpoints (e.g., /api/images/)
  if (props.url.startsWith("/api/")) {
    const apiServer = getApiServerUrl();
    return apiServer ? apiServer + props.url : props.url;
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
