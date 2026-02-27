import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import HaSensorGraph from "../HaSensorGraph.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("HaSensorGraph.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    store.entities = [
      {
        entity_id: "sensor.temperature",
        state: "22.5",
        attributes: {
          friendly_name: "Temperature",
          unit_of_measurement: "°C",
        },
      },
    ];

    store.fetchHistory = vi.fn().mockResolvedValue([
      { t: Date.now() - 3600000, v: 20 },
      { t: Date.now(), v: 22.5 },
    ]);
  });

  // Helper function to reduce mount configuration duplication
  const createWrapper = (props = {}, options = {}) => {
    return mount(HaSensorGraph, {
      props: {
        entity: "sensor.temperature",
        ...props,
      },
      global: {
        plugins: [pinia],
        ...options.global,
      },
      ...options,
    });
  };

  // Helper function to setup multi-entity scenario
  const setupMultiEntity = () => {
    store.entities.push({
      entity_id: "sensor.humidity",
      state: "65",
      attributes: {
        friendly_name: "Humidity",
        unit_of_measurement: "%",
      },
    });

    store.fetchHistory = vi.fn().mockResolvedValue([
      { t: Date.now() - 3600000, v: 60 },
      { t: Date.now(), v: 65 },
    ]);
  };

  describe("Rendering", () => {
    it("should render sensor graph card", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".card").exists()).toBe(true);
    });

    it("should display title", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.text()).toContain("Temperature");
    });

    it("should display unit of measurement", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.text()).toContain("°C");
    });

    it("should render SVG graph", async () => {
      const wrapper = createWrapper();

      await wrapper.vm.loadHistory();
      expect(wrapper.find("svg").exists()).toBe(true);
    });

    it("should calculate polyline points", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      const path = wrapper.find('path[stroke="#0d6efd"]');
      expect(path.exists()).toBe(true);
      expect(path.attributes("d")).toBeTruthy();
    });
  });

  describe("Hours Cycling", () => {
    it("should have hours cycle button", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("h");
    });

    it("should cycle through hours (24-48-72-96)", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      const button = wrapper.find("button");
      expect(button.text()).toBe("24h");

      await button.trigger("click");
      await flushPromises();
      expect(button.text()).toBe("48h");

      await button.trigger("click");
      await flushPromises();
      expect(button.text()).toBe("72h");

      await button.trigger("click");
      await flushPromises();
      expect(button.text()).toBe("96h");

      await button.trigger("click");
      await flushPromises();
      expect(button.text()).toBe("24h");
    });
  });

  describe("Data Loading", () => {
    it("should load history on mount", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.exists()).toBe(true);
      expect(store.fetchHistory).toHaveBeenCalled();
    });

    it("should display loading state", async () => {
      let resolveHistory;
      store.fetchHistory = vi.fn(
        () =>
          new Promise((resolve) => {
            resolveHistory = resolve;
          }),
      );

      const wrapper = createWrapper();

      // Wait for initial render but not for promise resolution
      await wrapper.vm.$nextTick();

      // Check loading state before promise resolves
      const loadingText = wrapper.find(".text-center.py-4");
      expect(loadingText.exists()).toBe(true);
      expect(loadingText.text()).toBe("Loading history…");

      // Clean up by resolving the promise
      resolveHistory([]);
      await flushPromises();
    });

    it("should display error when history fetch fails", async () => {
      store.fetchHistory = vi.fn().mockRejectedValue(new Error("Fetch failed"));

      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find(".text-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Fetch failed");
    });

    it("should display message when no data available", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([]);

      const wrapper = createWrapper();

      await wrapper.vm.loadHistory();
      expect(wrapper.text()).toContain("No numeric history");
    });

    it("should reload history when entity changes", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      const callCount = store.fetchHistory.mock.calls.length;

      store.entities[0].entity_id = "sensor.new_temperature";
      await wrapper.setProps({ entity: "sensor.new_temperature" });
      await flushPromises();

      expect(store.fetchHistory.mock.calls.length).toBeGreaterThan(callCount);
    });

    it("should throw error when no valid entities provided", async () => {
      // Entity string not in store -> resolvedEntities becomes [null]
      store.entities = [];
      const wrapper = createWrapper({ entity: "sensor.nonexistent" });
      await flushPromises();

      expect(wrapper.find(".text-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("No valid entities");
    });
  });

  describe("Props", () => {
    it("should accept maxPoints prop", () => {
      const wrapper = createWrapper({ maxPoints: 100 });

      expect(wrapper.props("maxPoints")).toBe(100);
    });

    it("should accept hours prop", () => {
      const wrapper = createWrapper({ hours: 48 });

      expect(wrapper.props("hours")).toBe(48);
    });
  });

  describe("Multiple Entities", () => {
    it("should handle multiple entities (array)", async () => {
      setupMultiEntity();

      const wrapper = createWrapper({
        entity: ["sensor.temperature", "sensor.humidity"],
      });
      await flushPromises();

      // Check that both entity labels appear in the legend
      expect(wrapper.text()).toContain("Temperature");
      expect(wrapper.text()).toContain("Humidity");
    });

    it("should display legend for dual graphs", async () => {
      setupMultiEntity();

      const wrapper = createWrapper({
        entity: ["sensor.temperature", "sensor.humidity"],
      });
      await flushPromises();

      // Check legend exists and has colored badges
      const badges = wrapper.findAll(".badge");
      expect(badges.length).toBe(2);
      expect(wrapper.text()).toContain("Temperature");
      expect(wrapper.text()).toContain("Humidity");
    });

    it("should handle three entities (triple graph)", async () => {
      setupMultiEntity();
      store.entities.push({
        entity_id: "sensor.pressure",
        state: "1013",
        attributes: {
          friendly_name: "Pressure",
          unit_of_measurement: "hPa",
        },
      });

      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 1010 },
        { t: Date.now(), v: 1013 },
      ]);

      const wrapper = createWrapper({
        entity: ["sensor.temperature", "sensor.humidity", "sensor.pressure"],
      });
      await flushPromises();

      // Check all three paths exist
      const bluePath = wrapper.find('path[stroke="#0d6efd"]');
      const redPath = wrapper.find('path[stroke="#dc3545"]');
      const greenPath = wrapper.find('path[stroke="#198754"]');
      expect(bluePath.exists()).toBe(true);
      expect(redPath.exists()).toBe(true);
      expect(greenPath.exists()).toBe(true);

      // Check legend has 3 items
      const badges = wrapper.findAll(".badge");
      expect(badges.length).toBe(3);
    });

    it("should display empty string title for multi-entity graphs", async () => {
      setupMultiEntity();
      const wrapper = createWrapper({
        entity: ["sensor.temperature", "sensor.humidity"],
      });
      await flushPromises();

      // title is empty for multi-entity, only legend is used
      const title = wrapper.find(".card-title span");
      expect(title.text()).toBe("");
    });
  });

  describe("Prop Validation", () => {
    it("should validate entity prop", () => {
      // String entity
      const validEntity = "sensor.temperature";
      expect(HaSensorGraph.props.entity.validator(validEntity)).toBe(true);

      // Invalid string
      const invalidEntity = "invalid";
      expect(HaSensorGraph.props.entity.validator(invalidEntity)).toBe(false);

      // Array with 1-3 entities
      const validArray = ["sensor.temperature", "sensor.humidity"];
      expect(HaSensorGraph.props.entity.validator(validArray)).toBe(true);

      // Array with 3 entities
      const validArray3 = [
        "sensor.temperature",
        "sensor.humidity",
        "sensor.pressure",
      ];
      expect(HaSensorGraph.props.entity.validator(validArray3)).toBe(true);

      // Array with too many entities (>3)
      const invalidArray = [
        "sensor.temperature",
        "sensor.humidity",
        "sensor.pressure",
        "sensor.extra",
      ];
      expect(HaSensorGraph.props.entity.validator(invalidArray)).toBe(false);

      // Empty array
      const emptyArray = [];
      expect(HaSensorGraph.props.entity.validator(emptyArray)).toBe(false);
    });

    it("should validate entity prop with object array items", () => {
      const validArrayWithObject = [
        {
          entity_id: "sensor.temperature",
          state: "22",
          attributes: { unit_of_measurement: "°C" },
        },
      ];
      expect(HaSensorGraph.props.entity.validator(validArrayWithObject)).toBe(
        true,
      );

      // Invalid object in array (missing state)
      const invalidArrayWithObject = [
        { entity_id: "sensor.temperature", attributes: {} },
      ];
      expect(HaSensorGraph.props.entity.validator(invalidArrayWithObject)).toBe(
        false,
      );
    });

    it("should handle entity passed as object directly", async () => {
      const entityObject = {
        entity_id: "sensor.direct_temp",
        state: "23.5",
        attributes: {
          friendly_name: "Direct Temperature",
          unit_of_measurement: "°C",
        },
      };

      const wrapper = createWrapper({ entity: entityObject });
      await flushPromises();

      expect(wrapper.text()).toContain("Direct Temperature");
      expect(wrapper.text()).toContain("°C");
    });
  });

  describe("Auto-refresh", () => {
    it("should set up auto-refresh interval on mount", async () => {
      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
      const wrapper = createWrapper();
      await flushPromises();

      // Verify interval is set with 5 minute (300000ms) delay
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000,
      );
      setIntervalSpy.mockRestore();
      wrapper.unmount();
    });

    it("should clear interval on unmount", async () => {
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

      const wrapper = createWrapper();
      await flushPromises();

      // Get the interval ID that was set
      const intervalId = setIntervalSpy.mock.results[0].value;

      wrapper.unmount();

      // Verify the specific interval was cleared
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);

      clearIntervalSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });

    it("should refresh history when auto-refresh interval fires", async () => {
      vi.useFakeTimers();

      const wrapper = createWrapper();
      await flushPromises();

      const initialCallCount = store.fetchHistory.mock.calls.length;

      // Fast-forward 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);
      await flushPromises();

      // Verify history was fetched again
      expect(store.fetchHistory.mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );

      vi.useRealTimers();
      wrapper.unmount();
    });

    it("should not set intervalId to null when already null on unmount", () => {
      const wrapper = createWrapper();
      // Simulate intervalId being already cleared
      const component = wrapper.vm;
      component.intervalId = null;
      wrapper.unmount();
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe("Value Formatting", () => {
    it("should display integer values without decimal places", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 20 },
        { t: Date.now(), v: 25 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Check min/max values displayed in DOM
      const textContent = wrapper.text();
      expect(textContent).toContain("25");
      expect(textContent).toContain("20");
    });

    it("should display decimal values with 2 decimal places", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 20.5 },
        { t: Date.now(), v: 22.75 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Check min/max values displayed in DOM
      const textContent = wrapper.text();
      expect(textContent).toContain("22.75");
      expect(textContent).toContain("20.50");
    });

    it("should handle null values in history data gracefully", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 7200000, v: 20 },
        { t: Date.now() - 3600000, v: null },
        { t: Date.now(), v: 22.5 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Should still render graph without errors
      expect(wrapper.find(".text-danger").exists()).toBe(false);
      expect(wrapper.find("svg").exists()).toBe(true);
    });

    it("should handle undefined values in history data gracefully", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 7200000, v: 20 },
        { t: Date.now() - 3600000, v: undefined },
        { t: Date.now(), v: 22.5 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Should still render graph without errors
      expect(wrapper.find(".text-danger").exists()).toBe(false);
      expect(wrapper.find("svg").exists()).toBe(true);
    });
  });

  describe("Entity Labels", () => {
    it("should display entity friendly name from store", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      // Verify the entity label appears in the card
      expect(wrapper.text()).toContain("Temperature");
    });

    it("should display entity_id when entity has no friendly name", async () => {
      store.entities[0].attributes = {};
      const wrapper = createWrapper();
      await flushPromises();

      // Should fall back to entity_id
      expect(wrapper.text()).toContain("sensor.temperature");
    });

    it("should show error when entity not found in store", async () => {
      store.entities = [];
      const wrapper = createWrapper({ entity: "sensor.nonexistent" });
      await flushPromises();

      // Should display error for non-existent entity
      expect(wrapper.find(".text-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("No valid entities");
    });
  });

  describe("Graph Rendering", () => {
    it("should render graph with exactly 2 data points", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 20 },
        { t: Date.now(), v: 25 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find("svg").exists()).toBe(true);
      expect(wrapper.find('path[stroke="#0d6efd"]').exists()).toBe(true);
    });

    it("should render smooth curves for multiple data points", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 7200000, v: 20 },
        { t: Date.now() - 5400000, v: 23 },
        { t: Date.now() - 3600000, v: 21 },
        { t: Date.now() - 1800000, v: 24 },
        { t: Date.now(), v: 22 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find("svg").exists()).toBe(true);
      const path = wrapper.find('path[stroke="#0d6efd"]');
      expect(path.exists()).toBe(true);
      expect(path.attributes("d")).toBeTruthy();
    });

    it("should handle single data point gracefully", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now(), v: 22 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Single point should still render without errors
      expect(wrapper.find(".text-danger").exists()).toBe(false);
    });

    it("should render filled area under graph line", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 20 },
        { t: Date.now(), v: 25 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      const filledArea = wrapper.find('path[fill="#0d6efd"][opacity="0.15"]');
      expect(filledArea.exists()).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle mixed numeric and non-numeric values", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 7200000, v: 20 },
        { t: Date.now() - 5400000, v: "invalid" },
        { t: Date.now() - 3600000, v: 22 },
        { t: Date.now() - 1800000, v: NaN },
        { t: Date.now(), v: 24 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Should filter out invalid values and render graph
      expect(wrapper.find(".text-danger").exists()).toBe(false);
      expect(wrapper.find("svg").exists()).toBe(true);
    });

    it("should respect maxPoints limit with large datasets", async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        t: Date.now() - i * 60000,
        v: 20 + Math.sin(i / 10) * 5,
      }));
      store.fetchHistory = vi.fn().mockResolvedValue(largeDataset);

      const wrapper = createWrapper({ maxPoints: 100 });
      await flushPromises();

      // Should render successfully with reduced points
      expect(wrapper.find("svg").exists()).toBe(true);
      expect(wrapper.find('path[stroke="#0d6efd"]').exists()).toBe(true);
    });

    it("should handle rapid entity prop changes", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      store.entities.push({
        entity_id: "sensor.temp2",
        state: "25",
        attributes: {
          friendly_name: "Temperature 2",
          unit_of_measurement: "°C",
        },
      });

      // Rapid prop changes
      await wrapper.setProps({ entity: "sensor.temp2" });
      await flushPromises();

      // Should display the final entity
      expect(wrapper.text()).toContain("Temperature 2");
    });

    it("should handle entity with very small value range", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 20.001 },
        { t: Date.now(), v: 20.002 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Should still render graph with tiny variations
      expect(wrapper.find("svg").exists()).toBe(true);
      expect(wrapper.find(".text-danger").exists()).toBe(false);
    });

    it("should handle entity with identical values", async () => {
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 22 },
        { t: Date.now() - 1800000, v: 22 },
        { t: Date.now(), v: 22 },
      ]);
      const wrapper = createWrapper();
      await flushPromises();

      // Should render flat line without errors
      expect(wrapper.find("svg").exists()).toBe(true);
      expect(wrapper.text()).toContain("22");
    });
  });

  describe("Error Recovery", () => {
    it("should recover when history becomes available after initial error", async () => {
      store.fetchHistory = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce([
          { t: Date.now() - 3600000, v: 20 },
          { t: Date.now(), v: 22 },
        ]);

      const wrapper = createWrapper();
      await flushPromises();

      // Should show error initially
      expect(wrapper.find(".text-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Network error");

      // Trigger retry by reloading history
      await wrapper.vm.loadHistory();
      await flushPromises();

      // Should now show graph successfully
      expect(wrapper.find(".text-danger").exists()).toBe(false);
      expect(wrapper.find("svg").exists()).toBe(true);
    });

    it("should handle transition from empty data to valid data", async () => {
      store.fetchHistory = vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { t: Date.now() - 3600000, v: 20 },
          { t: Date.now(), v: 22 },
        ]);

      const wrapper = createWrapper();
      await flushPromises();

      // Should show "no data" message initially
      expect(wrapper.text()).toContain("No numeric history");

      // Reload with valid data
      await wrapper.vm.loadHistory();
      await flushPromises();

      // Should now display graph
      expect(wrapper.find("svg").exists()).toBe(true);
      expect(wrapper.text()).not.toContain("No numeric history");
    });

    it("should handle entity becoming unavailable then available again", async () => {
      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.text()).toContain("Temperature");
      expect(wrapper.find("svg").exists()).toBe(true);

      // Change to a non-existent entity
      store.entities = [];
      await wrapper.setProps({ entity: "sensor.nonexistent" });
      await flushPromises();

      expect(wrapper.find(".text-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("No valid entities");

      // Add entity back and switch to it
      store.entities = [
        {
          entity_id: "sensor.temperature",
          state: "22.5",
          attributes: {
            friendly_name: "Temperature",
            unit_of_measurement: "°C",
          },
        },
      ];
      store.fetchHistory = vi.fn().mockResolvedValue([
        { t: Date.now() - 3600000, v: 20 },
        { t: Date.now(), v: 22.5 },
      ]);
      await wrapper.setProps({ entity: "sensor.temperature" });
      await flushPromises();

      // Should recover and display graph
      expect(wrapper.find(".text-danger").exists()).toBe(false);
      expect(wrapper.text()).toContain("Temperature");
      expect(wrapper.find("svg").exists()).toBe(true);
    });
  });

  describe("API", () => {
    it("should expose API for external control", () => {
      const wrapper = createWrapper();

      // Verify exposed methods exist
      expect(typeof wrapper.vm.loadHistory).toBe("function");
      expect(Array.isArray(wrapper.vm.points)).toBe(true);
    });
  });
});
