import { ref } from "vue";

/**
 * Composable for writing text to the clipboard.
 * Handles both the modern Clipboard API and a legacy execCommand fallback
 * so clipboard operations work across all target browsers.
 *
 * @returns {{ writeToClipboard: (text: string) => Promise<boolean>, copied: import('vue').Ref<boolean>, error: import('vue').Ref<string|null> }}
 */
export const useClipboard = () => {
  const copied = ref(false);
  const error = ref(null);

  /**
   * Write text to the system clipboard.
   * @param {string} text - The text to copy.
   * @returns {Promise<boolean>} True on success, false on failure.
   */
  const writeToClipboard = async (text) => {
    error.value = null;

    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
      return true;
    } catch {
      // Fallback for older browsers / non-secure contexts
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 2000);
        return true;
      } catch (fallbackError) {
        error.value = fallbackError.message || "Copy failed";
        return false;
      }
    }
  };

  return { writeToClipboard, copied, error };
};
