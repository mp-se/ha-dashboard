<template>
  <div class="property-editor">
    <label class="form-label small mb-1" :for="selectId">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      class="form-select form-select-sm"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">-- Select {{ label }} --</option>
      <option v-for="option in optionsList" :key="optionValue(option)" :value="optionValue(option)">
        {{ optionLabel(option) }}
      </option>
    </select>
    <small v-if="help" class="text-muted d-block mt-1">{{ help }}</small>
    <small v-if="error" class="text-danger d-block mt-1">{{ error }}</small>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  help: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

defineEmits(['update:modelValue']);

const selectId = computed(() => `select-input-${Math.random().toString(36).substr(2, 9)}`);

const optionsList = computed(() => props.options);

const optionValue = (option) => {
  if (typeof option === 'string') return option;
  return option.value;
};

const optionLabel = (option) => {
  if (typeof option === 'string') return option;
  return option.label;
};
</script>

<style scoped>
.property-editor {
  margin-bottom: 0.75rem;
}
</style>
