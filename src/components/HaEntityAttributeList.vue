<template>
  <div v-if="attributes.length > 0" class="ha-attribute-list-container mt-1">
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
    required: true,
  },
});
</script>

<style scoped>
.ha-attribute-key {
  color: var(--bs-secondary-color, #6c757d);
  font-weight: 500;
}

.ha-attribute-value {
  color: var(--bs-body-color, #212529);
  font-weight: 400;
}
</style>
