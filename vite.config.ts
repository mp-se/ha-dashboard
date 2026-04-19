import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const baseUrl = env.VITE_BASE_URL || "/";
  const DEBUG_LOGS = String(env.VITE_DEBUG_LOGS || "").toLowerCase() === "true";

  return {
    base: baseUrl,
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      vue(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit for large JS bundle
        },
        includeAssets: ["favicon.ico", "ha-icon.svg", "masked-icon.svg"],
        manifest: {
          name: "Home Assistant Dashboard",
          short_name: "HA Dashboard",
          description: "Real-time sensor dashboard for Home Assistant",
          theme_color: "#42b883",
          start_url: baseUrl,
          scope: baseUrl,
          icons: [
            {
              src: "ha-icon.svg",
              sizes: "any",
              type: "image/svg+xml",
            },
          ],
        },
      }),
      {
        name: "remove-unnecessary-files",
        apply: "build",
        writeBundle() {
          // Remove the shared-styles.css from dist after build
          const sharedStylesPath = path.join(
            __dirname,
            "dist",
            "styles",
            "shared-styles.css",
          );
          if (fs.existsSync(sharedStylesPath)) {
            fs.unlinkSync(sharedStylesPath);
            console.log("✓ Removed unnecessary dist/styles/shared-styles.css");
          }

          // Remove the data directory from dist
          const dataPath = path.join(__dirname, "dist", "data");
          if (fs.existsSync(dataPath)) {
            fs.rmSync(dataPath, { recursive: true, force: true });
            console.log("✓ Removed unnecessary dist/data/");
          }
        },
      },
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor chunks - prioritize splitting large libraries
            if (id.includes("node_modules")) {
              if (id.includes("vue")) {
                return "vendor-vue";
              }
              if (id.includes("pinia")) {
                return "vendor-pinia";
              }
              if (id.includes("bootstrap")) {
                return "vendor-bootstrap";
              }
              if (id.includes("home-assistant-js-websocket")) {
                return "vendor-ha";
              }
              if (id.includes("@mdi")) {
                return "vendor-icons";
              }
              if (id.includes("vue-draggable")) {
                return "vendor-draggable";
              }
              return "vendor-other";
            }

            // Split heavy utilities into separate chunks
            if (id.includes("src/utils/")) {
              if (id.includes("configValidator")) {
                return "util-config";
              }
              if (id.includes("cardPropertyMetadata")) {
                return "util-metadata";
              }
              if (id.includes("componentLayouts")) {
                return "util-layouts";
              }
              return "utils";
            }

            if (id.includes("src/composables/")) {
              return "composables";
            }

            // Component grouping by category - lazy loaded on demand
            if (id.includes("src/components/cards/")) {
              // Group input control cards
              if (
                id.includes("HaSwitch") ||
                id.includes("HaSelect") ||
                id.includes("HaButton")
              ) {
                return "cards-input";
              }
              // Group simple output display cards
              if (
                id.includes("HaSensor") ||
                id.includes("HaBinarySensor") ||
                id.includes("HaChip") ||
                id.includes("HaPerson") ||
                id.includes("HaSun") ||
                id.includes("HaWeather") ||
                id.includes("HaWarning") ||
                id.includes("HaError") ||
                id.includes("HaImage") ||
                id.includes("HaLink")
              ) {
                return "cards-output";
              }
              // Group complex cards (graphs, energy, etc)
              if (
                id.includes("HaGauge") ||
                id.includes("HaSensorGraph") ||
                id.includes("HaEnergy") ||
                id.includes("HaRoom") ||
                id.includes("HaLight") ||
                id.includes("HaMediaPlayer") ||
                id.includes("HaPrinter") ||
                id.includes("HaAlarmPanel") ||
                id.includes("HaBeerTap")
              ) {
                return "cards-complex";
              }
              // Spacer and layout components
              if (
                id.includes("HaSpacer") ||
                id.includes("HaRowSpacer") ||
                id.includes("HaHeader") ||
                id.includes("HaGlance")
              ) {
                return "cards-layout";
              }
              // Render and display utility cards
              if (
                id.includes("HaEntityList") ||
                id.includes("HaEntityAttributeList") ||
                id.includes("HaIconCircle")
              ) {
                return "cards-display";
              }
            }

            // View chunks - these are lazy loaded based on navigation
            if (id.includes("src/views/")) {
              if (id.includes("JsonConfigView")) {
                return "views-config";
              }
              if (id.includes("RawEntityView")) {
                return "views-dev";
              }
              if (id.includes("VisualEditorView")) {
                return "views-editor";
              }
              if (id.includes("DevicesView")) {
                return "views-devices";
              }
              return "views-other";
            }

            // Visual editor chunk (complex, lazy loaded)
            if (id.includes("src/components/visual-editor/")) {
              return "visual-editor";
            }

            // Stores chunk - necessary for state management
            if (id.includes("src/stores/")) {
              return "stores";
            }

            // Page layout components
            if (id.includes("src/components/page-components/")) {
              return "page-components";
            }

            // Sub-components used by cards
            if (id.includes("src/components/sub-components/")) {
              return "sub-components";
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: !DEBUG_LOGS,
          pure_funcs: DEBUG_LOGS
            ? []
            : ["console.log", "console.info", "console.warn"],
        },
      },
    },
  };
});
