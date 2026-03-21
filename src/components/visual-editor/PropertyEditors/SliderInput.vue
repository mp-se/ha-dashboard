<template>
  <div class="property-editor">
    <label class="form-label small mb-1" :for="inputId">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>
    <div class="d-flex gap-2 align-items-center">
      <input
        :id="inputId"
        type="range"
        class="form-range flex-grow-1"
        :min="min"
        :max="max"
        :step="step"
        :value="Number(modelValue)"
        @input="
          emit('update:modelValue', Number(parseFloat($event.target.value)))
        "
      />
      <span
        class="badge bg-secondary"
        style="min-width: 50px; text-align: center"
      >
        {{ Number(modelValue).toFixed(1) }}
      </span>
    </div>
    <small v-if="help" class="text-muted d-block mt-1">{{ help }}</small>
    <small v-if="error" class="text-danger d-block mt-1">{{ error }}</small>
  </div>
</template>

<script setup>
import { computed } from "vue";

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  label: {
    type: String,
    required: true,
  },
  help: {
    type: String,
    default: "",
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
  min: {
    type: Number,
    default: 0.1,
  },
  max: {
    type: Number,
    default: 2,
  },
  step: {
    type: Number,
    default: 0.1,
  },
});

const emit = defineEmits(["update:modelValue"]);

const inputId = computed(
  () => `slider-${Math.random().toString(36).substr(2, 9)}`,
);
</script>

<style scoped>
.form-range {
  cursor: pointer;
}

.badge {
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
}
</style>
