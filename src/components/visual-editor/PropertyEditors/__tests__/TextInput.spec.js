import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TextInput from "../TextInput.vue";

describe("TextInput.vue", () => {
  it("renders the input with label", () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "",
      },
    });
    const label = wrapper.find("label");
    expect(label.text()).toContain("Title");
  });

  it("displays required indicator when required", () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "",
        required: true,
      },
    });
    expect(wrapper.find(".text-danger").text()).toBe("*");
  });

  it("sets model value in input", () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "Hello World",
      },
    });
    const input = wrapper.find("input");
    expect(input.element.value).toBe("Hello World");
  });

  it("emits update:modelValue on input change", async () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "",
      },
    });
    const input = wrapper.find("input");
    await input.setValue("New Value");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")[0]).toEqual(["New Value"]);
  });

  it("displays help text when provided", () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "",
        help: "This is help text",
      },
    });
    expect(wrapper.find(".text-muted").text()).toBe("This is help text");
  });

  it("displays error message when provided", () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "",
        error: "This is an error",
      },
    });
    const error = wrapper
      .findAll(".text-danger")
      .find((el) => el.text() === "This is an error");
    expect(error).toBeTruthy();
  });

  it("applies maxLength attribute when provided", () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "",
        maxLength: 50,
      },
    });
    const input = wrapper.find("input");
    expect(input.element.maxLength).toBe(50);
  });

  it("sets placeholder to label", () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Enter Title",
        modelValue: "",
      },
    });
    const input = wrapper.find("input");
    expect(input.element.placeholder).toBe("Enter Title");
  });

  it("handles multiple updates", async () => {
    const wrapper = mount(TextInput, {
      props: {
        label: "Title",
        modelValue: "Initial",
      },
    });
    const input = wrapper.find("input");
    await input.setValue("Updated 1");
    await input.setValue("Updated 2");
    expect(wrapper.emitted("update:modelValue")).toHaveLength(2);
  });
});
