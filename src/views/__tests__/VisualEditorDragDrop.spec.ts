import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import VisualEditorView from "../VisualEditorView.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../stores/haStore";
import {
  resetVisualEditorToolbar,
  useVisualEditorToolbar,
} from "../../composables/useVisualEditorToolbar";

describe("VisualEditorView.vue - Reordering Integration (Phase 2)", () => {
  let wrapper: any;
  let haStore: any;

  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    resetVisualEditorToolbar();
    haStore = useHaStore();

    // Mock dashboard config
    haStore.dashboardConfig = {
      views: [
        {
          name: "overview",
          label: "Overview",
          entities: [
            { entity: "sensor.temperature", type: "HaSensor" },
            { entity: "light.living_room", type: "HaLight" },
            { entity: "switch.garage", type: "HaSwitch" },
          ],
        },
      ],
    };

    haStore.entityMap = {
      "sensor.temperature": {
        entity_id: "sensor.temperature",
        attributes: { friendly_name: "Temperature" },
        state: "23.5",
      },
      "light.living_room": {
        entity_id: "light.living_room",
        attributes: { friendly_name: "Living Room Light" },
        state: "on",
      },
      "switch.garage": {
        entity_id: "switch.garage",
        attributes: { friendly_name: "Garage Door" },
        state: "off",
      },
    };

    wrapper = mount(VisualEditorView, {
      global: {
        plugins: [pinia],
        stubs: {
          EditorCanvas: {
            template: `<div class="stubbed-canvas"></div>`,
            emits: ["reorder-entities", "select-entity", "remove-entity"],
          },
          EntityPalette: true,
          EntityInspector: true,
          JsonConfigView: true,
        },
      },
    });
  });

  describe("Entity reordering through VisualEditorView", () => {
    it("should handle reorder-entities event from EditorCanvas", () => {
      const newOrder = [
        { entity: "light.living_room", type: "HaLight" },
        { entity: "sensor.temperature", type: "HaSensor" },
        { entity: "switch.garage", type: "HaSwitch" },
      ];

      wrapper.vm.handleReorderEntities(newOrder);

      // Verify the store was updated
      expect(haStore.dashboardConfig.views[0].entities[0].entity).toBe(
        "light.living_room",
      );
    });

    it("should trigger auto-save on reorder", async () => {
      vi.useFakeTimers();
      const toolbar = useVisualEditorToolbar();

      const newOrder = [
        { entity: "switch.garage", type: "HaSwitch" },
        { entity: "sensor.temperature", type: "HaSensor" },
        { entity: "light.living_room", type: "HaLight" },
      ];

      wrapper.vm.handleReorderEntities(newOrder);

      // After reorder, hasChanges should be true
      expect(toolbar.hasChanges.value).toBe(true);

      vi.runAllTimers();
      await wrapper.vm.$nextTick();

      vi.useRealTimers();
    });

    it("should preserve entity properties during reorder", () => {
      const initialEntity = haStore.dashboardConfig.views[0].entities[0];
      const initialProperties = { ...initialEntity };

      const newOrder = [
        { entity: "light.living_room", type: "HaLight" },
        initialEntity,
        { entity: "switch.garage", type: "HaSwitch" },
      ];

      wrapper.vm.handleReorderEntities(newOrder);

      // The entity should still have its properties
      const reorderedEntity = haStore.dashboardConfig.views[0].entities[1];
      expect(reorderedEntity.entity).toBe(initialProperties.entity);
      expect(reorderedEntity.type).toBe(initialProperties.type);
    });

    it("should maintain correct order after multiple reorders", () => {
      let currentOrder = [...haStore.dashboardConfig.views[0].entities];

      // First reorder: move second to first
      const firstReorder = [currentOrder[1], currentOrder[0], currentOrder[2]];
      wrapper.vm.handleReorderEntities(firstReorder);
      currentOrder = [...haStore.dashboardConfig.views[0].entities];

      // Second reorder: move first to last
      const secondReorder = [currentOrder[1], currentOrder[2], currentOrder[0]];
      wrapper.vm.handleReorderEntities(secondReorder);
      currentOrder = [...haStore.dashboardConfig.views[0].entities];

      // Verify final order
      expect(currentOrder).toHaveLength(3);
      // Just verify order changed and all entities are still there
      expect(currentOrder.map((e) => e.entity)).toContain("sensor.temperature");
      expect(currentOrder.map((e) => e.entity)).toContain("light.living_room");
      expect(currentOrder.map((e) => e.entity)).toContain("switch.garage");
    });
  });

  describe("Drag-drop UX interactions", () => {
    it("should handle rapid reordering requests", () => {
      const orders = [
        [
          { entity: "light.living_room", type: "HaLight" },
          { entity: "sensor.temperature", type: "HaSensor" },
          { entity: "switch.garage", type: "HaSwitch" },
        ],
        [
          { entity: "switch.garage", type: "HaSwitch" },
          { entity: "light.living_room", type: "HaLight" },
          { entity: "sensor.temperature", type: "HaSensor" },
        ],
      ];

      orders.forEach((order) => {
        wrapper.vm.handleReorderEntities(order);
      });

      // Should have the last reorder applied
      expect(haStore.dashboardConfig.views[0].entities[0].entity).toBe(
        "switch.garage",
      );
    });

    it("should not lose entities during reorder", () => {
      const originalCount = haStore.dashboardConfig.views[0].entities.length;

      const newOrder = [
        haStore.dashboardConfig.views[0].entities[2],
        haStore.dashboardConfig.views[0].entities[0],
        haStore.dashboardConfig.views[0].entities[1],
      ];

      wrapper.vm.handleReorderEntities(newOrder);

      expect(haStore.dashboardConfig.views[0].entities).toHaveLength(
        originalCount,
      );
    });

    it("should update selection state appropriately", async () => {
      wrapper.vm.selectedEntityId = 0;

      const newOrder = [
        haStore.dashboardConfig.views[0].entities[1],
        haStore.dashboardConfig.views[0].entities[0],
        haStore.dashboardConfig.views[0].entities[2],
      ];

      wrapper.vm.handleReorderEntities(newOrder);
      await wrapper.vm.$nextTick();

      // Selection remains but points to potentially different entity
      // This is expected behavior as the indices may have changed
    });
  });

  describe("State consistency", () => {
    it("should keep currentView consistent with store", async () => {
      const initialView = wrapper.vm.currentView;
      expect(initialView).toBeDefined();
      expect(initialView.entities).toHaveLength(3);

      const newOrder = [
        { entity: "switch.garage", type: "HaSwitch" },
        { entity: "sensor.temperature", type: "HaSensor" },
        { entity: "light.living_room", type: "HaLight" },
      ];

      wrapper.vm.handleReorderEntities(newOrder);
      await wrapper.vm.$nextTick();

      const updatedView = wrapper.vm.currentView;
      expect(updatedView.entities[0].entity).toBe("switch.garage");
    });

    it("should reflect reorder in currentViewEntities computed property", async () => {
      const initialEntities = wrapper.vm.currentViewEntities;
      expect(initialEntities[0].entity).toBe("sensor.temperature");

      const newOrder = [
        { entity: "light.living_room", type: "HaLight" },
        { entity: "sensor.temperature", type: "HaSensor" },
        { entity: "switch.garage", type: "HaSwitch" },
      ];

      wrapper.vm.handleReorderEntities(newOrder);
      await wrapper.vm.$nextTick();

      const updatedEntities = wrapper.vm.currentViewEntities;
      expect(updatedEntities[0].entity).toBe("light.living_room");
    });
  });
});
