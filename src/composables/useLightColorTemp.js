/**
 * Composable for light color temperature calculations and conversions
 * Handles mireds/kelvin conversions and preset matching
 */

import { computed } from "vue";

/**
 * Convert mireds to kelvin
 * @param {number} mireds - Color temperature in mireds
 * @returns {number} Color temperature in kelvin
 */
export function miredsToKelvin(mireds) {
  return mireds > 0 ? Math.round(1000000 / mireds) : 0;
}

/**
 * Convert kelvin to mireds
 * @param {number} kelvin - Color temperature in kelvin
 * @returns {number} Color temperature in mireds
 */
export function kelvinToMireds(kelvin) {
  return kelvin > 0 ? Math.round(1000000 / kelvin) : 0;
}

/**
 * Get color style for a color temperature preset
 * @param {number} kelvin - Temperature in kelvin
 * @returns {{ backgroundColor: string }} Style object with background color
 */
export function getPresetColor(kelvin) {
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
}

/**
 * Find the closest matching preset from a list
 * @param {number} currentKelvin - Current temperature in kelvin
 * @param {Array<{kelvin: number}>} presets - Array of preset objects
 * @param {number} tolerance - Maximum kelvin difference to consider a match (default: 150)
 * @returns {object | null} Closest matching preset or null
 */
export function findClosestPreset(currentKelvin, presets, tolerance = 150) {
  if (!currentKelvin || currentKelvin === 0) return null;
  if (!presets || presets.length === 0) return null;

  let closestPreset = null;
  let smallestDiff = Infinity;

  for (const preset of presets) {
    const diff = Math.abs(preset.kelvin - currentKelvin);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestPreset = preset;
    }
  }

  // Only consider it a match if within tolerance
  return smallestDiff <= tolerance ? closestPreset : null;
}

/**
 * Composable for light color temperature management
 * @param {import('vue').ComputedRef<object>} entityAttrs - Entity attributes
 * @param {Array<{name: string, kelvin: number}>} colorTempPresets - Available presets
 * @returns {object} Color temperature utilities
 */
export function useLightColorTemp(entityAttrs, colorTempPresets) {
  /**
   * Get supported presets based on light's capabilities
   */
  const supportedPresets = computed(() => {
    const minKelvin = entityAttrs.value.min_color_temp_kelvin || 2200;
    const maxKelvin = entityAttrs.value.max_color_temp_kelvin || 6500;

    return colorTempPresets.filter(
      (preset) => preset.kelvin >= minKelvin && preset.kelvin <= maxKelvin,
    );
  });

  /**
   * Get minimum mireds supported by the light
   */
  const minMireds = computed(() => entityAttrs.value.min_mireds || 250);

  /**
   * Get current color temperature in mireds
   */
  const colorTempMireds = computed(
    () => entityAttrs.value.color_temp || minMireds.value,
  );

  /**
   * Get current color temperature in kelvin
   */
  const colorTempKelvin = computed(() =>
    miredsToKelvin(colorTempMireds.value),
  );

  /**
   * Find the active (closest matching) preset
   */
  const activePreset = computed(() =>
    findClosestPreset(colorTempKelvin.value, supportedPresets.value),
  );

  return {
    supportedPresets,
    minMireds,
    colorTempMireds,
    colorTempKelvin,
    activePreset,
    miredsToKelvin,
    kelvinToMireds,
    getPresetColor,
  };
}
