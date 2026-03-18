import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import NumberInput from "../NumberInput.vue";

describe("NumberInput.vue", () => {
  it("renders the input with label", () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
      },
    });
    const label = wrapper.find("label");
    expect(label.text()).toContain("Count");
  });

  it("displays required indicator when required", () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
        required: true,
      },
    });
    expect(wrapper.find(".text-danger").text()).toBe("*");
  });

  it("sets model value in input", () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 42,
      },
    });
    const input = wrapper.find("input");
    expect(input.element.value).toBe("42");
  });

  it("emits update:modelValue on input change", async () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
      },
    });
    const input = wrapper.find("input");
    await input.setValue("100");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")[0][0]).toBe(100);
  });

  it("displays help text when provided", () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
        help: "Enter a number",
      },
    });
    expect(wrapper.find(".text-muted").text()).toBe("Enter a number");
  });

  it("displays error message when provided", () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
        error: "Invalid number",
      },
    });
    const error = wrapper
      .findAll(".text-danger")
      .find((el) => el.text() === "Invalid number");
    expect(error).toBeTruthy();
  });

  it("applies min attribute when provided", () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
        min: -10,
      },
    });
    const input = wrapper.find("input");
    expect(input.element.min).toBe("-10");
  });

  it("applies max attribute when provided", () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
        max: 100,
      },
    });
    const input = wrapper.find("input");
    expect(input.element.max).toBe("100");
  });

  it("handles decimal values", async () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
      },
    });
    const input = wrapper.find("input");
    await input.setValue("3.14");
    expect(wrapper.emitted("update:modelValue")[0][0]).toBe(3.14);
  });

  it("converts string to number on emit", async () => {
    const wrapper = mount(NumberInput, {
      props: {
        label: "Count",
        modelValue: 0,
      },
    });
    const input = wrapper.find("input");
    await input.setValue("50");
    const emitted = wrapper.emitted("update:modelValue")[0][0];
    expect(typeof emitted).toBe("number");
    expect(emitted).toBe(50);
  });
});
