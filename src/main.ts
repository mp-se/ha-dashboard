import { createApp, App as VueApp } from "vue";
import { createPinia } from "pinia";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "@mdi/font/css/materialdesignicons.min.css";
import App from "./App.vue";
import { registerSW } from "virtual:pwa-register";
import { createLogger } from "./utils/logger";

const logger = createLogger("main");

const app: VueApp = createApp(App);
app.use(createPinia());

// Global error handler for unhandled component errors
app.config.errorHandler = (err: unknown, instance: unknown, info: string): void => {
  const error = err instanceof Error ? err : new Error(String(err));
  const component = (instance as any)?.$options?.name || "Unknown";
  logger.error("Global error caught:", {
    error: error.message || error,
    component: component,
    info: info,
  });

  // In production, you could send this to an error tracking service like Sentry
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(err, { contexts: { vue: { info } } });
  }
};

// Global warning handler for Vue warnings
// eslint-disable-next-line no-unused-vars
app.config.warnHandler = (msg: string, instance: unknown, trace: string): void => {
  // Only log in development
  if (import.meta.env.DEV) {
    logger.warn("Vue warning:", msg);
  }
};

// Auto-register all Ha* components globally.
// Any new component matching src/components/Ha*.vue is picked up automatically.
const haComponents = import.meta.glob<{ default: unknown }>(
  "./components/Ha*.vue",
  { eager: true },
);
for (const [path, mod] of Object.entries(haComponents)) {
  const name = path.split("/").pop()?.replace(".vue", "") || "";
  app.component(name, mod.default);
}

app.mount("#app");

// Register service worker for PWA updates
registerSW({
  onNeedRefresh() {
    // Notify the app that an update is available
    window.dispatchEvent(new CustomEvent("sw-need-refresh"));
  },
  onOfflineReady() {
    logger.log("App is ready for offline use");
  },
});
