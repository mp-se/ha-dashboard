import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PropertyEditorFactory from "../PropertyEditorFactory.vue";
import TextInput from "../TextInput.vue";
import TextAreaInput from "../TextAreaInput.vue";
import SelectInput from "../SelectInput.vue";
import BooleanToggle from "../BooleanToggle.vue";
import EntityListEditor from "../EntityListEditor.vue";
import IconPicker from "../IconPicker.vue";
import ColorPicker from "../ColorPicker.vue";
import NumberInput from "../NumberInput.vue";

describe("PropertyEditorFactory.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  describe("Text Input", () => {
    it("renders TextInput for text property type", () => {
      const property = {
        type: "text",
        label: "Title",
        help: "Enter title",
        required: true,
        maxLength: 100,
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "test",
        },
      });
      expect(wrapper.findComponent(TextInput).exists()).toBe(true);
      expect(wrapper.findComponent(TextInput).props("label")).toBe("Title");
      expect(wrapper.findComponent(TextInput).props("maxLength")).toBe(100);
    });

    it("emits update:modelValue from TextInput", async () => {
      const property = { type: "text", label: "Title" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "old",
        },
      });
      await wrapper
        .findComponent(TextInput)
        .vm.$emit("update:modelValue", "new");
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")[0]).toEqual(["new"]);
    });
  });

  describe("Textarea Input", () => {
    it("renders TextAreaInput for textarea property type", () => {
      const property = {
        type: "textarea",
        label: "Description",
        help: "Enter description",
        maxLength: 500,
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "desc",
        },
      });
      expect(wrapper.findComponent(TextAreaInput).exists()).toBe(true);
      expect(wrapper.findComponent(TextAreaInput).props("label")).toBe(
        "Description",
      );
    });

    it("emits update:modelValue from TextAreaInput", async () => {
      const property = { type: "textarea", label: "Description" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "old",
        },
      });
      await wrapper
        .findComponent(TextAreaInput)
        .vm.$emit("update:modelValue", "new desc");
      expect(wrapper.emitted("update:modelValue")[0]).toEqual(["new desc"]);
    });
  });

  describe("Select Input", () => {
    it("renders SelectInput for select property type", () => {
      const property = {
        type: "select",
        label: "Choose",
        options: [
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ],
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "a",
        },
      });
      expect(wrapper.findComponent(SelectInput).exists()).toBe(true);
      expect(wrapper.findComponent(SelectInput).props("options")).toEqual(
        property.options,
      );
    });

    it("emits update:modelValue from SelectInput", async () => {
      const property = {
        type: "select",
        label: "Choose",
        options: [{ value: "a", label: "A" }],
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "a",
        },
      });
      await wrapper
        .findComponent(SelectInput)
        .vm.$emit("update:modelValue", "b");
      expect(wrapper.emitted("update:modelValue")[0]).toEqual(["b"]);
    });
  });

  describe("Boolean Toggle", () => {
    it("renders BooleanToggle for boolean property type", () => {
      const property = {
        type: "boolean",
        label: "Enabled",
        help: "Toggle to enable",
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: true,
        },
      });
      expect(wrapper.findComponent(BooleanToggle).exists()).toBe(true);
      expect(wrapper.findComponent(BooleanToggle).props("label")).toBe(
        "Enabled",
      );
    });

    it("emits update:modelValue from BooleanToggle", async () => {
      const property = { type: "boolean", label: "Enabled" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: true,
        },
      });
      await wrapper
        .findComponent(BooleanToggle)
        .vm.$emit("update:modelValue", false);
      expect(wrapper.emitted("update:modelValue")[0]).toEqual([false]);
    });
  });

  describe("Entity List Editor", () => {
    it("renders EntityListEditor for entity-list property type", () => {
      const property = {
        type: "entity-list",
        label: "Entities",
        help: "Select entities",
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: ["entity1"],
        },
      });
      expect(wrapper.findComponent(EntityListEditor).exists()).toBe(true);
    });

    it("emits update:modelValue from EntityListEditor", async () => {
      const property = { type: "entity-list", label: "Entities" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: ["entity1"],
        },
      });
      await wrapper
        .findComponent(EntityListEditor)
        .vm.$emit("update:modelValue", ["entity2"]);
      expect(wrapper.emitted("update:modelValue")[0]).toEqual([["entity2"]]);
    });
  });

  describe("Icon Picker", () => {
    it("renders IconPicker for icon property type", () => {
      const property = {
        type: "icon",
        label: "Icon",
        help: "Pick an icon",
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "mdi-home",
        },
      });
      expect(wrapper.findComponent(IconPicker).exists()).toBe(true);
    });

    it("emits update:modelValue from IconPicker", async () => {
      const property = { type: "icon", label: "Icon" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "mdi-home",
        },
      });
      await wrapper
        .findComponent(IconPicker)
        .vm.$emit("update:modelValue", "mdi-star");
      expect(wrapper.emitted("update:modelValue")[0]).toEqual(["mdi-star"]);
    });
  });

  describe("Color Picker", () => {
    it("renders ColorPicker for color property type", () => {
      const property = {
        type: "color",
        label: "Color",
        help: "Choose color",
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "#ff0000",
        },
      });
      expect(wrapper.findComponent(ColorPicker).exists()).toBe(true);
    });

    it("emits update:modelValue from ColorPicker", async () => {
      const property = { type: "color", label: "Color" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "#ff0000",
        },
      });
      await wrapper
        .findComponent(ColorPicker)
        .vm.$emit("update:modelValue", "#00ff00");
      expect(wrapper.emitted("update:modelValue")[0]).toEqual(["#00ff00"]);
    });
  });

  describe("Number Input", () => {
    it("renders NumberInput for number property type", () => {
      const property = {
        type: "number",
        label: "Count",
        help: "Enter count",
        min: 0,
        max: 100,
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: 50,
        },
      });
      expect(wrapper.findComponent(NumberInput).exists()).toBe(true);
      expect(wrapper.findComponent(NumberInput).props("min")).toBe(0);
      expect(wrapper.findComponent(NumberInput).props("max")).toBe(100);
    });

    it("emits update:modelValue from NumberInput", async () => {
      const property = { type: "number", label: "Count" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: 50,
        },
      });
      await wrapper
        .findComponent(NumberInput)
        .vm.$emit("update:modelValue", 75);
      expect(wrapper.emitted("update:modelValue")[0]).toEqual([75]);
    });
  });

  describe("Error handling", () => {
    it("passes error prop to all components", () => {
      const property = { type: "text", label: "Title" };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "test",
          error: "Required field",
        },
      });
      expect(wrapper.findComponent(TextInput).props("error")).toBe(
        "Required field",
      );
    });
  });

  describe("Unknown property type", () => {
    it("renders nothing for unknown property type", () => {
      const property = {
        type: "unknown",
        label: "Unknown",
      };
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          property,
          modelValue: "test",
        },
      });
      expect(wrapper.findComponent(TextInput).exists()).toBe(false);
      expect(wrapper.findComponent(NumberInput).exists()).toBe(false);
    });
  });

  describe("Null/undefined property", () => {
    it("renders nothing when property is not provided", () => {
      const wrapper = mount(PropertyEditorFactory, {
        props: {
          modelValue: "test",
        },
      });
      expect(wrapper.find(".property-editor-factory").exists()).toBe(false);
    });
  });
});
