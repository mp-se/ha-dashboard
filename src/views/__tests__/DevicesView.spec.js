import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import DevicesView from "../DevicesView.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../stores/haStore";

describe("DevicesView.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders the view title", () => {
    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("Devices");
  });

  it("renders the search input", () => {
    const wrapper = mount(DevicesView);
    expect(wrapper.find('input[placeholder*="Filter devices"]').exists()).toBe(
      true,
    );
  });

  it("displays all devices initially", () => {
    const store = useHaStore();
    store.devices = [
      { id: "device1", name: "Device 1", entities: [] },
      { id: "device2", name: "Device 2", entities: [] },
      { id: "device3", name: "Device 3", entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const cards = wrapper.findAll(".card");
    expect(cards.length).toBe(3);
  });

  it("displays device name", () => {
    const store = useHaStore();
    store.devices = [{ id: "device1", name: "My Device", entities: [] }];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("My Device");
  });

  it("displays device ID", () => {
    const store = useHaStore();
    store.devices = [{ id: "device123", name: "My Device", entities: [] }];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("device123");
  });

  it('displays "Unnamed Device" when device has no name', () => {
    const store = useHaStore();
    store.devices = [{ id: "device1", name: null, entities: [] }];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("Unnamed Device");
  });

  it("displays entity count", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Device 1",
        entities: ["sensor.temp", "sensor.humidity"],
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("Entities: 2");
  });

  it("displays entity IDs when present", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Device 1",
        entities: ["sensor.temperature", "sensor.humidity"],
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("sensor.temperature");
    expect(wrapper.text()).toContain("sensor.humidity");
  });

  it("displays manufacturer information", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Device 1",
        entities: [],
        manufacturer: "Philips",
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("Philips");
  });

  it("displays model information", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Device 1",
        entities: [],
        model: "Hue Bridge",
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("Hue Bridge");
  });

  it("displays software version", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Device 1",
        entities: [],
        sw_version: "1.2.3",
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("1.2.3");
  });

  it("displays hardware version", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Device 1",
        entities: [],
        hw_version: "V2.1",
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain("V2.1");
  });

  it("filters devices by name", async () => {
    const store = useHaStore();
    store.devices = [
      { id: "device1", name: "Philips Hue Bridge", entities: [] },
      { id: "device2", name: "Sonos Speaker", entities: [] },
      { id: "device3", name: "Philips Lamp", entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue("Philips");

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll(".card");
    expect(cards.length).toBe(2);
  });

  it("performs case-insensitive device search", async () => {
    const store = useHaStore();
    store.devices = [
      { id: "device1", name: "Philips Hue", entities: [] },
      { id: "device2", name: "SONOS Speaker", entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue("philips");

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll(".card");
    expect(cards.length).toBe(1);
    expect(cards[0].text()).toContain("Philips Hue");
  });

  it("shows clear button when search text is present", async () => {
    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue("test");
    await wrapper.vm.$nextTick();

    const clearBtn = wrapper.find('button[aria-label="Clear device search"]');
    expect(clearBtn.exists()).toBe(true);
  });

  it("clears search text when clear button is clicked", async () => {
    const store = useHaStore();
    store.devices = [
      { id: "device1", name: "Device 1", entities: [] },
      { id: "device2", name: "Device 2", entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue("Device 1");
    await wrapper.vm.$nextTick();

    const clearBtn = wrapper.find('button[aria-label="Clear device search"]');
    await clearBtn.trigger("click");
    await wrapper.vm.$nextTick();

    expect(input.element.value).toBe("");
    const cards = wrapper.findAll(".card");
    expect(cards.length).toBe(2); // All devices shown again
  });

  it("returns empty list when no devices match search", async () => {
    const store = useHaStore();
    store.devices = [
      { id: "device1", name: "Device 1", entities: [] },
      { id: "device2", name: "Device 2", entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue("Nonexistent Device");

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll(".card");
    expect(cards.length).toBe(0);
  });

  it("handles devices without entities array", () => {
    const store = useHaStore();
    store.devices = [{ id: "device1", name: "Device 1" }];

    const wrapper = mount(DevicesView);
    const text = wrapper.text();

    // Should show 0 entities
    expect(text).toContain("Entities: 0");
  });

  it("hides entity list when no entities exist", () => {
    const store = useHaStore();
    store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

    const wrapper = mount(DevicesView);
    const lis = wrapper.findAll("ul.list-unstyled li");

    expect(lis.length).toBe(0);
  });

  it("displays all device information when present", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Complete Device",
        entities: ["sensor.temp", "sensor.humidity"],
        manufacturer: "Acme",
        model: "Model X",
        sw_version: "2.0.0",
        hw_version: "V3",
      },
    ];

    const wrapper = mount(DevicesView);
    const text = wrapper.text();

    expect(text).toContain("Complete Device");
    expect(text).toContain("sensor.temp");
    expect(text).toContain("sensor.humidity");
    expect(text).toContain("Acme");
    expect(text).toContain("Model X");
    expect(text).toContain("2.0.0");
    expect(text).toContain("V3");
  });

  it("handles empty devices list", () => {
    const store = useHaStore();
    store.devices = [];

    const wrapper = mount(DevicesView);
    const cards = wrapper.findAll(".card");
    expect(cards.length).toBe(0);
  });

  it("displays cards with proper styling", () => {
    const store = useHaStore();
    store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

    const wrapper = mount(DevicesView);
    const card = wrapper.find(".card");

    expect(card.classes()).toContain("h-100");
    expect(card.classes()).toContain("rounded-4");
  });

  it("updates device list when store devices change", async () => {
    const store = useHaStore();
    store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

    const wrapper = mount(DevicesView);
    let cards = wrapper.findAll(".card");
    expect(cards.length).toBe(1);

    // Update store
    store.devices = [
      { id: "device1", name: "Device 1", entities: [] },
      { id: "device2", name: "Device 2", entities: [] },
    ];

    await wrapper.vm.$nextTick();
    cards = wrapper.findAll(".card");
    expect(cards.length).toBe(2);
  });

  it("preserves entity order from device data", () => {
    const store = useHaStore();
    store.devices = [
      {
        id: "device1",
        name: "Device 1",
        entities: ["sensor.first", "sensor.second", "sensor.third"],
      },
    ];

    const wrapper = mount(DevicesView);
    const lis = wrapper.findAll("ul.list-unstyled li");

    expect(lis[0].text()).toContain("sensor.first");
    expect(lis[1].text()).toContain("sensor.second");
    expect(lis[2].text()).toContain("sensor.third");
  });

  describe("Area filtering", () => {
    it("renders area select dropdown", () => {
      const wrapper = mount(DevicesView);
      const select = wrapper.find(
        'select[aria-label="Filter devices by area"]',
      );
      expect(select.exists()).toBe(true);
    });

    it("displays all areas from store", () => {
      const store = useHaStore();
      store.areas = [
        { area_id: "area1", name: "Kitchen" },
        { area_id: "area2", name: "Bedroom" },
        { area_id: "area3", name: "Living Room" },
      ];
      store.devices = [];

      const wrapper = mount(DevicesView);
      const options = wrapper.findAll("select option");

      // Should have: All Areas, Kitchen, Bedroom, Living Room, Unassigned
      expect(options.length).toBe(5);
      expect(options[1].text()).toBe("Kitchen");
      expect(options[2].text()).toBe("Bedroom");
      expect(options[3].text()).toBe("Living Room");
      expect(options[4].text()).toBe("Unassigned");
    });

    it("filters devices by selected area", async () => {
      const store = useHaStore();
      store.areas = [
        { area_id: "kitchen", name: "Kitchen" },
        { area_id: "bedroom", name: "Bedroom" },
      ];
      store.devices = [
        { id: "device1", name: "Oven", area_id: "kitchen", entities: [] },
        { id: "device2", name: "Bed Lamp", area_id: "bedroom", entities: [] },
        {
          id: "device3",
          name: "Coffee Maker",
          area_id: "kitchen",
          entities: [],
        },
      ];

      const wrapper = mount(DevicesView);
      const select = wrapper.find("select");

      await select.setValue("kitchen");
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll(".card");
      expect(cards.length).toBe(2);
    });

    it('filters unassigned devices when "Unassigned" is selected', async () => {
      const store = useHaStore();
      store.areas = [{ area_id: "kitchen", name: "Kitchen" }];
      store.devices = [
        {
          id: "device1",
          name: "Device with area",
          area_id: "kitchen",
          entities: [],
        },
        { id: "device2", name: "Device without area", entities: [] },
        { id: "device3", name: "Another unassigned", entities: [] },
      ];

      const wrapper = mount(DevicesView);
      const select = wrapper.find("select");

      await select.setValue("unassigned");
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll(".card");
      expect(cards.length).toBe(2);
    });

    it('shows all devices when "All Areas" is selected', async () => {
      const store = useHaStore();
      store.areas = [{ area_id: "kitchen", name: "Kitchen" }];
      store.devices = [
        {
          id: "device1",
          name: "Device with area",
          area_id: "kitchen",
          entities: [],
        },
        { id: "device2", name: "Device without area", entities: [] },
      ];

      const wrapper = mount(DevicesView);
      const select = wrapper.find("select");

      await select.setValue("kitchen");
      await wrapper.vm.$nextTick();

      // Now select "All Areas"
      await select.setValue("");
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll(".card");
      expect(cards.length).toBe(2);
    });

    it("displays area name for device with area", () => {
      const store = useHaStore();
      store.areas = [{ area_id: "kitchen", name: "Kitchen" }];
      store.devices = [
        { id: "device1", name: "Oven", area_id: "kitchen", entities: [] },
      ];

      const wrapper = mount(DevicesView);
      expect(wrapper.text()).toContain("Area: Kitchen");
    });

    it('displays "Unassigned" for device without area', () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device", entities: [] }];

      const wrapper = mount(DevicesView);
      expect(wrapper.text()).toContain("Unassigned");
    });
  });

  describe("Copy to clipboard functionality", () => {
    it("renders copy button", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title*="Copy device JSON"]');
      expect(copyBtn.exists()).toBe(true);
    });

    it("copy button is clickable", async () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Test Device", entities: [] }];
      store.areas = [];
      store.sensors = [];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title*="Copy device JSON"]');

      // Should not throw when clicked
      await copyBtn.trigger("click");
      await wrapper.vm.$nextTick();

      expect(copyBtn.exists()).toBe(true);
    });

    it("displays copy button with correct icon", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title*="Copy device JSON"]');
      const icon = copyBtn.find("i.mdi");

      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain("mdi-content-copy");
    });

    it("copy button is positioned absolutely", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title*="Copy device JSON"]');

      expect(copyBtn.classes()).toContain("position-absolute");
      expect(copyBtn.classes()).toContain("top-0");
      expect(copyBtn.classes()).toContain("end-0");
    });

    it("copy button has outline secondary style", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title*="Copy device JSON"]');

      expect(copyBtn.classes()).toContain("btn-outline-secondary");
    });

    it("copy button has correct title text", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title*="Copy device JSON"]');

      expect(copyBtn.attributes("title")).toBe("Copy device JSON to clipboard");
    });
  });

  describe("Combined filtering (area + search)", () => {
    it("filters devices by both area and search text", async () => {
      const store = useHaStore();
      store.areas = [
        { area_id: "kitchen", name: "Kitchen" },
        { area_id: "bedroom", name: "Bedroom" },
      ];
      store.devices = [
        {
          id: "device1",
          name: "Philips Hue Light",
          area_id: "kitchen",
          entities: [],
        },
        {
          id: "device2",
          name: "Sonos Speaker",
          area_id: "kitchen",
          entities: [],
        },
        {
          id: "device3",
          name: "Philips Lamp",
          area_id: "bedroom",
          entities: [],
        },
      ];

      const wrapper = mount(DevicesView);
      const areaSelect = wrapper.find("select");
      const searchInput = wrapper.find('input[placeholder*="Filter devices"]');

      // Filter by kitchen area
      await areaSelect.setValue("kitchen");
      await wrapper.vm.$nextTick();

      let cards = wrapper.findAll(".card");
      expect(cards.length).toBe(2);

      // Then filter by "Philips" text
      await searchInput.setValue("Philips");
      await new Promise((resolve) => setTimeout(resolve, 350));
      await wrapper.vm.$nextTick();

      cards = wrapper.findAll(".card");
      expect(cards.length).toBe(1);
      expect(cards[0].text()).toContain("Philips Hue Light");
    });

    it("shows no devices when area and search filters do not match", async () => {
      const store = useHaStore();
      store.areas = [
        { area_id: "kitchen", name: "Kitchen" },
        { area_id: "bedroom", name: "Bedroom" },
      ];
      store.devices = [
        { id: "device1", name: "Hue Light", area_id: "bedroom", entities: [] },
      ];

      const wrapper = mount(DevicesView);
      const areaSelect = wrapper.find("select");
      const searchInput = wrapper.find('input[placeholder*="Filter devices"]');

      await areaSelect.setValue("kitchen");
      await searchInput.setValue("Hue");
      await new Promise((resolve) => setTimeout(resolve, 350));
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll(".card");
      expect(cards.length).toBe(0);
      expect(wrapper.text()).toContain(
        "No devices found matching your filters",
      );
    });
  });

  describe("Edge cases", () => {
    it("handles store with undefined devices array", () => {
      const store = useHaStore();
      store.devices = undefined;

      const wrapper = mount(DevicesView);
      const cards = wrapper.findAll(".card");
      expect(cards.length).toBe(0);
    });

    it("handles store with undefined areas array", () => {
      const store = useHaStore();
      store.areas = undefined;
      store.devices = [];

      const wrapper = mount(DevicesView);
      const select = wrapper.find("select");
      const options = wrapper.findAll("select option");

      expect(select.exists()).toBe(true);
      // Should still have "All Areas" and "Unassigned"
      expect(options.length).toBeGreaterThanOrEqual(2);
    });

    it("handles device with null name property", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: null, entities: [] }];

      const wrapper = mount(DevicesView);
      expect(wrapper.text()).toContain("Unnamed Device");
    });

    it("handles device with empty string name", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "", entities: [] }];

      const wrapper = mount(DevicesView);
      expect(wrapper.text()).toContain("Unnamed Device");
    });

    it("displays no message when devices exist", () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

      const wrapper = mount(DevicesView);

      // Should not have the "No devices found" message since there are devices
      expect(wrapper.text()).not.toContain(
        "No devices found matching your filters",
      );
    });

    it("displays proper message when no devices match filters", () => {
      const store = useHaStore();
      store.devices = [];

      const wrapper = mount(DevicesView);
      expect(wrapper.text()).toContain(
        "No devices found matching your filters",
      );
    });

    it("handles search input with whitespace", async () => {
      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Device 1", entities: [] }];

      const wrapper = mount(DevicesView);
      const input = wrapper.find('input[placeholder*="Filter devices"]');

      await input.setValue("   ");
      await new Promise((resolve) => setTimeout(resolve, 350));
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll(".card");
      // Whitespace-only search should not filter anything
      expect(cards.length).toBe(1);
    });
  });

  describe("Clipboard Functionality", () => {
    it("copies device JSON to clipboard when copy button is clicked", async () => {
      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      
      const originalNavigator = global.navigator;
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const store = useHaStore();
      store.devices = [
        {
          id: "device1",
          name: "Test Device",
          entities: ["sensor.test"],
          area_id: "living_room",
        },
      ];
      store.areas = [{ area_id: "living_room", name: "Living Room" }];
      store.sensors = [
        { entity_id: "sensor.test", state: "on", attributes: {} },
      ];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title="Copy device JSON to clipboard"]');
      expect(copyBtn.exists()).toBe(true);

      await copyBtn.trigger("click");

      expect(writeTextMock).toHaveBeenCalled();
      const copiedJson = JSON.parse(writeTextMock.mock.calls[0][0]);
      expect(copiedJson.id).toBe("device1");
      expect(copiedJson.areaName).toBe("Living Room");
      expect(copiedJson.entities[0].entity_id).toBe("sensor.test");
      
      vi.stubGlobal("navigator", originalNavigator);
    });

    it("handles copy failure gracefully", async () => {
      // Mock clipboard API to fail
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      const originalNavigator = global.navigator;
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error("Clipboard error")),
        },
      });

      const store = useHaStore();
      store.devices = [{ id: "device1", name: "Test Device", entities: [] }];

      const wrapper = mount(DevicesView);
      const copyBtn = wrapper.find('button[title="Copy device JSON to clipboard"]');
      
      await copyBtn.trigger("click");

      expect(consoleSpy).toHaveBeenCalledWith("Failed to copy device to clipboard:", expect.any(Error));
      consoleSpy.mockRestore();
      vi.stubGlobal("navigator", originalNavigator);
    });
  });
});
