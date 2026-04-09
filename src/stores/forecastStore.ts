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
