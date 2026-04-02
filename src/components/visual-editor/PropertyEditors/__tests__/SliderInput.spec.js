import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SliderInput from "../SliderInput.vue";

describe("SliderInput.vue", () => {
  const defaultProps = {
    label: "Scale",
    modelValue: 1,
  };

  // ─── Rendering ───────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("renders the label", () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      expect(wrapper.find("label").text()).toContain("Scale");
    });

    it("renders an input of type range", () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      const input = wrapper.find("input[type='range']");
      expect(input.exists()).toBe(true);
    });

    it("displays the current value in the badge", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, modelValue: 1.5 },
      });
      expect(wrapper.find(".badge").text()).toBe("1.5");
    });

    it("formats the badge value to one decimal place", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, modelValue: 1 },
      });
      expect(wrapper.find(".badge").text()).toBe("1.0");
    });

    it("shows required indicator when required=true", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, required: true },
      });
      expect(wrapper.find(".text-danger").text()).toBe("*");
    });

    it("does not show required indicator when required=false", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, required: false },
      });
      expect(wrapper.find("span.text-danger").exists()).toBe(false);
    });

    it("shows help text when provided", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, help: "Adjust the scale factor" },
      });
      expect(wrapper.find(".text-muted").text()).toBe(
        "Adjust the scale factor",
      );
    });

    it("does not show help text when not provided", () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      expect(wrapper.find(".text-muted").exists()).toBe(false);
    });

    it("shows error message when error prop is set", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, error: "Value out of range" },
      });
      const error = wrapper
        .findAll(".text-danger")
        .find((el) => el.text().includes("Value out of range"));
      expect(error).toBeTruthy();
      expect(error.text()).toBe("Value out of range");
    });

    it("does not show error text when error is empty", () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      // The only .text-danger if any would be required indicator – no error small
      const smalls = wrapper.findAll("small.text-danger");
      expect(smalls.length).toBe(0);
    });
  });

  // ─── Range attributes ─────────────────────────────────────────────────

  describe("range input attributes", () => {
    it("applies default min, max, step values", () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      const input = wrapper.find("input[type='range']");
      expect(input.attributes("min")).toBe("0.1");
      expect(input.attributes("max")).toBe("2");
      expect(input.attributes("step")).toBe("0.1");
    });

    it("applies custom min, max, step values", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, min: 0, max: 100, step: 5 },
      });
      const input = wrapper.find("input[type='range']");
      expect(input.attributes("min")).toBe("0");
      expect(input.attributes("max")).toBe("100");
      expect(input.attributes("step")).toBe("5");
    });

    it("sets the range value from modelValue", () => {
      const wrapper = mount(SliderInput, {
        props: { ...defaultProps, modelValue: 1.5 },
      });
      const input = wrapper.find("input[type='range']");
      expect(input.element.value).toBe("1.5");
    });
  });

  // ─── Events ──────────────────────────────────────────────────────────────

  describe("events", () => {
    it("emits update:modelValue with numeric value on slider input", async () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      const input = wrapper.find("input[type='range']");
      await input.setValue("1.5");
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")[0][0]).toBe(1.5);
    });

    it("emits a number, not a string", async () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      const input = wrapper.find("input[type='range']");
      await input.setValue("0.5");
      const emitted = wrapper.emitted("update:modelValue")[0][0];
      expect(typeof emitted).toBe("number");
    });
  });

  // ─── inputId uniqueness ───────────────────────────────────────────────────

  describe("accessibility", () => {
    it("label for attribute matches input id", () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      const labelFor = wrapper.find("label").attributes("for");
      const inputId = wrapper.find("input").attributes("id");
      expect(labelFor).toBe(inputId);
    });

    it("generates a unique id starting with slider-", () => {
      const wrapper = mount(SliderInput, { props: defaultProps });
      const inputId = wrapper.find("input").attributes("id");
      expect(inputId).toMatch(/^slider-/);
    });
  });
});
