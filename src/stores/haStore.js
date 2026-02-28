import { defineStore } from "pinia";
import { toRef } from "vue";
import { useAuthStore } from "./authStore";
import { createLogger } from "@/utils/logger";
import { useEntitiesStore } from "./entitiesStore";
import { useConfigStore } from "./configStore";
import { useForecastStore } from "./forecastStore";

/**
 * Bridge store that maintains the original useHaStore API
 * while delegating logic to specialized sub-stores.
 * This is the refined bridge implementation using toRef for reliable state linking.
 */
export const useHaStore = defineStore("ha", () => {
  const auth = useAuthStore();
  const entities = useEntitiesStore();
  const config = useConfigStore();
  const forecast = useForecastStore();
  const logger = createLogger("haStore");

  const init = async () => {
    logger.log("=== Starting initialization ===");
    auth.isLoading = true;
    auth.needsCredentials = false;
    auth.clearError();

    try {
      // Step 1: Load dashboard configuration
      logger.log("Step 1: Loading dashboard configuration...");
      await config.loadDashboardConfig();

      // Sync developerMode/localMode from config to auth
      if (config.dashboardConfig?.app?.developerMode !== undefined) {
        auth.developerMode = config.dashboardConfig.app.developerMode;
      }
      if (config.dashboardConfig?.app?.localMode !== undefined) {
        auth.isLocalMode = config.dashboardConfig.app.localMode;
      }

      // Check for JSON errors
      if (
        config.configValidationError?.some((err) =>
          err.message?.includes("JSON"),
        )
      ) {
        auth.isLoading = false;
        return;
      }

      // Step 2: Check for credentials
      const hasCredentials = await auth.loadCredentials();
      logger.log("Credentials loaded:", {
        url: auth.haUrl ? "(set)" : "(missing)",
        token: auth.accessToken ? "(set)" : "(missing)",
        localMode: auth.isLocalMode,
      });

      if (!hasCredentials && !auth.isLocalMode) {
        auth.needsCredentials = true;
        auth.isLoading = false;
        return;
      }

      // Step 3: Load data
      if (auth.isLocalMode) {
        logger.log("Step 3: Loading local data...");
        await entities.loadLocalData();
      } else {
        logger.log("Step 3: Connecting to WebSocket...");
        const conn = await auth.connectWebSocket();
        if (!conn)
          throw new Error("Connection failed: connection object is null");

        logger.log("Step 4: Fetching states and registries...");
        await entities.fetchStates();
        await entities.fetchEntityRegistry();
        await entities.fetchAreaRegistry();
        await entities.fetchDevicesAfterAuth();
        entities.mapEntitiesToDevices();
      }

      logger.log("=== Initialization complete ===");
      auth.isInitialized = true;
      auth.isLoading = false;
    } catch (error) {
      logger.error("=== Initialization error ===", error);
      auth.isLoading = false;
      auth.isInitialized = false;

      // If connection failed and we aren't in local mode, let the user check their credentials
      if (!auth.isLocalMode) {
        auth.needsCredentials = true;
      }

      // Preserve more specific errors if already set
      if (!auth.lastError) {
        const errorMessage =
          typeof error === "number"
            ? `Connection failed (code ${error}). Please check your URL and network.`
            : error.message || "Initialization failed";
        auth.setError(errorMessage);
      }
    }
  };

  const retryConnection = async () => {
    auth.clearError();
    auth.isConnected = false;
    entities.unsubscribeEntities();
    await init();
  };

  const reloadConfig = async () => {
    return await config.reloadConfig(auth, entities);
  };

  return {
    // Linked State from Auth Store
    haUrl: toRef(auth, "haUrl"),
    accessToken: toRef(auth, "accessToken"),
    isConnected: toRef(auth, "isConnected"),
    lastError: toRef(auth, "lastError"),
    isLocalMode: toRef(auth, "isLocalMode"),
    developerMode: toRef(auth, "developerMode"),
    credentialsFromConfig: toRef(auth, "credentialsFromConfig"),
    needsCredentials: toRef(auth, "needsCredentials"),
    isLoading: toRef(auth, "isLoading"),
    isInitialized: toRef(auth, "isInitialized"),

    // Linked State from Entities Store
    entities: toRef(entities, "entities"),
    entityMap: toRef(entities, "entityMap"),
    devices: toRef(entities, "devices"),
    areas: toRef(entities, "areas"),
    forecasts: toRef(forecast, "forecasts"),
    forecastSubscriptions: toRef(forecast, "forecastSubscriptions"),
    forecastSupport: toRef(forecast, "forecastSupport"),
    forecastErrors: toRef(forecast, "forecastErrors"),
    forecastLoading: toRef(forecast, "forecastLoading"),

    // Linked State from Config Store
    dashboardConfig: toRef(config, "dashboardConfig"),
    configValidationError: toRef(config, "configValidationError"),
    configErrorCount: toRef(config, "configErrorCount"),

    // Actions from Auth
    connectWebSocket: auth.connectWebSocket,
    callService: auth.callService,
    fetchWithTimeout: auth.fetchWithTimeout,
    loadCredentials: auth.loadCredentials,
    saveCredentials: auth.saveCredentials,
    clearError: auth.clearError,
    setError: auth.setError,

    // Actions from Entities
    fetchStates: entities.fetchStates,
    loadLocalData: entities.loadLocalData,
    saveLocalData: entities.saveLocalData,
    fetchEntityRegistry: entities.fetchEntityRegistry,
    fetchAreaRegistry: entities.fetchAreaRegistry,
    mapEntitiesToDevices: entities.mapEntitiesToDevices,
    fetchDevicesAfterAuth: entities.fetchDevicesAfterAuth,
    subscribeToWeatherForecast: forecast.subscribeToWeatherForecast,
    fetchHistory: entities.fetchHistory,
    fetchEnergyHistory: entities.fetchEnergyHistory,
    getBatterySensors: entities.getBatterySensors,
    getWifiSensors: entities.getWifiSensors,
    getEntitiesForDevice: entities.getEntitiesForDevice,
    getAll: entities.getAll,
    getSensors: entities.getSensors,
    getLights: entities.getLights,
    getSwitches: entities.getSwitches,
    getSuns: entities.getSuns,
    getFans: entities.getFans,
    getBinarySensors: entities.getBinarySensors,
    getSelects: entities.getSelects,
    getButtons: entities.getButtons,
    getDeviceTrackers: entities.getDeviceTrackers,
    getMediaPlayers: entities.getMediaPlayers,
    getAlarmPanels: entities.getAlarmPanels,
    getWeatherEntities: entities.getWeatherEntities,
    getEnergyConsumptionSensors: entities.getEnergyConsumptionSensors,
    getPowerConsumptionSensors: entities.getPowerConsumptionSensors,
    unsubscribeEntities: entities.unsubscribeEntities,

    // Actions from Config
    loadDashboardConfig: config.loadDashboardConfig,

    // Bridge logic
    init,
    retryConnection,
    reloadConfig,

    // Compatibility aliases
    fetchDevices: entities.fetchDevicesAfterAuth,
    autoFetchWeatherForecasts: () => {
      entities.getWeatherEntities().forEach((e) => {
        const feat = e.attributes?.supported_features || 0;
        let type = "daily";
        if (feat & 1) type = "daily";
        else if (feat & 2) type = "hourly";
        else if (feat & 4) type = "twice_daily";
        forecast.subscribeToWeatherForecast(e.entity_id, type);
      });
    },
  };
});
