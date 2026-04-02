import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
    environment: "happy-dom",
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.spec.ts", "**/__tests__/**"],
      thresholds: {
        // Enforced floors — tests will fail if coverage drops below these.
        // Current coverage: stmts 87.31%, branch 81.01%, funcs 83.94%, lines 88.28%
        // Several visual-editor components are listed in COVERAGE_EXCEPTIONS.md;
        // thresholds reflect current reality and must not decrease.
        statements: 86,
        branches: 79,
        functions: 82,
        lines: 87,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
