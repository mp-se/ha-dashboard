import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  // Ignore generated and dependency directories
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**", "public/**"],
  },

  // ESLint recommended rules
  js.configs.recommended,

  // Vue 3 recommended rules (flat config variant from eslint-plugin-vue v9)
  ...pluginVue.configs["flat/recommended"],

  // Disable ESLint formatting rules that conflict with Prettier
  prettier,

  // Browser globals for all source files
  {
    files: ["src/**/*.{js,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  },

  // Node + browser globals for test files (vitest runs in happy-dom / node)
  {
    files: ["src/**/__tests__/**/*.{js,ts}", "src/**/*.spec.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // Vitest globals (since vitest/globals export doesn't exist in current version)
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeHookAsync: "readonly",
        afterHookAsync: "readonly",
      },
    },
  },
];
