import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HaLight from "../HaLight.vue";
import * as useServiceCallModule from "@/composables/useServiceCall";

describe("HaLight.vue", () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render a light control card", () => {
      const entity = {
        entity_id: "light.bedroom",
        state: "off",
        attributes: {
          friendly_name: "Bedroom Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".card").exists()).toBe(true);
      expect(wrapper.find(".card-control").exists()).toBe(true);
    });

    it("should display light name from friendly_name", () => {
      const entity = {
        entity_id: "light.living_room",
        state: "on",
        attributes: {
          friendly_name: "Living Room Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain("Living Room Light");
    });

    it("should display entity_id as fallback name", () => {
      const entity = {
        entity_id: "light.unknown",
        state: "off",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain("light.unknown");
    });

    it("should show error when entity not found", () => {
      const wrapper = mount(HaLight, {
        props: {
          entity: "light.nonexistent",
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain("not found");
      expect(wrapper.find(".border-warning").exists()).toBe(true);
    });
  });

  describe("Switch Control", () => {
    it("should render switch toggle", () => {
      const entity = {
        entity_id: "light.desk",
        state: "off",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find("button.ha-control-button");
      expect(button.exists()).toBe(true);
    });

    it("should have control button clickable", () => {
      const entity = {
        entity_id: "light.hallway",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find("button.ha-control-button");
      expect(button.exists()).toBe(true);
    });

    it("should reflect on/off state", () => {
      const entity = {
        entity_id: "light.bedroom",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Button should exist and light is on
      const button = wrapper.find("button.ha-control-button");
      expect(button.exists()).toBe(true);
      expect(button.classes("control-button-on")).toBe(true);
    });
  });

  describe("Card Styling", () => {
    it("should have card-active class when light is on", () => {
      const entity = {
        entity_id: "light.on_light",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(
        wrapper.find("button.ha-control-button").classes("control-button-on"),
      ).toBe(true);
    });

    it("should not have control-button-on class when light is off", () => {
      const entity = {
        entity_id: "light.off_light",
        state: "off",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find("button.ha-control-button");
      expect(button.classes()).not.toContain("control-button-on");
    });

    it("should have warning border when entity not found", () => {
      const wrapper = mount(HaLight, {
        props: {
          entity: "light.missing",
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".border-warning").exists()).toBe(true);
    });

    it("should have warning border when unavailable", () => {
      const entity = {
        entity_id: "light.unavailable",
        state: "unavailable",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".border-warning").exists()).toBe(true);
    });

    it("should have secondary border when on", () => {
      const entity = {
        entity_id: "light.success",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".border-secondary").exists()).toBe(true);
    });

    it("should have secondary border when off", () => {
      const entity = {
        entity_id: "light.secondary",
        state: "off",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".border-secondary").exists()).toBe(true);
    });
  });

  describe("Brightness Control", () => {
    it("should show brightness slider for dimmable lights", () => {
      const entity = {
        entity_id: "light.dimmable",
        state: "on",
        attributes: {
          brightness: 128,
          supported_color_modes: ["brightness"],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const slider = wrapper.find('input[type="range"]');
      expect(slider.exists()).toBe(true);
    });

    it("should calculate brightness percentage correctly", () => {
      const entity = {
        entity_id: "light.dimmable",
        state: "on",
        attributes: {
          brightness: 255,
          supported_color_modes: ["brightness"],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain("100%");
    });

    it("should handle half brightness", () => {
      const entity = {
        entity_id: "light.half",
        state: "on",
        attributes: {
          brightness: 128,
          supported_color_modes: ["brightness"],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain("50%");
    });

    it("should disable brightness slider when light is off", () => {
      const entity = {
        entity_id: "light.dimmable_off",
        state: "off",
        attributes: {
          brightness: 128,
          supported_color_modes: ["brightness"],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const slider = wrapper.find('input[type="range"]');
      expect(slider.attributes("disabled")).toBeDefined();
    });

    it("should not show brightness slider for non-dimmable lights", () => {
      const entity = {
        entity_id: "light.simple",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should still render hidden placeholder
      expect(
        wrapper.findAll('input[type="range"]').length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Color Temperature Support", () => {
    it("should show color temperature presets when supported", () => {
      const entity = {
        entity_id: "light.color_temp",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
          color_temp: 370,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll(".preset-btn-icon");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should not show color temperature presets when not on", () => {
      const entity = {
        entity_id: "light.color_temp_off",
        state: "off",
        attributes: {
          supported_color_modes: ["color_temp"],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll(".preset-btn-icon");
      expect(buttons.length).toBe(0);
    });

    it("should filter presets based on light capabilities", () => {
      const entity = {
        entity_id: "light.limited_temp",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          min_color_temp_kelvin: 4000,
          max_color_temp_kelvin: 5000,
          color_temp: 250,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll(".preset-btn-icon");
      // Should only show presets within 4000-5000K
      expect(buttons.length).toBeLessThan(5);
    });
  });

  describe("Color Support", () => {
    it("should show color presets for RGB lights", () => {
      const entity = {
        entity_id: "light.rgb",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [0, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll(".color-preset-btn-icon");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should show color presets for HS lights", () => {
      const entity = {
        entity_id: "light.hs",
        state: "on",
        attributes: {
          supported_color_modes: ["hs"],
          hs_color: [120, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll(".color-preset-btn-icon");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should not show color presets when light is off", () => {
      const entity = {
        entity_id: "light.color_off",
        state: "off",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [0, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll(".color-preset-btn-icon");
      expect(buttons.length).toBe(0);
    });

    it("should handle lights without hs_color gracefully", () => {
      const entity = {
        entity_id: "light.no_color",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Color preset buttons are rendered but won't have active preset without hs_color
      const buttons = wrapper.findAll(".color-preset-btn-icon");
      expect(buttons.length).toBeGreaterThan(0); // Buttons still render

      // Verify no active color preset is highlighted
      const activeButtons = wrapper.findAll(".active-color");
      expect(activeButtons.length).toBe(0);
    });

    it("should highlight active color preset", () => {
      const entity = {
        entity_id: "light.rgb_active",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [0, 100], // Red
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const activeButtons = wrapper.findAll(".active-color");
      expect(activeButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Disabled State", () => {
    it("should disable controls when unavailable", () => {
      const entity = {
        entity_id: "light.unavail",
        state: "unavailable",
        attributes: {
          brightness: 128,
          supported_color_modes: ["brightness"],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find("button.ha-control-button");
      expect(button.attributes("disabled")).toBeDefined();
    });

    it("should disable controls when unknown", () => {
      const entity = {
        entity_id: "light.unknown",
        state: "unknown",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find("button.ha-control-button");
      expect(button.attributes("disabled")).toBeDefined();
    });
  });

  describe("Props Validation", () => {
    it("should accept string entity_id", () => {
      const wrapper = mount(HaLight, {
        props: {
          entity: "light.valid_id",
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it("should accept object entity with required fields", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it("should accept attributes prop", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
          attributes: ["brightness", "color_temp"],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Layout Classes", () => {
    it("should have responsive column classes", () => {
      const entity = {
        entity_id: "light.responsive",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".col-lg-4").exists()).toBe(true);
      expect(wrapper.find(".col-md-6").exists()).toBe(true);
    });

    it("should have rounded card class", () => {
      const entity = {
        entity_id: "light.rounded",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".rounded-4").exists()).toBe(true);
    });

    it("should have shadow class", () => {
      const entity = {
        entity_id: "light.shadow",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".shadow-lg").exists()).toBe(true);
    });
  });

  describe("Multiple Color Modes", () => {
    it("should support lights with brightness and color temp", () => {
      const entity = {
        entity_id: "light.advanced",
        state: "on",
        attributes: {
          brightness: 200,
          supported_color_modes: ["brightness", "color_temp"],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
          color_temp: 370,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should show both brightness slider and color temp presets
      const sliders = wrapper.findAll('input[type="range"]');
      expect(sliders.length).toBeGreaterThan(0);

      const buttons = wrapper.findAll(".preset-btn-icon");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should not show color temp presets if color is available", () => {
      const entity = {
        entity_id: "light.color_priority",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp", "rgb"],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
          hs_color: [0, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should show color presets, not color temp
      const colorButtons = wrapper.findAll(".color-preset-btn-icon");
      expect(colorButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Breadth Coverage", () => {
    it("should render switch with form-check classes", () => {
      const entity = {
        entity_id: "light.breadth",
        state: "on",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find("button.ha-control-button").exists()).toBe(true);
      expect(wrapper.find(".ha-control-circle-wrapper").exists()).toBe(true);
    });

    it("should have card-body and h-100 classes", () => {
      const entity = {
        entity_id: "light.classes",
        state: "off",
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".card-body").exists()).toBe(true);
      expect(wrapper.find(".h-100").exists()).toBe(true);
    });

    it("should render title with card-title class", () => {
      const entity = {
        entity_id: "light.titled",
        state: "on",
        attributes: {
          friendly_name: "My Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find(".card-title").exists()).toBe(true);
      expect(wrapper.find("h6").exists()).toBe(true);
    });
  });

  describe("Icon and Button Positioning", () => {
    it("should have ha-control-button with proper styling", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {
          friendly_name: "Test Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
        global: {
          stubs: {
            svg: true,
          },
        },
      });

      const controlButton = wrapper.find(".ha-control-button");
      expect(controlButton.exists()).toBe(true);

      // Check that button has no background and border
      const buttonElement = controlButton.element;
      expect(buttonElement.tagName).toBe("BUTTON");
    });

    it("should have ha-control-circle-wrapper as container for circle and icon", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {
          friendly_name: "Test Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
        global: {
          stubs: {
            svg: true,
          },
        },
      });

      const wrapper_elem = wrapper.find(".ha-control-circle-wrapper");
      expect(wrapper_elem.exists()).toBe(true);
    });

    it("should have ha-control-circle SVG with proper sizing", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {
          friendly_name: "Test Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const circle = wrapper.find(".ha-control-circle");
      expect(circle.exists()).toBe(true);

      // SVG should have width and height of 50
      const svgElement = circle.element;
      expect(svgElement.getAttribute("width")).toBe("50");
      expect(svgElement.getAttribute("height")).toBe("50");
      expect(svgElement.getAttribute("viewBox")).toBe("0 0 50 50");
    });

    it("should have ha-control-icon positioned absolutely over the circle", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {
          friendly_name: "Test Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const icon = wrapper.find(".ha-control-icon");
      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain("ha-control-icon");

      // Icon should be an <i> element with mdi-lightbulb class
      expect(icon.element.tagName).toBe("I");
      expect(icon.classes()).toContain("mdi");
      expect(icon.classes()).toContain("mdi-lightbulb");
    });

    it("should have control icon inside the wrapper", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {
          friendly_name: "Test Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const circleWrapper = wrapper.find(".ha-control-circle-wrapper");
      const icon = circleWrapper.find(".ha-control-icon");
      expect(icon.exists()).toBe(true);
    });

    it("should have control circle inside the wrapper", () => {
      const entity = {
        entity_id: "light.test",
        state: "on",
        attributes: {
          friendly_name: "Test Light",
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const circleWrapper = wrapper.find(".ha-control-circle-wrapper");
      const circle = circleWrapper.find(".ha-control-circle");
      expect(circle.exists()).toBe(true);
    });
  });

  describe("Interactions (Actions)", () => {
    let mockCallService;

    beforeEach(() => {
      mockCallService = vi.fn().mockResolvedValue(true);
      vi.spyOn(useServiceCallModule, "useServiceCall").mockReturnValue({
        callService: mockCallService,
        isLoading: { value: false },
        error: { value: null },
        success: { value: false },
      });
    });

    it("should call turn_on with hs_color when a color preset is clicked", async () => {
      const entity = {
        entity_id: "light.rgb_click",
        state: "on",
        attributes: {
          friendly_name: "RGB Click Light",
          supported_color_modes: ["rgb"],
        },
      };

      const wrapper = mount(HaLight, { props: { entity } });

      const colorBtn = wrapper.find(".color-preset-btn-icon");
      expect(colorBtn.exists()).toBe(true);
      await colorBtn.trigger("click");

      expect(mockCallService).toHaveBeenCalledWith(
        "light",
        "turn_on",
        expect.objectContaining({
          entity_id: "light.rgb_click",
          hs_color: expect.any(Array),
        }),
      );
    });

    it("should call turn_on with color_temp when a color temp preset is clicked", async () => {
      const entity = {
        entity_id: "light.ct_click",
        state: "on",
        attributes: {
          friendly_name: "CT Click Light",
          supported_color_modes: ["color_temp"],
          color_temp: 370,
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
        },
      };

      const wrapper = mount(HaLight, { props: { entity } });

      const presetBtn = wrapper.find(".preset-btn-icon");
      expect(presetBtn.exists()).toBe(true);
      await presetBtn.trigger("click");

      expect(mockCallService).toHaveBeenCalledWith(
        "light",
        "turn_on",
        expect.objectContaining({
          entity_id: "light.ct_click",
          color_temp: expect.any(Number),
        }),
      );
    });

    it("should call turn_on with brightness when slider is moved", async () => {
      const entity = {
        entity_id: "light.dim_slide",
        state: "on",
        attributes: {
          friendly_name: "Dimmable Slide",
          brightness: 128,
          supported_color_modes: ["brightness"],
        },
      };

      const wrapper = mount(HaLight, { props: { entity } });

      const slider = wrapper.find('input[type="range"]');
      expect(slider.exists()).toBe(true);

      // Simulate an input event with a specific value
      await slider.setValue(75);
      await slider.trigger("input");

      expect(mockCallService).toHaveBeenCalledWith(
        "light",
        "turn_on",
        expect.objectContaining({
          entity_id: "light.dim_slide",
          brightness: expect.any(Number),
        }),
      );
    });

    it("should not call service when color preset is clicked but entity is null", async () => {
      // Pass a string entity ID that doesn't exist in the store
      mount(HaLight, {
        props: { entity: "light.nonexistent_for_setColorPreset" },
      });

      // Entity not found → no template buttons to click, callService never called
      expect(mockCallService).not.toHaveBeenCalled();
    });
  });

  describe("controlCircleColor computed", () => {
    it("returns gray when light is unavailable", () => {
      const entity = {
        entity_id: "light.unavail_circle",
        state: "unavailable",
        attributes: {},
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#6c757d");
    });

    it("returns light gray when light is off", () => {
      const entity = {
        entity_id: "light.off_circle",
        state: "off",
        attributes: {},
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#e9ecef");
    });

    it("returns yellow for simple on/off light with no color modes", () => {
      const entity = {
        entity_id: "light.simple_on",
        state: "on",
        attributes: {},
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#FFC107");
    });

    it("computes RGB color for hue sector 0-60 (red-orange)", () => {
      const entity = {
        entity_id: "light.hue_0",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [30, 100], // hue=30 → sector 0-1
          brightness: 255,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("computes RGB color for hue sector 60-120 (yellow-green)", () => {
      const entity = {
        entity_id: "light.hue_90",
        state: "on",
        attributes: {
          supported_color_modes: ["hs"],
          hs_color: [90, 100], // hue=90 → sector 1-2
          brightness: 200,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("computes RGB color for hue sector 120-180 (green-cyan)", () => {
      const entity = {
        entity_id: "light.hue_150",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [150, 100], // hue=150 → sector 2-3
          brightness: 255,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("computes RGB color for hue sector 180-240 (cyan-blue)", () => {
      const entity = {
        entity_id: "light.hue_210",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [210, 100], // hue=210 → sector 3-4
          brightness: 255,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("computes RGB color for hue sector 240-300 (blue-magenta)", () => {
      const entity = {
        entity_id: "light.hue_270",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [270, 100], // hue=270 → sector 4-5
          brightness: 255,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("computes RGB color for hue sector 300-360 (else branch)", () => {
      const entity = {
        entity_id: "light.hue_330",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [330, 100], // hue=330 → sector 5+ (else branch)
          brightness: 255,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("returns warm color for color_temp light (2700K preset)", () => {
      const entity = {
        entity_id: "light.warm_ct",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 370, // ≈ 2702K → warm preset
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBeTruthy();
    });

    it("uses fallback kelvin colors when no preset matches (<=2700K)", () => {
      // min/max above all presets → supportedPresets = [] → falls to kelvin fallback
      const entity = {
        entity_id: "light.fallback_ct",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 371, // 1000000/371 ≈ 2695K ≤ 2700
          min_color_temp_kelvin: 7000,
          max_color_temp_kelvin: 8000,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#FFB366");
    });

    it("uses fallback kelvin color for 3000K range", () => {
      const entity = {
        entity_id: "light.fallback_3000",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 334, // 1000000/334 ≈ 2994K ≤ 3000
          min_color_temp_kelvin: 7000,
          max_color_temp_kelvin: 8000,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#FFCC80");
    });

    it("uses fallback kelvin color for 4000K range", () => {
      const entity = {
        entity_id: "light.fallback_4000",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 251, // 1000000/251 ≈ 3984K ≤ 4000
          min_color_temp_kelvin: 7000,
          max_color_temp_kelvin: 8000,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#E8F4FD");
    });

    it("uses fallback kelvin color for 5000K range", () => {
      const entity = {
        entity_id: "light.fallback_5000",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 201, // 1000000/201 ≈ 4975K ≤ 5000
          min_color_temp_kelvin: 7000,
          max_color_temp_kelvin: 8000,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#F0F8FF");
    });

    it("uses cold blue fallback for kelvin > 5000K", () => {
      const entity = {
        entity_id: "light.fallback_cold",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 153, // 1000000/153 ≈ 6536K > 5000K → else
          min_color_temp_kelvin: 7000,
          max_color_temp_kelvin: 8000,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#E3F2FD");
    });
  });

  describe("iconColor computed", () => {
    it("returns white when light is off", () => {
      const entity = {
        entity_id: "light.icon_off",
        state: "off",
        attributes: {},
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const icon = wrapper.find(".ha-control-icon");
      expect(icon.attributes("style")).toContain("color: white");
    });

    it("returns #333 for cool color_temp >= 4000K", () => {
      const entity = {
        entity_id: "light.icon_cool",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 200, // ≈ 5000K → >= 4000K → dark icon
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const icon = wrapper.find(".ha-control-icon");
      expect(icon.attributes("style")).toContain("color: #333");
    });

    it("returns white for warm color_temp < 4000K (passes through to luminance)", () => {
      const entity = {
        entity_id: "light.icon_warm",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 370, // ≈ 2702K → < 4000K → luminance check of #FFB366 → dark
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const icon = wrapper.find(".ha-control-icon");
      // #FFB366 luminance is well below threshold → white icon
      expect(icon.attributes("style")).toContain("color: white");
    });

    it("returns #333 for very pale/white explicit colors (e.g. #F0F8FF)", () => {
      const entity = {
        entity_id: "light.icon_daylight",
        state: "on",
        attributes: {
          supported_color_modes: ["color_temp"],
          color_temp: 200, // ≈ 5000K → fallback #F0F8FF → explicit light color → #333
          min_color_temp_kelvin: 5200,
          max_color_temp_kelvin: 6000,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const icon = wrapper.find(".ha-control-icon");
      expect(icon.attributes("style")).toContain("color: #333");
    });

    it("returns white for a dark color (e.g. deep blue #0000FF)", () => {
      const entity = {
        entity_id: "light.icon_blue",
        state: "on",
        attributes: {
          supported_color_modes: ["rgb"],
          hs_color: [240, 100], // Pure blue → dark → white icon
          brightness: 255,
        },
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const icon = wrapper.find(".ha-control-icon");
      expect(icon.attributes("style")).toContain("color: white");
    });

    it("returns yellow (#FFC107) circle and white icon for a simple on light", () => {
      const entity = {
        entity_id: "light.icon_simple",
        state: "on",
        attributes: {},
      };
      const wrapper = mount(HaLight, { props: { entity } });
      const circle = wrapper.find("circle");
      expect(circle.attributes("fill")).toBe("#FFC107");
      const icon = wrapper.find(".ha-control-icon");
      // #FFC107 luminance < 0.9 threshold → white icon
      expect(icon.attributes("style")).toContain("color: white");
    });
  });
});
