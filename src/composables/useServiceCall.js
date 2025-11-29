import { ref } from 'vue';
import { useHaStore } from '@/stores/haStore';

/**
 * Composable for making Home Assistant service calls with consistent error handling
 * Provides feedback states (loading, error, success) and timeout management
 *
 * @returns {object} - Contains callService method and state refs
 */
export const useServiceCall = () => {
  const store = useHaStore();

  const isLoading = ref(false);
  const error = ref(null);
  const success = ref(false);

  /**
   * Call a Home Assistant service with built-in error handling and feedback
   * @param {string} domain - Service domain (e.g., 'light', 'switch')
   * @param {string} service - Service name (e.g., 'turn_on')
   * @param {object} serviceData - Service call parameters
   * @param {object} options - Optional configuration
   * @param {number} options.timeout - Timeout in ms (default 5000)
   * @param {boolean} options.showFeedback - Show success/error feedback (default true)
   * @returns {Promise<boolean>} - True if successful, false if failed
   */
  const callService = async (domain, service, serviceData = {}, options = {}) => {
    const { timeout = 5000, showFeedback = true } = options;

    isLoading.value = true;
    error.value = null;
    success.value = false;

    try {
      // Skip actual call if in local mode
      if (store.isLocalMode) {
        console.log(`[LOCAL MODE] Would call service: ${domain}.${service}`, serviceData);
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
          setTimeout(() => {
            success.value = false;
          }, 2000);
        }

        return true;
      } catch (e) {
        clearTimeout(timeoutId);

        if (e.name === 'AbortError') {
          error.value = `Service call timeout (${timeout}ms)`;
        } else {
          error.value = e.message || 'Service call failed';
        }

        if (showFeedback) {
          console.error(`Service call failed: ${domain}.${service}`, e);
        }

        // Clear error after 5 seconds
        setTimeout(() => {
          error.value = null;
        }, 5000);

        return false;
      }
    } catch (e) {
      error.value = e.message || 'Unexpected error during service call';
      console.error('Service call error:', e);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Clear all feedback
  const clearFeedback = () => {
    error.value = null;
    success.value = false;
  };

  return {
    callService,
    clearFeedback,
    isLoading,
    error,
    success,
  };
};
