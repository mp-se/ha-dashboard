import { defineStore } from "pinia";
import { ref } from "vue";
import { useConfigStore } from "./configStore";
import {
  createConnection,
  createLongLivedTokenAuth,
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

export const useAuthStore = defineStore("auth", () => {
  const haUrl = ref("");
  const accessToken = ref("");
  const isConnected = ref(false);
  const lastError = ref(null);
  const isLocalMode = ref(import.meta.env.VITE_LOCAL_MODE === "true");
  const developerMode = ref(import.meta.env.VITE_DEVELOPER_MODE === "true");
  const credentialsFromConfig = ref(false);
  const needsCredentials = ref(false);
  const isLoading = ref(true);
  const isInitialized = ref(false);

  const logger = createLogger("authStore");

  let connection = null;

  const setError = (error) => {
    lastError.value = error;
    logger.error("Auth Store Error:", error);
  };

  const clearError = () => {
    lastError.value = null;
  };

  const wrapLibraryError = (error) => {
    // home-assistant-js-websocket sometimes throws the error code directly (numeric)
    const code = error && typeof error === "object" ? error.code : error;

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
      (error && error.message) ||
      (typeof error === "string"
        ? error
        : "Connection error with Home Assistant")
    );
  };

  const loadCredentials = async () => {
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
    const configHa = configStore.dashboardConfig?.haConfig;
    if (configHa?.haUrl && configHa?.accessToken) {
      haUrl.value = configHa.haUrl.trim();
      accessToken.value = configHa.accessToken.trim();
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

  const saveCredentials = async (url, token) => {
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

  const clearCredentials = () => {
    removeSecureItem("ha_url");
    removeSecureItem("ha_token");
    haUrl.value = "";
    accessToken.value = "";
    needsCredentials.value = true;
  };

  const connectWebSocket = async () => {
    if (isLocalMode.value) return;
    if (!haUrl.value || !accessToken.value) {
      throw new Error("Missing credentials for WebSocket connection");
    }

    if (isConnected.value && connection) {
      logger.log("WebSocket already connected");
      return connection;
    }

    try {
      logger.log("Connecting to Home Assistant at:", haUrl.value);
      const auth = createLongLivedTokenAuth(haUrl.value, accessToken.value);
      logger.log("Creating connection to Home Assistant...");
      connection = await createConnection({ auth });

      logger.log("✓ WebSocket connection established successfully");
      isConnected.value = true;
      clearError();

      connection.addEventListener("ready", () => {
        logger.log("WebSocket ready (reconnected)");
        isConnected.value = true;
        clearError();
      });

      connection.addEventListener("disconnected", () => {
        logger.log("WebSocket disconnected");
        isConnected.value = false;
        setError("Disconnected from Home Assistant");
      });

      return connection;
    } catch (error) {
      const wrappedError = wrapLibraryError(error);
      setError(wrappedError);
      isConnected.value = false;
      throw error;
    }
  };

  const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  };

  const callService = async (domain, service, data) => {
    if (isLocalMode.value) {
      logger.warn("Service calls are disabled in local mode");
      return;
    }
    if (!haUrl.value || !accessToken.value) return;
    try {
      const response = await fetch(
        `${haUrl.value}/api/services/${domain}/${service}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
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
    getConnection: () => connection,
    loadCredentials,
    saveCredentials,
    clearCredentials,
    connectWebSocket,
    setError,
    clearError,
    wrapLibraryError,
    fetchWithTimeout,
    callService,
  };
});
