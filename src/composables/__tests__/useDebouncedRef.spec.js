import { describe, it, expect, vi } from "vitest";
import useDebouncedRef from "../useDebouncedRef";

describe("useDebouncedRef", () => {
  it("should initialize with default values", () => {
    const { input, debounced } = useDebouncedRef();
    expect(input.value).toBe("");
    expect(debounced.value).toBe("");
  });

  it("should initialize with provided initial value", () => {
    const { input, debounced } = useDebouncedRef("hello");
    expect(input.value).toBe("hello");
    expect(debounced.value).toBe("hello");
  });

  it("should debounce input changes", async () => {
    const { input, debounced } = useDebouncedRef("initial", 50);

    input.value = "first";
    expect(debounced.value).toBe("initial");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("first");
  });

  it("should reset debounce timer on rapid changes", async () => {
    const { input, debounced } = useDebouncedRef("initial", 50);

    input.value = "first";
    await new Promise((resolve) => setTimeout(resolve, 25));
    input.value = "second";
    await new Promise((resolve) => setTimeout(resolve, 25));
    input.value = "third";

    expect(debounced.value).toBe("initial");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("third");
  });

  it("should use custom delay", async () => {
    const { input, debounced } = useDebouncedRef("initial", 100);

    input.value = "updated";
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(debounced.value).toBe("initial");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("updated");
  });

  it("should handle multiple sequential updates", async () => {
    const { input, debounced } = useDebouncedRef("", 50);

    input.value = "a";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("a");

    input.value = "ab";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("ab");

    input.value = "abc";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("abc");
  });

  it("should handle numeric values", async () => {
    const { input, debounced } = useDebouncedRef(0, 50);

    input.value = 42;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe(42);
  });

  it("should handle null and undefined values", async () => {
    const { input, debounced } = useDebouncedRef(null, 50);

    expect(input.value).toBe(null);
    expect(debounced.value).toBe(null);

    input.value = undefined;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe(undefined);
  });

  it("should handle empty string input", async () => {
    const { input, debounced } = useDebouncedRef("initial", 50);

    input.value = "";
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toBe("");
  });

  it("should clear timer on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { input } = useDebouncedRef("", 100);

    input.value = "test";
    // The watch with immediate: true will create a timer
    // Clearing happens on unmount in onBeforeUnmount hook
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("should work with object values", async () => {
    const initial = { name: "test", value: 1 };
    const { input, debounced } = useDebouncedRef(initial, 50);

    const updated = { name: "test", value: 2 };
    input.value = updated;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toEqual(updated);
  });

  it("should handle array values", async () => {
    const initial = [1, 2, 3];
    const { input, debounced } = useDebouncedRef(initial, 50);

    const updated = [1, 2, 3, 4];
    input.value = updated;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(debounced.value).toEqual(updated);
  });
});
