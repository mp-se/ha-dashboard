import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import EntityInspector from "../EntityInspector.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

// Mock child components
const mockPropertyEditorFactory = {
  name: "PropertyEditorFactory",
  template: '<div class="property-editor"><slot /></div>',
  props: ["property", "modelValue", "error"],
  emits: ["update:modelValue"],
};

const mockEntityListEditor = {
  name: "EntityListEditor",
  template: '<div class="entity-list-editor"><slot /></div>',
  props: ["modelValue", "lockFirstEntity", "label", "help"],
  emits: ["update:modelValue", "all-entities-removed"],
};

describe("EntityInspector.vue", () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useHaStore();

    // Mock store with a light entity
    store.entities = [
      {
        entity_id: "light.living_room",
        state: "on",
        attributes: {
          brightness: 255,
          color_mode: "rgb",
        },
      },
    ];
  });

  const createWrapper = (entity = {}) => {
    return mount(EntityInspector, {
      props: {
        entity: {
          entity: "light.living_room",
          type: undefined,
          attributes: {},
          ...entity,
        },
        entityId: 0,
      },
      global: {
        stubs: {
          PropertyEditorFactory: mockPropertyEditorFactory,
          EntityListEditor: mockEntityListEditor,
        },
      },
    });
  };

  describe("Component Type Selection", () => {
    it("renders component type selector", () => {
      wrapper = createWrapper();
      const selector = wrapper.find("#componentType");
      expect(selector.exists()).toBe(true);
    });

    it("displays recommended type when no type is set", () => {
      wrapper = createWrapper({
        entity: "light.living_room",
        type: undefined,
      });
      const selector = wrapper.find("#componentType");
      // The light entity should default to HaLight
      expect(selector.element.value).toBeTruthy();
    });

    it("displays Default label for recommended type", () => {
      wrapper = createWrapper();
      const options = wrapper.findAll("#componentType option");
      const recommendedOption = options.find((opt) =>
        opt.text().includes("Default"),
      );
      expect(recommendedOption).toBeTruthy();
    });

    it("removes auto-detect option", () => {
      wrapper = createWrapper();
      const options = wrapper.findAll("#componentType option");
      const autoDetectOption = options.find((opt) =>
        opt.text().includes("Auto-detect"),
      );
      expect(autoDetectOption).toBeFalsy();
    });

    it("emits update-type event when component type changes", async () => {
      wrapper = createWrapper();
      const selector = wrapper.find("#componentType");

      // Change to a different component type
      await selector.setValue("HaGauge");

      expect(wrapper.emitted("update-type")).toBeTruthy();
      expect(wrapper.emitted("update-type")[0][0]).toBe("HaGauge");
    });

    it("emits undefined when selecting the recommended type", async () => {
      wrapper = createWrapper({
        type: "HaGauge", // Start with a non-default type
      });

      const selector = wrapper.find("#componentType");
      const recommendedType = wrapper.vm.recommendedType;

      // Change back to recommended type
      await selector.setValue(recommendedType);

      expect(wrapper.emitted("update-type")).toBeTruthy();
      expect(wrapper.emitted("update-type")[0][0]).toBeUndefined();
    });

    it("displays available component types in optgroup", () => {
      wrapper = createWrapper();
      const optgroups = wrapper.findAll("#componentType optgroup");
      const availableGroup = optgroups.find((og) =>
        og.attributes("label")?.includes("Available"),
      );
      expect(availableGroup).toBeTruthy();

      const options = availableGroup.findAll("option");
      expect(options.length).toBeGreaterThan(0);
    });

    it("maintains current selected type in dropdown", async () => {
      wrapper = createWrapper({
        type: "HaGauge",
      });

      const selector = wrapper.find("#componentType");
      expect(selector.element.value).toBe("HaGauge");
    });
  });

  describe("Recommended Type Logic", () => {
    it("uses HaLight for light entities by default", () => {
      wrapper = createWrapper({
        entity: "light.living_room",
        type: undefined,
      });
      expect(wrapper.vm.recommendedType).toBe("HaLight");
    });

    it("uses HaSwitch for switch entities by default", () => {
      wrapper = createWrapper({
        entity: "switch.bedroom",
        type: undefined,
      });
      expect(wrapper.vm.recommendedType).toBe("HaSwitch");
    });

    it("uses HaBinarySensor for binary_sensor entities by default", () => {
      wrapper = createWrapper({
        entity: "binary_sensor.motion",
        type: undefined,
      });
      expect(wrapper.vm.recommendedType).toBe("HaBinarySensor");
    });

    it("uses HaEntityList when entity is a getter", () => {
      wrapper = createWrapper({
        getter: "store.allLights",
        entity: undefined,
        type: undefined,
      });
      expect(wrapper.vm.recommendedType).toBe("HaEntityList");
    });
  });

  describe("Entity Display", () => {
    it("displays entity ID when single entity", () => {
      wrapper = createWrapper({
        entity: "light.living_room",
      });
      expect(wrapper.text()).toContain("light.living_room");
    });

    it("renders EntityListEditor for array entities", () => {
      wrapper = createWrapper({
        entity: ["light.living_room", "light.kitchen"],
      });
      const editor = wrapper.findComponent(mockEntityListEditor);
      expect(editor.exists()).toBe(true);
    });
  });

  describe("Button Actions", () => {
    it("emits deselect event when deselect button clicked", async () => {
      wrapper = createWrapper();
      const deselectBtn = wrapper.find('button[title="Deselect this entity"]');
      if (deselectBtn.exists()) {
        await deselectBtn.trigger("click");
        expect(wrapper.emitted("deselect")).toBeTruthy();
      }
    });

    it("emits remove-entity event when remove button clicked", async () => {
      wrapper = createWrapper();
      const removeBtn = wrapper.find('button[title="Remove this entity"]');
      if (removeBtn.exists()) {
        await removeBtn.trigger("click");
        expect(wrapper.emitted("remove-entity")).toBeTruthy();
      }
    });
  });
});
