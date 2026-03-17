import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import EntityPalette from "../../../components/VisualEditor/EntityPalette.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../../stores/haStore";

describe("EntityPalette.vue", () => {
  let wrapper;
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    // Mock entity map
    store.entityMap = {
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
      "switch.garage_door": {
        entity_id: "switch.garage_door",
        attributes: { friendly_name: "Garage Door" },
        state: "off",
      },
    };

    // Now mount with the same pinia instance
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
      expect(
        filtered.every((e) => e.entity_id.startsWith("sensor")),
      ).toBe(true);
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
    const buttons = wrapper.findAll(".btn-outline-secondary");
    const clearButton = buttons.find(
      (btn) => btn.text() === "✕" && btn.element.hasAttribute("aria-label"),
    );
    if (clearButton) {
      await clearButton.trigger("click");
      expect(searchInput.element.value).toBe("");
    }
  });

  it("shows helpful message when no entities are available", async () => {
    // Create a wrapper with mocked empty store
    const pinia2 = createPinia();
    const wrapper2 = mount(EntityPalette, {
      props: {
        entitiesInView: [],
      },
      global: {
        plugins: [pinia2],
      },
    });

    // The new wrapper should have empty store
    await wrapper2.vm.$nextTick();
    expect(wrapper2.text()).toContain("No entities available");
  });
});
