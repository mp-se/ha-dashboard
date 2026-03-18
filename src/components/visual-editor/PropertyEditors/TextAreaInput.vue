<template>
  <div class="property-editor">
    <label class="form-label small mb-1" :for="textareaId">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      class="form-control form-control-sm"
      rows="4"
      :maxlength="maxLength"
      :placeholder="label"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <div v-if="maxLength" class="small text-muted mt-1">
      {{ modelValue?.length || 0 }} / {{ maxLength }} characters
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
    type: String,
    default: "",
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
  maxLength: {
    type: Number,
    default: null,
  },
  error: {
    type: String,
    default: "",
  },
});

defineEmits(["update:modelValue"]);

const textareaId = computed(
  () => `textarea-input-${Math.random().toString(36).substr(2, 9)}`,
);
</script>

<style scoped>
.property-editor {
  margin-bottom: 0.75rem;
}
</style>
