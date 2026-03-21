<script setup>
defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 1,
  },
  step: {
    type: Number,
    default: 0.1,
  },
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="slider-input mb-3">
    <label v-if="label" class="form-label d-flex justify-content-between">
      <span>{{ label }}</span>
      <span class="badge bg-secondary">{{ modelValue }}</span>
    </label>
    <input
      type="range"
      class="form-range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="$emit('update:modelValue', parseFloat($event.target.value))"
    />
  </div>
</template>

<style scoped>
.slider-input {
  width: 100%;
}
</style>
