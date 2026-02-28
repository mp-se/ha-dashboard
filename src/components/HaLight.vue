<template>
  <div class="col-lg-4 col-md-6">
    <div
      :class="[
        'card',
        'card-control',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : cardBorderClass,
      ]"
    >
      <div
        :class="[
          'card-body',
          !resolvedEntity ? 'text-center text-warning' : 'd-flex flex-column',
        ]"
      >
        <i
          v-if="!resolvedEntity"
          class="mdi mdi-alert-circle mdi-24px mb-2"
        ></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === "string" ? entity : entity?.entity_id }}"
          not found
        </div>
        <template v-else>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="text-start flex-grow-1">
              <h6 class="card-title mb-0">{{ name }}</h6>
            </div>
            <button
              class="ha-control-button"
              :class="{ 'control-button-on': isOn && !isDisabled }"
              :disabled="isDisabled || isLoading"
              :title="isOn ? 'Turn off' : 'Turn on'"
              :aria-label="isOn ? 'Turn off light' : 'Turn on light'"
              @click="isOn = !isOn"
            >
              <div class="ha-control-circle-wrapper">
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                  class="ha-control-circle"
                >
                  <circle cx="25" cy="25" r="22" :fill="controlCircleColor" />
                </svg>
                <i
                  class="mdi mdi-lightbulb ha-control-icon"
                  :style="{ color: iconColor }"
                ></i>
              </div>
            </button>
          </div>
          <!-- Brightness slider for dimmable lights -->
          <div class="mt-auto">
            <div
              v-if="supportsBrightness"
              class="d-flex align-items-center gap-2 mb-2"
            >
              <input
                :id="`brightness-${resolvedEntity.entity_id}`"
                v-model="brightnessSliderValue"
                type="range"
                class="form-range flex-grow-1"
                min="0"
                max="100"
                :disabled="isDisabled || !isOn"
                @input="handleBrightnessChange"
              />
              <span class="text-muted small" style="min-width: 45px"
                >{{ brightnessPct }}%</span
              >
            </div>

            <!-- Color temperature presets for color temperature lights -->
            <div
              v-if="supportsColorTemp && !supportsColor && isOn"
              class="mb-2"
            >
              <div class="d-flex gap-2 flex-wrap justify-content-center">
                <button
                  v-for="preset in supportedPresets"
                  :key="preset.kelvin"
                  type="button"
                  class="preset-btn-icon"
                  :class="{
                    'active-preset': activePreset?.kelvin === preset.kelvin,
                  }"
                  :style="getPresetColor(preset.kelvin)"
                  :disabled="isDisabled || !isOn"
                  :title="preset.name"
                  :aria-label="`Set color temperature to ${preset.name}`"
                  @click="setColorTempPreset(preset.kelvin)"
                >
                  <i class="mdi mdi-lightbulb-on-90"></i>
                </button>
              </div>
            </div>

            <!-- Color presets for color lights -->
            <div v-if="supportsColor && isOn" class="mb-2">
              <div class="d-flex gap-2 flex-wrap justify-content-center">
                <button
                  v-for="preset in colorPresets"
                  :key="preset.name"
                  type="button"
                  class="color-preset-btn-icon"
                  :class="{
                    'active-color': activeColorPreset?.name === preset.name,
                    'white-preset': preset.name === 'White',
                  }"
                  :style="{
                    backgroundColor: preset.color,
                  }"
                  :disabled="isDisabled || !isOn"
                  :title="preset.name"
                  @click="setColorPreset(preset)"
                >
                  <i class="mdi mdi-palette"></i>
                </button>
              </div>
            </div>

            <!-- Spacer for non-dimmable lights to maintain consistent height -->
            <div
              v-if="!supportsBrightness && !supportsColorTemp"
              class="d-flex align-items-center gap-2"
              style="visibility: hidden"
            >
              <input type="range" class="form-range flex-grow-1" disabled />
              <span class="text-muted small" style="min-width: 45px">100%</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useEntityResolver } from "@/composables/useEntityResolver";
import { useServiceCall } from "@/composables/useServiceCall";
import { useLightColor } from "@/composables/useLightColor";
import {
  useLightColorTemp,
  getPresetColor,
} from "@/composables/useLightColorTemp";
import { useLightColorPresets } from "@/composables/useLightColorPresets";

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === "string") {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === "object") {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
  // optional list of attribute keys to show (kept for API consistency across components)
  attributes: {
    type: Array,
    default: () => [],
  },
});

const { callService, isLoading } = useServiceCall();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(computed(() => props.entity));

const state = computed(() => resolvedEntity.value?.state ?? "unknown");
const entityAttrs = computed(() => resolvedEntity.value?.attributes || {});

const isDisabled = computed(() =>
  ["unavailable", "unknown"].includes(state.value),
);

// toggling state to prevent duplicate calls
const isOn = computed({
  get() {
    return state.value === "on";
  },
  async set(value) {
    if (!resolvedEntity.value || isLoading.value) return;
    const service = value ? "turn_on" : "turn_off";
    await callService("light", service, {
      entity_id: resolvedEntity.value.entity_id,
    });
  },
});

// Brightness in Home Assistant is 0-255; convert to percent if present
const brightnessPct = computed(() => {
  const b = entityAttrs.value.brightness;
  if (b === undefined || b === null) return null;
  const pct = Math.round((Number(b) / 255) * 100);
  return Number.isNaN(pct) ? null : pct;
});

// Check if light supports brightness control
const supportsBrightness = computed(() => {
  // Check if brightness is supported via color modes OR if the light has brightness attribute
  const colorModes = entityAttrs.value.supported_color_modes;
  const hasBrightnessMode =
    colorModes &&
    (Array.isArray(colorModes)
      ? colorModes.includes("brightness")
      : colorModes === "brightness");
  // Also check for other color modes that imply brightness control
  const hasOtherBrightnessModes =
    colorModes &&
    Array.isArray(colorModes) &&
    colorModes.some((mode) =>
      ["hs", "xy", "rgb", "rgbw", "rgbww", "color_temp"].includes(mode),
    );

  return hasBrightnessMode || hasOtherBrightnessModes;
});

// Check if light supports color temperature
const supportsColorTemp = computed(() => {
  const colorModes = entityAttrs.value.supported_color_modes;
  return (
    colorModes &&
    (Array.isArray(colorModes)
      ? colorModes.includes("color_temp")
      : colorModes === "color_temp")
  );
});

// Check if light supports color (HS/RGB modes)
const supportsColor = computed(() => {
  const colorModes = entityAttrs.value.supported_color_modes;
  const hasColorMode =
    colorModes &&
    (Array.isArray(colorModes)
      ? colorModes.some((mode) =>
          ["hs", "rgb", "rgbw", "rgbww", "xy"].includes(mode),
        )
      : ["hs", "rgb", "rgbw", "rgbww", "xy"].includes(colorModes));
  return hasColorMode;
});

// Color presets (standard colors)
const colorPresets = [
  { name: "Red", color: "#FF0000", hs: [0, 100] },
  { name: "Orange", color: "#FFA500", hs: [30, 100] },
  { name: "Yellow", color: "#FFFF00", hs: [60, 100] },
  { name: "Green", color: "#00FF00", hs: [120, 100] },
  { name: "Cyan", color: "#00FFFF", hs: [180, 100] },
  { name: "Blue", color: "#0000FF", hs: [240, 100] },
  { name: "Purple", color: "#800080", hs: [270, 100] },
  { name: "Magenta", color: "#FF00FF", hs: [300, 100] },
  { name: "Pink", color: "#FFC0CB", hs: [330, 75] },
  { name: "White", color: "#FFFFFF", hs: [0, 0] },
];

// Color temperature presets (standard lighting temperatures)
const colorTempPresets = [
  { name: "Warm", kelvin: 2700 },
  { name: "Soft", kelvin: 3000 },
  { name: "Cool", kelvin: 4000 },
  { name: "Daylight", kelvin: 5000 },
  { name: "Cold", kelvin: 6500 },
];

// Use color temperature composable
const { supportedPresets, activePreset } = useLightColorTemp(
  entityAttrs,
  colorTempPresets,
);

// Use color presets composable
const { activeColorPreset } = useLightColorPresets(entityAttrs, colorPresets);

// Set color preset
const setColorPreset = async (preset) => {
  if (!resolvedEntity.value) return;
  await callService("light", "turn_on", {
    entity_id: resolvedEntity.value.entity_id,
    hs_color: preset.hs,
  });
};

// Set color temperature preset
const setColorTempPreset = async (kelvin) => {
  if (!resolvedEntity.value) return;
  // Convert kelvin to mireds
  const mireds = Math.round(1000000 / kelvin);
  await callService("light", "turn_on", {
    entity_id: resolvedEntity.value.entity_id,
    color_temp: mireds,
  });
};

// Reactive value for brightness slider (0-100)
const brightnessSliderValue = ref(brightnessPct.value || 50);

// Update slider when brightness changes from HA
watch(brightnessPct, (newPct) => {
  if (newPct !== null) {
    brightnessSliderValue.value = newPct;
  }
});

// Handle brightness slider changes
const handleBrightnessChange = async (event) => {
  const newPct = parseInt(event.target.value);
  brightnessSliderValue.value = newPct;

  if (!resolvedEntity.value) return;

  // Convert percentage to 0-255 range for HA
  const brightness = Math.round((newPct / 100) * 255);
  await callService("light", "turn_on", {
    entity_id: resolvedEntity.value.entity_id,
    brightness: brightness,
  });
};

const cardBorderClass = computed(() => {
  if (isDisabled.value) return "border-warning";
  return "border-secondary";
});

// Friendly name for the card
const name = computed(() => {
  if (!resolvedEntity.value) return "Light";
  return (
    entityAttrs.value.friendly_name || resolvedEntity.value.entity_id || "Light"
  );
});

// Use color calculation composable
const { controlCircleColor, iconColor } = useLightColor(
  entityAttrs,
  isOn,
  supportsColor,
  supportsColorTemp,
  isDisabled,
  getPresetColor,
  supportedPresets,
);
</script>
