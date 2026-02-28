import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./authStore";
import { useEntitiesStore } from "./entitiesStore";

/**
 * Store responsible for managing weather forecast subscriptions and their state.
 * Extracted from entitiesStore to keep each store cohesive and single-purpose.
 */
export const useForecastStore = defineStore("forecast", () => {
  const authStore = useAuthStore();

  const forecasts = ref({});
  const forecastSubscriptions = ref({});
  const forecastSupport = ref({});
  const forecastErrors = ref({});
  const forecastLoading = ref({});

  /**
   * Subscribe to real-time forecast data for a weather entity.
   * @param {string} entityId - The weather entity ID.
   * @param {string} [forecastType="daily"] - Forecast type: "daily", "hourly", or "twice_daily".
   */
  const subscribeToWeatherForecast = async (
    entityId,
    forecastType = "daily",
  ) => {
    // Avoid duplicate subscriptions
    if (entityId in forecastSubscriptions.value) return;

    const entitiesStore = useEntitiesStore();
    const entity = entitiesStore.entityMap.get(entityId);
    if (!entity) {
      forecastErrors.value[entityId] = "Entity not found";
      return;
    }

    const connection = authStore.getConnection();
    if (!connection) {
      forecastErrors.value[entityId] = "WebSocket not connected";
      return;
    }

    try {
      forecastLoading.value[entityId] = true;
      const unsubscribe = await connection.subscribeMessage(
        (forecastData) => {
          if (forecastData && forecastData.forecast) {
            forecasts.value[entityId] = {
              type: forecastData.type || forecastType,
              data: forecastData.forecast,
              timestamp: Date.now(),
            };
            // Mirror forecast into entity attributes for components that read it there
            const ent = entitiesStore.entityMap.get(entityId);
            if (ent) {
              if (!ent.attributes) ent.attributes = {};
              ent.attributes.forecast = forecastData.forecast;
            }
            forecastLoading.value[entityId] = false;
            forecastErrors.value[entityId] = null;
          }
        },
        {
          type: "weather/subscribe_forecast",
          entity_id: entityId,
          forecast_type: forecastType,
        },
        { resubscribe: true },
      );
      forecastSubscriptions.value[entityId] = unsubscribe;
    } catch (error) {
      forecastLoading.value[entityId] = false;
      forecastErrors.value[entityId] =
        error.message || "Failed to subscribe to forecast";
    }
  };

  return {
    forecasts,
    forecastSubscriptions,
    forecastSupport,
    forecastErrors,
    forecastLoading,
    subscribeToWeatherForecast,
  };
});
