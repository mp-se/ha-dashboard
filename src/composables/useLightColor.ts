/**
 * Composable for light color calculations and conversions
 * Handles HSV to RGB conversion, luminance calculations, and color analysis
 */

import { computed, ComputedRef, Ref } from "vue";

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface StyleObject {
  backgroundColor: string;
}

interface LightColorReturn {
  controlCircleColor: ComputedRef<string>;
  iconColor: ComputedRef<string>;
}

/**
 * Convert HSV color to RGB hex string
 * @param hue - Hue (0-360)
 * @param saturation - Saturation (0-100)
 * @param brightness - Brightness (0-255)
 * @returns Hex color string (e.g., "#FF0000")
 */
export function hsvToRgbHex(
  hue: number,
  saturation: number,
  brightness: number,
): string {
  // Convert brightness from HA range (0-255) to HSV value (0-1)
  const v = (brightness / 255) * 0.8 + 0.2; // Scale 0.2-1.0 for better visibility
  const s = saturation / 100;
  const h = hue / 60;

  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;

  let r: number, g: number, b: number;

  if (h >= 0 && h < 1) [r, g, b] = [c, x, 0];
  else if (h >= 1 && h < 2) [r, g, b] = [x, c, 0];
  else if (h >= 2 && h < 3) [r, g, b] = [0, c, x];
  else if (h >= 3 && h < 4) [r, g, b] = [0, x, c];
  else if (h >= 4 && h < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number): string =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color to RGB components
 * @param hex - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns RGB components or null if invalid
 */
export function hexToRgb(hex: string | null | undefined): RGBColor | null {
  if (!hex) return null;

  let cleanHex = hex.trim();
  if (cleanHex.startsWith("#")) cleanHex = cleanHex.slice(1);

  // Handle shorthand hex (e.g., "FFF")
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (!/^[0-9a-f]{6}$/i.test(cleanHex)) return null;

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  return { r, g, b };
}

/**
 * Calculate relative luminance of RGB color using sRGB colorspace
 * @param rgb - RGB components (0-255)
 * @returns Relative luminance (0-1)
 */
export function calculateLuminance(rgb: RGBColor): number {
  const srgbToLinear = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const rLin = srgbToLinear(rgb.r);
  const gLin = srgbToLinear(rgb.g);
  const bLin = srgbToLinear(rgb.b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Determine if a color is light based on luminance
 * @param hexColor - Hex color string
 * @param threshold - Luminance threshold (default: 0.9)
 * @returns True if the color is considered light
 */
export function isLightColor(
  hexColor: string | null | undefined,
  threshold: number = 0.9,
): boolean {
  const color = (hexColor || "").toLowerCase();

  // Explicit light colors
  const explicitLightColors = new Set([
    "#ffffff",
    "#fff",
    "#f0f8ff",
    "#e8f4fd",
    "#e3f2fd",
  ]);

  if (explicitLightColors.has(color)) return true;
  if (color === "#ffffff" || color === "white") return true;

  const rgb = hexToRgb(color);
  if (!rgb) return false;

  const luminance = calculateLuminance(rgb);
  return luminance >= threshold;
}

/**
 * Composable for light color calculations
 * @param entityAttrs - Entity attributes
 * @param isOn - Whether light is on
 * @param supportsColor - Whether light supports color
 * @param supportsColorTemp - Whether light supports color temperature
 * @param isDisabled - Whether light is disabled
 * @param getPresetColor - Function to get preset color by kelvin
 * @param supportedPresets - Supported color temperature presets
 * @returns Color calculation utilities
 */
export function useLightColor(
  entityAttrs: ComputedRef<Record<string, unknown>>,
  isOn: ComputedRef<boolean>,
  supportsColor: ComputedRef<boolean>,
  supportsColorTemp: ComputedRef<boolean>,
  isDisabled: ComputedRef<boolean>,
  getPresetColor: (kelvin: number) => StyleObject,
  supportedPresets: ComputedRef<Array<{ kelvin: number }>>,
): LightColorReturn {
  /**
   * Calculate the control circle color based on light state and attributes
   */
  const controlCircleColor = computed(() => {
    if (isDisabled.value) return "#6c757d"; // Gray for unavailable
    if (!isOn.value) return "#e9ecef"; // Light gray for off

    // Show actual light color if supported
    if (
      supportsColor.value &&
      (entityAttrs.value.hs_color as number[] | undefined)
    ) {
      const [hue, sat] = entityAttrs.value.hs_color as number[];
      const brightness = (entityAttrs.value.brightness as number) || 255;
      return hsvToRgbHex(hue, sat, brightness);
    }

    // Show color temp as gradient if supported
    if (
      supportsColorTemp.value &&
      !supportsColor.value &&
      (entityAttrs.value.color_temp as number | undefined)
    ) {
      const mireds = entityAttrs.value.color_temp as number;
      const kelvin = mireds > 0 ? Math.round(1000000 / mireds) : 5000;

      // Match to the closest supported preset to get consistent colors
      let closestPreset: { kelvin: number } | null = null;
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

      // Fallback color temperature gradient
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

  /**
   * Calculate icon color based on background luminance for contrast
   */
  const iconColor = computed(() => {
    if (!isOn.value) return "white"; // White icon when off

    // Check color temperature first
    try {
      if (
        supportsColorTemp.value &&
        (entityAttrs.value.color_temp as number | undefined)
      ) {
        const mireds = entityAttrs.value.color_temp as number;
        const kelvin = mireds > 0 ? Math.round(1000000 / mireds) : 0;
        const COOL_WHITE_KELVIN = 4000;
        if (kelvin >= COOL_WHITE_KELVIN) return "#333";
      }
    } catch {
      // Fall through to luminance check
    }

    const color = controlCircleColor.value;
    return isLightColor(color, 0.9) ? "#333" : "white";
  });

  return {
    controlCircleColor,
    iconColor,
  };
}
