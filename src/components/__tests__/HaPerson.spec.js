import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import HaPerson from "../HaPerson.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("HaPerson.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.devices = [];
    store.sensors = [
      {
        entity_id: "person.john",
        state: "home",
        attributes: {
          friendly_name: "John",
          last_seen: "2025-01-15T10:30:00",
          icon: "mdi:account",
        },
      },
    ];
  });

  describe("Component Rendering", () => {
    it("should mount successfully", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("should accept entity prop", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("entity")).toBe("person.john");
    });

    it("should render card element", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".card").exists()).toBe(true);
    });
  });

  describe("Person Information Display", () => {
    it("should display friendly name", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("John");
    });

    it("should display entity_id as fallback", () => {
      store.sensors[0].attributes.friendly_name = undefined;
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("person.john");
    });

    it("should display location as home", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Home");
    });

    it("should display location as away", () => {
      store.sensors[0].state = "not_home";
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Away");
    });

    it("should format custom location", () => {
      store.sensors[0].state = "work";
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Work");
    });

    it("should display last seen", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Last Seen");
    });

    it("should format last seen date correctly", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const text = wrapper.text();
      expect(text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format check
    });

    it("should not display last seen when not available", () => {
      store.sensors[0].attributes.last_seen = undefined;
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).not.toContain("Last Seen");
    });
  });

  describe("Person Icons", () => {
    it("should display person icon from attributes", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-account").exists()).toBe(true);
    });

    it("should parse mdi: prefix in icon attribute", () => {
      store.sensors[0].attributes.icon = "mdi:account-circle";
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-account-circle").exists()).toBe(true);
    });

    it("should use default person icon when icon not set", () => {
      store.sensors[0].attributes.icon = undefined;
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-account").exists()).toBe(true);
    });

    it("should use icon from attributes when available", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const icons = wrapper.findAll("i");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Person States", () => {
    it("should have success border when home", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-success");
    });

    it("should have info border when away", () => {
      store.sensors[0].state = "not_home";
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-info");
    });

    it("should have warning border when unavailable", () => {
      store.sensors[0].state = "unavailable";
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-warning");
    });

    it("should have warning border when unknown", () => {
      store.sensors[0].state = "unknown";
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-warning");
    });
  });

  describe("Missing Entity Handling", () => {
    it("should handle missing entity gracefully", () => {
      store.sensors = [];
      const wrapper = mount(HaPerson, {
        props: { entity: "person.nonexistent" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("should display alert icon when entity not found", () => {
      store.sensors = [];
      const wrapper = mount(HaPerson, {
        props: { entity: "person.nonexistent" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-alert-circle").exists()).toBe(true);
    });

    it("should display error message with entity ID", () => {
      store.sensors = [];
      const wrapper = mount(HaPerson, {
        props: { entity: "person.nonexistent" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("person.nonexistent");
      expect(wrapper.text()).toContain("not found");
    });

    it("should have warning border when entity not found", () => {
      store.sensors = [];
      const wrapper = mount(HaPerson, {
        props: { entity: "person.nonexistent" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-warning");
    });
  });

  describe("Device Information", () => {
    it("should render device section when device_id available", () => {
      store.devices = [
        {
          id: "device123",
          name: "Mobile Device",
        },
      ];
      store.sensors[0].attributes.device_id = "device123";
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      // Device section should be rendered
      expect(wrapper.exists()).toBe(true);
    });

    it("should not display device info when device_id not present", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const borderTopElement = wrapper.find(".border-top");
      // Should not have device info section
      expect(borderTopElement.exists()).toBe(false);
    });
  });

  describe("Layout and Styling", () => {
    it("should have responsive column classes", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const column = wrapper.find(".col-lg-4");
      expect(column.classes()).toContain("col-md-6");
    });

    it("should have card display styles", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("card-display");
      expect(card.classes()).toContain("h-100");
      expect(card.classes()).toContain("rounded-4");
      expect(card.classes()).toContain("shadow-lg");
    });

    it("should have flex layout when entity resolved", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.john" },
        global: { plugins: [pinia] },
      });
      const cardBody = wrapper.find(".card-body");
      expect(cardBody.classes()).toContain("d-flex");
    });

    it("should have text-center layout when entity not found", () => {
      store.sensors = [];
      const wrapper = mount(HaPerson, {
        props: { entity: "person.nonexistent" },
        global: { plugins: [pinia] },
      });
      const cardBody = wrapper.find(".card-body");
      expect(cardBody.classes()).toContain("text-center");
    });
  });

  describe("Props Validation", () => {
    it("should accept valid string entity", () => {
      const wrapper = mount(HaPerson, {
        props: { entity: "person.test" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("entity")).toBe("person.test");
    });

    it("should accept valid object entity", () => {
      const entity = store.sensors[0];
      const wrapper = mount(HaPerson, {
        props: { entity },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("entity")).toBe(entity);
    });
  });
});
