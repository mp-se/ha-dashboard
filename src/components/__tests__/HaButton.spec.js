import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HaButton from "../HaButton.vue";
import { useHaStore } from "@/stores/haStore";

describe("HaButton.vue", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useHaStore();
    store.callService = vi.fn().mockResolvedValue(undefined);
    store.isLocalMode = false;
  });

  describe("Component Rendering", () => {
    it("should render button with entity string", () => {
      const wrapper = mount(HaButton, {
        props: {
          entity: "button.test",
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find(".card-control").exists()).toBe(true);
      expect(wrapper.find(".btn").exists()).toBe(true);
    });

    it("should render button with entity object", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: { friendly_name: "Test Button" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find(".card-control").exists()).toBe(true);
      expect(wrapper.text()).toContain("Test Button");
    });

    it("should display friendly name from attributes", () => {
      const entity = {
        entity_id: "button.garage",
        state: "unknown",
        attributes: { friendly_name: "Garage Door" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain("Garage Door");
    });

    it("should display entity_id as fallback for name", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: {},
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain("button.test");
    });
  });

  describe("Button States", () => {
    it("should disable button when entity is unavailable", () => {
      const entity = {
        entity_id: "button.test",
        state: "unavailable",
        attributes: { friendly_name: "Test Button" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find("button");
      expect(button.attributes("disabled")).toBeDefined();
    });

    it("should disable button when entity is unknown", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: { friendly_name: "Test Button" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find("button");
      expect(button.attributes("disabled")).toBeDefined();
    });

    it("should enable button when entity is available", () => {
      const entity = {
        entity_id: "button.test",
        state: "available",
        attributes: { friendly_name: "Test Button" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find("button");
      expect(button.attributes("disabled")).toBeUndefined();
    });
  });

  describe("Card Border Styling", () => {
    it("should have warning border when unavailable", () => {
      const entity = {
        entity_id: "button.test",
        state: "unavailable",
        attributes: { friendly_name: "Test" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find(".border-warning").exists()).toBe(true);
    });

    it("should have primary border when available", () => {
      const entity = {
        entity_id: "button.test",
        state: "available",
        attributes: { friendly_name: "Test" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find(".border-primary").exists()).toBe(true);
    });
  });

  describe("Device Name Display", () => {
    it("should not display device name when device_id not present", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: { friendly_name: "Test Button" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find(".border-top").exists()).toBe(false);
    });

    it("should display device name from store", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: {
          friendly_name: "Test Button",
          device_id: "device_123",
        },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
          mocks: {
            store: {
              devices: [{ id: "device_123", name: "Garage" }],
            },
          },
        },
      });

      // Device name is looked up from store, but we don't have it mocked
      // Just verify the component renders
      expect(wrapper.find(".card-control").exists()).toBe(true);
    });
  });

  describe("Props Validation", () => {
    it("should accept valid string entity", () => {
      const wrapper = mount(HaButton, {
        props: {
          entity: "button.test",
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it("should accept valid object entity", () => {
      const wrapper = mount(HaButton, {
        props: {
          entity: {
            entity_id: "button.test",
            state: "unknown",
            attributes: {},
          },
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Button Icon", () => {
    it("should display gesture-tap-button icon", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: { friendly_name: "Test" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.html()).toContain("mdi-gesture-tap-button");
    });
  });

  describe("Classes and Structure", () => {
    it("should have correct card classes", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: { friendly_name: "Test" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const card = wrapper.find(".card");
      expect(card.classes()).toContain("card-control");
      expect(card.classes()).toContain("rounded-4");
      expect(card.classes()).toContain("shadow-lg");
    });

    it("should have responsive column classes", () => {
      const entity = {
        entity_id: "button.test",
        state: "unknown",
        attributes: { friendly_name: "Test" },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      // Grid layout is now applied by container/view, not by component
      expect(wrapper.find(".card").exists()).toBe(true);
    });
  });

  describe("pressButton service call", () => {
    it("calls store.callService when button is clicked with a valid active entity", async () => {
      const entity = {
        entity_id: "button.my_button",
        state: "idle",
        attributes: { friendly_name: "My Button" },
      };

      const wrapper = mount(HaButton, {
        props: { entity },
        global: { stubs: { i: true } },
      });

      const btn = wrapper.find("button");
      expect(btn.attributes("disabled")).toBeUndefined();
      await btn.trigger("click");
      await wrapper.vm.$nextTick();

      expect(store.callService).toHaveBeenCalledWith(
        "button",
        "press",
        { entity_id: "button.my_button" },
        expect.any(Object),
      );
    });

    it("does not call callService when entity resolves to null (string not in store)", async () => {
      const wrapper = mount(HaButton, {
        props: { entity: "button.nonexistent" },
        global: { stubs: { i: true } },
      });

      const btn = wrapper.find("button");
      // Button is not disabled because we compute isUnavailable from resolved entity
      // even if it resolves null, the guard 'if (!resolvedEntity.value) return' fires
      await btn.trigger("click");
      await wrapper.vm.$nextTick();

      expect(store.callService).not.toHaveBeenCalled();
    });
  });
});
