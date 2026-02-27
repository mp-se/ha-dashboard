/**
 * Composable for light color preset matching
 * Handles RGB/HS color preset matching and management
 */

import { computed } from "vue";

/**
 * Find the closest matching color preset based on HS color
 * @param {number[]} currentHs - Current HS color [hue, saturation]
 * @param {Array<{name: string, hs: number[]}>} presets - Available color presets
 * @param {number} tolerance - Maximum difference to consider a match (default: 50)
 * @returns {object | null} Closest matching preset or null
 */
export function findClosestColorPreset(currentHs, presets, tolerance = 50) {
  if (!currentHs || !Array.isArray(currentHs) || currentHs.length < 2) {
    return null;
  }

  const [currentHue, currentSat] = currentHs;

  let closestPreset = null;
  let smallestDiff = Infinity;

  for (const preset of presets) {
    const [presetHue, presetSat] = preset.hs;

    // Calculate hue difference (accounting for 360° wraparound)
    let hueDiff = Math.abs(currentHue - presetHue);
    hueDiff = Math.min(hueDiff, 360 - hueDiff);

    // Calculate saturation difference
    const satDiff = Math.abs(currentSat - presetSat);

    // Combined difference (weighted - saturation matters more for matching)
    const totalDiff = hueDiff + satDiff * 2;

    if (totalDiff < smallestDiff) {
      smallestDiff = totalDiff;
      closestPreset = preset;
    }
  }

  // Only consider it a match if within tolerance
  return smallestDiff <= tolerance ? closestPreset : null;
}

/**
 * Composable for light color preset management
 * @param {import('vue').ComputedRef<object>} entityAttrs - Entity attributes
 * @param {Array<{name: string, color: string, hs: number[]}>} colorPresets - Available presets
 * @returns {object} Color preset utilities
 */
export function useLightColorPresets(entityAttrs, colorPresets) {
  /**
   * Find the active (closest matching) color preset
   */
  const activeColorPreset = computed(() => {
    const currentHs = entityAttrs.value.hs_color;
    return findClosestColorPreset(currentHs, colorPresets);
  });

  return {
    activeColorPreset,
  };
}
