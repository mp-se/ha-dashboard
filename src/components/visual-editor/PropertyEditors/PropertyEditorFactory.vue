<!--
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
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

    <!-- Image picker (web/Docker only) — replaced by URL input in native builds -->
    <ImagePicker
      v-else-if="property.type === 'image' && imageUpload"
      :model-value="modelValue"
      :label="property.label"
      :help="property.help"
      :required="property.required"
      :placeholder="property.placeholder"
      :error="error"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Native image: URL-only input (no upload backend available) -->
    <TextInput
      v-else-if="property.type === 'image' && !imageUpload"
      :model-value="modelValue"
      label="Image URL"
      help="Enter a URL. Use /local/ paths for images stored in your HA config/www/ folder, e.g. http://homeassistant.local:8123/local/photo.jpg"
      :required="property.required"
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

const imageUpload = window.__appCapabilities?.imageUpload ?? true;
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
