/**
 * Composable for light color preset matching
 * Handles RGB/HS color preset matching and management
 */

import { computed, ComputedRef } from "vue";

interface ColorPreset {
  name: string;
  hs: number[];
}

interface LightColorPresetsReturn {
  activeColorPreset: ComputedRef<ColorPreset | null>;
}

/**
 * Find the closest matching color preset based on HS color
 * @param currentHs - Current HS color [hue, saturation]
 * @param presets - Available color presets
 * @param tolerance - Maximum difference to consider a match (default: 50)
 * @returns Closest matching preset or null
 */
export function findClosestColorPreset(
  currentHs: number[] | null | undefined,
  presets: ColorPreset[],
  tolerance: number = 50,
): ColorPreset | null {
  if (!currentHs || !Array.isArray(currentHs) || currentHs.length < 2) {
    return null;
  }

  const [currentHue, currentSat] = currentHs;

  let closestPreset: ColorPreset | null = null;
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
 * @param entityAttrs - Entity attributes
 * @param colorPresets - Available presets
 * @returns Color preset utilities
 */
export function useLightColorPresets(
  entityAttrs: ComputedRef<Record<string, unknown>>,
  colorPresets: ColorPreset[],
): LightColorPresetsReturn {
  /**
   * Find the active (closest matching) color preset
   */
  const activeColorPreset = computed(() => {
    const currentHs = entityAttrs.value.hs_color as number[] | undefined;
    return findClosestColorPreset(currentHs, colorPresets);
  });

  return {
    activeColorPreset,
  };
}
