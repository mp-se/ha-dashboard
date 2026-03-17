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

  it("shows add attribute button", () => {
    const addBtn = wrapper.find(".btn-outline-secondary");
    expect(addBtn.exists()).toBe(true);
    expect(addBtn.text()).toContain("Add Attribute");
  });

  it("can add new attribute", async () => {
    const addBtn = wrapper.find(".btn-outline-secondary");
    await addBtn.trigger("click");

    await wrapper.vm.$nextTick();

    const keyInput = wrapper.find('input[placeholder="Attribute name"]');
    const valueInput = wrapper.find('input[placeholder="Attribute value"]');

    await keyInput.setValue("testKey");
    await valueInput.setValue("testValue");

    const confirmBtn = wrapper.findAll(".btn-primary")[0];
    await confirmBtn.trigger("click");

    expect(wrapper.emitted("update-attributes")).toBeTruthy();
  });

  it("shows remove entity button", () => {
    const removeBtn = wrapper.find(".btn-danger");
    expect(removeBtn.exists()).toBe(true);
    expect(removeBtn.text()).toContain("Remove Entity");
  });

  it("emits remove-entity when remove button is clicked", async () => {
    const removeBtn = wrapper.find(".btn-danger");
    await removeBtn.trigger("click");
    expect(wrapper.emitted("remove-entity")).toBeTruthy();
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
