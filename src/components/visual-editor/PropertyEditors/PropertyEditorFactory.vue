<template>
  <div v-if="property" class="property-editor-factory">
    <!-- Text input -->
    <TextInput
      v-if="property.type === 'text'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :max-length="property.maxLength"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Textarea input -->
    <TextAreaInput
      v-else-if="property.type === 'textarea'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :max-length="property.maxLength"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Select input -->
    <SelectInput
      v-else-if="property.type === 'select'"
      :model-value="modelValue"
      :label="property.label"
      :options="property.options"
      :help="property.help"
      :required="property.required"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Boolean toggle -->
    <BooleanToggle
      v-else-if="property.type === 'boolean'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Entity list editor -->
    <EntityListEditor
      v-else-if="property.type === 'entity-list'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Icon picker -->
    <IconPicker
      v-else-if="property.type === 'icon'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Color picker -->
    <ColorPicker
      v-else-if="property.type === 'color'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Number input -->
    <NumberInput
      v-else-if="property.type === 'number'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :min="property.min"
      :max="property.max"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Slider input -->
    <SliderInput
      v-else-if="property.type === 'slider'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :min="property.min"
      :max="property.max"
      :step="property.step"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Image picker -->
    <ImagePicker
      v-else-if="property.type === 'image'"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :placeholder="property.placeholder"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import TextInput from "./TextInput.vue";
import TextAreaInput from "./TextAreaInput.vue";
import SelectInput from "./SelectInput.vue";
import BooleanToggle from "./BooleanToggle.vue";
import EntityListEditor from "./EntityListEditor.vue";
import IconPicker from "./IconPicker.vue";
import ColorPicker from "./ColorPicker.vue";
import NumberInput from "./NumberInput.vue";
import SliderInput from "./SliderInput.vue";
import ImagePicker from "./ImagePicker.vue";

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  property: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: [String, Number, Boolean, Array],
    default: null,
  },
  error: {
    type: String,
    default: "",
  },
});

defineEmits(["update:modelValue"]);
</script>

<style scoped>
.property-editor-factory {
  width: 100%;
}
</style>
