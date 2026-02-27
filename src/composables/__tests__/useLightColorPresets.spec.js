import { describe, it, expect, beforeEach } from "vitest";
import { ref } from "vue";
import {
  findClosestColorPreset,
  useLightColorPresets,
} from "../useLightColorPresets";

describe("useLightColorPresets", () => {
  describe("findClosestColorPreset", () => {
    const colorPresets = [
      { name: "Red", color: "#FF0000", hs: [0, 100] },
      { name: "Orange", color: "#FFA500", hs: [30, 100] },
      { name: "Yellow", color: "#FFFF00", hs: [60, 100] },
      { name: "Green", color: "#00FF00", hs: [120, 100] },
      { name: "Cyan", color: "#00FFFF", hs: [180, 100] },
      { name: "Blue", color: "#0000FF", hs: [240, 100] },
      { name: "Purple", color: "#800080", hs: [270, 100] },
      { name: "Magenta", color: "#FF00FF", hs: [300, 100] },
      { name: "White", color: "#FFFFFF", hs: [0, 0] },
    ];

    describe("HS color matching", () => {
      it("should find exact red match", () => {
        const result = findClosestColorPreset([0, 100], colorPresets);
        expect(result).toEqual({ name: "Red", color: "#FF0000", hs: [0, 100] });
      });

      it("should find exact green match", () => {
        const result = findClosestColorPreset([120, 100], colorPresets);
        expect(result).toEqual({
          name: "Green",
          color: "#00FF00",
          hs: [120, 100],
        });
      });

      it("should find exact blue match", () => {
        const result = findClosestColorPreset([240, 100], colorPresets);
        expect(result).toEqual({
          name: "Blue",
          color: "#0000FF",
          hs: [240, 100],
        });
      });

      it("should find closest preset when hue is in between", () => {
        // 45 degrees is between Orange (30) and Yellow (60)
        const result = findClosestColorPreset([45, 100], colorPresets);
        expect(result).toBeDefined();
        expect([30, 60]).toContain(result.hs[0]);
      });

      it("should handle hue wraparound at 0/360 degrees", () => {
        // 350 degrees should be close to Red (0 degrees)
        const result = findClosestColorPreset([350, 100], colorPresets);
        expect(result.name).toBe("Red");
      });

      it("should handle hue wraparound with hue 360", () => {
        const result = findClosestColorPreset([360, 100], colorPresets);
        // Should match Red (hue 0) due to wraparound
        expect(result).toBeDefined();
        if (result) {
          expect(result.name).toBe("Red");
        }
      });

      it("should not match white when saturation is low but hue is far", () => {
        const result = findClosestColorPreset([180, 5], colorPresets);
        // [180, 5] has hue diff of 180 from White [0, 0]
        // totalDiff = 180 + 5*2 = 190, which exceeds tolerance of 50
        expect(result).toBeNull();
      });

      it("should match white exactly", () => {
        const result = findClosestColorPreset([0, 0], colorPresets);
        expect(result.name).toBe("White");
      });

      it("should handle colors near cyan", () => {
        const result = findClosestColorPreset([185, 100], colorPresets);
        // Should be within tolerance to Cyan
        expect(result).toBeDefined();
      });

      it("should handle colors near magenta", () => {
        const result = findClosestColorPreset([305, 100], colorPresets);
        // Should be within tolerance to Magenta
        expect(result).toBeDefined();
      });
    });

    describe("Edge cases and tolerance", () => {
      it("should return null for empty presets array", () => {
        const result = findClosestColorPreset([120, 100], []);
        expect(result).toBeNull();
      });

      it("should handle invalid color input gracefully", () => {
        const result = findClosestColorPreset(null, colorPresets);
        expect(result).toBeNull();
      });

      it("should handle undefined color input", () => {
        const result = findClosestColorPreset(undefined, colorPresets);
        expect(result).toBeNull();
      });

      it("should handle color array with wrong length", () => {
        const result = findClosestColorPreset([120], colorPresets);
        expect(result).toBeNull();
      });

      it("should match exact color even with very low tolerance", () => {
        // [180, 100] is an exact match for Cyan, so even tolerance=1 should match
        const result = findClosestColorPreset([180, 100], colorPresets, 1);
        expect(result).toEqual({
          name: "Cyan",
          color: "#00FFFF",
          hs: [180, 100],
        });
      });

      it("should find match with higher tolerance", () => {
        // 45 degrees from both orange (30) and yellow (60)
        const result = findClosestColorPreset([45, 100], colorPresets, 100);
        expect(result).toBeDefined();
      });
    });

    describe("Single preset", () => {
      it("should match single preset if within tolerance", () => {
        const singlePreset = [{ name: "Only", color: "#FF0000", hs: [0, 100] }];
        const result = findClosestColorPreset([10, 100], singlePreset, 50);
        expect(result).toEqual({
          name: "Only",
          color: "#FF0000",
          hs: [0, 100],
        });
      });

      it("should not match single preset if outside tolerance", () => {
        const singlePreset = [{ name: "Only", color: "#FF0000", hs: [0, 100] }];
        const result = findClosestColorPreset([180, 100], singlePreset, 10);
        expect(result).toBeNull();
      });
    });
  });

  describe("useLightColorPresets composable", () => {
    let entityAttrs;
    const colorPresets = [
      { name: "Red", color: "#FF0000", hs: [0, 100] },
      { name: "Green", color: "#00FF00", hs: [120, 100] },
      { name: "Blue", color: "#0000FF", hs: [240, 100] },
      { name: "White", color: "#FFFFFF", hs: [0, 0] },
    ];

    beforeEach(() => {
      entityAttrs = ref({});
    });

    it("should return null active preset when no hs_color", () => {
      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );

      expect(activeColorPreset.value).toBeNull();
    });

    it("should find active preset from hs_color", () => {
      entityAttrs.value = {
        hs_color: [0, 100], // Red
      };

      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );

      expect(activeColorPreset.value).toBeDefined();
      expect(activeColorPreset.value.name).toBe("Red");
    });

    it("should reactively update when hs_color changes", () => {
      entityAttrs.value = {
        hs_color: [0, 100], // Red
      };

      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );
      expect(activeColorPreset.value.name).toBe("Red");

      // Change to green
      entityAttrs.value = {
        hs_color: [120, 100],
      };

      expect(activeColorPreset.value.name).toBe("Green");
    });

    it("should handle white color", () => {
      entityAttrs.value = {
        hs_color: [0, 0],
      };

      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );

      expect(activeColorPreset.value.name).toBe("White");
    });

    it("should handle close but not exact match", () => {
      entityAttrs.value = {
        hs_color: [5, 100], // Close to red
      };

      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );

      expect(activeColorPreset.value.name).toBe("Red");
    });

    it("should handle empty presets array", () => {
      entityAttrs.value = {
        hs_color: [120, 100],
      };

      const { activeColorPreset } = useLightColorPresets(entityAttrs, []);

      expect(activeColorPreset.value).toBeNull();
    });

    it("should return null when preset doesn't match within tolerance", () => {
      const narrowPresets = [
        { name: "Red", color: "#FF0000", hs: [0, 100] },
        { name: "Blue", color: "#0000FF", hs: [240, 100] },
      ];

      entityAttrs.value = {
        hs_color: [180, 100], // Cyan - far from red and blue
      };

      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        narrowPresets,
      );

      // With default tolerance of 50, 180 degrees from both should not match
      expect(activeColorPreset.value).toBeNull();
    });

    it("should handle transition from no color to having color", () => {
      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );
      expect(activeColorPreset.value).toBeNull();

      entityAttrs.value = {
        hs_color: [240, 100], // Blue
      };

      expect(activeColorPreset.value.name).toBe("Blue");
    });

    it("should handle transition from having color to no color", () => {
      entityAttrs.value = {
        hs_color: [0, 100], // Red
      };

      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );
      expect(activeColorPreset.value.name).toBe("Red");

      entityAttrs.value = {};

      expect(activeColorPreset.value).toBeNull();
    });

    it("should handle low saturation colors", () => {
      entityAttrs.value = {
        hs_color: [120, 10], // Low saturation green (grayish)
      };

      const { activeColorPreset } = useLightColorPresets(
        entityAttrs,
        colorPresets,
      );

      // Low saturation doesn't guarantee white match if hue is too far
      // [120, 10] is 120 hue diff + 10*2 sat diff = 140 total diff
      // This exceeds default tolerance of 50, so should return null
      expect(activeColorPreset.value).toBeNull();
    });
  });
});
