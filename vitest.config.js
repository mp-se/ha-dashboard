import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    setupFiles: ["./src/setupTests.js"],
    globals: true,
    environment: "happy-dom",
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    include: [
      "src/**/__tests__/**/*.{js,ts}",
      "src/**/*.spec.{js,ts}",
      "docker/**/__tests__/**/*.{js,ts}",
      "docker/**/*.spec.{js,ts}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.spec.js", "**/__tests__/**"],
      thresholds: {
        // Enforced floors — tests will fail if coverage drops below these.
        // Current coverage: stmts 93.42%, branch 87.5%, funcs 94.28%, lines 94.35%
        // Set thresholds ~1-2% below current to catch regressions
        statements: 92,
        branches: 86,
        functions: 93,
        lines: 93,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
