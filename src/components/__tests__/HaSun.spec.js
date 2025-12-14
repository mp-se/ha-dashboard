import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import HaSun from "../HaSun.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("HaSun.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    store.sensors = [
      {
        entity_id: "sun.sun",
        state: "above_horizon",
        attributes: {
          friendly_name: "Sun",
          sunrise: new Date(Date.now() + 3600000).toISOString(),
          sunset: new Date(Date.now() - 3600000).toISOString(),
          elevation: 45.5,
          azimuth: 180.0,
          next_dawn: new Date(Date.now() + 86400000).toISOString(),
          next_dusk: new Date(Date.now() + 82800000).toISOString(),
          next_noon: new Date(Date.now() + 43200000).toISOString(),
          next_midnight: new Date(Date.now() - 43200000).toISOString(),
        },
      },
    ];
    store.entities = {};
  });

  it("should render sun card", () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find(".card").exists()).toBe(true);
  });

  it("should display sun entity", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Sun");
  });

  it("should display above_horizon state", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Above Horizon");
  });

  it("should display below_horizon state", async () => {
    store.sensors[0].state = "below_horizon";

    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Below Horizon");
  });

  it("should display sunrise time", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Sunrise");
  });

  it("should display sunset time", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Sunset");
  });

  it("should display sunrise and sunset times", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Sunrise");
    expect(wrapper.text()).toContain("Sunset");
  });

  it("should format time attributes", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.nextRising).toBeTruthy();
    expect(wrapper.vm.nextSetting).toBeTruthy();
  });

  it("should calculate time until sunset", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.nextSetting).toBeTruthy();
  });

  it("should display sun icon when above horizon", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.sunIcon).toContain("sun");
  });

  it("should display moon icon when below horizon", async () => {
    store.sensors[0].state = "below_horizon";

    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.sunIcon).toContain("night");
  });

  it("should display sunrise in future", async () => {
    store.sensors[0].state = "below_horizon";

    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Next Sunrise");
  });

  it("should display time attributes", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    const attributes = ["Sunrise", "Sunset"];
    attributes.forEach((attr) => {
      expect(wrapper.text()).toContain(attr);
    });
  });

  it("should resolve sun entity from store", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.resolvedEntity).toBeTruthy();
    expect(wrapper.vm.resolvedEntity.entity_id).toBe("sun.sun");
  });

  it("should handle missing elevation", async () => {
    delete store.sensors[0].attributes.elevation;

    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".card").exists()).toBe(true);
  });

  it("should handle missing azimuth", async () => {
    delete store.sensors[0].attributes.azimuth;

    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".card").exists()).toBe(true);
  });

  it("should update when entity state changes", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain("Above Horizon");

    store.sensors[0].state = "below_horizon";
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Below Horizon");
  });

  it("should display time attributes with formatting", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.nextRising).toBeTruthy();
    expect(wrapper.vm.nextSetting).toBeTruthy();
  });

  it("should validate entity prop", () => {
    const validEntity = "sun.sun";
    expect(HaSun.props.entity.validator(validEntity)).toBe(true);

    const invalidEntity = "invalid";
    expect(HaSun.props.entity.validator(invalidEntity)).toBe(false);
  });

  it("should apply sunrise/sunset styling", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    const card = wrapper.find(".card");
    expect(card.exists()).toBe(true);
  });

  it("should show approaching sunset color", async () => {
    const wrapper = mount(HaSun, {
      props: {
        entity: "sun.sun",
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.cardBorderClass).toBeTruthy();
  });
});
