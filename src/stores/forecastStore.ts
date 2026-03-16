import { defineStore } from "pinia";
import { ref, Ref } from "vue";
import { useAuthStore } from "./authStore";
import { useEntitiesStore } from "./entitiesStore";

interface Forecast {
  type: string;
  data: unknown[];
  timestamp: number;
}

/**
 * Store responsible for managing weather forecast subscriptions and their state.
 * Extracted from entitiesStore to keep each store cohesive and single-purpose.
 */
export const useForecastStore = defineStore("forecast", () => {
  const authStore = useAuthStore();

  const forecasts: Ref<Record<string, Forecast>> = ref({});
  const forecastSubscriptions: Ref<Record<string, () => void>> = ref({});
  const forecastSupport: Ref<Record<string, boolean>> = ref({});
  const forecastErrors: Ref<Record<string, string | null>> = ref({});
  const forecastLoading: Ref<Record<string, boolean>> = ref({});

  /**
   * Subscribe to real-time forecast data for a weather entity.
   * @param {string} entityId - The weather entity ID.
   * @param {string} [forecastType="daily"] - Forecast type: "daily", "hourly", or "twice_daily".
   */
  const subscribeToWeatherForecast = async (
    entityId: string,
    forecastType: string = "daily",
  ): Promise<void> => {
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
        (forecastData: Record<string, unknown>) => {
          if (forecastData && forecastData.forecast) {
            forecasts.value[entityId] = {
              type: (forecastData.type as string) || forecastType,
              data: (forecastData.forecast as unknown[]) || [],
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
        } as Record<string, unknown>,
        { resubscribe: true },
      );
      forecastSubscriptions.value[entityId] = unsubscribe;
    } catch (error) {
      forecastLoading.value[entityId] = false;
      forecastErrors.value[entityId] =
        ((error && typeof error === "object" && "message" in error
          ? (error as Record<string, unknown>).message
          : null) as string) || "Failed to subscribe to forecast";
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
