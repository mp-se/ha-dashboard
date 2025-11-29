<template>
  <div class="col-lg-4 col-md-6">
    <div :class="['card', 'card-display', 'h-100', 'rounded-4', 'shadow-lg', 'border-info']">
      <div class="card-body d-flex align-items-center justify-content-center p-0">
        <img :src="resolvedUrl" :alt="title" class="ha-image-img" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Image',
  },
});

// Resolve relative URLs to absolute URLs for bundled assets or data directory
const resolvedUrl = computed(() => {
  if (props.url.startsWith('http://') || props.url.startsWith('https://') || props.url.startsWith('data:')) {
    return props.url;
  }
  
  // For relative paths, prepend the data/ directory base path
  const baseUrl = import.meta.env.BASE_URL || '/';
  const dataBasePath = baseUrl + 'data/';
  
  // If URL is already absolute (starts with /), treat it as relative to data/
  if (props.url.startsWith('/')) {
    return dataBasePath + props.url.substring(1);
  }
  
  // For relative paths, prepend data/ directory
  return dataBasePath + props.url;
});
</script>

<style scoped>
.ha-image-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.375rem;
}
</style>
