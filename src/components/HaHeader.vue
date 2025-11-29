<template>
  <div class="row">
    <div class="col-md-12">
      <h1 class="h3 mb-4 text-center">
        <i v-if="icon" :class="icon" class="me-2"></i>
        {{ name }}
      </h1>
    </div>
  </div>
</template>

<script setup>
// eslint-disable-next-line no-unused-vars
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
</script>

<style scoped></style>
