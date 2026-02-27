import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ErrorBoundary from "../ErrorBoundary.vue";
import { useHaStore } from "@/stores/haStore";
import { defineComponent, h } from "vue";

// Test helper components - not actual production components
/* eslint-disable vue/one-component-per-file */

// Create a component that throws an error
const ThrowErrorComponent = defineComponent({
  name: "ThrowErrorComponent",
  setup() {
    throw new Error("Test error");
  },
  render() {
    return h("div", "This should not render");
  },
});

// Create a working component
const WorkingComponent = defineComponent({
  name: "WorkingComponent",
  render() {
    return h("div", { class: "test-content" }, "Working content");
  },
});

/* eslint-enable vue/one-component-per-file */

describe("ErrorBoundary", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders slot content when no error occurs", () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(WorkingComponent),
      },
    });

    expect(wrapper.find(".test-content").exists()).toBe(true);
    expect(wrapper.text()).toContain("Working content");
    expect(wrapper.find(".error-boundary-container").exists()).toBe(false);
  });

  it("catches and displays errors from child components", async () => {
    // Suppress console errors during test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "test-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find(".error-boundary-container").exists()).toBe(true);
    expect(wrapper.text()).toContain("Component Error");
    expect(wrapper.text()).toContain(
      "An error occurred while rendering this view",
    );

    consoleError.mockRestore();
  });

  it("displays error details in developer mode", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const store = useHaStore();
    store.developerMode = true;

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "test-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Error Details:");
    expect(wrapper.text()).toContain("Test error");

    consoleError.mockRestore();
  });

  it("hides error details when not in developer mode", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const store = useHaStore();
    store.developerMode = false;

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "test-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain("Error Details:");
    expect(wrapper.text()).not.toContain("Test error");

    consoleError.mockRestore();
  });

  it("emits error event when an error is caught", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "test-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("error")).toBeTruthy();
    expect(wrapper.emitted("error")[0][0]).toHaveProperty("error");
    expect(wrapper.emitted("error")[0][0]).toHaveProperty("viewName", "test-view");

    consoleError.mockRestore();
  });

  it("emits retry event when retry button is clicked", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "test-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();

    const retryButton = wrapper.find("button.btn-primary");
    await retryButton.trigger("click");

    expect(wrapper.emitted("retry")).toBeTruthy();

    consoleError.mockRestore();
  });

  it("emits goHome event when go home button is clicked", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "test-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();

    const goHomeButton = wrapper.find("button.btn-outline-secondary");
    await goHomeButton.trigger("click");

    expect(wrapper.emitted("goHome")).toBeTruthy();

    consoleError.mockRestore();
  });

  it("clears error state when retry is clicked", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "test-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".error-boundary-container").exists()).toBe(true);

    const retryButton = wrapper.find("button.btn-primary");
    await retryButton.trigger("click");

    // Verify retry event was emitted with no arguments
    expect(wrapper.emitted("retry")).toBeTruthy();
    expect(wrapper.emitted("retry")[0]).toEqual([]);

    consoleError.mockRestore();
  });

  it("displays view name in error context", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(ErrorBoundary, {
      props: {
        viewName: "custom-view",
      },
      slots: {
        default: h(ThrowErrorComponent),
      },
    });

    await wrapper.vm.$nextTick();

    // Check that viewName was passed to error event
    expect(wrapper.emitted("error")[0][0].viewName).toBe("custom-view");

    consoleError.mockRestore();
  });
});
