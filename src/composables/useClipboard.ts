import { ref, Ref } from "vue";

interface ClipboardReturn {
  writeToClipboard: (text: string) => Promise<boolean>;
  copied: Ref<boolean>;
  error: Ref<string | null>;
}

/**
 * Composable for writing text to the clipboard.
 * Handles both the modern Clipboard API and a legacy execCommand fallback
 * so clipboard operations work across all target browsers.
 *
 * @returns Object with writeToClipboard method and state refs
 */
export const useClipboard = (): ClipboardReturn => {
  const copied = ref(false);
  const error = ref<string | null>(null);

  /**
   * Write text to the system clipboard.
   * @param text - The text to copy
   * @returns True on success, false on failure
   */
  const writeToClipboard = async (text: string): Promise<boolean> => {
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
        const errorMsg =
          fallbackError instanceof Error
            ? fallbackError.message
            : "Copy failed";
        error.value = errorMsg;
        return false;
      }
    }
  };

  return { writeToClipboard, copied, error };
};
