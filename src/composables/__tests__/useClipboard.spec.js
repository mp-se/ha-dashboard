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

  describe("writeToClipboard", () => {
    it("writes text to clipboard using Clipboard API and returns true", async () => {
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

      // Prime with a pre-existing error state
      error.value = "old error";

      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      await writeToClipboard("fresh text");
      expect(error.value).toBeNull();
    });

    it("sets error and returns false when Clipboard API fails", async () => {
      const clipboardError = new Error("Clipboard not available");
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(clipboardError),
        },
      });

      const { writeToClipboard, copied, error } = useClipboard();
      const result = await writeToClipboard("should fail");

      expect(result).toBe(false);
      expect(copied.value).toBe(false);
      expect(error.value).toBe("Clipboard not available");
    });

    it("sets error message for non-Error exceptions", async () => {
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: vi.fn().mockRejectedValue("String error"),
        },
      });

      const { writeToClipboard, error } = useClipboard();
      const result = await writeToClipboard("test");

      expect(result).toBe(false);
      expect(error.value).toBe("Copy failed");
    });
  });
});
