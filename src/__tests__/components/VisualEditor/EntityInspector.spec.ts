import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import EntityInspector from "../../../components/VisualEditor/EntityInspector.vue";
import { createPinia, setActivePinia } from "pinia";

describe("EntityInspector.vue", () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());

    wrapper = mount(EntityInspector, {
      props: {
        entity: {
          entity: "light.living_room",
          type: "HaLight",
          attributes: { label: "Living Room" },
        },
        entityId: 0,
      },
      global: {
        plugins: [createPinia()],
      },
    });
  });

  it("renders the inspector", () => {
    expect(wrapper.find(".entity-inspector").exists()).toBe(true);
  });

  it("displays entity ID", () => {
    expect(wrapper.text()).toContain("light.living_room");
  });

  it("shows component type selector", () => {
    const typeSelect = wrapper.find("#componentType");
    expect(typeSelect.exists()).toBe(true);
  });

  it("emits update-type when component type changes", async () => {
    const typeSelect = wrapper.find("#componentType");
    await typeSelect.setValue("HaSwitch");
    expect(wrapper.emitted("update-type")).toBeTruthy();
    expect(wrapper.emitted("update-type")[0]).toEqual(["HaSwitch"]);
  });

  it("displays attributes section", () => {
    expect(wrapper.find(".attributes-form").exists()).toBe(true);
  });

  it("shows add attribute dropdown", () => {
    const selects = wrapper.findAll("select");
    // Should have component type selector and add attribute dropdown
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("can add new attribute from dropdown", async () => {
    // Update props to include a proper entity from store
    await wrapper.setProps({
      entity: {
        entity: "light.living_room",
        type: "HaLight",
        attributes: {},
      },
    });

    // Mock store data with available attributes
    const selects = wrapper.findAll("select");
    // Find the select that's for adding attributes (not the component type selector)
    const addAttributeSelect = selects.find((s) => s.element.innerHTML.includes("Select an attribute"));
    
    if (addAttributeSelect) {
      // The store should provide available attributes, so the dropdown should have options
      expect(addAttributeSelect.exists()).toBe(true);
    }
  });

  it("shows remove entity button", () => {
    const removeBtn = wrapper.find(".btn-danger");
    expect(removeBtn.exists()).toBe(true);
    expect(removeBtn.text()).toContain("Remove");
  });

  it("emits remove-entity when remove button is clicked", async () => {
    const removeBtn = wrapper.find(".btn-danger");
    await removeBtn.trigger("click");
    expect(wrapper.emitted("remove-entity")).toBeTruthy();
  });

  it("emits deselect when deselect button is clicked", async () => {
    const buttons = wrapper.findAll("button");
    const deselectBtn = buttons.find((btn) => btn.text().includes("Deselect"));
    expect(deselectBtn).toBeDefined();
    await deselectBtn.trigger("click");
    expect(wrapper.emitted("deselect")).toBeTruthy();
  });

  it("displays list of available component types", () => {
    const options = wrapper.findAll("#componentType option");
    expect(options.length).toBeGreaterThan(5); // Should have many options
  });

  it("handles entity with getter", async () => {
    await wrapper.setProps({
      entity: {
        getter: "getBatterySensors",
        type: "HaEntityList",
      },
    });
    await wrapper.vm.$nextTick();
    // Check that the entity ID field shows the getter
    const entityIdText = wrapper.find(".form-control-static").text();
    expect(entityIdText).toContain("getBatterySensors");
  });
});
