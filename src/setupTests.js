import { config } from "@vue/test-utils";
import HaIconCircle from "./components/HaIconCircle.vue";
import HaEntityAttributeList from "./components/HaEntityAttributeList.vue";

// Register global components for all tests
config.global.components = {
  HaIconCircle,
  HaEntityAttributeList,
};

// Suppress warnings about reserved HTML elements used in MDI icons
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (
    typeof message === "string" &&
    (message.includes("Do not use built-in or reserved HTML elements") ||
      message.includes("component id: i") ||
      message.includes("component id: svg"))
  ) {
    return; // Suppress these specific warnings
  }
  originalWarn(...args);
};

// Mock localStorage which might be missing/incomplete in happy-dom
if (typeof window !== "undefined") {
  const mockStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        if (value === undefined) value = "undefined";
        if (value === null) value = "null";
        store[key] = value.toString();
      },
      clear: () => {
        store = {};
      },
      removeItem: (key) => {
        delete store[key];
      },
      key: (index) => Object.keys(store)[index] || null,
      get length() {
        return Object.keys(store).length;
      },
    };
  })();

  // Use Object.defineProperty to bypass potential Proxy restrictions if present
  try {
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
  } catch (e) {
    // If window.localStorage is already there and we can't redefine it,
    // just try to patch it. If that fails (Proxy), we might need another approach.
    if (window.localStorage && !window.localStorage.clear) {
      try {
        window.localStorage.clear = mockStorage.clear;
      } catch (err) {
        // Fallback for tricky scenarios: manually patch each test file or use a vitest plugin
      }
    }
  }
}
