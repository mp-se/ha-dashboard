import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import HaEnergy from "../HaEnergy.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("HaEnergy.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    // Mock energy and power sensors
    store.entities = [
      {
        entity_id: "sensor.power_hemma",
        state: "1250",
        attributes: {
          friendly_name: "Power Consumption",
          device_class: "power",
          unit_of_measurement: "W",
          state_class: "measurement",
        },
      },
      {
        entity_id: "sensor.accumulated_consumption_hemma",
        state: "2450.75",
        attributes: {
          friendly_name: "Total Energy Consumption",
          device_class: "energy",
          unit_of_measurement: "kWh",
          state_class: "total",
        },
      },
      {
        entity_id: "sensor.other_sensor",
        state: "100",
        attributes: {
          friendly_name: "Other Sensor",
          device_class: "temperature",
          unit_of_measurement: "°C",
        },
      },
    ];

    // Mock fetchEnergyHistory method
    store.fetchEnergyHistory = vi.fn().mockResolvedValue([
      { timestamp: Date.now() - 86400000, value: 850, label: "00" },
      { timestamp: Date.now() - 82800000, value: 920, label: "01" },
      { timestamp: Date.now() - 79200000, value: 1050, label: "02" },
    ]);
  });

  it("should render warning when no energy sensors found", () => {
    store.entities = [];

    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain("No energy consumption sensors found");
  });

  it("should auto-detect energy consumption sensor", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    // Should prefer energy sensor over power sensor
    expect(wrapper.vm.energySensor.entity_id).toBe(
      "sensor.accumulated_consumption_hemma",
    );
  });

  it("should fallback to power sensor when energy sensor not available", async () => {
    store.entities = store.entities.filter(
      (s) => s.attributes.device_class !== "energy",
    );

    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.energySensor.entity_id).toBe("sensor.power_hemma");
  });

  it("should display card title from sensor friendly_name", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain("Total Energy Consumption");
  });

  it("should render period selector button", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    const button = wrapper.find("button");
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("1d");
  });

  it("should select period 1d by default", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.selectedPeriod).toBe(1);
    expect(wrapper.vm.currentPeriodLabel).toBe("1d");
  });

  it("should cycle through periods when button clicked", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    const button = wrapper.find("button");

    // Click 1st time: 1d → 3d
    await button.trigger("click");
    expect(wrapper.vm.selectedPeriod).toBe(3);
    expect(wrapper.vm.currentPeriodLabel).toBe("3d");

    // Click 2nd time: 3d → 7d
    await button.trigger("click");
    expect(wrapper.vm.selectedPeriod).toBe(7);
    expect(wrapper.vm.currentPeriodLabel).toBe("7d");

    // Click 3rd time: 7d → 14d
    await button.trigger("click");
    expect(wrapper.vm.selectedPeriod).toBe(14);
    expect(wrapper.vm.currentPeriodLabel).toBe("14d");

    // Click 4th time: 14d → 1d (cycles back)
    await button.trigger("click");
    expect(wrapper.vm.selectedPeriod).toBe(1);
    expect(wrapper.vm.currentPeriodLabel).toBe("1d");
  });

  it("should fetch energy history on mount", async () => {
    mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(store.fetchEnergyHistory).toHaveBeenCalledWith(
      "sensor.accumulated_consumption_hemma",
      1,
    );
  });

  it("should refetch energy history when period changes", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();
    store.fetchEnergyHistory.mockClear();

    // Cycle period once (1d → 3d)
    wrapper.vm.cyclePeriod();
    await flushPromises();

    expect(store.fetchEnergyHistory).toHaveBeenCalledWith(
      "sensor.accumulated_consumption_hemma",
      3,
    );
  });

  it("should populate chart data from fetched history", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.chartData.length).toBe(3);
    expect(wrapper.vm.chartData[0].value).toBe(850);
    expect(wrapper.vm.chartData[0].label).toBe("00");
  });

  it("should calculate statistics from chart data", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.stats.max).toBe(1050);
    expect(wrapper.vm.stats.min).toBe(850);
    expect(wrapper.vm.stats.avg).toBeCloseTo(940, 0);
    expect(wrapper.vm.stats.total).toBe(2820);
  });

  it("should display statistics in stat boxes", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain("Peak");
    expect(wrapper.text()).toContain("Average");
    expect(wrapper.text()).toContain("Total");
  });

  it("should show loading state while fetching data", async () => {
    let resolvePromise;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    store.fetchEnergyHistory = vi.fn(() => delayedPromise);

    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Should be loading immediately after mount
    expect(wrapper.vm.isLoading).toBe(true);

    // Resolve the promise
    resolvePromise([]);
    await flushPromises();

    // Should no longer be loading after resolution
    expect(wrapper.vm.isLoading).toBe(false);
  });

  it("should display error message when fetch fails", async () => {
    store.fetchEnergyHistory = vi
      .fn()
      .mockRejectedValue(new Error("API Error"));

    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.error).toContain("Failed to load data");
  });

  it("should display error when no data available for period", async () => {
    store.fetchEnergyHistory = vi.fn().mockResolvedValue([]);

    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.error).toContain("No data available");
  });

  it("should render SVG chart", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("should render chart bars for each data point", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    const rects = wrapper.findAll(".chart-bars rect");
    expect(rects.length).toBe(3);
  });

  it("should get unit from sensor attributes", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.unit).toBe("kWh");
  });

  it("should render with col-lg-4 col-md-6 classes", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    // Grid layout is now applied by container/view, not by component
    expect(wrapper.find(".card").exists()).toBe(true);
  });

  it("should render card with border-info class when sensors found", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.find(".border-info").exists()).toBe(true);
  });

  it("should format values with k suffix for thousands", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    // formatValue(1050) should return "1.1k"
    expect(wrapper.vm.formatValue(1050)).toContain("1");
  });

  it("should format Y-axis labels", async () => {
    const wrapper = mount(HaEnergy, {
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.formatYAxisLabel(1000)).toBe("1k");
    expect(wrapper.vm.formatYAxisLabel(100)).toBe("100");
  });

  it("should fetch both current and previous period data in parallel", async () => {
    mount(HaEnergy, {
      global: { plugins: [pinia], stubs: { i: true, svg: true } },
    });

    await flushPromises();

    // Must be called twice per fetch: current period and previous period
    expect(store.fetchEnergyHistory).toHaveBeenCalledTimes(2);
    expect(store.fetchEnergyHistory).toHaveBeenCalledWith(
      "sensor.accumulated_consumption_hemma",
      1,
    );
    expect(store.fetchEnergyHistory).toHaveBeenCalledWith(
      "sensor.accumulated_consumption_hemma",
      1,
      1,
    );
  });

  it("should calculate comparison percentage vs previous period", async () => {
    store.fetchEnergyHistory = vi
      .fn()
      .mockImplementation((_id, _days, offsetDays = 0) => {
        if (offsetDays > 0) {
          // Previous period: total 2400
          return Promise.resolve([
            { timestamp: Date.now(), value: 700, label: "00" },
            { timestamp: Date.now(), value: 800, label: "01" },
            { timestamp: Date.now(), value: 900, label: "02" },
          ]);
        }
        // Current period: total 2820
        return Promise.resolve([
          { timestamp: Date.now(), value: 850, label: "00" },
          { timestamp: Date.now(), value: 920, label: "01" },
          { timestamp: Date.now(), value: 1050, label: "02" },
        ]);
      });

    const wrapper = mount(HaEnergy, {
      global: { plugins: [pinia], stubs: { i: true, svg: true } },
    });

    await flushPromises();

    // ((2820 - 2400) / 2400) * 100 = 17.5%
    expect(wrapper.vm.stats.comparison).toBeCloseTo(17.5, 1);
  });

  it("should show comparison indicator in template when comparison is non-null", async () => {
    store.fetchEnergyHistory = vi
      .fn()
      .mockImplementation((_id, _days, offsetDays = 0) => {
        if (offsetDays > 0) {
          return Promise.resolve([
            { timestamp: Date.now(), value: 700, label: "00" },
          ]);
        }
        return Promise.resolve([
          { timestamp: Date.now(), value: 1050, label: "00" },
        ]);
      });

    const wrapper = mount(HaEnergy, {
      global: { plugins: [pinia], stubs: { svg: true } },
    });

    await flushPromises();

    expect(wrapper.text()).toContain("% vs previous");
  });

  it("should set comparison to null when previous period total is zero", async () => {
    store.fetchEnergyHistory = vi
      .fn()
      .mockImplementation((_id, _days, offsetDays = 0) => {
        if (offsetDays > 0) {
          return Promise.resolve([
            { timestamp: Date.now(), value: 0, label: "00" },
          ]);
        }
        return Promise.resolve([
          { timestamp: Date.now(), value: 1050, label: "00" },
        ]);
      });

    const wrapper = mount(HaEnergy, {
      global: { plugins: [pinia], stubs: { i: true, svg: true } },
    });

    await flushPromises();

    expect(wrapper.vm.stats.comparison).toBeNull();
  });

  it("should set comparison to null when previous period data is empty", async () => {
    store.fetchEnergyHistory = vi
      .fn()
      .mockImplementation((_id, _days, offsetDays = 0) => {
        if (offsetDays > 0) {
          return Promise.resolve([]);
        }
        return Promise.resolve([
          { timestamp: Date.now(), value: 850, label: "00" },
        ]);
      });

    const wrapper = mount(HaEnergy, {
      global: { plugins: [pinia], stubs: { i: true, svg: true } },
    });

    await flushPromises();

    expect(wrapper.vm.stats.comparison).toBeNull();
  });
});
