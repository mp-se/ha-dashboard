import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import VisualEditorView from "../../views/VisualEditorView.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../stores/haStore";

describe("VisualEditorView.vue", () => {
  let wrapper;
  let haStore;

  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
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
          ],
        },
        {
          name: "bedroom",
          label: "Bedroom",
          entities: [{ entity: "light.bedroom", type: "HaLight" }],
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
      "light.bedroom": {
        entity_id: "light.bedroom",
        attributes: { friendly_name: "Bedroom Light" },
        state: "off",
      },
    };

    wrapper = mount(VisualEditorView, {
      global: {
        plugins: [pinia],
        stubs: {
          EditorCanvas: true,
          EntityPalette: true,
          EntityInspector: true,
          JsonConfigView: true,
        },
      },
    });
  });

  it("renders the visual editor view", () => {
    expect(wrapper.exists()).toBe(true);
  });

  it("has tab buttons", () => {
    const buttons = wrapper.findAll(".btn-outline-primary");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("loads first view by default", async () => {
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedViewName).toBe("overview");
  });

  it("can change selected view", async () => {
    const selector = wrapper.find("#viewSelector");
    await selector.setValue("bedroom");
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedViewName).toBe("bedroom");
  });

  it("displays current view entities", () => {
    expect(wrapper.vm.currentViewEntities).toHaveLength(2);
  });

  it("can handle adding entity to view", () => {
    const initialCount = wrapper.vm.currentViewEntities.length;
    wrapper.vm.handleAddEntity("switch.new_switch");
    expect(wrapper.vm.currentViewEntities.length).toBe(initialCount + 1);
  });

  it("can reorder entities", () => {
    const reordered = [
      { entity: "light.living_room", type: "HaLight" },
      { entity: "sensor.temperature", type: "HaSensor" },
    ];
    wrapper.vm.handleReorderEntities(reordered);
    expect(wrapper.vm.currentViewEntities[0].entity).toBe("light.living_room");
  });

  it("can remove entity from view", () => {
    const initialCount = wrapper.vm.currentViewEntities.length;
    wrapper.vm.handleRemoveEntity(0);
    expect(wrapper.vm.currentViewEntities.length).toBe(initialCount - 1);
  });

  it("can update entity type", () => {
    wrapper.vm.selectedEntityId = 0;
    wrapper.vm.handleUpdateEntityType("HaChip");
    expect(wrapper.vm.currentViewEntities[0].type).toBe("HaChip");
  });
});
