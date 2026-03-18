import { ref, Ref } from "vue";

interface ClipboardReturn {
  writeToClipboard: (text: string) => Promise<boolean>;
  copied: Ref<boolean>;
  error: Ref<string | null>;
}

/**
 * Composable for writing text to the clipboard.
 * Uses the modern Clipboard API available in all target browsers (2020+).
 * The deprecated execCommand fallback has been removed.
 *
 * @returns Object with writeToClipboard method and state refs
 */
export const useClipboard = (): ClipboardReturn => {
  const copied = ref(false);
  const error = ref<string | null>(null);

  /**
   * Write text to the system clipboard using the modern Clipboard API.
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Copy failed";
      error.value = errorMsg;
      return false;
    }
  };

  return { writeToClipboard, copied, error };
};
