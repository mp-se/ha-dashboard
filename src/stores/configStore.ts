import { defineStore } from "pinia";
import { ref, Ref } from "vue";
import { validateConfig } from "../utils/configValidator";
import { createLogger } from "@/utils/logger";
import { useAuthStore } from "./authStore";
import parseJSON from "json-parse-even-better-errors";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import { TIMEOUT_CONFIG } from "@/utils/constants";

interface ValidationError {
  message: string;
  line?: number;
  column?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  errorCount: number;
}

export const useConfigStore = defineStore("config", () => {
  const dashboardConfig: Ref<unknown> = ref(null);
  const configValidationError: Ref<ValidationError[] | null> = ref(null);
  const configErrorCount: Ref<number> = ref(0);
  const logger = createLogger("configStore");

  const loadDashboardConfig = async (): Promise<ValidationResult> => {
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const configUrl = baseUrl + "data/dashboard-config.json";
      const response = await fetchWithTimeout(configUrl, {}, TIMEOUT_CONFIG);

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
      let config: unknown;
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
        const error = e as Record<string, unknown>;
        const line = (error.line as number) || 1;
        const columnMatch = (error.message as string)?.match(/position (\d+)/);
        const column = (error.column as number) || (columnMatch ? Number(columnMatch[1]) : 0);
        return {
          valid: false,
          errors: [
            {
              message: `JSON syntax error: ${error.message} (line ${line}, column ${column})`,
              line: line,
              column: column,
            },
          ],
          errorCount: 1,
        };
      }

      if (config && typeof config === "object") {
        for (const sym of Object.getOwnPropertySymbols(config)) {
          delete (config as Record<symbol, unknown>)[sym];
        }
      }

      const validationResult = validateConfig(config);
      dashboardConfig.value = config;

      if (!validationResult.valid) {
        configValidationError.value = validationResult.errors;
        configErrorCount.value = validationResult.errorCount;
      } else {
        configValidationError.value = null;
        configErrorCount.value = 0;
      }

      // Sync settings to authStore if it's initialized
      const authStore = useAuthStore();
      const configObj = config as Record<string, unknown> | null;
      if (configObj?.app && typeof configObj.app === "object") {
        const appConfig = configObj.app as Record<string, unknown>;
        if (appConfig.developerMode !== undefined) {
          authStore.developerMode = Boolean(appConfig.developerMode);
        }
        if (appConfig.localMode !== undefined) {
          authStore.isLocalMode = Boolean(appConfig.localMode);
        }
      }

      return validationResult;
    } catch (error) {
      logger.error("Error loading dashboard config:", error);
      return {
        valid: false,
        errors: [{ message: (error as Record<string, unknown>).message as string || "Unknown error loading config" }],
        errorCount: 1,
      };
    }
  };

  const reloadConfig = async (authStore: ReturnType<typeof useAuthStore>, entitiesStore: unknown): Promise<ValidationResult> => {
    try {
      logger.log("Reloading dashboard configuration...");
      const currentUrl = authStore.haUrl;
      const currentToken = authStore.accessToken;

      const validationResult = await loadDashboardConfig();

      if (currentUrl) authStore.haUrl = currentUrl;
      if (currentToken) authStore.accessToken = currentToken;

      const entitiesStoreTyped = entitiesStore as {
        loadLocalData: () => Promise<void>;
      };
      if (authStore.isLocalMode) {
        logger.log("Reloading local data...");
        await entitiesStoreTyped.loadLocalData();
      }

      return validationResult;
    } catch (error) {
      logger.error("Error reloading config:", error);
      return {
        valid: false,
        errors: [(error as Record<string, unknown>).message as string || "Failed to reload configuration"],
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
