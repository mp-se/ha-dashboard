<template>
  <div class="col-lg-4 col-md-6">
    <!-- Invisible spacer -->
  </div>
</template>

<script setup>
defineProps({
  // Added attributes prop for consistency across components
  attributes: { type: Array, default: () => [] },
});
// Spacer card component for layout purposes
// Provides consistent spacing in dashboard layouts
</script>

<style scoped>
/* Spacer card specific styles if needed */
</style>
