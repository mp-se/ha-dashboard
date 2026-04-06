import { createLogger } from "@/utils/logger";

const logger = createLogger("useDarkMode");

/**
 * Composable for handling dark mode toggling with full integration:
 * - Sets Bootstrap's data-bs-theme attribute on root element
 * - Sets CSS colorScheme for browser UI consistency
 * - Persists preference to localStorage
 * - Cleans up iOS focus state artifacts
 *
 * Usage:
 *   const { toggleDarkMode } = useDarkMode();
 *   
 *   @click="toggleDarkMode(currentValue)"
 */
export function useDarkMode() {
  /**
   * Toggle dark mode and apply all necessary side effects
   * @param currentValue - Current dark mode state (boolean)
   * @returns Function to call with emit callback
   */
  const toggleDarkMode = (currentValue: boolean, emit: (key: string, value: boolean) => void) => {
    const newValue = !currentValue;
    const root = document.documentElement;

    // 1. Set Bootstrap 5.3 theme attribute
    root.setAttribute("data-bs-theme", newValue ? "dark" : "light");

    // 2. Set CSS colorScheme for browser UI elements (scrollbars, inputs, etc.)
    root.style.colorScheme = newValue ? "dark" : "light";

    // 3. Persist to localStorage
    localStorage.setItem("ha-dashboard-dark-mode", String(newValue));

    // 4. Remove iOS focus state artifacts after click
    const btn = document.querySelector('[aria-label="Toggle dark mode"]');
    if (btn) {
      btn.blur();
      (btn as HTMLElement).style.outline = "none";
      (btn as HTMLElement).style.boxShadow = "none";
      (btn as HTMLElement).style.backgroundColor = "transparent";
    }

    logger.log("[useDarkMode] Toggled dark mode to", newValue);

    // 5. Emit to parent component
    emit("update:darkMode", newValue);
  };

  return {
    toggleDarkMode,
  };
}
