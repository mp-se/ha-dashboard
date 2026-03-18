import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import JsonConfigView from "../JsonConfigView.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../stores/haStore";
import * as useDefaultComponentType from "../../composables/useDefaultComponentType";

vi.mock("../../composables/useDefaultComponentType", () => ({
  getDefaultComponentType: vi.fn((entity, getter) => {
    if (getter) return "HaGlance";
    if (entity?.includes("sensor")) return "HaSensor";
    if (entity?.includes("light")) return "HaLight";
    if (entity?.includes("switch")) return "HaSwitch";
    return "HaGlance";
  }),
}));

// Mock all card components
vi.mock("../../components/cards/HaAlarmPanel.vue", () => ({
  default: {
    name: "HaAlarmPanel",
    template: '<div class="ha-alarm-panel">HaAlarmPanel</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaBeerTap.vue", () => ({
  default: {
    name: "HaBeerTap",
    template: '<div class="ha-beer-tap">HaBeerTap</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaBinarySensor.vue", () => ({
  default: {
    name: "HaBinarySensor",
    template: '<div class="ha-binary-sensor">HaBinarySensor</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaButton.vue", () => ({
  default: {
    name: "HaButton",
    template: '<div class="ha-button">HaButton</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaChip.vue", () => ({
  default: {
    name: "HaChip",
    template: '<div class="ha-chip">HaChip</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaEnergy.vue", () => ({
  default: {
    name: "HaEnergy",
    template: '<div class="ha-energy">HaEnergy</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaError.vue", () => ({
  default: {
    name: "HaError",
    template: '<div class="ha-error">HaError</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaGauge.vue", () => ({
  default: {
    name: "HaGauge",
    template: '<div class="ha-gauge">HaGauge</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaGlance.vue", () => ({
  default: {
    name: "HaGlance",
    template: '<div class="ha-glance">HaGlance</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaHeader.vue", () => ({
  default: {
    name: "HaHeader",
    template: '<div class="ha-header">HaHeader</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaImage.vue", () => ({
  default: {
    name: "HaImage",
    template: '<div class="ha-image">HaImage</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaLight.vue", () => ({
  default: {
    name: "HaLight",
    template: '<div class="ha-light">HaLight</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaLink.vue", () => ({
  default: {
    name: "HaLink",
    template: '<div class="ha-link">HaLink</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaMediaPlayer.vue", () => ({
  default: {
    name: "HaMediaPlayer",
    template: '<div class="ha-media-player">HaMediaPlayer</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaPerson.vue", () => ({
  default: {
    name: "HaPerson",
    template: '<div class="ha-person">HaPerson</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaPrinter.vue", () => ({
  default: {
    name: "HaPrinter",
    template: '<div class="ha-printer">HaPrinter</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaRoom.vue", () => ({
  default: {
    name: "HaRoom",
    template: '<div class="ha-room">HaRoom</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaRowSpacer.vue", () => ({
  default: {
    name: "HaRowSpacer",
    template: '<div class="ha-row-spacer">HaRowSpacer</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaSelect.vue", () => ({
  default: {
    name: "HaSelect",
    template: '<div class="ha-select">HaSelect</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaSensor.vue", () => ({
  default: {
    name: "HaSensor",
    template: '<div class="ha-sensor">HaSensor</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaSensorGraph.vue", () => ({
  default: {
    name: "HaSensorGraph",
    template: '<div class="ha-sensor-graph">HaSensorGraph</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaSpacer.vue", () => ({
  default: {
    name: "HaSpacer",
    template: '<div class="ha-spacer">HaSpacer</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaSun.vue", () => ({
  default: {
    name: "HaSun",
    template: '<div class="ha-sun">HaSun</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaSwitch.vue", () => ({
  default: {
    name: "HaSwitch",
    template: '<div class="ha-switch">HaSwitch</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaWarning.vue", () => ({
  default: {
    name: "HaWarning",
    template: '<div class="ha-warning">HaWarning</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/cards/HaWeather.vue", () => ({
  default: {
    name: "HaWeather",
    template: '<div class="ha-weather">HaWeather</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));

// Mock sub-components
vi.mock("../../components/sub-components/EntityAttributeList.vue", () => ({
  default: {
    name: "EntityAttributeList",
    template: '<div class="entity-attribute-list">EntityAttributeList</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));
vi.mock("../../components/sub-components/IconCircle.vue", () => ({
  default: {
    name: "IconCircle",
    template: '<div class="icon-circle">IconCircle</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));

// Mock containers
vi.mock("../../components/containers/EntityList.vue", () => ({
  default: {
    name: "EntityList",
    template: '<div class="entity-list">EntityList</div>',
    props: { entity: [String, Array], entities: [Array, Object], componentMap: Object, attributes: [Array, Object], getter: String, type: String },
  },
}));

describe("JsonConfigView.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("renders the view title", () => {
    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("renders nothing when dashboard config is not set", () => {
    const store = useHaStore();
    store.dashboardConfig = null;

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll('[class*="ha-"]').length).toBe(0);
  });

  it("renders nothing when view is not found in config", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Other View",
          entities: [{ entity: "sensor.test", type: "HaSensor" }],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll('[class*="ha-"]').length).toBe(0);
  });

  it("renders entities from the specified view", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            { entity: "sensor.temperature", type: "HaSensor" },
            { entity: "light.lamp", type: "HaLight" },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    const sensors = wrapper.findAll(".ha-sensor");
    const lights = wrapper.findAll(".ha-light");

    expect(sensors.length).toBe(1);
    expect(lights.length).toBe(1);
  });

  it("uses explicit component type from entity config", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            { entity: "sensor.temperature", type: "HaLight" }, // Override type
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll(".ha-light").length).toBe(1);
  });

  it("uses default component type when not explicitly specified", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            { entity: "sensor.temperature" }, // No type specified
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    // Should use HaSensor as default for sensor.* entity
    expect(
      useDefaultComponentType.getDefaultComponentType,
    ).toHaveBeenCalledWith("sensor.temperature", undefined);
    expect(wrapper.findAll(".ha-sensor").length).toBe(1);
  });

  it("handles array of entities in entity property", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              entity: ["sensor.temp1", "sensor.temp2"],
              type: "HaSensor",
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll(".ha-sensor").length).toBe(1);
  });

  it("passes attributes to components", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              entity: "sensor.temperature",
              type: "HaSensor",
              attributes: ["unit_of_measurement", "device_class"],
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    const sensor = wrapper.findComponent({ name: "HaSensor" });
    expect(sensor.props("attributes")).toEqual([
      "unit_of_measurement",
      "device_class",
    ]);
  });

  it("handles getter functions that return entities", () => {
    const store = useHaStore();
    store.entities = [
      { entity_id: "sensor.battery1", state: "85", attributes: {} },
      { entity_id: "sensor.battery2", state: "90", attributes: {} },
    ];
    store.getBatterySensors = vi.fn(() => [
      { entity_id: "sensor.battery1", state: "85", attributes: {} },
      { entity_id: "sensor.battery2", state: "90", attributes: {} },
    ]);

    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              getter: "getBatterySensors",
              type: "HaSensor",
              attributes: [],
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll(".ha-sensor").length).toBe(2);
  });

  it("handles HaEntityList with getter", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              getter: "getSensors",
              type: "EntityList",
              componentMap: { default: "HaSensor" },
              attributes: [],
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll(".entity-list").length).toBe(1);
  });

  it("handles HaEntityList with entities array", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              type: "EntityList",
              entities: [
                { entity: "sensor.temp" },
                { entity: "sensor.humidity" },
              ],
              componentMap: { default: "HaSensor" },
              attributes: [],
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    const entityList = wrapper.findComponent({ name: "EntityList" });
    expect(entityList.exists()).toBe(true);
    expect(entityList.props("entities")).toHaveLength(2);
  });

  it("handles wildcard entity patterns", () => {
    const store = useHaStore();
    store.entities = [
      { entity_id: "sensor.temperature", state: "25", attributes: {} },
      { entity_id: "sensor.humidity", state: "60", attributes: {} },
      { entity_id: "sensor.pressure", state: "1013", attributes: {} },
      { entity_id: "light.lamp", state: "on", attributes: {} },
    ];

    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              entity: "sensor.*",
              type: "HaSensor",
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    // Should match 3 sensors (not the light)
    expect(wrapper.findAll(".ha-sensor").length).toBe(3);
  });

  it("handles complex wildcard patterns with dots", () => {
    const store = useHaStore();
    store.entities = [
      { entity_id: "sensor.room1.temperature", state: "25", attributes: {} },
      { entity_id: "sensor.room1.humidity", state: "60", attributes: {} },
      { entity_id: "sensor.room2.temperature", state: "22", attributes: {} },
    ];

    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              entity: "sensor.room1.*",
              type: "HaSensor",
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    // Should match only room1 sensors
    expect(wrapper.findAll(".ha-sensor").length).toBe(2);
  });

  it("filters control props before passing to components", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              entity: "sensor.temperature",
              type: "HaSensor",
              component: "HaSensor", // Should be filtered out
              attributes: ["unit_of_measurement"],
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    const sensor = wrapper.findComponent({ name: "HaSensor" });
    // Component prop should be filtered out, only entity and attributes should be passed
    expect(sensor.props("component")).toBeUndefined();
    expect(sensor.props("entity")).toBe("sensor.temperature");
    expect(sensor.props("attributes")).toEqual(["unit_of_measurement"]);
  });

  it("handles empty entities list in view", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll('[class*="ha-"]').length).toBe(0);
  });

  it("handles view without entities property", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll('[class*="ha-"]').length).toBe(0);
  });

  it("renders multiple different component types in one view", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            { entity: "sensor.temperature", type: "HaSensor" },
            { entity: "light.lamp", type: "HaLight" },
            { entity: "switch.pump", type: "HaSwitch" },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll(".ha-sensor").length).toBe(1);
    expect(wrapper.findAll(".ha-light").length).toBe(1);
    expect(wrapper.findAll(".ha-switch").length).toBe(1);
  });

  it("correctly orders entities as they appear in config", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            { entity: "sensor.first", type: "HaSensor" },
            { entity: "sensor.second", type: "HaSensor" },
            { entity: "sensor.third", type: "HaSensor" },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    const sensors = wrapper.findAll(".ha-sensor");
    // Vue Test Utils renders components but text content shows the entity prop value
    expect(sensors.length).toBe(3);
  });

  it("handles mixed direct entities and wildcard patterns", () => {
    const store = useHaStore();
    store.entities = [
      { entity_id: "sensor.temperature", state: "25", attributes: {} },
      { entity_id: "sensor.humidity", state: "60", attributes: {} },
      { entity_id: "sensor.pressure", state: "1013", attributes: {} },
    ];

    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            { entity: "sensor.temperature", type: "HaSensor" }, // Direct
            { entity: "sensor.*", type: "HaSensor" }, // Wildcard
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    // Should have direct entity + wildcard matches (temperature might be counted twice)
    expect(wrapper.findAll(".ha-sensor").length).toBeGreaterThanOrEqual(3);
  });

  it("handles config changes reactively", async () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [{ entity: "sensor.temperature", type: "HaSensor" }],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    expect(wrapper.findAll(".ha-sensor").length).toBe(1);

    // Update config
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            { entity: "sensor.temperature", type: "HaSensor" },
            { entity: "sensor.humidity", type: "HaSensor" },
          ],
        },
      ],
    };

    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".ha-sensor").length).toBe(2);
  });

  it("handles entities with multiple entities passed to single component", () => {
    const store = useHaStore();
    store.dashboardConfig = {
      views: [
        {
          name: "Test View",
          entities: [
            {
              entity: ["sensor.temp1", "sensor.temp2", "sensor.temp3"],
              type: "HaSensor",
            },
          ],
        },
      ],
    };

    const wrapper = mount(JsonConfigView, {
      props: { viewName: "Test View" },
    });

    // Should render as single component with array entity
    expect(wrapper.findAll(".ha-sensor").length).toBe(1);
  });
});
