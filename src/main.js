import { createApp } from "vue";
import { createPinia } from "pinia";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "@mdi/font/css/materialdesignicons.min.css";
import App from "./App.vue";
import { registerSW } from "virtual:pwa-register";
import { createLogger } from "./utils/logger.js";

const logger = createLogger("main");

const app = createApp(App);
app.use(createPinia());

// Auto-register all Ha* components globally.
// Any new component matching src/components/Ha*.vue is picked up automatically.
const haComponents = import.meta.glob("./components/Ha*.vue", { eager: true });
for (const [path, mod] of Object.entries(haComponents)) {
  const name = path.split("/").pop().replace(".vue", "");
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
