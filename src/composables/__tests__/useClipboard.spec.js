import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useClipboard } from "../useClipboard";

describe("useClipboard", () => {
  let originalNavigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.stubGlobal("navigator", originalNavigator);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns writeToClipboard, copied, and error refs", () => {
    const { writeToClipboard, copied, error } = useClipboard();
    expect(typeof writeToClipboard).toBe("function");
    expect(copied.value).toBe(false);
    expect(error.value).toBeNull();
  });

  describe("writeToClipboard (navigator.clipboard success)", () => {
    it("writes text to clipboard and returns true", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { clipboard: { writeText: writeTextMock } });

      const { writeToClipboard, copied, error } = useClipboard();
      const result = await writeToClipboard("hello world");

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("hello world");
      expect(copied.value).toBe(true);
      expect(error.value).toBeNull();
    });

    it("resets copied to false after 2 seconds", async () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { writeToClipboard, copied } = useClipboard();
      await writeToClipboard("timer test");

      expect(copied.value).toBe(true);
      await vi.advanceTimersByTimeAsync(2000);
      expect(copied.value).toBe(false);
    });

    it("clears previous error on new write attempt", async () => {
      const { writeToClipboard, error } = useClipboard();

      // First call succeeds; prime with a pre-existing error state
      error.value = "old error";

      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      await writeToClipboard("fresh text");
      expect(error.value).toBeNull();
    });
  });

  describe("writeToClipboard (navigator.clipboard fails, execCommand fallback)", () => {
    it("succeeds via execCommand fallback when clipboard API is unavailable", async () => {
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
      });

      // Define execCommand on document for this test (not available in happy-dom)
      Object.defineProperty(document, "execCommand", {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(true),
      });

      const { writeToClipboard, copied, error } = useClipboard();
      const result = await writeToClipboard("fallback success");

      expect(result).toBe(true);
      expect(copied.value).toBe(true);
      expect(error.value).toBeNull();

      // Clean up
      Object.defineProperty(document, "execCommand", {
        writable: true,
        configurable: true,
        value: undefined,
      });
    });

    it("returns false and sets error when both paths fail (happy-dom has no execCommand)", async () => {
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
      });

      const { writeToClipboard, copied, error } = useClipboard();
      // In happy-dom document.execCommand does not exist → TypeError thrown
      const result = await writeToClipboard("fallback test");

      // Both clipboard API and execCommand fallback fail
      expect(result).toBe(false);
      expect(copied.value).toBe(false);
      expect(error.value).toBeTruthy();
    });
  });

  describe("writeToClipboard (no navigator.clipboard)", () => {
    it("falls back to execCommand when clipboard API is unavailable", async () => {
      vi.stubGlobal("navigator", {});

      const { writeToClipboard, error } = useClipboard();
      const result = await writeToClipboard("no clipboard api");

      // In happy-dom execCommand doesn't exist → fallback fails
      expect(result).toBe(false);
      expect(error.value).toBeTruthy();
    });
  });
});
