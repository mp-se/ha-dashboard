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
const attributes = computed(() => resolvedEntity.value?.attributes || {});

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
  const b = attributes.value.brightness;
  if (b === undefined || b === null) return null;
  const pct = Math.round((Number(b) / 255) * 100);
  return Number.isNaN(pct) ? null : pct;
});

// Check if light supports brightness control
const supportsBrightness = computed(() => {
  // Check if brightness is supported via color modes OR if the light has brightness attribute
  const colorModes = attributes.value.supported_color_modes;
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
  const colorModes = attributes.value.supported_color_modes;
  return (
    colorModes &&
    (Array.isArray(colorModes)
      ? colorModes.includes("color_temp")
      : colorModes === "color_temp")
  );
});

// Check if light supports color (HS/RGB modes)
const supportsColor = computed(() => {
  const colorModes = attributes.value.supported_color_modes;
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

// Get supported presets based on light's capabilities
const supportedPresets = computed(() => {
  const minKelvin = attributes.value.min_color_temp_kelvin || 2200;
  const maxKelvin = attributes.value.max_color_temp_kelvin || 6500;

  return colorTempPresets.filter(
    (preset) => preset.kelvin >= minKelvin && preset.kelvin <= maxKelvin,
  );
});

// Get color style for temperature presets
const getPresetColor = (kelvin) => {
  switch (kelvin) {
    case 2700:
      return { backgroundColor: "#FFB366" }; // Warm orange
    case 3000:
      return { backgroundColor: "#FFCC80" }; // Soft yellow
    case 4000:
      return { backgroundColor: "#E8F4FD" }; // Cool white
    case 5000:
      return { backgroundColor: "#F0F8FF" }; // Daylight white
    case 6500:
      return { backgroundColor: "#E3F2FD" }; // Cold blue-white
    default:
      return { backgroundColor: "#6c757d" }; // Gray fallback
  }
};

// Color temperature ranges
const minMireds = computed(() => attributes.value.min_mireds || 250);

// Current color temperature in mireds
const colorTempMireds = computed(
  () => attributes.value.color_temp || minMireds.value,
);

// Convert mireds to kelvin for display
const colorTempKelvin = computed(() => {
  const mireds = colorTempMireds.value;
  return mireds > 0 ? Math.round(1000000 / mireds) : 0;
});

// Current color temperature in kelvin (for preset matching)
const currentColorTempKelvin = computed(() => colorTempKelvin.value);

// Find the closest matching preset
const activePreset = computed(() => {
  const currentKelvin = currentColorTempKelvin.value;
  if (!currentKelvin || currentKelvin === 0) return null;

  // Find the preset with the smallest difference (only from supported presets)
  let closestPreset = null;
  let smallestDiff = Infinity;

  for (const preset of supportedPresets.value) {
    const diff = Math.abs(preset.kelvin - currentKelvin);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestPreset = preset;
    }
  }

  // Only consider it a match if within 150K tolerance
  return smallestDiff <= 150 ? closestPreset : null;
});

// Find the closest matching color preset
const activeColorPreset = computed(() => {
  const currentHs = attributes.value.hs_color;
  if (!currentHs || !Array.isArray(currentHs) || currentHs.length < 2)
    return null;

  const [currentHue, currentSat] = currentHs;

  // Find the preset with the smallest difference
  let closestPreset = null;
  let smallestDiff = Infinity;

  for (const preset of colorPresets) {
    const [presetHue, presetSat] = preset.hs;
    // Calculate hue difference (accounting for 360° wraparound)
    let hueDiff = Math.abs(currentHue - presetHue);
    hueDiff = Math.min(hueDiff, 360 - hueDiff);
    // Calculate saturation difference
    const satDiff = Math.abs(currentSat - presetSat);
    // Combined difference (weighted)
    const totalDiff = hueDiff + satDiff * 2;

    if (totalDiff < smallestDiff) {
      smallestDiff = totalDiff;
      closestPreset = preset;
    }
  }

  // Only consider it a match if within reasonable tolerance
  return smallestDiff <= 50 ? closestPreset : null;
});

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

// Control circle color based on light state
const controlCircleColor = computed(() => {
  if (isDisabled.value) return "#6c757d"; // Gray for unavailable
  if (!isOn.value) return "#e9ecef"; // Light gray for off

  // Show actual light color if supported
  if (supportsColor.value && attributes.value.hs_color) {
    const [hue, sat] = attributes.value.hs_color;
    // Convert HSV to RGB for display, using brightness for intensity
    const brightness = attributes.value.brightness || 255;
    const v = (brightness / 255) * 0.8 + 0.2; // Scale 0.2-1.0

    const h = hue / 60;
    const s = sat / 100;
    const c = v * s;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = v - c;
    let r, g, b;

    if (h >= 0 && h < 1) [r, g, b] = [c, x, 0];
    else if (h >= 1 && h < 2) [r, g, b] = [x, c, 0];
    else if (h >= 2 && h < 3) [r, g, b] = [0, c, x];
    else if (h >= 3 && h < 4) [r, g, b] = [0, x, c];
    else if (h >= 4 && h < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    const toHex = (v) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Show color temp as gradient if supported
  if (
    supportsColorTemp.value &&
    !supportsColor.value &&
    attributes.value.color_temp
  ) {
    const mireds = attributes.value.color_temp;
    const kelvin = mireds > 0 ? Math.round(1000000 / mireds) : 5000;

    // Match to the closest supported preset to get consistent colors
    let closestPreset = null;
    let smallestDiff = Infinity;

    for (const preset of supportedPresets.value) {
      const diff = Math.abs(preset.kelvin - kelvin);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestPreset = preset;
      }
    }

    if (closestPreset) {
      return getPresetColor(closestPreset.kelvin).backgroundColor;
    }

    // Fallback if no preset matches
    if (kelvin <= 2700)
      return "#FFB366"; // Warm orange
    else if (kelvin <= 3000)
      return "#FFCC80"; // Soft yellow
    else if (kelvin <= 4000)
      return "#E8F4FD"; // Cool white
    else if (kelvin <= 5000)
      return "#F0F8FF"; // Daylight white
    else return "#E3F2FD"; // Cold blue-white
  }

  // Default yellow for simple on/off lights
  return "#FFC107";
});

// Icon color - black for light backgrounds, white for dark backgrounds
const iconColor = computed(() => {
  if (!isOn.value) return "white"; // White icon when off

  // Prefer color temperature when available: if the light is showing a cool white
  // (e.g. >= 4000K) then the icon should be dark for contrast.
  try {
    if (supportsColorTemp.value && attributes.value.color_temp) {
      const mireds = attributes.value.color_temp;
      const kelvin = mireds > 0 ? Math.round(1000000 / mireds) : 0;
      const COOL_WHITE_KELVIN = 4000;
      if (kelvin >= COOL_WHITE_KELVIN) return "#333";
    }
  } catch (err) {
    // ignore and fall through to luminance check
    // console.warn('Error computing kelvin for iconColor:', err);
  }

  // If the control color is explicitly white (or close to it), prefer dark icon
  const color = (controlCircleColor.value || "").toLowerCase();
  if (color === "#ffffff" || color === "white") return "#333";

  // Convert hex color to RGB and compute luminance. If it's a light color, use dark icon.
  const hexToRgb = (h) => {
    if (!h) return null;
    let hex = h.trim();
    if (hex.startsWith("#")) hex = hex.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  };

  const rgb = hexToRgb(color);
  if (!rgb) return "white";

  const srgbToLinear = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const rLin = srgbToLinear(rgb.r);
  const gLin = srgbToLinear(rgb.g);
  const bLin = srgbToLinear(rgb.b);
  const luminance = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;

  // Only very light backgrounds should get a dark icon; tune threshold high
  const LUMINANCE_THRESHOLD = 0.9;

  // Some common very pale colors that should definitely use a dark icon
  const explicitLightColors = new Set([
    "#ffffff",
    "#fff",
    "#f0f8ff",
    "#e8f4fd",
    "#e3f2fd",
  ]);
  if (explicitLightColors.has(color)) return "#333";

  // threshold tuned high so only whites and very pale colors get dark icon
  return luminance >= LUMINANCE_THRESHOLD ? "#333" : "white";
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name ||
    resolvedEntity.value?.entity_id ||
    "Unknown",
);
</script>

<style scoped>
.badge {
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.35em 0.6em;
}

.form-check.form-switch {
  padding: 0;
}

.preset-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: inherit;
}

.preset-btn-icon:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.preset-btn-icon.active-preset {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  color: #333;
}

.preset-btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-preset-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-preset-btn-icon.white-preset {
  color: #333;
  background-color: #ffffff !important;
}

.color-preset-btn-icon:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.color-preset-btn-icon.active-color {
  border-color: #fff;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-preset-btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
