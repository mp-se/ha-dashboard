import { defineStore } from "pinia";
import { ref } from "vue";
import { validateConfig } from "../utils/configValidator";
import { createLogger } from "@/utils/logger";
import { useAuthStore } from "./authStore";
import parseJSON from "json-parse-even-better-errors";

export const useConfigStore = defineStore("config", () => {
  const dashboardConfig = ref(null);
  const configValidationError = ref(null);
  const configErrorCount = ref(0);
  const logger = createLogger("configStore");

  const loadDashboardConfig = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const configUrl = baseUrl + "data/dashboard-config.json";
      const response = await fetch(configUrl);

      if (!response.ok) {
        return {
          valid: false,
          errors: [
            {
              message: `Failed to load config: ${response.status} ${response.statusText}`,
            },
          ],
          errorCount: 1,
        };
      }

      // Very simple JSON loading to match tests and standard behavior
      let config;
      try {
        if (typeof response.text === "function") {
          const text = await response.text();
          config = parseJSON(text); // Use json-parse-even-better-errors for detailed messages
        } else if (typeof response.json === "function") {
          config = await response.json();
        } else {
          config = response;
        }
      } catch (e) {
        const line = e.line || 1;
        const column = e.column || e.message.match(/position (\d+)/)?.[1] || 0;
        return {
          valid: false,
          errors: [
            {
              message: `JSON syntax error: ${e.message} (line ${line}, column ${column})`,
              line: line,
              column: column,
            },
          ],
          errorCount: 1,
        };
      }

      if (config && typeof config === "object") {
        for (const sym of Object.getOwnPropertySymbols(config)) {
          delete config[sym];
        }
      }

      const validationResult = validateConfig(config);
      dashboardConfig.value = config;

      if (!validationResult.valid) {
        configValidationError.value = validationResult.errors;
        configErrorCount.value = validationResult.errorCount;
      } else {
        configValidationError.value = [];
        configErrorCount.value = 0;
      }

      // Sync settings to authStore if it's initialized
      const authStore = useAuthStore();
      if (config?.app?.developerMode !== undefined) {
        authStore.developerMode = config.app.developerMode;
      }
      if (config?.app?.localMode !== undefined) {
        authStore.isLocalMode = config.app.localMode;
      }

      return validationResult;
    } catch (error) {
      logger.error("Error loading dashboard config:", error);
      return {
        valid: false,
        errors: [{ message: error.message || "Unknown error loading config" }],
        errorCount: 1,
      };
    }
  };

  const reloadConfig = async (authStore, entitiesStore) => {
    try {
      logger.log("Reloading dashboard configuration...");
      const currentUrl = authStore.haUrl;
      const currentToken = authStore.accessToken;

      const validationResult = await loadDashboardConfig();

      if (currentUrl) authStore.haUrl = currentUrl;
      if (currentToken) authStore.accessToken = currentToken;

      if (authStore.isLocalMode) {
        logger.log("Reloading local data...");
        await entitiesStore.loadLocalData();
      }

      return validationResult;
    } catch (error) {
      logger.error("Error reloading config:", error);
      return {
        valid: false,
        errors: [error.message || "Failed to reload configuration"],
        errorCount: 1,
      };
    }
  };

  return {
    dashboardConfig,
    configValidationError,
    configErrorCount,
    loadDashboardConfig,
    reloadConfig,
  };
});
