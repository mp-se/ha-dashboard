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
import type { ServiceCallData } from "@/types";
import { sendWsMessage } from "@/utils/wsRequest";

export const useAuthStore = defineStore("auth", () => {
  const haUrl: Ref<string> = ref("");
  const accessToken: Ref<string> = ref("");
  const isConnected: Ref<boolean> = ref(false);
  const lastError: Ref<string | null> = ref(null);
  const isLocalMode: Ref<boolean> = ref(
    (import.meta as any).env.VITE_LOCAL_MODE === "true",
  );
  const developerMode: Ref<boolean> = ref(
    (import.meta as any).env.VITE_DEVELOPER_MODE === "true",
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
      return "Authentication Error: Invalid access token. Please check your credentials and try again.";
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
        return `Certificate Validation Error: Your browser does not trust the Home Assistant certificate at ${haUrl.value}. Open the URL in your browser and accept the certificate warning first.`;
      }
      return `Server Not Found: Unable to connect to Home Assistant at ${haUrl.value}. Please check the URL, ensure Home Assistant is running, and verify your network connection.`;
    }
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes("Failed to fetch")
    ) {
      return `CORS/Security Error: Home Assistant server at ${haUrl.value} is not configured to accept requests from this application. This may be due to CORS settings or an untrusted SSL certificate. Ensure you can access the URL directly in your browser.`;
    }
    return (
      (error && typeof error === "object" && "message" in error
        ? (error as Record<string, unknown>).message
        : null) ||
      (typeof error === "string"
        ? error
        : "Connection error with Home Assistant")
    ) as string;
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
    const envUrl = (import.meta as any).env.VITE_HA_URL;
    const envToken = (import.meta as any).env.VITE_HA_TOKEN;
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
          connection.removeEventListener("error" as any, onErrorHandler);
        connection.close();
      }

      // Normalize URL: remove trailing slash and whitespace to prevent malformed WebSocket URL
      // This handles URLs from any source: user input, localStorage, or config file
      const normalizedUrl = haUrl.value.trim().replace(/\/$/, "");
      logger.log("Connecting to Home Assistant at:", normalizedUrl);
      const auth: Auth = createLongLivedTokenAuth(
        normalizedUrl,
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
      connection.addEventListener("error" as any, onErrorHandler);

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
      // Use WebSocket exclusively for service calls to avoid native CORS issues
      if (!connection) {
        throw new Error(
          "No WebSocket connection available for service call. Connect via WebSocket before calling services.",
        );
      }

      try {
        await sendWsMessage(connection, {
          type: "call_service",
          domain,
          service,
          service_data: data,
        });
        return;
      } catch (wsErr) {
        logger.error("WebSocket service call failed:", wsErr);
        throw wsErr;
      }
    } catch (error) {
      logger.error("Error calling service:", error);
      throw error;
    }
  };

  /**
   * Toggle developer mode with password protection
   * Validates password against config and toggles developerMode state.
   * If no password is configured, developer mode can be toggled freely.
   * @param password - Password to validate (ignored when no password is configured)
   * @returns true if toggle successful, false if password is wrong
   */
  const toggleDeveloperMode = (password: string): boolean => {
    // Only require password when enabling, not when disabling
    if (!developerMode.value) {
      // Enabling - validate password
      const configStore = useConfigStore();
      const appConfig = (configStore.dashboardConfig as Record<string, unknown>)
        ?.app as Record<string, unknown> | undefined;

      const configuredPassword = appConfig?.password
        ? String(appConfig.password).trim()
        : "";

      // If a password is configured, validate it
      if (configuredPassword) {
        if (password !== configuredPassword) {
          logger.warn("Invalid developer password");
          return false;
        }
      }
      // No password configured — allow freely
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
