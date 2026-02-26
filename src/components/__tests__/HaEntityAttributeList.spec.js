import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HaEntityAttributeList from "../HaEntityAttributeList.vue";

describe("HaEntityAttributeList.vue", () => {
  describe("Rendering", () => {
    it("renders nothing when attributes array is empty", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: { attributes: [] },
      });
      expect(wrapper.find(".ha-attribute-list-container").exists()).toBe(false);
    });

    it("renders container when attributes are provided", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [["Temperature", "22°C"]],
        },
      });
      expect(wrapper.find(".ha-attribute-list-container").exists()).toBe(true);
    });

    it("renders one row per attribute pair", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [
            ["Temperature", "22°C"],
            ["Humidity", "65%"],
            ["Pressure", "1013 hPa"],
          ],
        },
      });
      const rows = wrapper.findAll(".small.d-flex");
      expect(rows).toHaveLength(3);
    });

    it("displays label text for each attribute", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [
            ["Temperature", "22.5°C"],
            ["Humidity", "60%"],
          ],
        },
      });
      expect(wrapper.text()).toContain("Temperature:");
      expect(wrapper.text()).toContain("Humidity:");
    });

    it("displays value text for each attribute", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [
            ["Battery", "85%"],
            ["Signal", "strong"],
          ],
        },
      });
      expect(wrapper.text()).toContain("85%");
      expect(wrapper.text()).toContain("strong");
    });

    it("uses label as key to uniquely identify rows", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [
            ["A Label", "val1"],
            ["B Label", "val2"],
          ],
        },
      });
      const keys = wrapper.findAll(".ha-attribute-key");
      expect(keys).toHaveLength(2);
    });
  });

  describe("Styling", () => {
    it("applies ha-attribute-key class to label element", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [["State", "on"]],
        },
      });
      expect(wrapper.find(".ha-attribute-key").exists()).toBe(true);
    });

    it("applies ha-attribute-value class to value element", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [["State", "on"]],
        },
      });
      expect(wrapper.find(".ha-attribute-value").exists()).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("renders a single attribute correctly", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [["Power", "1200W"]],
        },
      });
      expect(wrapper.text()).toContain("Power:");
      expect(wrapper.text()).toContain("1200W");
    });

    it("handles numeric values as strings", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [["Count", "42"]],
        },
      });
      expect(wrapper.text()).toContain("42");
    });

    it("handles hyphen values (unavailable)", () => {
      const wrapper = mount(HaEntityAttributeList, {
        props: {
          attributes: [["Last Updated", "-"]],
        },
      });
      expect(wrapper.text()).toContain("-");
    });
  });
});
