<template>
  <div class="col-lg-4 col-md-6">
    <div class="card card-display h-100 rounded-4 shadow-lg">
      <div class="card-body d-flex align-items-center">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-1">{{ header }}</h6>
          <a :href="url" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
            {{ name }}
          </a>
        </div>
        <div class="d-flex align-items-center">
          <i class="mdi mdi-open-in-new" style="font-size: 1.5rem; color: #6c757d"></i>
        </div>
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

<style scoped>
/* Custom styles if needed */
</style>
