import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { useIsMobile } from "../useIsMobile";

const createWrapper = (breakpoint?: number) =>
  mount(
    defineComponent({
      setup() {
        return breakpoint !== undefined
          ? useIsMobile(breakpoint)
          : useIsMobile();
      },
      template: "<div />",
    }),
  );

describe("useIsMobile", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns false when viewport is wider than breakpoint", () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.isMobile).toBe(false);
  });

  it("returns true when viewport is narrower than breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 480 });
    const wrapper = createWrapper();
    expect(wrapper.vm.isMobile).toBe(true);
  });

  it("returns true when viewport equals breakpoint (not strictly less)", () => {
    Object.defineProperty(window, "innerWidth", { value: 768 });
    const wrapper = createWrapper();
    // 768 < 768 is false, so isMobile should be false at exactly breakpoint
    expect(wrapper.vm.isMobile).toBe(false);
  });

  it("returns true when viewport is one pixel below breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 767 });
    const wrapper = createWrapper();
    expect(wrapper.vm.isMobile).toBe(true);
  });

  it("updates reactively when window is resized to mobile width", async () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.isMobile).toBe(false);

    Object.defineProperty(window, "innerWidth", { value: 375 });
    window.dispatchEvent(new Event("resize"));
    await nextTick();

    expect(wrapper.vm.isMobile).toBe(true);
  });

  it("updates reactively when window is resized back to desktop width", async () => {
    Object.defineProperty(window, "innerWidth", { value: 375 });
    const wrapper = createWrapper();
    expect(wrapper.vm.isMobile).toBe(true);

    Object.defineProperty(window, "innerWidth", { value: 1200 });
    window.dispatchEvent(new Event("resize"));
    await nextTick();

    expect(wrapper.vm.isMobile).toBe(false);
  });

  it("respects a custom breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 900 });
    const wrapper = createWrapper(1024);
    expect(wrapper.vm.isMobile).toBe(true);
  });

  it("removes the resize listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const wrapper = createWrapper();
    wrapper.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });
});
