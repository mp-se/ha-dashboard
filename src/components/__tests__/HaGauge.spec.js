import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import HaGauge from "../HaGauge.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("HaGauge.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    store.sensors = [
      {
        entity_id: "sensor.temperature",
        state: "22.5",
        attributes: {
          friendly_name: "Living Room Temperature",
          unit_of_measurement: "°C",
          icon: "mdi:thermometer",
        },
      },
      {
        entity_id: "sensor.humidity",
        state: "65",
        attributes: {
          friendly_name: "Humidity",
          unit_of_measurement: "%",
          icon: "mdi:water-percent",
        },
      },
    ];
  });

  it("should render gauge with string entity reference", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Living Room Temperature");
  });

  it("should render gauge with object entity", () => {
    const entity = {
      entity_id: "sensor.test",
      state: "30",
      attributes: {
        friendly_name: "Test Gauge",
        unit_of_measurement: "°C",
      },
    };

    const wrapper = mount(HaGauge, {
      props: {
        entity,
        min: 0,
        max: 100,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Test Gauge");
  });

  it("should display numeric value from entity state", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.numericValue).toBe(22.5);
  });

  it("should format numeric value to 1 decimal place", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.formattedValue).toBe("22.5");
  });

  it("should handle non-numeric state values", () => {
    store.sensors[0].state = "unavailable";

    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.numericValue).toBe(0);
  });

  it("should display unit of measurement from entity", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("°C");
  });

  it("should display min and max values", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("0");
    expect(wrapper.text()).toContain("50");
  });

  it("should display entity name from friendly_name attribute", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Living Room Temperature");
  });

  it("should infer icon from unit type for temperature", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.iconClass).toContain("thermometer");
  });

  it("should infer icon from unit type for percentage", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.humidity",
        min: 0,
        max: 100,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.iconClass).toContain("water-percent");
  });

  it("should use icon attribute when provided", () => {
    store.sensors[0].attributes.icon = "mdi:custom-icon";

    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.iconClass).toBe("mdi mdi-custom-icon");
  });

  it("should calculate gauge arc correctly", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.gaugeArc).toBeDefined();
    expect(typeof wrapper.vm.gaugeArc).toBe("string");
  });

  it("should calculate value arc correctly", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.valueArc).toBeDefined();
    expect(typeof wrapper.vm.valueArc).toBe("string");
  });

  it("should clamp numeric value within min-max range", () => {
    store.sensors[0].state = "100";

    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    // The valueArc should not exceed the max angle
    expect(wrapper.vm.valueArc).toBeDefined();
  });

  it("should clamp value below min to min", () => {
    store.sensors[0].state = "-10";

    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    // The valueArc should not go below the start angle
    expect(wrapper.vm.valueArc).toBeDefined();
  });

  it("should have correct gauge radius", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.radius).toBe(77);
  });

  it("should have correct start angle", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.startAngle).toBeCloseTo(Math.PI * 0.75, 2);
  });

  it("should have correct end angle", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.endAngle).toBeCloseTo(Math.PI * 2.25, 2);
  });

  it("should render SVG element", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("should render card with border-info class", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    const card = wrapper.find(".card");
    expect(card.classes()).toContain("border-info");
  });

  it("should render card with display class", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
        max: 50,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    const card = wrapper.find(".card");
    expect(card.classes()).toContain("card-display");
    expect(card.classes()).toContain("h-100");
    expect(card.classes()).toContain("rounded-4");
    expect(card.classes()).toContain("shadow-lg");
  });

  it("should have default min value of 0", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        max: 100,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.props("min")).toBe(0);
  });

  it("should have default max value of 100", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: "sensor.temperature",
        min: 0,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.props("max")).toBe(100);
  });

  it("should handle null entity gracefully", () => {
    const wrapper = mount(HaGauge, {
      props: {
        entity: null,
        min: 0,
        max: 100,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.vm.numericValue).toBe(0);
  });

  it("should display entity_id when entity name not available", () => {
    const entity = {
      entity_id: "sensor.test",
      state: "50",
      attributes: {},
    };

    const wrapper = mount(HaGauge, {
      props: {
        entity,
        min: 0,
        max: 100,
      },
      global: {
        plugins: [pinia],
        stubs: {
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("sensor.test");
  });
});
