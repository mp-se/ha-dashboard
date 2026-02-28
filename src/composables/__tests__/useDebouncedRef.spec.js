import { describe, it, expect, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import useDebouncedRef from "../useDebouncedRef";

/**
 * Helper to mount a test component that uses useDebouncedRef
 */
function mountWithComposable(initialValue, delay) {
  let composableResult;
  const TestComponent = defineComponent({
    setup() {
      composableResult = useDebouncedRef(initialValue, delay);
      return composableResult;
    },
    template: "<div></div>",
  });
  const wrapper = mount(TestComponent);
  return { wrapper, ...composableResult };
}

describe("useDebouncedRef", () => {
  it("should initialize with default values", () => {
    const { wrapper, input, debounced } = mountWithComposable();
    expect(input.value).toBe("");
    expect(debounced.value).toBe("");
    wrapper.unmount();
  });

  it("should initialize with provided initial value", () => {
    const { wrapper, input, debounced } = mountWithComposable("hello");
    expect(input.value).toBe("hello");
    expect(debounced.value).toBe("hello");
    wrapper.unmount();
  });

  it("should debounce input changes", async () => {
    const { wrapper, input, debounced } = mountWithComposable("initial", 50);

    input.value = "first";
    expect(debounced.value).toBe("initial");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("first");
    wrapper.unmount();
  });

  it("should reset debounce timer on rapid changes", async () => {
    const { wrapper, input, debounced } = mountWithComposable("initial", 50);

    input.value = "first";
    await new Promise((resolve) => setTimeout(resolve, 25));
    input.value = "second";
    await new Promise((resolve) => setTimeout(resolve, 25));
    input.value = "third";

    expect(debounced.value).toBe("initial");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("third");
    wrapper.unmount();
  });

  it("should use custom delay", async () => {
    const { wrapper, input, debounced } = mountWithComposable("initial", 100);

    input.value = "updated";
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(debounced.value).toBe("initial");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("updated");
    wrapper.unmount();
  });

  it("should handle multiple sequential updates", async () => {
    const { wrapper, input, debounced } = mountWithComposable("", 50);

    input.value = "a";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("a");

    input.value = "ab";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("ab");

    input.value = "abc";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("abc");
    wrapper.unmount();
  });

  it("should handle numeric values", async () => {
    const { wrapper, input, debounced } = mountWithComposable(0, 50);

    input.value = 42;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe(42);
    wrapper.unmount();
  });

  it("should handle null and undefined values", async () => {
    const { wrapper, input, debounced } = mountWithComposable(null, 50);

    expect(input.value).toBe(null);
    expect(debounced.value).toBe(null);

    input.value = undefined;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe(undefined);
    wrapper.unmount();
  });

  it("should handle empty string input", async () => {
    const { wrapper, input, debounced } = mountWithComposable("initial", 50);

    input.value = "";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("");
    wrapper.unmount();
  });

  it("should clear timer on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { wrapper, input } = mountWithComposable("", 100);

    input.value = "test";
    // The watch with immediate: true will create a timer
    // Clearing happens on unmount in onBeforeUnmount hook
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    wrapper.unmount();
    clearTimeoutSpy.mockRestore();
  });

  it("clears pending timer and stops watcher on component unmount", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { wrapper, input } = mountWithComposable("initial", 500);

    // Trigger a change to ensure timer is active
    input.value = "changed";

    await wrapper.unmount();

    // onBeforeUnmount: timer should have been cleared
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("should work with object values", async () => {
    const initial = { name: "test", value: 1 };
    const { wrapper, input, debounced } = mountWithComposable(initial, 50);

    const updated = { name: "test", value: 2 };
    input.value = updated;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toEqual(updated);
    wrapper.unmount();
  });

  it("should handle array values", async () => {
    const initial = [1, 2, 3];
    const { wrapper, input, debounced } = mountWithComposable(initial, 50);

    const updated = [1, 2, 3, 4];
    input.value = updated;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toEqual(updated);
    wrapper.unmount();
  });
});
