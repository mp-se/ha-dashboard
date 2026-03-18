import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import VisualEditorView from "../VisualEditorView.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../stores/haStore";

describe("VisualEditorView - Phase 3: Simplified Integration Tests", () => {
  let wrapper;
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    // Mock entity data
    store.entityMap = {
      "light.living_room": {
        entity_id: "light.living_room",
        state: "on",
        attributes: {
          brightness: 254,
          friendly_name: "Living Room",
        },
      },
    };

    store.dashboardConfig = {
      views: [
        {
          name: "home",
          label: "Home",
          entities: [
            {
              entity: "light.living_room",
              type: "HaLight",
              attributes: {
                label: "Living Room Light",
              },
            },
          ],
        },
      ],
    };

    wrapper = mount(VisualEditorView, {
      global: {
        plugins: [pinia],
        stubs: {
          EntityPalette: true,
          EditorCanvas: true,
          EntityInspector: true,
        },
      },
    });
  });

  describe("Component Type Management", () => {
    it("handler exists and is callable", () => {
      expect(typeof wrapper.vm.handleUpdateEntityType).toBe("function");
    });

    it("updates entity type in store when handler is called", async () => {
      // Ensure component is fully initialized
      await wrapper.vm.$nextTick();

      // The onMounted should have set selectedViewName to "home"
      wrapper.vm.selectedEntityId = 0;

      const originalType = store.dashboardConfig.views[0].entities[0].type;
      expect(originalType).toBe("HaLight");

      // Call the handler directly
      wrapper.vm.handleUpdateEntityType("HaSwitch");
      await wrapper.vm.$nextTick();

      expect(store.dashboardConfig.views[0].entities[0].type).toBe("HaSwitch");
    });

    it("preserves entity ID and attributes when changing type", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;

      const originalEntity = store.dashboardConfig.views[0].entities[0];
      const originalAttributes = { ...originalEntity.attributes };

      wrapper.vm.handleUpdateEntityType("HaSensor");
      await wrapper.vm.$nextTick();

      expect(store.dashboardConfig.views[0].entities[0].entity).toBe(
        "light.living_room",
      );
      expect(store.dashboardConfig.views[0].entities[0].attributes).toEqual(
        originalAttributes,
      );
    });

    it("handles null selection gracefully", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = null;

      const fn = () => {
        wrapper.vm.handleUpdateEntityType("HaButton");
      };

      expect(fn).not.toThrow();
      // Type should NOT change since no entity is selected
      expect(store.dashboardConfig.views[0].entities[0].type).toBe("HaLight");
    });
  });

  describe("Attribute Management", () => {
    it("handler exists and is callable", () => {
      expect(typeof wrapper.vm.handleUpdateEntityAttributes).toBe("function");
    });

    it("updates entity attributes in store when handler is called", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;

      const newAttributes = {
        label: "Updated Label",
        icon: "mdi:light",
      };

      wrapper.vm.handleUpdateEntityAttributes(newAttributes);
      await wrapper.vm.$nextTick();

      expect(store.dashboardConfig.views[0].entities[0].attributes).toEqual(
        newAttributes,
      );
    });

    it("can set attributes to empty object", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;

      wrapper.vm.handleUpdateEntityAttributes({});
      await wrapper.vm.$nextTick();

      expect(store.dashboardConfig.views[0].entities[0].attributes).toEqual({});
    });

    it("can update attributes with different types", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;

      const attributes = {
        stringAttr: "value",
        numberAttr: 42,
        booleanAttr: true,
        arrayAttr: [1, 2, 3],
      };

      wrapper.vm.handleUpdateEntityAttributes(attributes);
      await wrapper.vm.$nextTick();

      const stored = store.dashboardConfig.views[0].entities[0].attributes;
      expect(stored.stringAttr).toBe("value");
      expect(stored.numberAttr).toBe(42);
      expect(stored.booleanAttr).toBe(true);
      expect(Array.isArray(stored.arrayAttr)).toBe(true);
    });

    it("handles null selection gracefully", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = null;

      const fn = () => {
        wrapper.vm.handleUpdateEntityAttributes({ test: "value" });
      };

      expect(fn).not.toThrow();
      // Attributes should NOT change since no entity is selected
      expect(store.dashboardConfig.views[0].entities[0].attributes.label).toBe(
        "Living Room Light",
      );
    });
  });

  describe("Type and Attributes Together", () => {
    it("maintains type when updating attributes", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;

      const originalType = "HaLight";

      wrapper.vm.handleUpdateEntityAttributes({ newAttr: "value" });
      await wrapper.vm.$nextTick();

      expect(store.dashboardConfig.views[0].entities[0].type).toBe(
        originalType,
      );
    });

    it("maintains attributes when updating type", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;

      const originalAttributes = {
        label: "Living Room Light",
      };

      wrapper.vm.handleUpdateEntityType("HaSensor");
      await wrapper.vm.$nextTick();

      expect(store.dashboardConfig.views[0].entities[0].attributes).toEqual(
        originalAttributes,
      );
    });
  });

  describe("Multiple Entities", () => {
    beforeEach(() => {
      store.dashboardConfig.views[0].entities.push({
        entity: "light.bedroom",
        type: "HaLight",
        attributes: {
          label: "Bedroom Light",
        },
      });
    });

    it("updates correct entity when multiple exist", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 1;

      wrapper.vm.handleUpdateEntityAttributes({
        label: "Updated Bedroom",
      });
      await wrapper.vm.$nextTick();

      // First entity should be unchanged
      expect(store.dashboardConfig.views[0].entities[0].attributes.label).toBe(
        "Living Room Light",
      );

      // Second entity should be updated
      expect(store.dashboardConfig.views[0].entities[1].attributes.label).toBe(
        "Updated Bedroom",
      );
    });

    it("changes type on correct entity", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 1;

      wrapper.vm.handleUpdateEntityType("HaGauge");
      await wrapper.vm.$nextTick();

      expect(store.dashboardConfig.views[0].entities[1].type).toBe("HaGauge");
      expect(store.dashboardConfig.views[0].entities[0].type).toBe("HaLight");
    });
  });

  describe("Handler Logic Validation", () => {
    it("both handlers don't throw with readonly store updates", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;

      const typeFn = () => {
        wrapper.vm.handleUpdateEntityType("HaButton");
      };

      const attrFn = () => {
        wrapper.vm.handleUpdateEntityAttributes({ test: "value" });
      };

      expect(typeFn).not.toThrow();
      expect(attrFn).not.toThrow();
    });

    it("handlers work with valid view names", async () => {
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;
      wrapper.vm.handleUpdateEntityType("HaSensor");

      await wrapper.vm.$nextTick();
      expect(store.dashboardConfig.views[0].entities[0].type).toBe("HaSensor");
    });

    it("handlers gracefully handle invalid view names", async () => {
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedEntityId = 0;
      wrapper.vm.selectedViewName = "nonexistent";
      await wrapper.vm.$nextTick();

      const fn = () => {
        wrapper.vm.handleUpdateEntityAttributes({ test: "value" });
      };

      expect(fn).not.toThrow();
      // Store should remain unchanged since view doesn't exist
      expect(store.dashboardConfig.views[0].entities[0].attributes.label).toBe(
        "Living Room Light",
      );
    });
  });
});
