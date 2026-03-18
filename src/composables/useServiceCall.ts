import { ref, Ref, onBeforeUnmount } from "vue";
import { useHaStore } from "@/stores/haStore";
import { createLogger } from "@/utils/logger";

interface ServiceCallOptions {
  timeout?: number;
  showFeedback?: boolean;
}

interface ServiceCallReturn {
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    options?: ServiceCallOptions,
  ) => Promise<boolean>;
  clearFeedback: () => void;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  success: Ref<boolean>;
}

/**
 * Composable for making Home Assistant service calls with consistent error handling
 * Provides feedback states (loading, error, success) and timeout management
 *
 * @returns Object containing callService method and state refs
 */
export const useServiceCall = (): ServiceCallReturn => {
  const store = useHaStore();
  const logger = createLogger("useServiceCall");

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);

  // Track timeout IDs for cleanup
  let errorTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Clear any pending timeouts
   */
  const clearPendingTimeouts = (): void => {
    if (errorTimeoutId !== null) {
      clearTimeout(errorTimeoutId);
      errorTimeoutId = null;
    }
    if (successTimeoutId !== null) {
      clearTimeout(successTimeoutId);
      successTimeoutId = null;
    }
  };

  /**
   * Call a Home Assistant service with built-in error handling and feedback
   * @param domain - Service domain (e.g., 'light', 'switch')
   * @param service - Service name (e.g., 'turn_on')
   * @param serviceData - Service call parameters
   * @param options - Optional configuration
   * @returns True if successful, false if failed
   */
  const callService = async (
    domain: string,
    service: string,
    serviceData: Record<string, unknown> = {},
    options: ServiceCallOptions = {},
  ): Promise<boolean> => {
    const { timeout = 5000, showFeedback = true } = options;

    // Clear any pending timeouts from previous calls
    clearPendingTimeouts();

    isLoading.value = true;
    error.value = null;
    success.value = false;

    try {
      // Skip actual call if in local mode
      if (store.isLocalMode) {
        logger.log(
          `[LOCAL MODE] Would call service: ${domain}.${service}`,
          serviceData,
        );
        isLoading.value = false;
        return true;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        await store.callService(domain, service, serviceData, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        success.value = showFeedback;

        // Clear success feedback after 2 seconds
        if (showFeedback) {
          successTimeoutId = setTimeout(() => {
            success.value = false;
          }, 2000);
        }

        return true;
      } catch (e) {
        clearTimeout(timeoutId);

        if ((e as unknown as { name: string }).name === "AbortError") {
          error.value = `Service call timeout (${timeout}ms)`;
        } else {
          error.value = (e as Error).message || "Service call failed";
        }

        if (showFeedback) {
          logger.error(`Service call failed: ${domain}.${service}`, e);
        }

        // Clear error after 5 seconds
        errorTimeoutId = setTimeout(() => {
          error.value = null;
        }, 5000);

        return false;
      }
    } catch (e) {
      error.value =
        (e as Error).message || "Unexpected error during service call";
      logger.error("Service call error:", e);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Clear all feedback
  const clearFeedback = (): void => {
    clearPendingTimeouts();
    error.value = null;
    success.value = false;
  };

  // Clean up timeouts on component unmount
  onBeforeUnmount(() => {
    clearPendingTimeouts();
  });

  return {
    callService,
    clearFeedback,
    isLoading,
    error,
    success,
  };
};
