import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";
import HaIconCircle from "../HaIconCircle.vue";

describe("HaIconCircle.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useHaStore();
  });

  const lightEntity = {
    entity_id: "light.bedroom",
    state: "on",
    attributes: { friendly_name: "Bedroom Light" },
  };

  const sensorEntity = {
    entity_id: "sensor.temperature",
    state: "22.5",
    attributes: { friendly_name: "Temperature", unit_of_measurement: "°C" },
  };

  describe("Rendering", () => {
    it("renders wrapper div when entity has an icon", () => {
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "light.bedroom", resolvedEntity: lightEntity },
      });
      expect(wrapper.find(".ha-icon-circle-wrapper").exists()).toBe(true);
    });

    it("renders nothing when iconClass is empty (null entity with unknown domain)", () => {
      // entity is null, entityId has no known domain mapping
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "xyz.nothing", resolvedEntity: null },
      });
      // useIconClass returns null for unknown entity kinds
      expect(wrapper.find(".ha-icon-circle-wrapper").exists()).toBe(false);
    });

    it("renders icon-bg div", () => {
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "light.bedroom", resolvedEntity: lightEntity },
      });
      expect(wrapper.find(".icon-bg").exists()).toBe(true);
    });

    it("applies backgroundColor style to icon-bg", () => {
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "light.bedroom", resolvedEntity: lightEntity },
      });
      expect(wrapper.find(".icon-bg").attributes("style")).toContain(
        "background-color",
      );
    });

    it("renders icon element with mdi class", () => {
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "sensor.temperature", resolvedEntity: sensorEntity },
      });
      expect(wrapper.find("i").classes()).toContain("mdi");
    });

    it("renders thermometer icon for temperature sensor", () => {
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "sensor.temperature", resolvedEntity: sensorEntity },
      });
      expect(wrapper.find("i").classes()).toContain("mdi-thermometer");
    });
  });

  describe("Size prop", () => {
    it("applies flex-shrink-0 class for default (medium) size", () => {
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "light.bedroom", resolvedEntity: lightEntity },
      });
      expect(wrapper.find(".flex-shrink-0").exists()).toBe(true);
    });

    it("applies icon-bg-small for small size", () => {
      const wrapper = mount(HaIconCircle, {
        props: {
          entityId: "light.bedroom",
          resolvedEntity: lightEntity,
          size: "small",
        },
      });
      expect(wrapper.find(".icon-bg-small").exists()).toBe(true);
    });

    it("applies icon-overlay-small for small size", () => {
      const wrapper = mount(HaIconCircle, {
        props: {
          entityId: "light.bedroom",
          resolvedEntity: lightEntity,
          size: "small",
        },
      });
      expect(wrapper.find(".icon-overlay-small").exists()).toBe(true);
    });

    it("applies ha-icon-overlay for medium size", () => {
      const wrapper = mount(HaIconCircle, {
        props: {
          entityId: "light.bedroom",
          resolvedEntity: lightEntity,
          size: "medium",
        },
      });
      expect(wrapper.find(".ha-icon-overlay").exists()).toBe(true);
    });

    it("applies mb-3 class for large size", () => {
      const wrapper = mount(HaIconCircle, {
        props: {
          entityId: "light.bedroom",
          resolvedEntity: lightEntity,
          size: "large",
        },
      });
      expect(wrapper.find(".ha-icon-circle-wrapper").classes()).toContain(
        "mb-3",
      );
    });

    it("uses icon-bg (not icon-bg-small) for large size", () => {
      const wrapper = mount(HaIconCircle, {
        props: {
          entityId: "light.bedroom",
          resolvedEntity: lightEntity,
          size: "large",
        },
      });
      expect(wrapper.find(".icon-bg").exists()).toBe(true);
      expect(wrapper.find(".icon-bg-small").exists()).toBe(false);
    });

    it("uses ha-icon-overlay for large size", () => {
      const wrapper = mount(HaIconCircle, {
        props: {
          entityId: "light.bedroom",
          resolvedEntity: lightEntity,
          size: "large",
        },
      });
      expect(wrapper.find(".ha-icon-overlay").exists()).toBe(true);
    });
  });

  describe("Props", () => {
    it("accepts entityId as required string", () => {
      expect(
        mount(HaIconCircle, { props: { entityId: "switch.fan" } }).exists(),
      ).toBe(true);
    });

    it("resolvedEntity defaults to null without error", () => {
      expect(
        mount(HaIconCircle, {
          props: { entityId: "light.x", resolvedEntity: null },
        }).exists(),
      ).toBe(true);
    });

    it("renders icon for switch entity", () => {
      const entity = { entity_id: "switch.fan", state: "on", attributes: {} };
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "switch.fan", resolvedEntity: entity },
      });
      expect(wrapper.find("i").exists()).toBe(true);
    });

    it("renders for binary_sensor entity", () => {
      const entity = {
        entity_id: "binary_sensor.door",
        state: "on",
        attributes: { device_class: "door" },
      };
      expect(
        mount(HaIconCircle, {
          props: { entityId: "binary_sensor.door", resolvedEntity: entity },
        }).exists(),
      ).toBe(true);
    });

    it("renders icon for entity with explicit mdi: icon attribute", () => {
      const entity = {
        entity_id: "sensor.custom",
        state: "5",
        attributes: { icon: "mdi:star" },
      };
      const wrapper = mount(HaIconCircle, {
        props: { entityId: "sensor.custom", resolvedEntity: entity },
      });
      expect(wrapper.find("i").classes()).toContain("mdi-star");
    });
  });
});
