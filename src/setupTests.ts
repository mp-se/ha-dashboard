import { config } from "@vue/test-utils";
import { beforeEach } from "vitest";
import IconCircle from "./components/sub-components/IconCircle.vue";
import EntityAttributeList from "./components/sub-components/EntityAttributeList.vue";

// Register global components for all tests
config.global.components = {
  IconCircle,
  EntityAttributeList,
};

// Mock localStorage for tests
const localStorageStore: Record<string, string> = {};

// Create a proxy for localStorage that:
// 1. Uses Storage.prototype methods if they're spied on
// 2. Otherwise uses our custom implementation
const mockStorage = new Proxy(Object.create(Storage.prototype), {
  get(target: any, prop: string | symbol) {
    // Check if it's a method that might be spied on
    if (prop === "getItem") {
      // First check if Storage.prototype.getItem is a spy (has mock properties)
      const protoMethod = Storage.prototype.getItem;
      if (protoMethod && (protoMethod as any).mock) {
        // Use the spy
        return protoMethod.bind(target);
      }
      // Otherwise use our implementation
      return (key: string) => localStorageStore[key] ?? null;
    }
    if (prop === "setItem") {
      const protoMethod = Storage.prototype.setItem;
      if (protoMethod && (protoMethod as any).mock) {
        return protoMethod.bind(target);
      }
      return (key: string, value: string) => {
        localStorageStore[key] = String(value);
      };
    }
    if (prop === "removeItem") {
      const protoMethod = Storage.prototype.removeItem;
      if (protoMethod && (protoMethod as any).mock) {
        return protoMethod.bind(target);
      }
      return (key: string) => {
        delete localStorageStore[key];
      };
    }
    if (prop === "clear") {
      const protoMethod = Storage.prototype.clear;
      if (protoMethod && (protoMethod as any).mock) {
        return protoMethod.bind(target);
      }
      return () => {
        Object.keys(localStorageStore).forEach((key) => {
          delete localStorageStore[key];
        });
      };
    }
    if (prop === "key") {
      const protoMethod = Storage.prototype.key;
      if (protoMethod && (protoMethod as any).mock) {
        return protoMethod.bind(target);
      }
      return (index: number) => Object.keys(localStorageStore)[index] ?? null;
    }
    if (prop === "length") {
      return Object.keys(localStorageStore).length;
    }
    return Reflect.get(target, prop);
  },
});

global.localStorage = mockStorage as unknown as Storage;

beforeEach(() => {
  // Clear localStorage before each test
  Object.keys(localStorageStore).forEach((key) => {
    delete localStorageStore[key];
  });
});

// Suppress warnings about reserved HTML elements used in MDI icons
const originalWarn = console.warn;
console.warn = (...args: unknown[]): void => {
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
