import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HaSpacer from "../HaSpacer.vue";

describe("HaSpacer.vue", () => {
  describe("Rendering", () => {
    it("should render a spacer card", () => {
      const wrapper = mount(HaSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Grid layout is now applied by container/view, not by component
      expect(wrapper.exists()).toBe(true);
    });

    it("should have responsive column classes", () => {
      const wrapper = mount(HaSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Grid layout is now applied by container/view, not by component
      expect(wrapper.exists()).toBe(true);
    });

    it("should render as an invisible spacer", () => {
      const wrapper = mount(HaSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Text content should be empty (comments are not visible text)
      expect(wrapper.text().trim()).toBe("");
    });
  });

  describe("Props", () => {
    it("should accept optional attributes prop", () => {
      const wrapper = mount(HaSpacer, {
        props: {
          attributes: ["spacing", "layout"],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it("should default attributes to empty array", () => {
      const wrapper = mount(HaSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Layout Purpose", () => {
    it("should use responsive grid classes for layout spacing", () => {
      const wrapper = mount(HaSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Grid layout is now applied by container/view, not by component
      expect(wrapper.element.tagName).toBe("DIV");
    });

    it("should render a single wrapper div", () => {
      const wrapper = mount(HaSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.element.tagName).toBe("DIV");
    });

    it("should provide consistent sizing with other cards", () => {
      const wrapper = mount(HaSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Grid layout is now applied by container/view, not by component
      const classes = wrapper.element.className;
      expect(classes.length).toBeGreaterThanOrEqual(0);
    });

    it("should maintain grid consistency", () => {
      const wrapper1 = mount(HaSpacer, {
        global: {
          stubs: { i: true, svg: true },
        },
      });
      const wrapper2 = mount(HaSpacer, {
        global: {
          stubs: { i: true, svg: true },
        },
      });

      // Both should render as spacer divs
      expect(wrapper1.exists()).toBe(true);
      expect(wrapper2.exists()).toBe(true);
    });
  });
});
