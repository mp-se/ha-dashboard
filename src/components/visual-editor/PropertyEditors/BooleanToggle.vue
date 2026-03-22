<template>
  <div class="property-editor">
    <label class="form-label small mb-1">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>
    <div class="form-check form-switch">
      <input
        :id="toggleId"
        :checked="modelValue"
        type="checkbox"
        class="form-check-input"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <label :for="toggleId" class="form-check-label small">
        {{ modelValue ? "Yes" : "No" }}
      </label>
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
    type: Boolean,
    default: false,
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
});

defineEmits(["update:modelValue"]);

const toggleId = computed(
  () => `toggle-input-${Math.random().toString(36).substr(2, 9)}`,
);
</script>
