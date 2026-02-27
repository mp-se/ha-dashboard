import { describe, it, expect, beforeEach } from "vitest";
import { ref } from "vue";
import {
  hsvToRgbHex,
  hexToRgb,
  calculateLuminance,
  isLightColor,
  useLightColor,
} from "../useLightColor";

describe("useLightColor", () => {
  describe("hsvToRgbHex", () => {
    it("should convert red HSV to RGB hex", () => {
      const result = hsvToRgbHex(0, 100, 255);
      expect(result).toBe("#ff0000");
    });

    it("should convert green HSV to RGB hex", () => {
      const result = hsvToRgbHex(120, 100, 255);
      expect(result).toBe("#00ff00");
    });

    it("should convert blue HSV to RGB hex", () => {
      const result = hsvToRgbHex(240, 100, 255);
      expect(result).toBe("#0000ff");
    });

    it("should convert yellow HSV to RGB hex", () => {
      const result = hsvToRgbHex(60, 100, 255);
      expect(result).toBe("#ffff00");
    });

    it("should convert cyan HSV to RGB hex", () => {
      const result = hsvToRgbHex(180, 100, 255);
      expect(result).toBe("#00ffff");
    });

    it("should convert magenta HSV to RGB hex", () => {
      const result = hsvToRgbHex(300, 100, 255);
      expect(result).toBe("#ff00ff");
    });

    it("should handle low saturation (white-ish)", () => {
      const result = hsvToRgbHex(0, 0, 255);
      expect(result).toMatch(/^#[a-f0-9]{6}$/);
    });

    it("should handle low brightness", () => {
      const result = hsvToRgbHex(0, 100, 0);
      expect(result).toMatch(/^#[0-3]{6}$/);
    });

    it("should handle mid-range brightness", () => {
      const result = hsvToRgbHex(0, 100, 128);
      expect(result).toMatch(/^#[a-f0-9]{6}$/);
    });

    it("should handle hue wraparound (360 degrees)", () => {
      const result360 = hsvToRgbHex(360, 100, 255);
      const result0 = hsvToRgbHex(0, 100, 255);
      expect(result360).toBe(result0);
    });
  });

  describe("hexToRgb", () => {
    it("should convert hex with # prefix to RGB", () => {
      const result = hexToRgb("#FF0000");
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("should convert hex without # prefix to RGB", () => {
      const result = hexToRgb("00FF00");
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it("should handle lowercase hex", () => {
      const result = hexToRgb("#0000ff");
      expect(result).toEqual({ r: 0, g: 0, b: 255 });
    });

    it("should handle mixed case hex", () => {
      const result = hexToRgb("#FfA500");
      expect(result).toEqual({ r: 255, g: 165, b: 0 });
    });

    it("should handle hex with whitespace", () => {
      const result = hexToRgb("  #FFFFFF  ");
      expect(result).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("should handle 3-character shorthand hex", () => {
      const result = hexToRgb("#FFF");
      expect(result).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("should return null for invalid hex (too long)", () => {
      const result = hexToRgb("#FFFFFFF");
      expect(result).toBeNull();
    });

    it("should return null for invalid hex (non-hex characters)", () => {
      const result = hexToRgb("#GGGGGG");
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      const result = hexToRgb(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = hexToRgb(undefined);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = hexToRgb("");
      expect(result).toBeNull();
    });
  });

  describe("calculateLuminance", () => {
    it("should calculate luminance for white", () => {
      const rgb = hexToRgb("#FFFFFF");
      const luminance = calculateLuminance(rgb);
      expect(luminance).toBeCloseTo(1.0, 1);
    });

    it("should calculate luminance for black", () => {
      const rgb = hexToRgb("#000000");
      const luminance = calculateLuminance(rgb);
      expect(luminance).toBe(0);
    });

    it("should calculate luminance for red", () => {
      const rgb = hexToRgb("#FF0000");
      const luminance = calculateLuminance(rgb);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });

    it("should calculate luminance for green (higher than red)", () => {
      const redRgb = hexToRgb("#FF0000");
      const greenRgb = hexToRgb("#00FF00");
      const redLuminance = calculateLuminance(redRgb);
      const greenLuminance = calculateLuminance(greenRgb);
      expect(greenLuminance).toBeGreaterThan(redLuminance);
    });

    it("should calculate luminance for blue (lower than green)", () => {
      const blueRgb = hexToRgb("#0000FF");
      const greenRgb = hexToRgb("#00FF00");
      const blueLuminance = calculateLuminance(blueRgb);
      const greenLuminance = calculateLuminance(greenRgb);
      expect(blueLuminance).toBeLessThan(greenLuminance);
    });

    it("should return NaN for invalid RGB object", () => {
      const luminance = calculateLuminance({ r: NaN, g: NaN, b: NaN });
      expect(luminance).toBeNaN();
    });

    it("should handle edge case RGB values", () => {
      const luminance = calculateLuminance({ r: 128, g: 128, b: 128 });
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe("isLightColor", () => {
    it("should identify white as light", () => {
      expect(isLightColor("#FFFFFF", 0.5)).toBe(true);
    });

    it("should identify black as dark", () => {
      expect(isLightColor("#000000", 0.5)).toBe(false);
    });

    it("should identify light gray as light with low threshold", () => {
      expect(isLightColor("#CCCCCC", 0.5)).toBe(true);
    });

    it("should identify dark gray as dark with high threshold", () => {
      expect(isLightColor("#333333", 0.5)).toBe(false);
    });

    it("should respect threshold parameter", () => {
      const color = "#888888";
      expect(isLightColor(color, 0.2)).toBe(true); // Low threshold
      expect(isLightColor(color, 0.8)).toBe(false); // High threshold
    });

    it("should use default threshold of 0.9", () => {
      // Test with very light color that exceeds 0.9 luminance
      expect(isLightColor("#FFFFFF")).toBe(true);
      // Test with light gray that should be below 0.9 threshold
      expect(isLightColor("#AAAAAA")).toBe(false);
    });
  });

  describe("useLightColor composable", () => {
    let entityAttrs, isOn, supportsColor, supportsColorTemp, isDisabled;
    let getPresetColor, supportedPresets;

    beforeEach(() => {
      entityAttrs = ref({});
      isOn = ref(true);
      supportsColor = ref(false);
      supportsColorTemp = ref(false);
      isDisabled = ref(false);
      getPresetColor = () => ({
        backgroundColor: "#FFB366",
      });
      supportedPresets = ref([
        { name: "Warm", kelvin: 2700 },
        { name: "Cool", kelvin: 4000 },
      ]);
    });

    it("should return gray for disabled light", () => {
      isDisabled.value = true;
      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toBe("#6c757d");
    });

    it("should return light gray when light is off", () => {
      isOn.value = false;
      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toBe("#e9ecef");
    });

    it("should calculate color from hs_color when supported", () => {
      supportsColor.value = true;
      entityAttrs.value = {
        hs_color: [0, 100], // Red
        brightness: 255,
      };

      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toMatch(/^#[a-f0-9]{6}$/);
      expect(controlCircleColor.value).toContain("ff"); // Should have red component
    });

    it("should handle color with low brightness", () => {
      supportsColor.value = true;
      entityAttrs.value = {
        hs_color: [120, 100], // Green
        brightness: 50,
      };

      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toMatch(/^#[a-f0-9]{6}$/);
    });

    it("should use color temp when color not supported", () => {
      supportsColorTemp.value = true;
      entityAttrs.value = {
        color_temp: 370, // ~2700K (warm)
      };

      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toBe("#FFB366");
    });

    it("should return default yellow for simple on/off lights", () => {
      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toBe("#FFC107");
    });

    it("should return white icon for off light", () => {
      isOn.value = false;
      const { iconColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(iconColor.value).toBe("white");
    });

    it("should return dark icon for cool white (>= 4000K)", () => {
      supportsColorTemp.value = true;
      entityAttrs.value = {
        color_temp: 250, // 4000K
      };

      const { iconColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(iconColor.value).toBe("#333");
    });

    it("should calculate icon color based on luminance for colored lights", () => {
      supportsColor.value = true;
      entityAttrs.value = {
        hs_color: [60, 100], // Yellow (light color)
        brightness: 255,
      };

      const { iconColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      // Yellow is a light color, so icon should be dark
      expect(iconColor.value).toBe("#333");
    });

    it("should use white icon for dark background colors", () => {
      supportsColor.value = true;
      entityAttrs.value = {
        hs_color: [240, 100], // Blue (darker color)
        brightness: 100,
      };

      const { iconColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(iconColor.value).toBe("white");
    });

    it("should reactively update when entity attributes change", () => {
      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toBe("#FFC107"); // Default yellow

      // Enable color support and set a color
      supportsColor.value = true;
      entityAttrs.value = {
        hs_color: [0, 100],
        brightness: 255,
      };

      expect(controlCircleColor.value).not.toBe("#FFC107");
      expect(controlCircleColor.value).toMatch(/^#[a-f0-9]{6}$/);
    });

    it("should reactively update when light is turned off", () => {
      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      expect(controlCircleColor.value).toBe("#FFC107");

      isOn.value = false;
      expect(controlCircleColor.value).toBe("#e9ecef");
    });

    it("should handle color temperature fallback when no preset matches", () => {
      supportsColorTemp.value = true;
      supportedPresets.value = []; // No presets
      entityAttrs.value = {
        color_temp: 370, // ~2702K
      };

      const { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );

      // Should use fallback color for soft temperature (2702K > 2700K threshold)
      expect(controlCircleColor.value).toBe("#FFCC80");
    });

    it("should handle various color temperature ranges in fallback", () => {
      supportsColorTemp.value = true;
      supportedPresets.value = [];

      // Test soft (2702K, slightly above 2700K threshold)
      entityAttrs.value = { color_temp: 370 };
      let { controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      );
      expect(controlCircleColor.value).toBe("#FFCC80");

      // Test soft (3003K, slightly above 3000K threshold)
      entityAttrs.value = { color_temp: 333 };
      ({ controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      ));
      expect(controlCircleColor.value).toBe("#E8F4FD");

      // Test cool (4000K)
      entityAttrs.value = { color_temp: 250 };
      ({ controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      ));
      expect(controlCircleColor.value).toBe("#E8F4FD");

      // Test daylight (5000K)
      entityAttrs.value = { color_temp: 200 };
      ({ controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      ));
      expect(controlCircleColor.value).toBe("#F0F8FF");

      // Test cold (6500K)
      entityAttrs.value = { color_temp: 154 };
      ({ controlCircleColor } = useLightColor(
        entityAttrs,
        isOn,
        supportsColor,
        supportsColorTemp,
        isDisabled,
        getPresetColor,
        supportedPresets,
      ));
      expect(controlCircleColor.value).toBe("#E3F2FD");
    });
  });
});
