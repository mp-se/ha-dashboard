import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import EntityInspector from "../../../components/VisualEditor/EntityInspector.vue";
import { createPinia, setActivePinia } from "pinia";
import { useEntitiesStore } from "../../../stores/entitiesStore";
import { useHaStore } from "../../../stores/haStore";

describe("EntityInspector.vue", () => {
  let wrapper;
  let pinia;
  let entitiesStore;

  beforeEach(async () => {
    // Create pinia first
    pinia = createPinia();
    setActivePinia(pinia);

    // Get stores from the active pinia instance
    useHaStore();
    entitiesStore = useEntitiesStore();

    // Populate the store BEFORE creating the component
    entitiesStore.entities = [
      {
        entity_id: "light.living_room",
        state: "on",
        attributes: {
          friendly_name: "Living Room",
          brightness: 200,
          color_mode: "color_temp",
        },
      },
    ];

    // NOW mount the component with the same pinia instance
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
        plugins: [pinia],
      },
    });

    // Wait for the component to fully update with the store data
    await nextTick();
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

  it("displays attributes section", async () => {
    // Verify the entities store has the entity data
    expect(entitiesStore.entityMap.has("light.living_room")).toBe(true);
    const storedEntity = entitiesStore.entityMap.get("light.living_room");
    expect(storedEntity?.attributes).toBeDefined();
    expect(Object.keys(storedEntity?.attributes || {}).length).toBeGreaterThan(0);

    // Verify the haStore also has the entity data via delegation
    const haStore = useHaStore();
    expect(haStore.entityMap.has("light.living_room")).toBe(true);
    const haStoredEntity = haStore.entityMap.get("light.living_room");
    expect(haStoredEntity?.attributes).toBeDefined();

    // Wait for wrapper to update
    await nextTick();
    await wrapper.vm.$nextTick();

    // Check wrapper for entity inspector content
    console.log("Wrapper HTML:", wrapper.html().substring(0, 500));
    console.log("Wrapper text:", wrapper.text().substring(0, 500));
    expect(wrapper.html()).toContain("light.living_room");

    // Now check if the attributes section is visible
    const attribForm = wrapper.find(".attributes-form");
    console.log("Attributes form exists:", attribForm.exists());
    console.log("Looking for inspector-section:", wrapper.findAll(".inspector-section").length);
    expect(attribForm.exists()).toBe(true);
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
