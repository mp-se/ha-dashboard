import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import VisualEditorView from "../VisualEditorView.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../stores/haStore";
import { useConfigStore } from "../../stores/configStore";

describe("VisualEditorView.vue", () => {
  let wrapper: any;
  let haStore: any;
  let pinia;

  beforeEach(() => {
    localStorage.clear();
    pinia = createPinia();
    setActivePinia(pinia);
    haStore = useHaStore();

    // Mock dashboard config
    haStore.dashboardConfig = {
      views: [
        {
          name: "overview",
          label: "Overview",
          entities: [
            { entity: "sensor.temperature", type: "HaSensor" },
            { entity: "light.living_room", type: "HaLight" },
          ],
        },
        {
          name: "bedroom",
          label: "Bedroom",
          entities: [{ entity: "light.bedroom", type: "HaLight" }],
        },
      ],
    };

    haStore.entityMap = {
      "sensor.temperature": {
        entity_id: "sensor.temperature",
        attributes: { friendly_name: "Temperature" },
        state: "23.5",
      },
      "light.living_room": {
        entity_id: "light.living_room",
        attributes: { friendly_name: "Living Room Light" },
        state: "on",
      },
      "light.bedroom": {
        entity_id: "light.bedroom",
        attributes: { friendly_name: "Bedroom Light" },
        state: "off",
      },
    };

    wrapper = mount(VisualEditorView, {
      global: {
        plugins: [pinia],
        stubs: {
          ViewManager: true,
          EditorCanvas: true,
          EntityPalette: true,
          EntityInspector: true,
          JsonConfigView: true,
        },
      },
    });
  });

  it("renders the visual editor view", () => {
    expect(wrapper.exists()).toBe(true);
  });

  it("displays editor canvas with the restored view manager", () => {
    const editorContainer = wrapper.find(".editor-container");
    expect(editorContainer.exists()).toBe(true);
    const viewManager = wrapper.findComponent({ name: "ViewManager" });
    expect(viewManager.exists()).toBe(true);
  });

  it("loads first view by default", async () => {
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedViewName).toBe("overview");
  });

  it("can change selected view through ViewManager", async () => {
    const viewManager = wrapper.findComponent({ name: "ViewManager" });
    expect(viewManager.exists()).toBe(true);
    expect(wrapper.vm.selectedViewName).toBe("overview");
  });

  it("displays current view entities", () => {
    expect(wrapper.vm.currentViewEntities).toHaveLength(2);
  });

  it("can handle adding entity to view", () => {
    const initialCount = wrapper.vm.currentViewEntities.length;
    wrapper.vm.handleAddEntity("switch.new_switch");
    expect(wrapper.vm.currentViewEntities.length).toBe(initialCount + 1);
  });

  it("can reorder entities", () => {
    const reordered = [
      { entity: "light.living_room", type: "HaLight" },
      { entity: "sensor.temperature", type: "HaSensor" },
    ];
    wrapper.vm.handleReorderEntities(reordered);
    expect(wrapper.vm.currentViewEntities[0].entity).toBe("light.living_room");
  });

  it("can remove entity from view", () => {
    const initialCount = wrapper.vm.currentViewEntities.length;
    wrapper.vm.handleRemoveEntity(0);
    expect(wrapper.vm.currentViewEntities.length).toBe(initialCount - 1);
  });

  it("can update entity type", () => {
    wrapper.vm.selectedEntityId = 0;
    wrapper.vm.handleUpdateEntityType("HaChip");
    expect(wrapper.vm.currentViewEntities[0].type).toBe("HaChip");
  });

  describe("handleAddEntityAtIndex", () => {
    it("inserts entity string at specified index", () => {
      wrapper.vm.handleAddEntityAtIndex({
        entity: "sensor.new",
        index: 0,
      });
      expect(wrapper.vm.currentViewEntities[0].entity).toBe("sensor.new");
    });

    it("inserts static component at specified index", () => {
      wrapper.vm.handleAddEntityAtIndex({
        entity: { type: "HaHeader" },
        index: 0,
      });
      expect(wrapper.vm.currentViewEntities[0].type).toBe("HaHeader");
    });

    it("does nothing when no current view", () => {
      wrapper.vm.selectedViewName = "nonexistent";
      const countBefore = wrapper.vm.currentViewEntities.length;
      wrapper.vm.handleAddEntityAtIndex({ entity: "sensor.x", index: 0 });
      expect(wrapper.vm.currentViewEntities.length).toBe(countBefore);
    });

    it("clamps index to valid range", () => {
      const initial = wrapper.vm.currentViewEntities.length;
      wrapper.vm.handleAddEntityAtIndex({
        entity: "sensor.last",
        index: 9999,
      });
      expect(wrapper.vm.currentViewEntities.length).toBe(initial + 1);
      expect(
        wrapper.vm.currentViewEntities[wrapper.vm.currentViewEntities.length - 1].entity,
      ).toBe("sensor.last");
    });

    it("ignores null/invalid entity payload", () => {
      const initial = wrapper.vm.currentViewEntities.length;
      wrapper.vm.handleAddEntityAtIndex({ entity: null, index: 0 });
      expect(wrapper.vm.currentViewEntities.length).toBe(initial);
    });
  });

  describe("handleRemoveEntityByEntityId", () => {
    it("removes entity by entity ID", () => {
      const initial = wrapper.vm.currentViewEntities.length;
      wrapper.vm.handleRemoveEntityByEntityId("sensor.temperature");
      expect(wrapper.vm.currentViewEntities.length).toBe(initial - 1);
    });

    it("does nothing when entity ID not found", () => {
      const initial = wrapper.vm.currentViewEntities.length;
      wrapper.vm.handleRemoveEntityByEntityId("sensor.nonexistent");
      expect(wrapper.vm.currentViewEntities.length).toBe(initial);
    });

    it("deselects entity when removed entity was selected", () => {
      wrapper.vm.selectedEntityId = 0;
      wrapper.vm.handleRemoveEntityByEntityId("sensor.temperature");
      expect(wrapper.vm.selectedEntityId).toBeNull();
    });
  });

  describe("handleMoveUp", () => {
    it("moves entity up one position", () => {
      wrapper.vm.selectedEntityId = 1; // Second item
      const initial0 = wrapper.vm.currentViewEntities[0].entity;
      const initial1 = wrapper.vm.currentViewEntities[1].entity;

      wrapper.vm.handleMoveUp();

      expect(wrapper.vm.currentViewEntities[0].entity).toBe(initial1);
      expect(wrapper.vm.currentViewEntities[1].entity).toBe(initial0);
      expect(wrapper.vm.selectedEntityId).toBe(0);
    });

    it("does nothing when at top position", () => {
      wrapper.vm.selectedEntityId = 0;
      const initial = JSON.stringify(wrapper.vm.currentViewEntities);

      wrapper.vm.handleMoveUp();

      expect(JSON.stringify(wrapper.vm.currentViewEntities)).toBe(initial);
      expect(wrapper.vm.selectedEntityId).toBe(0);
    });

    it("does nothing when no entity is selected", () => {
      wrapper.vm.selectedEntityId = null;
      const initial = JSON.stringify(wrapper.vm.currentViewEntities);

      wrapper.vm.handleMoveUp();

      expect(JSON.stringify(wrapper.vm.currentViewEntities)).toBe(initial);
    });

    it("does nothing when no current view", () => {
      wrapper.vm.selectedEntityId = 1;
      wrapper.vm.selectedViewName = "nonexistent";
      const initial = JSON.stringify(wrapper.vm.currentViewEntities);

      wrapper.vm.handleMoveUp();

      expect(JSON.stringify(wrapper.vm.currentViewEntities)).toBe(initial);
    });
  });

  describe("handleMoveDown", () => {
    it("moves entity down one position", () => {
      wrapper.vm.selectedEntityId = 0; // First item
      const initial0 = wrapper.vm.currentViewEntities[0].entity;
      const initial1 = wrapper.vm.currentViewEntities[1].entity;

      wrapper.vm.handleMoveDown();

      expect(wrapper.vm.currentViewEntities[0].entity).toBe(initial1);
      expect(wrapper.vm.currentViewEntities[1].entity).toBe(initial0);
      expect(wrapper.vm.selectedEntityId).toBe(1);
    });

    it("does nothing when at bottom position", () => {
      const lastIndex = wrapper.vm.currentViewEntities.length - 1;
      wrapper.vm.selectedEntityId = lastIndex;
      const initial = JSON.stringify(wrapper.vm.currentViewEntities);

      wrapper.vm.handleMoveDown();

      expect(JSON.stringify(wrapper.vm.currentViewEntities)).toBe(initial);
      expect(wrapper.vm.selectedEntityId).toBe(lastIndex);
    });

    it("does nothing when no entity is selected", () => {
      wrapper.vm.selectedEntityId = null;
      const initial = JSON.stringify(wrapper.vm.currentViewEntities);

      wrapper.vm.handleMoveDown();

      expect(JSON.stringify(wrapper.vm.currentViewEntities)).toBe(initial);
    });

    it("does nothing when no current view", () => {
      wrapper.vm.selectedEntityId = 0;
      wrapper.vm.selectedViewName = "nonexistent";
      const initial = JSON.stringify(wrapper.vm.currentViewEntities);

      wrapper.vm.handleMoveDown();

      expect(JSON.stringify(wrapper.vm.currentViewEntities)).toBe(initial);
    });
  });

  describe("handleUpdateEntityAttributes", () => {
    it("updates attributes of selected entity", () => {
      wrapper.vm.selectedEntityId = 0;
      wrapper.vm.handleUpdateEntityAttributes({ unit_of_measurement: "°C" });
      expect(
        wrapper.vm.currentViewEntities[0].attributes.unit_of_measurement,
      ).toBe("°C");
    });

    it("does nothing when no entity is selected", () => {
      wrapper.vm.selectedEntityId = null;
      expect(() =>
        wrapper.vm.handleUpdateEntityAttributes({ unit: "°C" }),
      ).not.toThrow();
    });
  });

  describe("handleUpdateEntityProperties", () => {
    it("merges properties into selected entity", () => {
      wrapper.vm.selectedEntityId = 0;
      wrapper.vm.handleUpdateEntityProperties({
        header: "My Card",
        icon: "mdi-home",
      });
      expect(wrapper.vm.currentViewEntities[0].header).toBe("My Card");
      expect(wrapper.vm.currentViewEntities[0].icon).toBe("mdi-home");
    });

    it("does nothing when no entity is selected", () => {
      wrapper.vm.selectedEntityId = null;
      expect(() =>
        wrapper.vm.handleUpdateEntityProperties({ header: "x" }),
      ).not.toThrow();
    });
  });

  describe("onSelectEntity", () => {
    it("sets selectedEntityId", () => {
      wrapper.vm.onSelectEntity(1);
      expect(wrapper.vm.selectedEntityId).toBe(1);
    });

    it("clears selectedEntityId when null is passed", () => {
      wrapper.vm.onSelectEntity(1);
      wrapper.vm.onSelectEntity(null);
      expect(wrapper.vm.selectedEntityId).toBeNull();
    });
  });

  describe("handleViewCreated", () => {
    it("auto-selects the new view", async () => {
      const newView = {
        name: "newview",
        label: "New View",
        entities: [],
      };
      haStore.dashboardConfig.views.push(newView);
      wrapper.vm.handleViewCreated(newView);
      expect(wrapper.vm.selectedViewName).toBe("newview");
    });
  });

  describe("handleViewDeleted", () => {
    it("auto-selects first remaining view after deletion", async () => {
      wrapper.vm.selectedViewName = "bedroom";
      haStore.dashboardConfig.views = haStore.dashboardConfig.views.filter(
        (v) => v.name !== "bedroom",
      );
      wrapper.vm.handleViewDeleted({ name: "bedroom" });
      expect(wrapper.vm.selectedViewName).toBe("overview");
    });
  });

  describe("handleViewUpdated", () => {
    it("does not throw and preserves state", () => {
      expect(() =>
        wrapper.vm.handleViewUpdated({ name: "overview", label: "Updated" }),
      ).not.toThrow();
    });
  });

  describe("panel resize logic", () => {
    it("normalizePanelWidths returns defaults for invalid input", () => {
      const result = wrapper.vm.normalizePanelWidths({
        left: NaN,
        center: "x",
        right: null,
      });
      expect(result).toEqual({ left: 25, center: 50, right: 25 });
    });

    it("normalizePanelWidths normalises to 100% total", () => {
      const result = wrapper.vm.normalizePanelWidths({
        left: 10,
        center: 20,
        right: 10,
      });
      expect(result.left + result.center + result.right).toBeCloseTo(100, 1);
    });

    it("normalizePanelWidths returns defaults when total is 0", () => {
      const result = wrapper.vm.normalizePanelWidths({
        left: 0,
        center: 0,
        right: 0,
      });
      expect(result).toEqual({ left: 25, center: 50, right: 25 });
    });

    it("savePanelWidths stores widths in localStorage", () => {
      wrapper.vm.savePanelWidths();
      const saved = localStorage.getItem("editor-panel-widths");
      expect(saved).toContain("left");
    });

    it("initializePanelWidths restores saved widths from localStorage", () => {
      localStorage.setItem(
        "editor-panel-widths",
        JSON.stringify({ left: 30, center: 45, right: 25 }),
      );
      wrapper.vm.initializePanelWidths();
      expect(wrapper.vm.leftPanelWidth).toBeCloseTo(30, 0);
    });

    it("initializePanelWidths handles corrupt localStorage data gracefully", () => {
      localStorage.setItem("editor-panel-widths", "not-json{");
      expect(() => wrapper.vm.initializePanelWidths()).not.toThrow();
    });

    it("startResize sets isResizing true and attaches listeners", () => {
      const addEventSpy = vi.spyOn(document, "addEventListener");
      wrapper.vm.startResize("left", { clientX: 200 });
      expect(wrapper.vm.isResizing).toBe(true);
      expect(addEventSpy).toHaveBeenCalledWith(
        "mousemove",
        expect.any(Function),
      );
    });

    it("handleMouseMove adjusts panel widths during left resize", () => {
      wrapper.vm.startResize("left", { clientX: 200 });
      wrapper.vm.handleMouseMove({ clientX: 220 }); // 20px rightward
      expect(wrapper.vm.leftPanelWidth).toBeGreaterThan(25);
    });

    it("handleMouseMove adjusts panel widths during right resize", () => {
      wrapper.vm.startResize("right", { clientX: 400 });
      wrapper.vm.handleMouseMove({ clientX: 420 }); // 20px rightward
      expect(wrapper.vm.centerPanelWidth).toBeGreaterThan(50);
    });

    it("handleMouseMove does nothing when not resizing", () => {
      const before = wrapper.vm.leftPanelWidth;
      wrapper.vm.handleMouseMove({ clientX: 500 });
      expect(wrapper.vm.leftPanelWidth).toBe(before);
    });

    it("handleMouseUp ends resize and removes listeners", () => {
      const removeEventSpy = vi.spyOn(document, "removeEventListener");
      wrapper.vm.startResize("left", { clientX: 200 });
      wrapper.vm.handleMouseUp();
      expect(wrapper.vm.isResizing).toBe(false);
      expect(removeEventSpy).toHaveBeenCalled();
    });
  });

  describe("saveConfigToBackend", () => {
    it("calls configStore.saveConfigToBackend", async () => {
      const configStore = useConfigStore();
      vi.spyOn(configStore, "saveConfigToBackend").mockResolvedValue(true);
      await wrapper.vm.saveConfigToBackend();
      expect(configStore.saveConfigToBackend).toHaveBeenCalled();
    });

    it("does nothing when dashboardConfig is null", async () => {
      haStore.dashboardConfig = null;
      await expect(wrapper.vm.saveConfigToBackend()).resolves.not.toThrow();
    });
  });

  describe("onMobilePaletteAdd", () => {
    beforeEach(() => {
      wrapper.vm.selectedViewName = "overview";
    });

    it("appends to end when no card is selected", () => {
      wrapper.vm.selectedEntityId = null;
      wrapper.vm.onMobilePaletteAdd("sensor.new");
      const entities = haStore.dashboardConfig.views[0].entities;
      expect(entities[entities.length - 1]).toMatchObject({ entity: "sensor.new" });
    });

    it("inserts after the selected card index", () => {
      wrapper.vm.selectedEntityId = 0; // first card selected
      wrapper.vm.onMobilePaletteAdd("sensor.inserted");
      const entities = haStore.dashboardConfig.views[0].entities;
      // should be at index 1, between the two original cards
      expect(entities[1]).toMatchObject({ entity: "sensor.inserted" });
    });

    it("updates selectedEntityId to the new card's index after insert", () => {
      wrapper.vm.selectedEntityId = 0;
      wrapper.vm.onMobilePaletteAdd("sensor.inserted");
      expect(wrapper.vm.selectedEntityId).toBe(1);
    });

    it("closes the mobile panel after adding", () => {
      wrapper.vm.showMobilePanel = true;
      wrapper.vm.onMobilePaletteAdd("sensor.new");
      expect(wrapper.vm.showMobilePanel).toBe(false);
    });

    it("inserts after last card when last card is selected", () => {
      wrapper.vm.selectedEntityId = 1; // last card (index 1 of 2)
      wrapper.vm.onMobilePaletteAdd("sensor.last");
      const entities = haStore.dashboardConfig.views[0].entities;
      expect(entities[2]).toMatchObject({ entity: "sensor.last" });
      expect(wrapper.vm.selectedEntityId).toBe(2);
    });
  });
});
