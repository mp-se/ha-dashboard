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
import { computed, ref, Ref } from "vue";
import { validateConfig } from "../utils/configValidator";
import { createLogger } from "@/utils/logger";
import { useAuthStore } from "./authStore";
import parseJSON from "json-parse-even-better-errors";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import { TIMEOUT_CONFIG } from "@/utils/constants";

const DASHBOARD_CONFIG_CACHE_KEY = "dashboard-config";

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
  const serverAuthEnabled: Ref<boolean> = ref(false);
  const serverAuthenticated: Ref<boolean> = ref(false);
  // "viewer" sessions are read-only; null when the server has no login (static/demo)
  const serverRole: Ref<"editor" | "viewer" | null> = ref(null);
  const isViewer = computed(() => serverRole.value === "viewer");
  const needsServerLogin: Ref<boolean> = ref(false);
  const hasCachedDashboardConfig: Ref<boolean> = ref(false);
  const isUsingCachedConfig: Ref<boolean> = ref(false);
  const serverLoginError: Ref<string | null> = ref(null);
  const logger = createLogger("configStore");

  const getApiUrl = (path: string): string => {
    const apiBaseUrl =
      import.meta.env.VITE_API_URL || import.meta.env.BASE_URL || "/";
    const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
    return `${base}api/${path}`;
  };

  // The public demo build embeds sample data instead of talking to a server.
  const isDemo = (): boolean => import.meta.env.VITE_DEMO === "true";

  const loadDemoConfig = async (): Promise<ValidationResult> => {
    const { demoConfig } = await import("virtual:demo-data");
    serverAuthEnabled.value = false;
    serverAuthenticated.value = false;
    serverRole.value = null;
    needsServerLogin.value = false;
    return applyConfig(structuredClone(demoConfig), { authenticated: true });
  };

  const cacheSafeConfig = (config: unknown): void => {
    if (!config || typeof config !== "object" || Array.isArray(config)) return;
    const snapshot = JSON.parse(JSON.stringify(config)) as Record<
      string,
      unknown
    >;
    if (snapshot.app && typeof snapshot.app === "object") {
      delete (snapshot.app as Record<string, unknown>).password;
    }
    if (snapshot.haConfig && typeof snapshot.haConfig === "object") {
      delete (snapshot.haConfig as Record<string, unknown>).accessToken;
    }
    try {
      localStorage.setItem(
        DASHBOARD_CONFIG_CACHE_KEY,
        JSON.stringify(snapshot),
      );
      hasCachedDashboardConfig.value = true;
    } catch (error) {
      logger.warn("Unable to cache dashboard configuration:", error);
    }
  };

  const applyConfig = async (
    config: unknown,
    options: { authenticated?: boolean; cached?: boolean } = {},
  ): Promise<ValidationResult> => {
    const authStore = useAuthStore();
    const configObject = config as Record<string, unknown> | null;
    const haConfig = configObject?.haConfig as
      Record<string, unknown> | undefined;
    const haUrl = typeof haConfig?.haUrl === "string" ? haConfig.haUrl : "";
    const accessToken =
      typeof haConfig?.accessToken === "string" ? haConfig.accessToken : "";
    if (haUrl && accessToken) {
      try {
        await authStore.saveCredentials(haUrl, accessToken);
      } catch (error) {
        logger.warn("Could not persist Home Assistant credentials:", error);
        authStore.haUrl = haUrl;
        authStore.accessToken = accessToken;
      }
      authStore.credentialsFromConfig = true;
    }

    if (configObject?.app && typeof configObject.app === "object") {
      delete (configObject.app as Record<string, unknown>).password;
    }
    if (haConfig && "accessToken" in haConfig) haConfig.accessToken = "";

    const validationResult = validateConfig(config);
    dashboardConfig.value = config;
    configValidationError.value = validationResult.valid
      ? null
      : validationResult.errors;
    configErrorCount.value = validationResult.errorCount;
    isUsingCachedConfig.value = options.cached ?? false;

    if (options.authenticated) cacheSafeConfig(config);
    const appConfig = configObject?.app as Record<string, unknown> | undefined;
    if (appConfig) {
      if (appConfig.developerMode !== undefined) {
        authStore.developerMode = Boolean(appConfig.developerMode);
      }
      if (appConfig.localMode !== undefined) {
        authStore.isLocalMode = Boolean(appConfig.localMode);
      }
    }
    // Viewers never get the editor/developer tools (the server enforces this too).
    if (isViewer.value) authStore.developerMode = false;
    return validationResult;
  };

  const loadCachedConfig = async (): Promise<ValidationResult | null> => {
    try {
      const cached = localStorage.getItem(DASHBOARD_CONFIG_CACHE_KEY);
      if (!cached) return null;
      const result = await applyConfig(parseJSON(cached), { cached: true });
      cacheSafeConfig(dashboardConfig.value);
      hasCachedDashboardConfig.value = true;
      return result;
    } catch (error) {
      logger.warn("Ignoring invalid cached dashboard configuration:", error);
      localStorage.removeItem(DASHBOARD_CONFIG_CACHE_KEY);
      hasCachedDashboardConfig.value = false;
      return null;
    }
  };

  const refreshConfigInBackground = async (): Promise<void> => {
    try {
      const response = await fetchWithTimeout(
        getApiUrl("config"),
        { credentials: "include", cache: "no-store" },
        TIMEOUT_CONFIG,
      );
      if (response.status === 401 || response.status === 503) {
        serverAuthEnabled.value = true;
        serverAuthenticated.value = false;
        needsServerLogin.value = true;
        return;
      }
      if (response.ok) {
        serverAuthEnabled.value = true;
        serverAuthenticated.value = true;
        needsServerLogin.value = false;
        const payload = await response.json();
        if (payload.role) serverRole.value = payload.role;
        await applyConfig(payload.data ?? payload, { authenticated: true });
      }
      // Any other status: keep showing the cached dashboard.
    } catch (error) {
      logger.log(
        "Dashboard refresh deferred while server is unavailable",
        error,
      );
    }
  };

  const loadDashboardConfig = async (
    forceRefresh = false,
  ): Promise<ValidationResult> => {
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

    if (isDemo()) return loadDemoConfig();

    serverLoginError.value = null;
    isUsingCachedConfig.value = false;

    const cachedConfig = await loadCachedConfig();
    if (cachedConfig && !forceRefresh) {
      void refreshConfigInBackground();
      return cachedConfig;
    }

    try {
      const response = await fetchWithTimeout(
        getApiUrl("config"),
        { credentials: "include", cache: "no-store" },
        TIMEOUT_CONFIG,
      );

      if (response.status === 401 || response.status === 503) {
        serverAuthEnabled.value = true;
        serverAuthenticated.value = false;
        needsServerLogin.value = true;
        const cached = await loadCachedConfig();
        return (
          cached ?? {
            valid: false,
            errors: [
              {
                message:
                  response.status === 503
                    ? "Server authentication is not configured."
                    : "Sign in to load the dashboard configuration.",
              },
            ],
            errorCount: 1,
          }
        );
      }

      if (response.ok) {
        serverAuthEnabled.value = true;
        serverAuthenticated.value = true;
        needsServerLogin.value = false;
        const payload = await response.json();
        if (payload.role) serverRole.value = payload.role;
        return await applyConfig(payload.data ?? payload, {
          authenticated: true,
        });
      }

      // The configuration is only ever served by the API: no file fallback.
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      logger.warn(
        "Dashboard server unavailable; trying cached configuration",
        error,
      );
      const cached = await loadCachedConfig();
      if (cached) return cached;

      return {
        valid: false,
        errors: [
          {
            message: `Failed to load dashboard configuration: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        errorCount: 1,
      };
    }
  };

  const loginToServer = async (password: string): Promise<boolean> => {
    serverLoginError.value = null;
    try {
      const response = await fetch(getApiUrl("session/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        serverLoginError.value =
          response.status === 429
            ? "Too many attempts. Wait a few minutes and try again."
            : response.status === 503
              ? "Server authentication is not configured."
              : "Incorrect password.";
        return false;
      }
      serverAuthEnabled.value = true;
      serverAuthenticated.value = true;
      needsServerLogin.value = false;
      const login = await response.json().catch(() => ({}));
      serverRole.value = login?.role === "viewer" ? "viewer" : "editor";
      const result = await loadDashboardConfig(true);
      if (!result.valid) {
        serverLoginError.value =
          "Signed in, but the dashboard configuration is invalid.";
      }
      return result.valid;
    } catch (error) {
      serverLoginError.value =
        error instanceof Error ? error.message : String(error);
      return false;
    }
  };

  const logoutFromServer = async (): Promise<void> => {
    try {
      await fetch(getApiUrl("session/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      serverAuthenticated.value = false;
      serverRole.value = null;
      needsServerLogin.value = true;
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
      const response = await fetch(getApiUrl("config"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        if (response.status === 401) {
          serverAuthEnabled.value = true;
          serverAuthenticated.value = false;
          needsServerLogin.value = true;
        }
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
      dashboardConfig.value = config;
      cacheSafeConfig(config);
      isUsingCachedConfig.value = false;

      return true;
    } catch (error) {
      logger.error("Error saving dashboard config to server:", error);
      return false;
    }
  };

  const listConfigBackups = async (): Promise<
    Array<{ sequence: number; createdAt: string }>
  > => {
    const response = await fetch(getApiUrl("config/backups"), {
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        serverAuthEnabled.value = true;
        serverAuthenticated.value = false;
        needsServerLogin.value = true;
      }
      throw new Error("Could not load saved dashboard versions");
    }
    const result = (await response.json()) as {
      data?: { backups?: Array<{ sequence: number; createdAt: string }> };
    };
    return result.data?.backups ?? [];
  };

  const restoreConfigBackup = async (sequence: number): Promise<boolean> => {
    const response = await fetch(getApiUrl("config/restore"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        serverAuthEnabled.value = true;
        serverAuthenticated.value = false;
        needsServerLogin.value = true;
      }
      return false;
    }

    const validation = await loadDashboardConfig();
    return validation.valid;
  };

  return {
    dashboardConfig,
    configValidationError,
    configErrorCount,
    serverAuthEnabled,
    serverAuthenticated,
    serverRole,
    isViewer,
    needsServerLogin,
    hasCachedDashboardConfig,
    isUsingCachedConfig,
    serverLoginError,
    loadDashboardConfig,
    loginToServer,
    logoutFromServer,
    reloadConfig,
    addView,
    updateView,
    deleteView,
    saveDashboardConfig,
    saveConfigToBackend,
    listConfigBackups,
    restoreConfigBackup,
  };
});
