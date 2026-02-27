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
        stubs: { svg: true },
        ...options.global,
      },
      ...options,
    });
  };

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

  it("should render SVG graph", async () => {
    const wrapper = createWrapper({}, { global: { plugins: [pinia] } });

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

  it("should accept maxPoints prop", () => {
    const wrapper = createWrapper({ maxPoints: 100 });

    expect(wrapper.props("maxPoints")).toBe(100);
  });

  it("should accept hours prop", () => {
    const wrapper = createWrapper({ hours: 48 });

    expect(wrapper.props("hours")).toBe(48);
  });

  it("should handle multiple entities (array)", async () => {
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

    const wrapper = createWrapper({
      entity: ["sensor.temperature", "sensor.humidity"],
    });
    await flushPromises();

    // Check that both entity labels appear in the legend
    expect(wrapper.text()).toContain("Temperature");
    expect(wrapper.text()).toContain("Humidity");
  });

  it("should display legend for dual graphs", async () => {
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

  it("should reload history when entity changes", async () => {
    const wrapper = createWrapper();
    await flushPromises();

    const callCount = store.fetchHistory.mock.calls.length;

    store.entities[0].entity_id = "sensor.new_temperature";
    await wrapper.setProps({ entity: "sensor.new_temperature" });
    await flushPromises();

    expect(store.fetchHistory.mock.calls.length).toBeGreaterThan(callCount);
  });

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

  it("should handle three entities (triple graph)", async () => {
    store.entities.push(
      {
        entity_id: "sensor.humidity",
        state: "65",
        attributes: {
          friendly_name: "Humidity",
          unit_of_measurement: "%",
        },
      },
      {
        entity_id: "sensor.pressure",
        state: "1013",
        attributes: {
          friendly_name: "Pressure",
          unit_of_measurement: "hPa",
        },
      },
    );

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

  it("should expose API for external control", () => {
    const wrapper = createWrapper();

    // Verify exposed methods exist
    expect(typeof wrapper.vm.loadHistory).toBe("function");
    expect(Array.isArray(wrapper.vm.points)).toBe(true);
  });

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

  it("should throw error when no valid entities provided", async () => {
    // Entity string not in store -> resolvedEntities becomes [null]
    store.entities = [];
    const wrapper = createWrapper({ entity: "sensor.nonexistent" });
    await flushPromises();

    expect(wrapper.find(".text-danger").exists()).toBe(true);
    expect(wrapper.text()).toContain("No valid entities");
  });

  it("should format integer values without decimal places", async () => {
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

  it("should format decimal values with 2 decimal places", async () => {
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

  it("should display empty string title for multi-entity graphs", async () => {
    store.entities.push({
      entity_id: "sensor.humidity",
      state: "65",
      attributes: { friendly_name: "Humidity", unit_of_measurement: "%" },
    });
    store.fetchHistory = vi.fn().mockResolvedValue([
      { t: Date.now() - 3600000, v: 60 },
      { t: Date.now(), v: 65 },
    ]);
    const wrapper = createWrapper({
      entity: ["sensor.temperature", "sensor.humidity"],
    });
    await flushPromises();

    // title is empty for multi-entity, only legend is used
    const title = wrapper.find(".card-title span");
    expect(title.text()).toBe("");
  });

  it("should get entity label for string entity from store", async () => {
    const wrapper = createWrapper();
    await flushPromises();

    // Verify the entity label appears in the card
    expect(wrapper.text()).toContain("Temperature");
  });

  it("should return 'Unknown' for entity label when no friendly name or entity_id", () => {
    const wrapper = createWrapper();
    // Test getEntityLabel fallback to "Unknown"
    const result = wrapper.vm.getEntityLabel({
      attributes: {},
    });
    expect(result).toBe("Unknown");
  });

  it("should return entity_id when no friendly name available", () => {
    const wrapper = createWrapper();
    const result = wrapper.vm.getEntityLabel({
      entity_id: "sensor.test",
      attributes: {},
    });
    expect(result).toBe("sensor.test");
  });

  it("should handle getSmoothPath with exactly 2 points", () => {
    const wrapper = createWrapper();
    const twoPoints = "10,20 30,40";
    const path = wrapper.vm.getSmoothPath(twoPoints);
    expect(path).toContain("M 10,20");
    expect(path).toContain("L 30,40");
  });

  it("should handle getSmoothPath with empty string", () => {
    const wrapper = createWrapper();
    const path = wrapper.vm.getSmoothPath("");
    expect(path).toBe("");
  });

  it("should handle getSmoothPath with single point", () => {
    const wrapper = createWrapper();
    const singlePoint = "10,20";
    const path = wrapper.vm.getSmoothPath(singlePoint);
    expect(path).toBe("");
  });

  it("should generate smooth path with Bezier curves for 3+ points", () => {
    const wrapper = createWrapper();
    const multiPoints = "10,20 30,40 50,30";
    const path = wrapper.vm.getSmoothPath(multiPoints);
    expect(path).toContain("M 10,20");
    expect(path).toContain("Q");
  });

  it("should handle getAreaPath with empty string", () => {
    const wrapper = createWrapper();
    const path = wrapper.vm.getAreaPath("");
    expect(path).toBe("");
  });

  it("should handle getAreaPath with single point", () => {
    const wrapper = createWrapper();
    const singlePoint = "10,20";
    const path = wrapper.vm.getAreaPath(singlePoint);
    expect(path).toBe("");
  });

  it("should generate area path for multiple points", () => {
    const wrapper = createWrapper();
    const multiPoints = "10,20 30,40 50,30";
    const path = wrapper.vm.getAreaPath(multiPoints);
    expect(path).toContain("M 10,20");
    expect(path).toContain("L 50,40");
    expect(path).toContain("Z");
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

  it("should calculate polyline points for empty data array", () => {
    const wrapper = createWrapper();
    const result = wrapper.vm.calculatePolylinePoints([]);
    expect(result).toBe("");
  });

  it("should return entity ID as label when string entity not in store", () => {
    const wrapper = createWrapper();
    // Test with non-existent entity ID
    const result = wrapper.vm.getEntityLabel("sensor.nonexistent");
    expect(result).toBe("sensor.nonexistent");
  });

  it("should format null values as empty string", () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.formatValue(null)).toBe("");
  });

  it("should format undefined values as empty string", () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.formatValue(undefined)).toBe("");
  });
});
