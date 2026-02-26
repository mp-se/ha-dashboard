import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    setupFiles: ["./src/setupTests.js"],
    globals: true,
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.spec.js", "**/__tests__/**"],
      thresholds: {
        // Enforced floors — tests will fail if coverage drops below these.
        // Set ~1-2% below current measured coverage so CI catches regressions
        // without failing on the current codebase.
        // Current: stmts 89.7%, branch 84.3%, funcs 91.8%, lines 90.9%
        statements: 88,
        branches: 83,
        functions: 90,
        lines: 89,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
