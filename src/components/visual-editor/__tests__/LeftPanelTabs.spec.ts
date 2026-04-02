import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import LeftPanelTabs from "../LeftPanelTabs.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../../stores/haStore";

describe("LeftPanelTabs.vue", () => {
  let wrapper;
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    // No need to mock entityMap since it's handled by the store

    wrapper = mount(LeftPanelTabs, {
      props: {
        views: [
          {
            name: "home",
            label: "Home",
            icon: "mdi-home",
            entities: [],
          },
          {
            name: "bedrooms",
            label: "Bedrooms",
            icon: "mdi-bed",
            entities: [],
          },
        ],
        selectedViewName: "home",
        entitiesInView: [{ entity: "light.living_room" }],
      },
      global: {
        plugins: [pinia],
      },
    });
  });

  it("renders the left panel tabs container", () => {
    expect(wrapper.find(".left-panel-tabs").exists()).toBe(true);
  });

  it("renders all three tabs", () => {
    const buttons = wrapper.findAll(".tab-button");
    expect(buttons).toHaveLength(3);
  });

  it("displays correct tab labels", () => {
    const buttons = wrapper.findAll(".tab-button");
    expect(buttons[0].text()).toContain("Views");
    expect(buttons[1].text()).toContain("Entities");
    expect(buttons[2].text()).toContain("Components");
  });

  it("shows views tab content by default", () => {
    const viewsPane = wrapper.findAll(".tab-pane")[0];
    expect(viewsPane.isVisible()).toBe(true);
  });

  it("switches to entities tab when clicked", async () => {
    const buttons = wrapper.findAll(".tab-button");
    await buttons[1].trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.activeTab).toBe("entities");

    const activeButton = wrapper.findAll(".tab-button")[1];
    expect(activeButton.classes()).toContain("active");
  });

  it("switches to components tab when clicked", async () => {
    const buttons = wrapper.findAll(".tab-button");
    await buttons[2].trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.activeTab).toBe("components");

    const activeButton = wrapper.findAll(".tab-button")[2];
    expect(activeButton.classes()).toContain("active");
  });

  it("marks active tab as active only once", async () => {
    const buttons = wrapper.findAll(".tab-button");
    await buttons[1].trigger("click");
    await wrapper.vm.$nextTick();

    const activeButtons = wrapper.findAll(".tab-button.active");
    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0].text()).toContain("Entities");
  });

  it("emits view-selected event when passed from ViewManager", async () => {
    // This tests the pass-through event emission
    wrapper.vm.$emit("view-selected", "bedrooms");
    expect(wrapper.emitted("view-selected")).toBeTruthy();
    expect(wrapper.emitted("view-selected")[0]).toEqual(["bedrooms"]);
  });

  it("emits add-entity event when passed from EntityPalette", async () => {
    wrapper.vm.$emit("add-entity", "sensor.humidity");
    expect(wrapper.emitted("add-entity")).toBeTruthy();
    expect(wrapper.emitted("add-entity")[0]).toEqual(["sensor.humidity"]);
  });

  it("passes correct props to child components", () => {
    expect(wrapper.props("views")).toEqual([
      {
        name: "home",
        label: "Home",
        icon: "mdi-home",
        entities: [],
      },
      {
        name: "bedrooms",
        label: "Bedrooms",
        icon: "mdi-bed",
        entities: [],
      },
    ]);
    expect(wrapper.props("selectedViewName")).toBe("home");
    expect(wrapper.props("entitiesInView")).toEqual([
      { entity: "light.living_room" },
    ]);
  });

  it("contains ViewManager component in views tab", async () => {
    const viewsPane = wrapper.findAll(".tab-pane")[0];
    expect(viewsPane.find(".view-manager").exists()).toBe(true);
  });

  it("contains EntityPalette component in entities tab", async () => {
    const entitiesPane = wrapper.findAll(".tab-pane")[1];
    expect(entitiesPane.find(".entity-palette").exists()).toBe(true);
  });

  it("contains StaticComponentPalette component in components tab", async () => {
    const componentsPane = wrapper.findAll(".tab-pane")[2];
    expect(componentsPane.find(".static-component-palette").exists()).toBe(true);
  });

  it("maintains active tab state across user interactions", async () => {
    const buttons = wrapper.findAll(".tab-button");

    // Switch to entities
    await buttons[1].trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.activeTab).toBe("entities");

    // Switch back to views
    await buttons[0].trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.activeTab).toBe("views");

    // Switch to components
    await buttons[2].trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.activeTab).toBe("components");
  });
});
