<template>
  <div class="property-editor">
    <label class="form-label small mb-2">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div class="color-picker">
      <!-- Color palette with common Bootstrap colors -->
      <div class="color-grid">
        <button
          v-for="color in colorPalette"
          :key="color.hex"
          type="button"
          class="color-btn"
          :style="{ backgroundColor: color.hex }"
          :class="{ active: modelValue === color.hex }"
          :title="color.name"
          @click="$emit('update:modelValue', color.hex)"
        >
          <i
            v-if="modelValue === color.hex"
            class="mdi mdi-check text-white"
          ></i>
        </button>
      </div>

      <!-- Custom color input -->
      <div class="mt-2">
        <div class="input-group input-group-sm">
          <input
            :value="modelValue"
            type="text"
            class="form-control"
            placeholder="#000000"
            @input="$emit('update:modelValue', $event.target.value)"
          />
          <input
            :value="modelValue"
            type="color"
            class="btn btn-outline-secondary"
            style="width: 40px; padding: 0.25rem"
            @input="$emit('update:modelValue', $event.target.value)"
          />
        </div>
      </div>

      <!-- Current color display -->
      <div v-if="modelValue" class="mt-2">
        <div
          class="current-color"
          :style="{ backgroundColor: modelValue }"
        ></div>
      </div>
    </div>

    <small v-if="help" class="text-muted d-block mt-2">{{ help }}</small>
    <small v-if="error" class="text-danger d-block mt-2">{{ error }}</small>
  </div>
</template>

<script setup>
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
  error: {
    type: String,
    default: "",
  },
});

defineEmits(["update:modelValue"]);

const colorPalette = [
  { name: "Primary", hex: "#0d6efd" },
  { name: "Secondary", hex: "#6c757d" },
  { name: "Success", hex: "#198754" },
  { name: "Danger", hex: "#dc3545" },
  { name: "Warning", hex: "#ffc107" },
  { name: "Info", hex: "#0dcaf0" },
  { name: "Light", hex: "#f8f9fa" },
  { name: "Dark", hex: "#212529" },
  { name: "Red", hex: "#e74c3c" },
  { name: "Orange", hex: "#e67e22" },
  { name: "Yellow", hex: "#f1c40f" },
  { name: "Green", hex: "#27ae60" },
  { name: "Blue", hex: "#3498db" },
  { name: "Purple", hex: "#9b59b6" },
  { name: "Pink", hex: "#e91e63" },
  { name: "Cyan", hex: "#00bcd4" },
];
</script>

<style scoped>
.color-picker {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  background-color: #f8f9fa;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 0.5rem;
}

.color-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-btn:hover {
  border-color: #0d6efd;
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}

.current-color {
  width: 100%;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}
</style>
