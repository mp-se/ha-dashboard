import { describe, it, expect } from "vitest";
import {
  COMPONENT_LAYOUTS,
  getComponentLayoutClasses,
  getComponentLayoutConfig,
} from "../componentLayouts";

describe("componentLayouts.js", () => {
  describe("COMPONENT_LAYOUTS constant", () => {
    it("should export COMPONENT_LAYOUTS object", () => {
      expect(COMPONENT_LAYOUTS).toBeDefined();
      expect(typeof COMPONENT_LAYOUTS).toBe("object");
    });

    it("should have entries for all major components", () => {
      const expectedComponents = [
        "HaLight",
        "HaSwitch",
        "HaSensor",
        "HaButton",
        "HaRoom",
        "HaHeader",
        "HaSpacer",
      ];
      expectedComponents.forEach((component) => {
        expect(COMPONENT_LAYOUTS[component]).toBeDefined();
      });
    });
  });

  describe("getComponentLayoutClasses()", () => {
    it("should return default 3-column layout for most components", () => {
      const classes = getComponentLayoutClasses("HaLight");
      expect(classes).toBe("col-lg-4 col-md-6");
    });

    it("should return full-width layout for HaHeader", () => {
      const classes = getComponentLayoutClasses("HaHeader");
      expect(classes).toBe("col-12");
    });

    it("should return full-width layout for HaRowSpacer", () => {
      const classes = getComponentLayoutClasses("HaRowSpacer");
      expect(classes).toBe("col-12");
    });

    it("should return small chip layout for HaChip", () => {
      const classes = getComponentLayoutClasses("HaChip");
      expect(classes).toBe("col-6 col-sm-4 col-md-2");
    });

    it("should return default layout for unknown component type", () => {
      const classes = getComponentLayoutClasses("UnknownComponent");
      expect(classes).toContain("col-lg-4");
      expect(classes).toContain("col-md-6");
    });

    it("should return default layout for null component type", () => {
      const classes = getComponentLayoutClasses(null);
      expect(classes).toBe("col-lg-4 col-md-6");
    });
  });

  describe("getComponentLayoutConfig()", () => {
    it("should return layout configuration object for component", () => {
      const config = getComponentLayoutConfig("HaLight");
      expect(config).toBeDefined();
      expect(config.classes).toBe("col-lg-4 col-md-6");
      expect(config.desktop).toBe("col-lg-4");
      expect(config.tablet).toBe("col-md-6");
      expect(config.mobile).toBe("col-12");
      expect(config.description).toBeDefined();
    });

    it("should return default config for unknown component", () => {
      const config = getComponentLayoutConfig("UnknownComponent");
      expect(config).toBeDefined();
      expect(config.classes).toBeDefined();
    });

    it("should have consistent breakpoints for standard 3-column layout", () => {
      const config = getComponentLayoutConfig("HaSwitch");
      expect(config.desktop).toBe("col-lg-4");
      expect(config.tablet).toBe("col-md-6");
      expect(config.mobile).toBe("col-12");
    });
  });

  describe("Layout consistency", () => {
    it("all layouts should have classes property", () => {
      Object.entries(COMPONENT_LAYOUTS).forEach(([component, layout]) => {
        expect(layout.classes).toBeDefined(
          `${component} should have classes property`,
        );
      });
    });

    it("all layouts should have responsive breakpoint properties", () => {
      Object.entries(COMPONENT_LAYOUTS).forEach(([component, layout]) => {
        expect(layout.desktop).toBeDefined(
          `${component} should have desktop property`,
        );
        expect(layout.tablet).toBeDefined(
          `${component} should have tablet property`,
        );
        expect(layout.mobile).toBeDefined(
          `${component} should have mobile property`,
        );
      });
    });

    it("classes property should match combined breakpoints", () => {
      Object.entries(COMPONENT_LAYOUTS).forEach(([, layout]) => {
        const { classes, desktop, tablet } = layout;
        // For responsive layouts, desktop + tablet should be included
        if (!classes.includes("col-12") && !classes.includes("col-6")) {
          expect(classes).toContain(desktop);
          expect(classes).toContain(tablet);
        }
      });
    });
  });
});
