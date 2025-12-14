import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import HaRoom from "../HaRoom.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";
import * as useServiceCallModule from "@/composables/useServiceCall";

describe("HaRoom.vue", () => {
  let wrapper;
  let store;
  let pinia;
  let mockCallService;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.sensors = [];

    // Mock useServiceCall composable
    mockCallService = vi.fn().mockResolvedValue(true);
    vi.spyOn(useServiceCallModule, "useServiceCall").mockReturnValue({
      callService: mockCallService,
      isLoading: false,
    });
  });

  it("renders the component with area entity", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find(".card").exists()).toBe(true);
    expect(wrapper.find(".ha-entity-name").text()).toBe("Bedroom");
  });

  it("accepts entity as string and converts to array", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: "area.bedroom",
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find(".card").exists()).toBe(true);
    expect(wrapper.find(".ha-entity-name").text()).toBe("Bedroom");
  });

  it("accepts entity string with control objects when passed as array", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
      {
        entity_id: "light.bedroom",
        state: "on",
        attributes: {
          friendly_name: "Bedroom Light",
          icon: "mdi:lightbulb",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom", "light.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find(".card").exists()).toBe(true);
    const controlObjects = wrapper.findAll(".control-object");
    expect(controlObjects).toHaveLength(1);
  });

  it("finds area entity by checking for area. prefix", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["light.bedroom", "area.bedroom", "switch.fan"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find(".ha-entity-name").text()).toBe("Bedroom");
  });

  it("displays temperature when available in area entities", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: ["sensor.bedroom_temp"],
      },
      {
        entity_id: "sensor.bedroom_temp",
        state: "22.5",
        attributes: {
          device_class: "temperature",
          unit_of_measurement: "°C",
          friendly_name: "Bedroom Temperature",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain("22.5");
    expect(wrapper.text()).toContain("°C");
  });

  it("displays humidity when available in area entities", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: ["sensor.bedroom_humidity"],
      },
      {
        entity_id: "sensor.bedroom_humidity",
        state: "65",
        attributes: {
          device_class: "humidity",
          unit_of_measurement: "%",
          friendly_name: "Bedroom Humidity",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain("65");
    expect(wrapper.text()).toContain("%");
  });

  it("displays temperature and humidity on same row", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: ["sensor.bedroom_temp", "sensor.bedroom_humidity"],
      },
      {
        entity_id: "sensor.bedroom_temp",
        state: "22.5",
        attributes: {
          device_class: "temperature",
          unit_of_measurement: "°C",
        },
      },
      {
        entity_id: "sensor.bedroom_humidity",
        state: "65",
        attributes: {
          device_class: "humidity",
          unit_of_measurement: "%",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    const tempHumidityDiv = wrapper.find(".d-flex.gap-3");
    expect(tempHumidityDiv.exists()).toBe(true);
    expect(tempHumidityDiv.text()).toContain("22.5");
    expect(tempHumidityDiv.text()).toContain("65");
  });

  it("filters control objects to exclude area entities", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
      {
        entity_id: "light.bedroom",
        state: "on",
        attributes: {
          friendly_name: "Bedroom Light",
          icon: "mdi:lightbulb",
        },
      },
      {
        entity_id: "switch.fan",
        state: "off",
        attributes: {
          friendly_name: "Fan",
          icon: "mdi:fan",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom", "light.bedroom", "switch.fan"],
      },
      global: { plugins: [pinia] },
    });

    const controlObjects = wrapper.findAll(".control-object");
    expect(controlObjects).toHaveLength(2);
  });

  it("displays control objects with correct icons and colors", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
      {
        entity_id: "light.bedroom",
        state: "on",
        attributes: {
          friendly_name: "Bedroom Light",
          icon: "mdi:lightbulb",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom", "light.bedroom"],
        color: "red",
      },
      global: { plugins: [pinia] },
    });

    const controlObject = wrapper.find(".control-object");
    expect(controlObject.exists()).toBe(true);
  });

  it("uses custom color prop for main circle", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
        color: "green",
      },
      global: { plugins: [pinia] },
    });

    const circle = wrapper.find(".ha-icon-circle circle");
    expect(circle.attributes("fill")).toBe("green");
  });

  it("defaults to blue color when not specified", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    const circle = wrapper.find(".ha-icon-circle circle");
    expect(circle.attributes("fill")).toBe("blue");
  });

  it("handles unavailable temperature state", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: ["sensor.bedroom_temp"],
      },
      {
        entity_id: "sensor.bedroom_temp",
        state: "unavailable",
        attributes: {
          device_class: "temperature",
          unit_of_measurement: "°C",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain("unavailable");
  });

  it("rounds temperature to 1 decimal place", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: ["sensor.bedroom_temp"],
      },
      {
        entity_id: "sensor.bedroom_temp",
        state: "22.456789",
        attributes: {
          device_class: "temperature",
          unit_of_measurement: "°C",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain("22.5");
  });

  it("rounds humidity to 0 decimal places", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: ["sensor.bedroom_humidity"],
      },
      {
        entity_id: "sensor.bedroom_humidity",
        state: "65.789",
        attributes: {
          device_class: "humidity",
          unit_of_measurement: "%",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain("66");
  });

  it("calls toggleEntity on control object click", async () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
      {
        entity_id: "light.bedroom",
        state: "on",
        attributes: {
          friendly_name: "Bedroom Light",
          icon: "mdi:lightbulb",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom", "light.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    const controlObject = wrapper.find(".control-object");
    await controlObject.trigger("click");

    expect(mockCallService).toHaveBeenCalledWith("light", "turn_off", {
      entity_id: "light.bedroom",
    });
  });

  it("uses area icon when available", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    const icon = wrapper.find(".ha-icon-overlay");
    expect(icon.classes()).toContain("mdi-bed");
  });

  it("uses default door icon when area icon not available", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    const icon = wrapper.find(".ha-icon-overlay");
    expect(icon.classes()).toContain("mdi-door");
  });

  it("disables control object when entity is unavailable", () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
      {
        entity_id: "light.bedroom",
        state: "unavailable",
        attributes: {
          friendly_name: "Bedroom Light",
          icon: "mdi:lightbulb",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom", "light.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    const controlObject = wrapper.find(".control-object");
    expect(controlObject.classes()).toContain("control-object-disabled");
    expect(controlObject.classes("opacity")).toBeDefined();
  });

  it("does not call service when clicking unavailable control object", async () => {
    store.sensors = [
      {
        entity_id: "area.bedroom",
        state: "Bedroom",
        attributes: {
          friendly_name: "Bedroom",
          icon: "mdi:bed",
        },
        entities: [],
      },
      {
        entity_id: "light.bedroom",
        state: "unavailable",
        attributes: {
          friendly_name: "Bedroom Light",
          icon: "mdi:lightbulb",
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ["area.bedroom", "light.bedroom"],
      },
      global: { plugins: [pinia] },
    });

    const controlObject = wrapper.find(".control-object");
    await controlObject.trigger("click");

    expect(mockCallService).not.toHaveBeenCalled();
  });

  describe("Icon and Button Positioning", () => {
    it("should have control objects with ha-control-circle-wrapper", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: {
            friendly_name: "Bedroom",
            icon: "mdi:bed",
          },
          entities: [],
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: {
            friendly_name: "Bedroom Light",
            icon: "mdi:lightbulb",
          },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: ["area.bedroom", "light.bedroom"],
        },
        global: { plugins: [pinia] },
      });

      const circleWrappers = wrapper.findAll(".ha-control-circle-wrapper");
      expect(circleWrappers.length).toBeGreaterThan(0);
    });

    it("should have ha-control-circle SVG in each wrapper", () => {
      store.sensors = [
        {
          entity_id: "area.living_room",
          state: "Living Room",
          attributes: {
            friendly_name: "Living Room",
            icon: "mdi:sofa",
          },
          entities: [],
        },
        {
          entity_id: "light.main",
          state: "on",
          attributes: {
            friendly_name: "Main Light",
            icon: "mdi:lightbulb",
          },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: ["area.living_room", "light.main"],
        },
        global: { plugins: [pinia] },
      });

      const circles = wrapper.findAll(".ha-control-circle");
      expect(circles.length).toBeGreaterThan(0);

      // Each circle should be an SVG with proper dimensions
      circles.forEach((circle) => {
        expect(circle.element.tagName).toBe("svg");
        expect(circle.element.getAttribute("width")).toBe("50");
        expect(circle.element.getAttribute("height")).toBe("50");
      });
    });

    it("should have ha-control-icon inside each wrapper", () => {
      store.sensors = [
        {
          entity_id: "area.test",
          state: "Test",
          attributes: {
            friendly_name: "Test Area",
            icon: "mdi:home",
          },
          entities: [],
        },
        {
          entity_id: "light.test",
          state: "on",
          attributes: {
            friendly_name: "Test Light",
            icon: "mdi:lightbulb",
          },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: ["area.test", "light.test"],
        },
        global: { plugins: [pinia] },
      });

      const icons = wrapper.findAll(".ha-control-icon");
      expect(icons.length).toBeGreaterThan(0);

      // Each icon should be an <i> element with mdi classes
      icons.forEach((icon) => {
        expect(icon.element.tagName).toBe("I");
        expect(icon.classes()).toContain("mdi");
      });
    });

    it("should have control icon and circle both inside wrapper", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: {
            friendly_name: "Bedroom",
            icon: "mdi:bed",
          },
          entities: [],
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: {
            friendly_name: "Bedroom Light",
            icon: "mdi:lightbulb",
          },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: ["area.bedroom", "light.bedroom"],
        },
        global: { plugins: [pinia] },
      });

      const wrappers_elems = wrapper.findAll(".ha-control-circle-wrapper");

      wrappers_elems.forEach((wrapperVm) => {
        const circle = wrapperVm.find(".ha-control-circle");
        const icon = wrapperVm.find(".ha-control-icon");

        expect(circle.exists()).toBe(true);
        expect(icon.exists()).toBe(true);
      });
    });
  });

  describe("Multiple Controls - Up to 6 Limit", () => {
    it("limits control objects to 6 entities", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "light.ceiling",
          state: "off",
          attributes: { friendly_name: "Ceiling Light" },
        },
        {
          entity_id: "switch.fan",
          state: "on",
          attributes: { friendly_name: "Fan" },
        },
        {
          entity_id: "fan.bedroom",
          state: "off",
          attributes: { friendly_name: "Bedroom Fan" },
        },
        {
          entity_id: "light.desk",
          state: "on",
          attributes: { friendly_name: "Desk Light" },
        },
        {
          entity_id: "light.nightstand",
          state: "on",
          attributes: { friendly_name: "Nightstand Light" },
        },
        {
          entity_id: "switch.outlet",
          state: "off",
          attributes: { friendly_name: "Outlet" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "light.bedroom",
            "light.ceiling",
            "switch.fan",
            "fan.bedroom",
            "light.desk",
            "light.nightstand",
            "switch.outlet",
          ],
        },
        global: { plugins: [pinia] },
      });

      // Should only display 6 controls, not 7 (excluding area entity)
      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(6);
    });

    it("displays 4 controls in 2-column grid layout", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "light.ceiling",
          state: "off",
          attributes: { friendly_name: "Ceiling Light" },
        },
        {
          entity_id: "switch.fan",
          state: "on",
          attributes: { friendly_name: "Fan" },
        },
        {
          entity_id: "fan.bedroom",
          state: "off",
          attributes: { friendly_name: "Bedroom Fan" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "light.bedroom",
            "light.ceiling",
            "switch.fan",
            "fan.bedroom",
          ],
        },
        global: { plugins: [pinia] },
      });

      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(4);

      const grid = wrapper.find(".room-controls-grid");
      expect(grid.exists()).toBe(true);
      expect(grid.classes()).toContain("room-controls-grid");
    });

    it("displays 5 controls in 2-column grid layout", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "light.ceiling",
          state: "off",
          attributes: { friendly_name: "Ceiling Light" },
        },
        {
          entity_id: "switch.fan",
          state: "on",
          attributes: { friendly_name: "Fan" },
        },
        {
          entity_id: "fan.bedroom",
          state: "off",
          attributes: { friendly_name: "Bedroom Fan" },
        },
        {
          entity_id: "light.desk",
          state: "on",
          attributes: { friendly_name: "Desk Light" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "light.bedroom",
            "light.ceiling",
            "switch.fan",
            "fan.bedroom",
            "light.desk",
          ],
        },
        global: { plugins: [pinia] },
      });

      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(5);

      const grid = wrapper.find(".room-controls-grid");
      expect(grid.exists()).toBe(true);
    });

    it("displays 6 controls in 2-column grid layout", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "light.ceiling",
          state: "off",
          attributes: { friendly_name: "Ceiling Light" },
        },
        {
          entity_id: "switch.fan",
          state: "on",
          attributes: { friendly_name: "Fan" },
        },
        {
          entity_id: "fan.bedroom",
          state: "off",
          attributes: { friendly_name: "Bedroom Fan" },
        },
        {
          entity_id: "light.desk",
          state: "on",
          attributes: { friendly_name: "Desk Light" },
        },
        {
          entity_id: "light.nightstand",
          state: "on",
          attributes: { friendly_name: "Nightstand Light" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "light.bedroom",
            "light.ceiling",
            "switch.fan",
            "fan.bedroom",
            "light.desk",
            "light.nightstand",
          ],
        },
        global: { plugins: [pinia] },
      });

      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(6);

      const grid = wrapper.find(".room-controls-grid");
      expect(grid.exists()).toBe(true);
      // Verify grid contains all 6 control children
      const gridChildren = grid.findAll(".control-object");
      expect(gridChildren).toHaveLength(6);
    });

    it("maintains control functionality with expanded 6-control layout", async () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "light.ceiling",
          state: "off",
          attributes: { friendly_name: "Ceiling Light" },
        },
        {
          entity_id: "switch.fan",
          state: "on",
          attributes: { friendly_name: "Fan" },
        },
        {
          entity_id: "fan.bedroom",
          state: "off",
          attributes: { friendly_name: "Bedroom Fan" },
        },
        {
          entity_id: "light.desk",
          state: "on",
          attributes: { friendly_name: "Desk Light" },
        },
        {
          entity_id: "light.nightstand",
          state: "on",
          attributes: { friendly_name: "Nightstand Light" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "light.bedroom",
            "light.ceiling",
            "switch.fan",
            "fan.bedroom",
            "light.desk",
            "light.nightstand",
          ],
        },
        global: { plugins: [pinia] },
      });

      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(6);

      // Click the last control (nightstand light)
      await controls[5].trigger("click");

      expect(mockCallService).toHaveBeenCalledWith("light", "turn_off", {
        entity_id: "light.nightstand",
      });
    });
  });

  describe("Temperature and Humidity Sensor Detection Fallback", () => {
    it("uses temperature sensor from entity list when not in area.entities", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [], // Empty, no temp sensor in area
        },
        {
          entity_id: "sensor.bedroom_temp",
          state: "21.5",
          attributes: {
            friendly_name: "Bedroom Temperature",
            device_class: "temperature",
            unit_of_measurement: "°C",
          },
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: ["area.bedroom", "sensor.bedroom_temp", "light.bedroom"],
        },
        global: { plugins: [pinia] },
      });

      expect(wrapper.find(".ha-entity-name").text()).toBe("Bedroom");
      expect(wrapper.text()).toContain("21.5");
      expect(wrapper.text()).toContain("°C");
    });

    it("uses humidity sensor from entity list when not in area.entities", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [], // Empty, no humidity sensor in area
        },
        {
          entity_id: "sensor.bedroom_humidity",
          state: "65",
          attributes: {
            friendly_name: "Bedroom Humidity",
            device_class: "humidity",
            unit_of_measurement: "%",
          },
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: ["area.bedroom", "sensor.bedroom_humidity", "light.bedroom"],
        },
        global: { plugins: [pinia] },
      });

      expect(wrapper.find(".ha-entity-name").text()).toBe("Bedroom");
      expect(wrapper.text()).toContain("65");
      expect(wrapper.text()).toContain("%");
    });

    it("prefers temperature sensor from area.entities over entity list", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: ["sensor.area_temp"], // Area has its own temp sensor
        },
        {
          entity_id: "sensor.area_temp",
          state: "22.0",
          attributes: {
            friendly_name: "Area Temperature",
            device_class: "temperature",
            unit_of_measurement: "°C",
          },
        },
        {
          entity_id: "sensor.entity_temp",
          state: "20.0",
          attributes: {
            friendly_name: "Entity Temperature",
            device_class: "temperature",
            unit_of_measurement: "°C",
          },
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: ["area.bedroom", "sensor.entity_temp", "light.bedroom"],
        },
        global: { plugins: [pinia] },
      });

      // Should use area temp (22.0), not entity list temp (20.0)
      expect(wrapper.text()).toContain("22.0");
      expect(wrapper.text()).not.toContain("20.0");
    });

    it("excludes temperature sensor from control objects", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "sensor.bedroom_temp",
          state: "21.5",
          attributes: {
            friendly_name: "Bedroom Temperature",
            device_class: "temperature",
            unit_of_measurement: "°C",
          },
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "switch.fan",
          state: "off",
          attributes: { friendly_name: "Fan" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "sensor.bedroom_temp",
            "light.bedroom",
            "switch.fan",
          ],
        },
        global: { plugins: [pinia] },
      });

      // Should only have 2 controls (light + switch), not 3
      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(2);
    });

    it("excludes humidity sensor from control objects", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "sensor.bedroom_humidity",
          state: "65",
          attributes: {
            friendly_name: "Bedroom Humidity",
            device_class: "humidity",
            unit_of_measurement: "%",
          },
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "switch.fan",
          state: "off",
          attributes: { friendly_name: "Fan" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "sensor.bedroom_humidity",
            "light.bedroom",
            "switch.fan",
          ],
        },
        global: { plugins: [pinia] },
      });

      // Should only have 2 controls (light + switch), humidity excluded
      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(2);
    });

    it("excludes both temperature and humidity sensors from control objects", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "sensor.bedroom_temp",
          state: "21.5",
          attributes: {
            friendly_name: "Bedroom Temperature",
            device_class: "temperature",
            unit_of_measurement: "°C",
          },
        },
        {
          entity_id: "sensor.bedroom_humidity",
          state: "65",
          attributes: {
            friendly_name: "Bedroom Humidity",
            device_class: "humidity",
            unit_of_measurement: "%",
          },
        },
        {
          entity_id: "light.bedroom",
          state: "on",
          attributes: { friendly_name: "Bedroom Light" },
        },
        {
          entity_id: "switch.fan",
          state: "off",
          attributes: { friendly_name: "Fan" },
        },
        {
          entity_id: "light.desk",
          state: "on",
          attributes: { friendly_name: "Desk Light" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "sensor.bedroom_temp",
            "sensor.bedroom_humidity",
            "light.bedroom",
            "switch.fan",
            "light.desk",
          ],
        },
        global: { plugins: [pinia] },
      });

      // Should have 3 controls (2 lights + 1 switch), both sensors excluded
      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(3);

      // Verify temperature and humidity are displayed
      expect(wrapper.text()).toContain("21.5");
      expect(wrapper.text()).toContain("65");
    });

    it("allows up to 6 non-sensor control objects even with sensors in entity list", () => {
      store.sensors = [
        {
          entity_id: "area.bedroom",
          state: "Bedroom",
          attributes: { friendly_name: "Bedroom", icon: "mdi:bed" },
          entities: [],
        },
        {
          entity_id: "sensor.bedroom_temp",
          state: "21.5",
          attributes: {
            friendly_name: "Bedroom Temperature",
            device_class: "temperature",
            unit_of_measurement: "°C",
          },
        },
        {
          entity_id: "sensor.bedroom_humidity",
          state: "65",
          attributes: {
            friendly_name: "Bedroom Humidity",
            device_class: "humidity",
            unit_of_measurement: "%",
          },
        },
        {
          entity_id: "light.light1",
          state: "on",
          attributes: { friendly_name: "Light 1" },
        },
        {
          entity_id: "light.light2",
          state: "on",
          attributes: { friendly_name: "Light 2" },
        },
        {
          entity_id: "light.light3",
          state: "on",
          attributes: { friendly_name: "Light 3" },
        },
        {
          entity_id: "light.light4",
          state: "on",
          attributes: { friendly_name: "Light 4" },
        },
        {
          entity_id: "light.light5",
          state: "on",
          attributes: { friendly_name: "Light 5" },
        },
        {
          entity_id: "light.light6",
          state: "on",
          attributes: { friendly_name: "Light 6" },
        },
      ];

      wrapper = mount(HaRoom, {
        props: {
          entity: [
            "area.bedroom",
            "sensor.bedroom_temp",
            "sensor.bedroom_humidity",
            "light.light1",
            "light.light2",
            "light.light3",
            "light.light4",
            "light.light5",
            "light.light6",
          ],
        },
        global: { plugins: [pinia] },
      });

      // Should have exactly 6 controls (sensors don't count toward limit)
      const controls = wrapper.findAll(".control-object");
      expect(controls).toHaveLength(6);
    });
  });
});
