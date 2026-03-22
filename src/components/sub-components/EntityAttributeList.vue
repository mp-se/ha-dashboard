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
