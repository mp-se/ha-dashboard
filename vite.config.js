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

  return {
    base: baseUrl,
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
  };
});
