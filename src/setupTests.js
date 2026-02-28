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
