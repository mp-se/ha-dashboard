import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import EditorCanvas from "../EditorCanvas.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("EditorCanvas.vue", () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useHaStore();

    // Mock various entity types with their domains
    store.entities = [
      { entity_id: "light.kitchen", state: "on", attributes: { class: "light" } },
      { entity_id: "switch.bedroom", state: "off", attributes: {} },
      { entity_id: "sensor.temperature", state: "22", attributes: {} },
      { entity_id: "binary_sensor.motion", state: "on", attributes: {} },
      { entity_id: "weather.home", state: "sunny", attributes: {} },
      { entity_id: "select.mode", state: "auto", attributes: {} },
      { entity_id: "button.restart", state: "unknown", attributes: {} },
      { entity_id: "person.john", state: "home", attributes: {} },
      { entity_id: "camera.front_door", state: "idle", attributes: {} },
      { entity_id: "group.all_lights", state: "on", attributes: {} },
    ];

    // Build entityMap
    store.entityMap = {};
    store.entities.forEach((entity) => {
      store.entityMap[entity.entity_id] = entity;
    });
  });

  const createWrapper = (entities = []) => {
    return mount(EditorCanvas, {
      props: {
        entities,
        selectedEntityId: null,
      },
      global: {
        stubs: {
          HaAlarmPanel: true,
          HaBeerTap: true,
          HaBinarySensor: true,
          HaButton: true,
          HaChip: true,
          HaEnergy: true,
          EntityAttributeList: true,
          EntityList: true,
          HaError: true,
          HaGauge: true,
          HaGlance: true,
          HaHeader: true,
          IconCircle: true,
          HaImage: true,
          HaLight: true,
          HaLink: true,
          HaMediaPlayer: true,
          HaPerson: true,
          HaPrinter: true,
          HaRoom: true,
          HaRowSpacer: true,
          HaSelect: true,
          HaSensor: true,
          HaSensorGraph: true,
          HaSpacer: true,
          HaSun: true,
          HaSwitch: true,
          HaWarning: true,
          HaWeather: true,
        },
      },
    });
  };

  describe("Component Type Auto-detection", () => {
    it("renders empty state when no entities", () => {
      wrapper = createWrapper([]);
      expect(wrapper.text()).toContain("No entities in this view");
    });

    it("auto-detects light component for light entities without type", async () => {
      wrapper = createWrapper([
        { entity: "light.kitchen", type: undefined, attributes: {} },
      ]);

      await wrapper.vm.$nextTick();

      // The component should auto-detect HaLight
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "light.kitchen",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaLight);
    });

    it("auto-detects switch component for switch entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "switch.bedroom",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaSwitch);
    });

    it("auto-detects sensor component for sensor entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "sensor.temperature",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaSensor);
    });

    it("auto-detects binary_sensor component for binary_sensor entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "binary_sensor.motion",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaBinarySensor);
    });

    it("auto-detects weather component for weather entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "weather.home",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaWeather);
    });

    it("auto-detects select component for select entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "select.mode",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaSelect);
    });

    it("auto-detects button component for button entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "button.restart",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaButton);
    });

    it("auto-detects person component for person entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "person.john",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaPerson);
    });

    it("auto-detects image component for camera entities without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "camera.front_door",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaImage);
    });

    it("defaults to sensor for unknown entity types without type", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "unknown_domain.something",
        type: undefined,
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaSensor);
    });

    it("uses explicit type when provided", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        entity: "light.kitchen",
        type: "HaGauge", // Override the auto-detected type
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaGauge);
    });

    it("handles spacer components without entity", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        type: "HaSpacer",
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaSpacer);
    });

    it("handles header components without entity", async () => {
      const componentType = wrapper.vm.getComponentForEntity({
        type: "HaHeader",
      });

      expect(componentType).toBe(wrapper.vm.componentMap.HaHeader);
    });

    it("renders multiple entities with correct auto-detected types", async () => {
      wrapper = createWrapper([
        { entity: "light.kitchen", type: undefined, attributes: {} },
        { entity: "switch.bedroom", type: undefined, attributes: {} },
        { entity: "sensor.temperature", type: undefined, attributes: {} },
      ]);

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.localEntities).toHaveLength(3);
      expect(
        wrapper.vm.getComponentForEntity(wrapper.vm.localEntities[0]),
      ).toBe(wrapper.vm.componentMap.HaLight);
      expect(
        wrapper.vm.getComponentForEntity(wrapper.vm.localEntities[1]),
      ).toBe(wrapper.vm.componentMap.HaSwitch);
      expect(
        wrapper.vm.getComponentForEntity(wrapper.vm.localEntities[2]),
      ).toBe(wrapper.vm.componentMap.HaSensor);
    });
  });
});
