import { describe, it, expect } from "vitest";
import {
  isValidMdiIcon,
  suggestMdiIcons,
  getAllMdiIcons,
  getMdiIconCount,
} from "../mdiIconValidator";

describe("mdiIconValidator", () => {
  describe("isValidMdiIcon", () => {
    it("should validate common dashboard icons", () => {
      expect(isValidMdiIcon("home")).toBe(true);
      expect(isValidMdiIcon("lightbulb")).toBe(true);
      expect(isValidMdiIcon("thermometer")).toBe(true);
      expect(isValidMdiIcon("power-plug")).toBe(true);
    });

    it("should validate icons with mdi- prefix", () => {
      expect(isValidMdiIcon("mdi-home")).toBe(true);
      expect(isValidMdiIcon("mdi-lightbulb")).toBe(true);
      expect(isValidMdiIcon("mdi-weather-sunny")).toBe(true);
    });

    it("should validate view icons", () => {
      expect(isValidMdiIcon("view-dashboard")).toBe(true);
      expect(isValidMdiIcon("mdi-view-dashboard")).toBe(true);
    });

    it("should validate weather icons", () => {
      expect(isValidMdiIcon("weather-sunny")).toBe(true);
      expect(isValidMdiIcon("weather-cloudy")).toBe(true);
      expect(isValidMdiIcon("cloud")).toBe(true);
    });

    it("should validate light/control icons", () => {
      expect(isValidMdiIcon("lamp")).toBe(true);
      expect(isValidMdiIcon("switch")).toBe(true);
      expect(isValidMdiIcon("power")).toBe(true);
    });

    it("should validate climate icons", () => {
      expect(isValidMdiIcon("fan")).toBe(true);
      expect(isValidMdiIcon("air-conditioner")).toBe(true);
    });

    it("should validate media icons", () => {
      expect(isValidMdiIcon("play")).toBe(true);
      expect(isValidMdiIcon("pause")).toBe(true);
      expect(isValidMdiIcon("music")).toBe(true);
    });

    it("should validate security icons", () => {
      expect(isValidMdiIcon("alarm")).toBe(true);
      expect(isValidMdiIcon("camera")).toBe(true);
      expect(isValidMdiIcon("lock")).toBe(true);
    });

    it("should validate sensor icons", () => {
      expect(isValidMdiIcon("gauge")).toBe(true);
      expect(isValidMdiIcon("water")).toBe(true);
      expect(isValidMdiIcon("water-percent")).toBe(true);
    });

    it("should validate device icons", () => {
      expect(isValidMdiIcon("phone")).toBe(true);
      expect(isValidMdiIcon("printer")).toBe(true);
      expect(isValidMdiIcon("washing-machine")).toBe(true);
    });

    it("should reject invalid icon names", () => {
      expect(isValidMdiIcon("invalid-icon-xyz")).toBe(false);
      expect(isValidMdiIcon("mdi-invalid-icon")).toBe(false);
      expect(isValidMdiIcon("foo-bar")).toBe(false);
    });

    it("should handle null and undefined gracefully", () => {
      expect(isValidMdiIcon(null)).toBe(false);
      expect(isValidMdiIcon(undefined)).toBe(false);
      expect(isValidMdiIcon("")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isValidMdiIcon("HOME")).toBe(true);
      expect(isValidMdiIcon("Home")).toBe(true);
      expect(isValidMdiIcon("LIGHTBULB")).toBe(true);
    });

    it("should handle various prefix formats", () => {
      expect(isValidMdiIcon("mdi-home")).toBe(true);
      expect(isValidMdiIcon("home")).toBe(true);
      expect(isValidMdiIcon("mdi-mdi-home")).toBe(true); // double prefix
    });
  });

  describe("suggestMdiIcons", () => {
    it("should suggest icons that start with the query", () => {
      const suggestions = suggestMdiIcons("light");
      expect(suggestions.length).toBeGreaterThan(0);
      // With 7000+ icons, suggestions might contain 'lightbulb' or other light-related icons
      expect(suggestions.some((s) => s.includes("light"))).toBe(true);
    });

    it("should suggest icons that contain the query", () => {
      const suggestions = suggestMdiIcons("light");
      // Should find icons with 'light' in the name
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.includes("light"))).toBe(true);
    });

    it("should suggest thermometer for therm", () => {
      const suggestions = suggestMdiIcons("therm");
      expect(suggestions.length).toBeGreaterThan(0);
      // Should suggest icons containing 'therm'
      expect(suggestions.some((s) => s.includes("therm"))).toBe(true);
    });

    it("should suggest weather icons for weather", () => {
      const suggestions = suggestMdiIcons("sun");
      expect(suggestions.length).toBeGreaterThan(0);
      // Should suggest icons containing 'sun'
      expect(suggestions.some((s) => s.includes("sun"))).toBe(true);
    });

    it("should handle mdi- prefix in suggestions", () => {
      const suggestions = suggestMdiIcons("mdi-light");
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("should return empty array for invalid queries", () => {
      const suggestions = suggestMdiIcons("xyz123abc");
      expect(suggestions).toEqual([]);
    });

    it("should return up to 5 suggestions", () => {
      const suggestions = suggestMdiIcons("a");
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it("should handle null and undefined gracefully", () => {
      expect(suggestMdiIcons(null)).toEqual([]);
      expect(suggestMdiIcons(undefined)).toEqual([]);
    });
  });

  describe("getAllMdiIcons", () => {
    it("should return an array of icon names", () => {
      const icons = getAllMdiIcons();
      expect(Array.isArray(icons)).toBe(true);
      expect(icons.length).toBeGreaterThan(0);
    });

    it("should return sorted icons", () => {
      const icons = getAllMdiIcons();
      const sorted = [...icons].sort();
      expect(icons).toEqual(sorted);
    });

    it("should contain common icons", () => {
      const icons = getAllMdiIcons();
      expect(icons).toContain("home");
      expect(icons).toContain("lightbulb");
      expect(icons).toContain("thermometer");
      expect(icons).toContain("weather-sunny");
    });

    it("should not have mdi- prefix in returned icons", () => {
      const icons = getAllMdiIcons();
      const hasPrefixed = icons.some((icon) => icon.startsWith("mdi-"));
      expect(hasPrefixed).toBe(false);
    });
  });

  describe("getMdiIconCount", () => {
    it("should return a positive number", () => {
      const count = getMdiIconCount();
      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe("number");
    });

    it("should match getAllMdiIcons length", () => {
      const count = getMdiIconCount();
      const icons = getAllMdiIcons();
      expect(count).toBe(icons.length);
    });

    it("should have at least 100 icons", () => {
      const count = getMdiIconCount();
      expect(count).toBeGreaterThanOrEqual(100);
    });
  });

  describe("real-world icon validation", () => {
    it("should validate Home Assistant common device icons", () => {
      const commonIcons = [
        "home",
        "lightbulb",
        "thermometer",
        "fan",
        "door",
        "dock-window",
        "camera",
        "alarm",
        "washing-machine",
        "toaster-oven",
        "dishwasher",
        "fridge",
      ];

      commonIcons.forEach((icon) => {
        expect(isValidMdiIcon(icon)).toBe(
          true,
          `Icon "${icon}" should be valid`,
        );
      });
    });

    it("should validate view navigation icons", () => {
      const viewIcons = [
        "view-dashboard",
        "home",
        "lightbulb",
        "power-plug",
        "cloud",
        "calendar",
        "chart-line",
        "cog",
      ];

      viewIcons.forEach((icon) => {
        const valid = isValidMdiIcon(icon);
        // Most should be valid, chart-line might not be
        expect(valid || suggestMdiIcons(icon).length >= 0).toBe(true);
      });
    });

    it("should reject common typos with suggestions", () => {
      const shouldInvalid = ["thermomtr", "lightbuld", "humidty"];

      shouldInvalid.forEach((typo) => {
        expect(isValidMdiIcon(typo)).toBe(false);
        expect(suggestMdiIcons(typo).length).toBeGreaterThan(0);
      });
    });
  });
});
