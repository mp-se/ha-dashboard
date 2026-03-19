import { defineStore } from "pinia";
import { ref, Ref } from "vue";
import { useConfigStore } from "./configStore";
import {
  createConnection,
  createLongLivedTokenAuth,
  Connection,
  Auth,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
} from "home-assistant-js-websocket";
import { createLogger } from "@/utils/logger";
import {
  getSecureItem,
  setSecureItem,
  removeSecureItem,
  isCryptoSupported,
} from "@/utils/secureStorage";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import { TIMEOUT_SERVICE_CALL } from "@/utils/constants";
import type {
  ServiceCallData,
  DashboardConfig,
  Logger as LoggerInterface,
} from "@/types";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export const useAuthStore = defineStore("auth", () => {
  const haUrl: Ref<string> = ref("");
  const accessToken: Ref<string> = ref("");
  const isConnected: Ref<boolean> = ref(false);
  const lastError: Ref<string | null> = ref(null);
  const isLocalMode: Ref<boolean> = ref(
    import.meta.env.VITE_LOCAL_MODE === "true",
  );
  const developerMode: Ref<boolean> = ref(
    import.meta.env.VITE_DEVELOPER_MODE === "true",
  );
  const credentialsFromConfig: Ref<boolean> = ref(false);
  const needsCredentials: Ref<boolean> = ref(false);
  const isLoading: Ref<boolean> = ref(true);
  const isInitialized: Ref<boolean> = ref(false);

  const logger = createLogger("authStore");

  let connection: Connection | null = null;
  let onReadyHandler: (() => void) | null = null;
  let onDisconnectedHandler: (() => void) | null = null;
  let onErrorHandler: ((error: unknown) => void) | null = null;

  const setError = (error: unknown): void => {
    lastError.value = String(error);
    logger.error("Auth Store Error:", error);
  };

  const clearError = (): void => {
    lastError.value = null;
  };

  const wrapLibraryError = (error: unknown): string => {
    // home-assistant-js-websocket sometimes throws the error code directly (numeric)
    const code =
      error && typeof error === "object"
        ? (error as Record<string, unknown>).code
        : error;

    if (code === ERR_INVALID_AUTH || code === "invalid_auth") {
      return "Authentication failed: Invalid access token. Check your VITE_HA_TOKEN.";
    }
    if (
      code === ERR_CANNOT_CONNECT ||
      code === "cannot_connect" ||
      code === 1
    ) {
      // Check if it's an IP-based URL with HTTPS
      const urlStr = haUrl.value || "";
      const isIpWithHttps =
        urlStr.startsWith("https://") &&
        /https?:\/\/(\[.*\]|\d+\.\d+\.\d+\.\d+)/.test(urlStr);
      if (isIpWithHttps) {
        return `Connection failed: Secure connection to ${haUrl.value} rejected. Ensure you have trusted the Home Assistant certificate at this IP in your browser first.`;
      }
      return `Failed to connect to Home Assistant at ${haUrl.value}. Check URL and network connectivity.`;
    }
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes("Failed to fetch")
    ) {
      return `CORS or SSL error: Home Assistant server at ${haUrl.value} does not allow cross-origin requests or has an untrusted certificate. Ensure you can visit the URL in your browser and accept any certificate warnings.`;
    }
    return (
      (error && typeof error === "object" && "message" in error
        ? (error as Record<string, unknown>).message
        : null) ||
      (typeof error === "string"
        ? error
        : "Connection error with Home Assistant")
    );
  };

  const loadCredentials = async (): Promise<boolean> => {
    // Priority 1: Encrypted localStorage (user-provided override)
    try {
      if (isCryptoSupported()) {
        const savedUrl = await getSecureItem("ha_url");
        const savedToken = await getSecureItem("ha_token");
        if (savedUrl && savedToken) {
          haUrl.value = savedUrl.trim();
          accessToken.value = savedToken.trim();
          credentialsFromConfig.value = false;
          logger.log(
            "✓ Using encrypted credentials from localStorage (override)",
          );
          return true;
        }
      } else {
        logger.warn("Web Crypto API not supported, falling back to config/env");
      }
    } catch (error) {
      logger.error("Failed to load encrypted credentials:", error);
      // Fall through to other credential sources
    }

    // Priority 2: Dashboard config (provided template)
    const configStore = useConfigStore();
    const configHa = (configStore.dashboardConfig as Record<string, unknown>)
      ?.haConfig as Record<string, unknown> | undefined;
    if (configHa?.haUrl && configHa?.accessToken) {
      haUrl.value = String(configHa.haUrl).trim();
      accessToken.value = String(configHa.accessToken).trim();
      credentialsFromConfig.value = true;
      logger.log("✓ Using credentials from dashboard config");
      return true;
    }

    // Priority 3: Environment variables (Vite legacy)
    const envUrl = import.meta.env.VITE_HA_URL;
    const envToken = import.meta.env.VITE_HA_TOKEN;
    if (envUrl && envToken) {
      haUrl.value = envUrl.trim();
      accessToken.value = envToken.trim();
      credentialsFromConfig.value = true;
      logger.log("✓ Using credentials from environment variables");
      return true;
    }

    return false;
  };

  const saveCredentials = async (url: string, token: string): Promise<void> => {
    try {
      if (isCryptoSupported()) {
        await setSecureItem("ha_url", url);
        await setSecureItem("ha_token", token);
        logger.log("✓ Credentials encrypted and saved");
      } else {
        logger.warn("Web Crypto API not supported, credentials not saved");
      }
      haUrl.value = url;
      accessToken.value = token;
      credentialsFromConfig.value = false;
      needsCredentials.value = false;
    } catch (error) {
      logger.error("Failed to save encrypted credentials:", error);
      throw new Error("Failed to save credentials securely");
    }
  };

  const clearCredentials = (): void => {
    removeSecureItem("ha_url");
    removeSecureItem("ha_token");
    haUrl.value = "";
    accessToken.value = "";
    needsCredentials.value = true;
  };

  const connectWebSocket = async (): Promise<Connection | undefined> => {
    if (isLocalMode.value) return undefined;
    if (!haUrl.value || !accessToken.value) {
      throw new Error("Missing credentials for WebSocket connection");
    }

    if (isConnected.value && connection) {
      logger.log("WebSocket already connected");
      return connection;
    }

    try {
      // Clean up existing listeners to prevent memory leak on reconnection
      if (connection) {
        if (onReadyHandler)
          connection.removeEventListener("ready", onReadyHandler);
        if (onDisconnectedHandler)
          connection.removeEventListener("disconnected", onDisconnectedHandler);
        if (onErrorHandler)
          connection.removeEventListener("error", onErrorHandler);
        connection.close();
      }

      logger.log("Connecting to Home Assistant at:", haUrl.value);
      const auth: Auth = createLongLivedTokenAuth(
        haUrl.value,
        accessToken.value,
      );
      logger.log("Creating connection to Home Assistant...");
      connection = await createConnection({ auth });

      logger.log("✓ WebSocket connection established successfully");
      isConnected.value = true;
      clearError();

      // Define handler functions as references to enable cleanup
      onReadyHandler = () => {
        try {
          logger.log("WebSocket ready (reconnected)");
          isConnected.value = true;
          clearError();
        } catch (error) {
          logger.error("Error in WebSocket ready handler:", error);
          setError(`Connection error: ${error}`);
        }
      };

      onDisconnectedHandler = () => {
        try {
          logger.log("WebSocket disconnected");
          isConnected.value = false;
          setError("Disconnected from Home Assistant");
        } catch (error) {
          logger.error("Error in WebSocket disconnected handler:", error);
        }
      };

      onErrorHandler = (error: unknown) => {
        try {
          logger.error("WebSocket error event:", error);
          const wrappedError = wrapLibraryError(error);
          setError(wrappedError);
          isConnected.value = false;
        } catch (handlerError) {
          logger.error("Error in WebSocket error handler:", handlerError);
        }
      };

      connection.addEventListener("ready", onReadyHandler);
      connection.addEventListener("disconnected", onDisconnectedHandler);
      connection.addEventListener("error", onErrorHandler);

      return connection;
    } catch (error) {
      const wrappedError = wrapLibraryError(error);
      setError(wrappedError);
      isConnected.value = false;
      throw error;
    }
  };

  const callService = async (
    domain: string,
    service: string,
    data: ServiceCallData,
  ): Promise<void> => {
    if (isLocalMode.value) {
      logger.warn("Service calls are disabled in local mode");
      return;
    }
    if (!haUrl.value || !accessToken.value) return;
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken.value}`,
        "Content-Type": "application/json",
      };

      // Fetch and include CSRF token for security
      try {
        const csrfResponse = await fetchWithTimeout(
          `${haUrl.value}/api/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken.value}`,
            },
          },
          TIMEOUT_SERVICE_CALL,
        );
        if (csrfResponse.ok) {
          const config = (await csrfResponse.json()) as Record<string, unknown>;
          if (config.csrf_token && typeof config.csrf_token === "string") {
            headers["X-CSRF-Token"] = config.csrf_token;
          }
        }
      } catch (csrfError) {
        logger.warn("Failed to fetch CSRF token:", csrfError);
        // Continue without CSRF token - not all Home Assistant setups require it
      }

      const response = await fetchWithTimeout(
        `${haUrl.value}/api/services/${domain}/${service}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        },
        TIMEOUT_SERVICE_CALL,
      );
      if (!response.ok) {
        let errorMessage = `Service call failed: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage =
            "Authentication failed: Invalid access token. Please check VITE_HA_TOKEN.";
        } else if (response.status === 403) {
          errorMessage =
            "Access forbidden: Check CORS settings or permissions in Home Assistant.";
        } else if (response.status === 404) {
          errorMessage =
            "Service not found: Verify domain and service are correct.";
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        logger.error("CORS or network error calling service:", error);
        throw new Error(
          `CORS error: Home Assistant server at ${haUrl.value} does not allow cross-origin requests. Ensure CORS is configured properly in Home Assistant.`,
        );
      }
      logger.error("Error calling service:", error);
      throw error;
    }
  };

  /**
   * Toggle developer mode with password protection
   * Validates password against config and toggles developerMode state
   * @param password - Password to validate
   * @returns true if toggle successful, false if password invalid or not configured
   */
  const toggleDeveloperMode = (password: string): boolean => {
    const configStore = useConfigStore();
    const appConfig = (configStore.dashboardConfig as Record<string, unknown>)
      ?.app as Record<string, unknown> | undefined;

    // Check if password is configured
    if (!appConfig?.password) {
      logger.warn("Developer password not configured in dashboard config");
      return false;
    }

    // Validate password
    if (password !== String(appConfig.password)) {
      logger.warn("Invalid developer password");
      return false;
    }

    // Toggle mode
    developerMode.value = !developerMode.value;
    logger.log(
      `✓ Developer mode ${developerMode.value ? "enabled" : "disabled"}`,
    );
    return true;
  };

  return {
    haUrl,
    accessToken,
    isConnected,
    lastError,
    isLocalMode,
    developerMode,
    credentialsFromConfig,
    needsCredentials,
    isLoading,
    isInitialized,
    getConnection: (): Connection | null => connection,
    loadCredentials,
    saveCredentials,
    clearCredentials,
    connectWebSocket,
    setError,
    clearError,
    wrapLibraryError,
    fetchWithTimeout,
    callService,
    toggleDeveloperMode,
  };
});
