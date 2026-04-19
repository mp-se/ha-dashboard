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
    const nativeLoader = (window as any).__nativeConfigLoader;
    if (nativeLoader) {
      logger.log("[Native Mode] loadDashboardConfig via native hook");

      try {
        const config = await nativeLoader();
        logger.log(
          "[Native Mode] config loaded, views:",
          (config as any)?.views?.length ?? 0,
        );
        const validationResult = validateConfig(config);
        dashboardConfig.value = config;
        configValidationError.value = validationResult.valid
          ? null
          : validationResult.errors;
        configErrorCount.value = validationResult.errorCount;
        return validationResult;
      } catch (error) {
        logger.error("[Native Mode] Error from native config loader:", error);
        dashboardConfig.value = { views: [] };
        return { valid: true, errors: [], errorCount: 0 };
      }
    }

    // Server mode: load from HTTP
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const configUrl = baseUrl + "data/dashboard-config.json";

      try {
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
          const columnMatch = (error.message as string)?.match(
            /position (\d+)/,
          );
          const column =
            (error.column as number) ||
            (columnMatch ? Number(columnMatch[1]) : 0);
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
      } catch (fetchError) {
        // Network/CORS error during fetch
        const errorMsg =
          ((fetchError as Record<string, unknown>)?.message as string) ||
          String(fetchError);

        logger.error("Error loading dashboard config:", fetchError);
        return {
          valid: false,
          errors: [
            {
              message: `Failed to fetch config: ${errorMsg}`,
            },
          ],
          errorCount: 1,
        };
      }
    } catch (error) {
      // Outer catch for any other errors
      logger.error("Error loading dashboard config:", error);
      return {
        valid: false,
        errors: [
          {
            message:
              ((error as Record<string, unknown>).message as string) ||
              "Unknown error loading config",
          },
        ],
        errorCount: 1,
      };
    }
  };

  const reloadConfig = async (
    authStore: ReturnType<typeof useAuthStore>,
    entitiesStore: unknown,
  ): Promise<ValidationResult> => {
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
        errors: [
          ((error as Record<string, unknown>).message as string) ||
            "Failed to reload configuration",
        ],
        errorCount: 1,
      };
    }
  };

  /**
   * Add a new view to the dashboard config
   */
  const addView = (newView: {
    name: string;
    label: string;
    icon: string;
    hidden?: boolean;
    entities?: unknown[];
  }): void => {
    const config = dashboardConfig.value as Record<string, unknown> | null;
    if (!config || !Array.isArray(config.views)) return;

    // Check if view already exists
    if (
      config.views.some((v: Record<string, unknown>) => v.name === newView.name)
    ) {
      logger.warn(`View "${newView.name}" already exists`);
      return;
    }

    config.views.push({
      name: newView.name,
      label: newView.label,
      icon: newView.icon,
      hidden: newView.hidden || false,
      entities: newView.entities || [],
    });

    logger.log(`View "${newView.name}" added`);
  };

  /**
   * Update an existing view's properties
   */
  const updateView = (
    viewName: string,
    updates: Record<string, unknown>,
  ): void => {
    const config = dashboardConfig.value as Record<string, unknown> | null;
    if (!config || !Array.isArray(config.views)) return;

    const viewIndex = config.views.findIndex(
      (v: Record<string, unknown>) => v.name === viewName,
    );
    if (viewIndex === -1) {
      logger.warn(`View "${viewName}" not found`);
      return;
    }

    Object.assign(config.views[viewIndex], updates);
    logger.log(`View "${viewName}" updated`);
  };

  /**
   * Delete a view from the dashboard config
   */
  const deleteView = (viewName: string): void => {
    const config = dashboardConfig.value as Record<string, unknown> | null;
    if (!config || !Array.isArray(config.views)) return;

    const viewIndex = config.views.findIndex(
      (v: Record<string, unknown>) => v.name === viewName,
    );
    if (viewIndex === -1) {
      logger.warn(`View "${viewName}" not found`);
      return;
    }

    // Prevent deleting the last view
    if (config.views.length === 1) {
      logger.warn("Cannot delete the last view");
      return;
    }

    config.views.splice(viewIndex, 1);
    logger.log(`View "${viewName}" deleted`);
  };

  /**
   * Save the dashboard config to a JSON file
   */
  const saveDashboardConfig = (): void => {
    try {
      if (!dashboardConfig.value) return;

      const jsonString = JSON.stringify(dashboardConfig.value, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dashboard-config.json";
      link.click();
      URL.revokeObjectURL(url);
      logger.log("Dashboard config downloaded");
    } catch (error) {
      logger.error("Error saving dashboard config:", error);
    }
  };

  /**
   * Save config to backend server via POST /api/config
   * Creates timestamped backup of existing config
   * @returns true if save successful, false otherwise
   */
  const saveConfigToBackend = async (config: unknown): Promise<boolean> => {
    const nativeSaver = (window as any).__nativeConfigSaver;
    if (nativeSaver) {
      logger.log("[Native Mode] saveConfigToBackend via native hook");

      try {
        const success = await nativeSaver(config);
        if (success) {
          dashboardConfig.value = config;
          localStorage.removeItem("dashboardConfigDraft");
        }
        logger.log("[Native Mode] save result:", success);
        return !!success;
      } catch (error) {
        logger.error("[Native Mode] Error from native config saver:", error);
        return false;
      }
    }

    try {
      const password =
        ((dashboardConfig.value as Record<string, unknown>) || {})?.app
          ?.password || ("" as string);

      if (!password) {
        logger.warn(
          "Editor password not configured in config, skipping backend save",
        );
        return false;
      }

      // Development: VITE_API_URL env var points to localhost:3000
      // Production: Uses BASE_URL (app served with Nginx /api/ proxy to localhost:3000)
      const apiBaseUrl =
        (import.meta.env.VITE_API_URL as string) ||
        (import.meta.env.BASE_URL as string) ||
        "/";
      const apiUrl =
        apiBaseUrl + (apiBaseUrl.endsWith("/") ? "api/config" : "/api/config");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        let errorMsg = "Failed to save config";
        try {
          const errorData = (await response.json()) as Record<string, unknown>;
          errorMsg = (errorData.error as string) || errorMsg;
        } catch {
          // Response not JSON, use generic message
        }
        throw new Error(errorMsg);
      }

      const result = (await response.json()) as Record<string, unknown>;
      const backupPath =
        ((result.data as Record<string, unknown>)?.backupPath as string) || "";
      logger.log("✓ Dashboard config saved to server:", backupPath);

      // Clear draft from local storage after successful save
      localStorage.removeItem("dashboardConfigDraft");

      return true;
    } catch (error) {
      logger.error("Error saving dashboard config to server:", error);
      return false;
    }
  };

  return {
    dashboardConfig,
    configValidationError,
    configErrorCount,
    loadDashboardConfig,
    reloadConfig,
    addView,
    updateView,
    deleteView,
    saveDashboardConfig,
    saveConfigToBackend,
  };
});
