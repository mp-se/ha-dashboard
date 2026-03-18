import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TextAreaInput from "../TextAreaInput.vue";

describe("TextAreaInput.vue", () => {
  it("renders textarea with label", () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "",
      },
    });
    const label = wrapper.find("label");
    expect(label.text()).toContain("Description");
  });

  it("displays required indicator when required", () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "",
        required: true,
      },
    });
    expect(wrapper.find(".text-danger").text()).toBe("*");
  });

  it("sets model value in textarea", () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "Long text content",
      },
    });
    const textarea = wrapper.find("textarea");
    expect(textarea.element.value).toBe("Long text content");
  });

  it("emits update:modelValue on textarea change", async () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "",
      },
    });
    const textarea = wrapper.find("textarea");
    await textarea.setValue("New text");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")[0]).toEqual(["New text"]);
  });

  it("displays help text when provided", () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "",
        help: "Enter detailed description",
      },
    });
    expect(wrapper.find(".text-muted").text()).toBe(
      "Enter detailed description",
    );
  });

  it("displays error message when provided", () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "",
        error: "Too long",
      },
    });
    const error = wrapper
      .findAll(".text-danger")
      .find((el) => el.text() === "Too long");
    expect(error).toBeTruthy();
  });

  it("applies maxLength attribute when provided", () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "",
        maxLength: 500,
      },
    });
    const textarea = wrapper.find("textarea");
    expect(textarea.element.maxLength).toBe(500);
  });

  it("sets placeholder to label", () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Enter description",
        modelValue: "",
      },
    });
    const textarea = wrapper.find("textarea");
    expect(textarea.element.placeholder).toBe("Enter description");
  });

  it("handles multiline text", async () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "",
      },
    });
    const textarea = wrapper.find("textarea");
    const multilineText = "Line 1\nLine 2\nLine 3";
    await textarea.setValue(multilineText);
    expect(wrapper.emitted("update:modelValue")[0]).toEqual([multilineText]);
  });

  it("handles multiple updates", async () => {
    const wrapper = mount(TextAreaInput, {
      props: {
        label: "Description",
        modelValue: "Initial",
      },
    });
    const textarea = wrapper.find("textarea");
    await textarea.setValue("Updated 1");
    await textarea.setValue("Updated 2");
    expect(wrapper.emitted("update:modelValue")).toHaveLength(2);
  });
});
