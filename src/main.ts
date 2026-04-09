/*
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
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
app.config.errorHandler = (
  err: unknown,
  instance: unknown,
  info: string,
): void => {
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
app.config.warnHandler = (
  msg: string,
  _instance: unknown,
  _trace: string,
): void => {
  // Only log in development
  if (import.meta.env.DEV) {
    logger.warn("Vue warning:", msg);
  }
};

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
