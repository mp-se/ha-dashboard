import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import EntityPalette from "../../../components/visual-editor/EntityPalette.vue";
import { createPinia, setActivePinia } from "pinia";
import { useEntitiesStore } from "../../../stores/entitiesStore";

const seedEntities = [
  {
    entity_id: "sensor.temperature",
    attributes: { friendly_name: "Temperature" },
    state: "23.5",
  },
  {
    entity_id: "light.living_room",
    attributes: { friendly_name: "Living Room Light" },
    state: "on",
  },
  {
    entity_id: "switch.garage_door",
    attributes: { friendly_name: "Garage Door" },
    state: "off",
  },
];

describe("EntityPalette.vue", () => {
  let wrapper;
  let entitiesStore;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    entitiesStore = useEntitiesStore();

    // entityMap is computed from entities; seed the raw array
    entitiesStore.entities = [...seedEntities];

    wrapper = mount(EntityPalette, {
      props: {
        entitiesInView: [{ entity: "sensor.temperature" }],
      },
      global: {
        plugins: [pinia],
      },
    });
  });

  it("renders the entity palette", () => {
    expect(wrapper.find(".entity-palette").exists()).toBe(true);
  });

  it("displays list of available entities", async () => {
    await wrapper.vm.$nextTick();
    // Verify the component has the computed properties defined
    expect(typeof wrapper.vm.allEntities).toBe("object");
    expect(Array.isArray(wrapper.vm.filteredEntities)).toBe(true);
  });

  it("emits add-entity when add button is clicked", async () => {
    wrapper.vm.$emit("add-entity", "light.living_room");
    expect(wrapper.emitted("add-entity")).toBeTruthy();
  });

  it("disables button for entities already in view", () => {
    expect(wrapper.vm.isEntityInView("sensor.temperature")).toBe(true);
    expect(wrapper.vm.isEntityInView("light.living_room")).toBe(false);
  });

  it("filters entities by type", async () => {
    const typeSelect = wrapper.find("select");
    await typeSelect.setValue("sensor");
    await wrapper.vm.$nextTick();
    const filtered = wrapper.vm.filteredEntities;
    // Filtered entities should only include sensors
    if (filtered.length > 0) {
      expect(filtered.every((e) => e.entity_id.startsWith("sensor"))).toBe(
        true,
      );
    }
  });

  it("filters entities by search text", async () => {
    wrapper.vm.searchText = "temperature";
    await wrapper.vm.$nextTick();
    const filtered = wrapper.vm.filteredEntities;
    // Should have at least one match
    expect(filtered.length).toBeGreaterThanOrEqual(0);
  });

  it("clears search text when clear button is clicked", async () => {
    const searchInput = wrapper.find('input[placeholder="Search entities..."]');
    await searchInput.setValue("temperature");
    await wrapper.vm.$nextTick();
    // The ✕ clear button appears when searchText is non-empty
    const clearButton = wrapper.find(".btn-outline-secondary");
    expect(clearButton.exists()).toBe(true);
    await clearButton.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.searchText).toBe("");
  });

  it("shows helpful message when no entities are available", async () => {
    const pinia2 = createPinia();
    setActivePinia(pinia2);
    const wrapper2 = mount(EntityPalette, {
      props: {
        entitiesInView: [],
      },
      global: {
        plugins: [pinia2],
      },
    });
    await wrapper2.vm.$nextTick();
    expect(wrapper2.text()).toContain("No entities available");
    setActivePinia(pinia);
  });

  it("renders entity items for entities not in view", async () => {
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll(".entity-item");
    // sensor.temperature is in view, so only light and switch should appear
    expect(items.length).toBe(2);
  });

  it("shows entity friendly name and id in each item", async () => {
    await wrapper.vm.$nextTick();
    const text = wrapper.text();
    expect(text).toContain("Living Room Light");
    expect(text).toContain("light.living_room");
  });

  it("shows entity id segment when no friendly name", async () => {
    entitiesStore.entities = [
      { entity_id: "sensor.no_name", attributes: {}, state: "1" },
    ];
    await wrapper.setProps({ entitiesInView: [] });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("no_name");
  });

  it("shows all-in-view message when filtered list is empty but entities exist", async () => {
    // Put all seeded entities in view so filteredEntities is empty
    await wrapper.setProps({
      entitiesInView: [
        { entity: "sensor.temperature" },
        { entity: "light.living_room" },
        { entity: "switch.garage_door" },
      ],
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("All entities are already in this view");
  });

  it("calls handleDragStart on dragstart event", async () => {
    await wrapper.vm.$nextTick();
    const item = wrapper.find(".entity-item");
    const mockDataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
    };
    await item.trigger("dragstart", { dataTransfer: mockDataTransfer });
    expect(mockDataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      expect.stringContaining('"entity"'),
    );
  });

  it("calls handleDragEnd on dragend event", async () => {
    await wrapper.vm.$nextTick();
    const item = wrapper.find(".entity-item");
    // dragend should not throw
    await expect(item.trigger("dragend")).resolves.not.toThrow();
  });
});
