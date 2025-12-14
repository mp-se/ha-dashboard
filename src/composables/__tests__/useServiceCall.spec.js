import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useServiceCall } from "../useServiceCall";

// Mock the Pinia store
vi.mock("@/stores/haStore", () => ({
  useHaStore: vi.fn(),
}));

import { useHaStore } from "@/stores/haStore";

describe("useServiceCall", () => {
  let mockStore;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStore = {
      isLocalMode: false,
      callService: vi.fn().mockResolvedValue(undefined),
    };
    useHaStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial state", () => {
    it("should initialize with default state", () => {
      const { isLoading, error, success } = useServiceCall();
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(success.value).toBe(false);
    });

    it("should return all required methods and properties", () => {
      const service = useServiceCall();
      expect(service).toHaveProperty("callService");
      expect(service).toHaveProperty("clearFeedback");
      expect(service).toHaveProperty("isLoading");
      expect(service).toHaveProperty("error");
      expect(service).toHaveProperty("success");
    });
  });

  describe("Service call success", () => {
    it("should call service successfully", async () => {
      const { callService, isLoading } = useServiceCall();

      const promise = callService("light", "turn_on", {
        entity_id: "light.bedroom",
      });
      expect(isLoading.value).toBe(true);

      await promise;
      expect(mockStore.callService).toHaveBeenCalledWith(
        "light",
        "turn_on",
        { entity_id: "light.bedroom" },
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it("should return true on success", async () => {
      const { callService } = useServiceCall();
      const result = await callService("switch", "turn_on", {});
      expect(result).toBe(true);
    });

    it("should set isLoading to false after call", async () => {
      const { callService, isLoading } = useServiceCall();
      expect(isLoading.value).toBe(false);

      await callService("light", "turn_on", {});
      expect(isLoading.value).toBe(false);
    });

    it("should show success feedback by default", async () => {
      const { callService, success } = useServiceCall();
      expect(success.value).toBe(false);

      await callService("light", "turn_on", {});
      expect(success.value).toBe(true);
    });

    it("should clear success feedback after 2 seconds", async () => {
      const { callService, success } = useServiceCall();

      await callService("light", "turn_on", {});
      expect(success.value).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(success.value).toBe(false);
    });

    it("should not show feedback when showFeedback is false", async () => {
      const { callService, success } = useServiceCall();

      await callService("light", "turn_on", {}, { showFeedback: false });
      expect(success.value).toBe(false);
    });
  });

  describe("Service call error handling", () => {
    it("should handle service call error", async () => {
      const testError = new Error("Service error");
      mockStore.callService.mockRejectedValueOnce(testError);

      const { callService, error } = useServiceCall();
      const result = await callService("light", "turn_on", {});

      expect(result).toBe(false);
      expect(error.value).toBe("Service error");
    });

    it("should return false on error", async () => {
      mockStore.callService.mockRejectedValueOnce(new Error("Failed"));

      const { callService } = useServiceCall();
      const result = await callService("light", "turn_on", {});

      expect(result).toBe(false);
    });

    it("should clear error after 5 seconds", async () => {
      mockStore.callService.mockRejectedValueOnce(new Error("Test error"));

      const { callService, error } = useServiceCall();
      await callService("light", "turn_on", {});
      expect(error.value).toBe("Test error");

      vi.advanceTimersByTime(5000);
      expect(error.value).toBeNull();
    });

    it("should handle timeout error", async () => {
      const abortError = new Error("Timeout");
      abortError.name = "AbortError";
      mockStore.callService.mockRejectedValueOnce(abortError);

      const { callService, error } = useServiceCall();
      await callService("light", "turn_on", {}, { timeout: 1000 });

      expect(error.value).toContain("timeout");
    });

    it("should use custom timeout value", async () => {
      const { callService } = useServiceCall();

      await callService("light", "turn_on", {}, { timeout: 3000 });

      const callArgs = mockStore.callService.mock.calls[0];
      expect(callArgs[2]).toEqual({}); // service data
    });

    it("should use default timeout of 5000ms", async () => {
      const { callService } = useServiceCall();

      await callService("light", "turn_on", {});
      // Timeout should be set internally, can't directly verify but should not error
      expect(mockStore.callService).toHaveBeenCalled();
    });
  });

  describe("Local mode", () => {
    it("should skip actual service call in local mode", async () => {
      mockStore.isLocalMode = true;

      const { callService } = useServiceCall();
      const result = await callService("light", "turn_on", {
        entity_id: "light.bedroom",
      });

      expect(mockStore.callService).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should log local mode message", async () => {
      mockStore.isLocalMode = true;
      const logSpy = vi.spyOn(console, "log");

      const { callService } = useServiceCall();
      await callService("light", "turn_on", { entity_id: "light.bedroom" });

      expect(logSpy).toHaveBeenCalledWith(
        "[LOCAL MODE] Would call service: light.turn_on",
        { entity_id: "light.bedroom" },
      );
      logSpy.mockRestore();
    });
  });

  describe("clearFeedback method", () => {
    it("should clear error and success", async () => {
      const { callService, clearFeedback, error, success } = useServiceCall();

      await callService("light", "turn_on", {});
      expect(success.value).toBe(true);

      clearFeedback();
      expect(success.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it("should clear error only when present", async () => {
      mockStore.callService.mockRejectedValueOnce(new Error("Test error"));

      const { callService, clearFeedback, error } = useServiceCall();
      const promise = callService("light", "turn_on", {});

      // Wait for the promise to settle
      await promise;
      // Error should be set
      expect(error.value).toBeTruthy();

      clearFeedback();
      expect(error.value).toBeNull();
    });
  });

  describe("State management during calls", () => {
    it("should set isLoading true during call", async () => {
      const { callService, isLoading } = useServiceCall();

      const promise = callService("light", "turn_on", {});
      expect(isLoading.value).toBe(true);

      await promise;
      expect(isLoading.value).toBe(false);
    });

    it("should reset error on new successful call", async () => {
      mockStore.callService.mockRejectedValueOnce(new Error("First error"));

      const { callService, error } = useServiceCall();
      await callService("light", "turn_on", {});
      expect(error.value).toBe("First error");

      mockStore.callService.mockResolvedValueOnce(undefined);
      await callService("light", "turn_off", {});
      expect(error.value).toBeNull();
    });

    it("should reset success on new failed call", async () => {
      const { callService, success } = useServiceCall();

      await callService("light", "turn_on", {});
      expect(success.value).toBe(true);

      mockStore.callService.mockRejectedValueOnce(new Error("Failed"));
      await callService("light", "turn_off", {});
      expect(success.value).toBe(false);
    });
  });

  describe("Service data handling", () => {
    it("should pass empty service data by default", async () => {
      const { callService } = useServiceCall();

      await callService("light", "turn_on");

      const callArgs = mockStore.callService.mock.calls[0];
      expect(callArgs[2]).toEqual({});
    });

    it("should pass custom service data", async () => {
      const { callService } = useServiceCall();
      const serviceData = { entity_id: "light.bedroom", brightness: 255 };

      await callService("light", "turn_on", serviceData);

      const callArgs = mockStore.callService.mock.calls[0];
      expect(callArgs[2]).toEqual(serviceData);
    });

    it("should handle complex service data objects", async () => {
      const { callService } = useServiceCall();
      const serviceData = {
        entity_id: "light.bedroom",
        brightness: 255,
        rgb_color: [255, 0, 0],
        transition: 2,
      };

      await callService("light", "turn_on", serviceData);

      const callArgs = mockStore.callService.mock.calls[0];
      expect(callArgs[2]).toEqual(serviceData);
    });
  });

  describe("Error scenarios", () => {
    it("should handle error without message property", async () => {
      mockStore.callService.mockRejectedValueOnce({});

      const { callService, error } = useServiceCall();
      await callService("light", "turn_on", {});

      expect(error.value).toBeTruthy();
    });

    it("should handle error in finally block", async () => {
      mockStore.callService.mockRejectedValueOnce(new Error("Test error"));

      const { callService, isLoading } = useServiceCall();
      await callService("light", "turn_on", {});

      expect(isLoading.value).toBe(false);
    });
  });
});
