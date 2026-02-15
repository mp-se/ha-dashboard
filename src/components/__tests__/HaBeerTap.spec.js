import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HaBeerTap from "../HaBeerTap.vue";
import { useHaStore } from "@/stores/haStore";

describe("HaBeerTap.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useHaStore();
    store.sensors = [];
  });

  it("renders error when no entities provided", () => {
    const wrapper = mount(HaBeerTap, {
      props: {
        entity: [],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.find(".border-warning").exists()).toBe(true);
    expect(wrapper.text()).toContain("No beer tap entities found");
  });

  it("renders beer tap with volume and beer data", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume1",
        state: "3.499",
        attributes: {
          glasses: 8.7,
          keg_volume: 19,
          glass_volume: 0.4,
          keg_percent: 18.41,
          unit_of_measurement: "L",
          device_class: "volume",
          friendly_name: "Tap 1 - Volym",
          device_id: "301ae177572661f521c6ac4046ea18d6",
        },
      },
      {
        entity_id: "sensor.tap_tap_beer1",
        state: "Imperial Licorice",
        attributes: {
          abv: 8.9,
          ibu: 78,
          ebc: 53,
          friendly_name: "Tap 1 - Namn",
          device_id: "301ae177572661f521c6ac4046ea18d6",
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume1", "sensor.tap_tap_beer1"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Check beer name
    expect(wrapper.text()).toContain("Imperial Licorice");

    // Check ABV
    expect(wrapper.text()).toContain("ABV: 8.9");

    // Check IBU
    expect(wrapper.text()).toContain("IBU: 78");

    // Check EBC
    expect(wrapper.text()).toContain("EBC: 53");
  });

  it("calculates percentage correctly", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume1",
        state: "9.5",
        attributes: {
          glasses: 23.75,
          keg_volume: 19,
          glass_volume: 0.4,
          keg_percent: 50,
          unit_of_measurement: "L",
          device_class: "volume",
          friendly_name: "Tap 1 - Volym",
        },
      },
      {
        entity_id: "sensor.tap_tap_beer1",
        state: "Test Beer",
        attributes: {
          abv: 5.0,
          ibu: 40,
          ebc: 20,
          friendly_name: "Tap 1 - Namn",
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume1", "sensor.tap_tap_beer1"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // 9.5 / 19 * 100 = 50%
    expect(wrapper.text()).toContain("Test Beer");
    expect(wrapper.text()).toContain("ABV: 5.0");
  });

  it("shows empty state when volume is 0", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume4",
        state: "0",
        attributes: {
          glasses: 0,
          keg_volume: 19,
          glass_volume: 0.4,
          keg_percent: 0,
          unit_of_measurement: "L",
          device_class: "volume",
          friendly_name: "Tap 4 - Volym",
        },
      },
      {
        entity_id: "sensor.tap_tap_beer4",
        state: "unknown",
        attributes: {
          friendly_name: "Tap 4 - Namn",
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume4", "sensor.tap_tap_beer4"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Should show beer-off icon
    expect(wrapper.find(".mdi-beer-off").exists()).toBe(true);

    // Should not show ABV or additional info
    const abvText = wrapper.text();
    expect(abvText).not.toContain("% ABV");
  });

  it("uses EBC value to determine beer color", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume1",
        state: "10",
        attributes: {
          glasses: 25,
          keg_volume: 19,
          glass_volume: 0.4,
          unit_of_measurement: "L",
          device_class: "volume",
          friendly_name: "Tap 1 - Volym",
        },
      },
      {
        entity_id: "sensor.tap_tap_beer1",
        state: "Dark Stout",
        attributes: {
          abv: 7.0,
          ibu: 60,
          ebc: 100, // Very dark, should be #3D2817
          friendly_name: "Tap 1 - Namn",
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume1", "sensor.tap_tap_beer1"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Check that color is applied to progress bar and icon background
    const iconBg = wrapper.find(".ha-icon-circle");
    expect(iconBg.attributes("style")).toContain("background-color: #3D2817");
  });

  it("handles missing attributes gracefully", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume1",
        state: "5",
        attributes: {
          unit_of_measurement: "L",
          device_class: "volume",
          friendly_name: "Tap 1 - Volym",
        },
      },
      {
        entity_id: "sensor.tap_tap_beer1",
        state: "Test Beer",
        attributes: {
          friendly_name: "Tap 1 - Namn",
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume1", "sensor.tap_tap_beer1"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Should show '-' for missing values
    expect(wrapper.text()).toContain("-");

    // Should not throw error
    expect(wrapper.find(".card").exists()).toBe(true);
  });

  it("accepts entity objects as props", () => {
    const store = useHaStore();
    const volumeEntity = {
      entity_id: "sensor.tap_tap_volume1",
      state: "15",
      attributes: {
        glasses: 37.5,
        keg_volume: 19,
        unit_of_measurement: "L",
        device_class: "volume",
        friendly_name: "Tap 1 - Volym",
      },
    };

    const beerEntity = {
      entity_id: "sensor.tap_tap_beer1",
      state: "Pale Ale",
      attributes: {
        abv: 5.5,
        ibu: 45,
        ebc: 25,
        friendly_name: "Tap 1 - Namn",
      },
    };

    store.sensors = [volumeEntity, beerEntity];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: [volumeEntity, beerEntity],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Pale Ale");
    expect(wrapper.text()).toContain("ABV: 5.5");
    expect(wrapper.text()).toContain("IBU: 45");
  });

  it("auto-detects volume entity by device_class", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume1",
        state: "12.5",
        attributes: {
          glasses: 31.3,
          keg_volume: 19,
          unit_of_measurement: "L",
          device_class: "volume",
          friendly_name: "Tap 1 - Volym",
        },
      },
      {
        entity_id: "sensor.tap_tap_beer1",
        state: "Belgian Tripel",
        attributes: {
          abv: 9.0,
          ibu: 35,
          ebc: 12,
          friendly_name: "Tap 1 - Namn",
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume1", "sensor.tap_tap_beer1"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    const text = wrapper.text();
    expect(text).toContain("Belgian Tripel");
    expect(text).toContain("ABV: 9.0");
    expect(text).toContain("EBC: 12");
    expect(text).toContain("IBU: 35");
  });

  it("auto-detects beer entity by entity_id pattern", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.gravitymon_volume",
        state: "8.5",
        attributes: {
          glasses: 21.25,
          keg_volume: 19,
          unit_of_measurement: "L",
          device_class: "volume",
          friendly_name: "Gravitymon Volume",
        },
      },
      {
        entity_id: "sensor.gravitymon_beername",
        state: "Hoppy IPA",
        attributes: {
          abv: 6.5,
          ibu: 65,
          ebc: 35,
          friendly_name: "Gravitymon Beer Name",
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.gravitymon_volume", "sensor.gravitymon_beername"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Hoppy IPA");
    expect(wrapper.text()).toContain("ABV: 6.5");
    expect(wrapper.text()).toContain("IBU: 65");
  });

  it("handles non-numeric volume state", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume1",
        state: "unavailable",
        attributes: {
          keg_volume: 19,
          unit_of_measurement: "L",
        },
      },
      {
        entity_id: "sensor.tap_tap_beer1",
        state: "Test Beer",
        attributes: {},
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume1", "sensor.tap_tap_beer1"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("0L"); // volume defaults to 0
    expect(wrapper.find(".ha-progress-bar").element.style.width).toBe("0%");
  });

  it("handles missing beer attributes (ABV, IBU, EBC)", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.tap_tap_volume1",
        state: "5",
        attributes: {
          keg_volume: 20,
        },
      },
      {
        entity_id: "sensor.tap_tap_beer1",
        state: "Simple Beer",
        attributes: {
          // No ABV, IBU, or EBC
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ["sensor.tap_tap_volume1", "sensor.tap_tap_beer1"],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("ABV: -%");
    expect(wrapper.text()).toContain("EBC: -");
    expect(wrapper.text()).toContain("IBU: -");
    // Default beer color
    expect(wrapper.get(".ha-icon-circle").element.style.backgroundColor).toBe(
      "#D4A574",
    );
  });

  it("returns correct colors for different EBC values", () => {
    const store = useHaStore();
    const testCases = [
      { ebc: 5, expected: "#F4D03F" },
      { ebc: 15, expected: "#F9E79F" },
      { ebc: 25, expected: "#F5B041" },
      { ebc: 45, expected: "#DC7633" },
      { ebc: 80, expected: "#8B4513" },
    ];

    testCases.forEach(({ ebc, expected }) => {
      store.sensors = [
        {
          entity_id: "sensor.beer",
          state: "Test",
          attributes: { ebc },
        },
        {
          entity_id: "sensor.volume",
          state: "10",
          attributes: { unit_of_measurement: "L" },
        },
      ];
      const wrapper = mount(HaBeerTap, {
        props: { entity: ["sensor.beer", "sensor.volume"] },
        global: { stubs: { i: true, svg: true } },
      });
      expect(wrapper.get(".ha-icon-circle").element.style.backgroundColor).toBe(
        expected,
      );
    });
  });

  it("auto-detects beer entity by name and volume by device_class", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.test_vol",
        state: "10",
        attributes: { device_class: "volume", keg_volume: 20 },
      },
      {
        entity_id: "sensor.test_beer",
        state: "Detect Me",
        attributes: { abv: 4.5 },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: { entity: ["sensor.test_vol", "sensor.test_beer"] },
    });

    expect(wrapper.text()).toContain("Detect Me");
    expect(wrapper.text()).toContain("10.00");
  });

  it("handles beer state as unknown", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.vol",
        state: "10",
        attributes: { unit_of_measurement: "L" },
      },
      {
        entity_id: "sensor.beer",
        state: "unknown",
        attributes: {},
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: { entity: ["sensor.vol", "sensor.beer"] },
    });

    expect(wrapper.find(".mdi-beer-off").exists()).toBe(true);
    // Color should be gray #C0C0C0
    expect(wrapper.get(".ha-icon-circle").element.style.backgroundColor).toBe(
      "#C0C0C0",
    );
  });

  it("handles missing store sensors gracefully", () => {
    const store = useHaStore();
    store.sensors = null;

    const wrapper = mount(HaBeerTap, {
      props: { entity: "sensor.any" },
    });

    expect(wrapper.text()).toContain("No beer tap entities found");
  });

  describe("Prop Validation", () => {
    const validator = HaBeerTap.props.entity.validator;

    it("validates array of strings", () => {
      expect(validator(["sensor.one", "sensor.two"])).toBe(true);
    });

    it("validates array of objects", () => {
      expect(validator([{ entity_id: "sensor.one" }])).toBe(true);
    });

    it("validates mixed array", () => {
      expect(validator(["sensor.one", { entity_id: "sensor.two" }])).toBe(true);
    });

    it("rejects invalid array items", () => {
      expect(validator(["sensor.one", 123])).toBe(false);
    });

    it("rejects invalid string format", () => {
      expect(validator("invalid-format")).toBe(false);
    });

    it("rejects invalid types", () => {
      expect(validator(123)).toBe(false);
      expect(validator(null)).toBe(false);
    });
  });

  it("handles single entity object as prop", () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: "sensor.beer_volume",
        state: "12",
        attributes: { keg_volume: 24 },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: { entity_id: "sensor.beer_volume" },
      },
    });

    expect(wrapper.text()).toContain("12.00");
    expect(wrapper.find(".ha-progress-bar").element.style.width).toBe("50%");
  });
});
