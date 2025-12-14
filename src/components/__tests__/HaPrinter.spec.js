import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import HaPrinter from "../HaPrinter.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("HaPrinter.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.devices = [];
    store.sensors = [
      {
        entity_id: "sensor.printer_toner",
        state: "ready",
        attributes: {
          friendly_name: "Printer Toner",
          unit_of_measurement: "%",
          black: 75,
          cyan: 60,
          magenta: 50,
          yellow: 90,
        },
      },
      {
        entity_id: "black",
        state: "75",
        attributes: { friendly_name: "Black Toner" },
      },
      {
        entity_id: "cyan",
        state: "60",
        attributes: { friendly_name: "Cyan Toner" },
      },
      {
        entity_id: "magenta",
        state: "50",
        attributes: { friendly_name: "Magenta Toner" },
      },
      {
        entity_id: "yellow",
        state: "90",
        attributes: { friendly_name: "Yellow Toner" },
      },
    ];
  });

  describe("Component Rendering", () => {
    it("should mount successfully", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("should accept entity prop", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("entity")).toBe("sensor.printer_toner");
    });

    it("should render card element", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".card").exists()).toBe(true);
    });

    it("should render card display class", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("card-display");
    });

    it("should update when entity changes", async () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });

      store.sensors.push({
        entity_id: "sensor.printer_toner_black",
        state: "50",
        attributes: {
          friendly_name: "Printer Black Toner",
          black: 50,
          cyan: 40,
          magenta: 30,
          yellow: 70,
        },
      });

      await wrapper.setProps({ entity: "sensor.printer_toner_black" });
      expect(wrapper.props("entity")).toBe("sensor.printer_toner_black");
    });
  });

  describe("Printer Information Display", () => {
    it("should display friendly name", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Printer Toner");
    });

    it("should display entity_id as fallback", () => {
      store.sensors[0].attributes.friendly_name = undefined;
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("sensor.printer_toner");
    });

    it("should display current state value", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("ready");
    });

    it("should display Toner label", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Toner");
    });
  });

  describe("Toner Level Display", () => {
    it("should render progress bars for all toner colors", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const progressBars = wrapper.findAll(".ha-progress-bar");
      expect(progressBars.length).toBeGreaterThanOrEqual(4);
    });

    it("should have all four progress bars", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const progressElements = wrapper.findAll(".progress");
      expect(progressElements.length).toBe(4);
    });

    it("should use correct color for black toner", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const bars = wrapper.findAll(".ha-progress-bar");
      expect(bars[0].classes()).toContain("bg-dark");
    });

    it("should use correct color for cyan toner", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const bars = wrapper.findAll(".ha-progress-bar");
      expect(bars[1].classes()).toContain("bg-info");
    });

    it("should use correct color for magenta toner", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const bars = wrapper.findAll(".ha-progress-bar");
      expect(bars[2].attributes("style")).toContain("#e700d9");
    });

    it("should use correct color for yellow toner", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const bars = wrapper.findAll(".ha-progress-bar");
      expect(bars[3].classes()).toContain("bg-warning");
    });
  });

  describe("Missing Entity Handling", () => {
    it("should handle missing entity gracefully", () => {
      store.sensors = [];
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_nonexistent",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("should display alert icon when entity not found", () => {
      store.sensors = [];
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_nonexistent",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-alert-circle").exists()).toBe(true);
    });

    it("should display error message when entity not found", () => {
      store.sensors = [];
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_nonexistent",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("not found");
    });

    it("should have warning border when entity not found", () => {
      store.sensors = [];
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_nonexistent",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-warning");
    });
  });

  describe("Device Information", () => {
    it("should handle device information when available", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      // Just verify it doesn't crash
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Card Styling", () => {
    it("should have responsive column classes", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const column = wrapper.find(".col-lg-4");
      expect(column.classes()).toContain("col-md-6");
    });

    it("should have correct card classes", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("h-100");
      expect(card.classes()).toContain("rounded-4");
      expect(card.classes()).toContain("shadow-lg");
    });

    it("should have info border when entity available", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-info");
    });
  });

  describe("Props Validation", () => {
    it("should accept valid string entity", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("entity")).toBe("sensor.printer_toner");
    });

    it("should accept valid object entity", () => {
      const entity = store.sensors[0];
      const wrapper = mount(HaPrinter, {
        props: {
          entity,
          black: "black",
          cyan: "cyan",
          magenta: "magenta",
          yellow: "yellow",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("entity")).toBe(entity);
    });

    it("should accept color attribute props", () => {
      const wrapper = mount(HaPrinter, {
        props: {
          entity: "sensor.printer_toner",
          black: "black_attr",
          cyan: "cyan_attr",
          magenta: "magenta_attr",
          yellow: "yellow_attr",
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("black")).toBe("black_attr");
      expect(wrapper.props("cyan")).toBe("cyan_attr");
      expect(wrapper.props("magenta")).toBe("magenta_attr");
      expect(wrapper.props("yellow")).toBe("yellow_attr");
    });
  });
});
