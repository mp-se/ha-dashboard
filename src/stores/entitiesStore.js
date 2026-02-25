import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "./authStore";
import { subscribeEntities } from "home-assistant-js-websocket";

export const useEntitiesStore = defineStore("entities", () => {
  const authStore = useAuthStore();

  const sensors = ref([]);
  const entityMap = computed(() => {
    const map = new Map();
    sensors.value.forEach((s) => map.set(s.entity_id, s));
    return map;
  });
  const devices = ref([]);
  const areas = ref([]);

  const forecasts = ref({});
  const forecastSubscriptions = ref({});
  const forecastSupport = ref({});
  const forecastErrors = ref({});
  const forecastLoading = ref({});

  let unsubscribeEntitiesFn = null;

  const fetchStates = async () => {
    if (authStore.isLocalMode) return;
    const connection = authStore.getConnection();
    if (!connection) {
      console.warn("fetchStates: Connection not established");
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        let firstUpdate = true;
        unsubscribeEntitiesFn = subscribeEntities(connection, (entities) => {
          const statesList = Object.values(entities).map((entity) => ({
            entity_id: entity.entity_id,
            state: entity.state,
            attributes: entity.attributes || {},
          }));

          const newMap = new Map(statesList.map((s) => [s.entity_id, s]));

          // Remove non-existent non-virtual entities
          let i = sensors.value.length;
          while (i--) {
            const entityId = sensors.value[i].entity_id;
            if (!newMap.has(entityId) && !entityId.startsWith("area.")) {
              sensors.value.splice(i, 1);
            }
          }

          // Update or add
          for (const newEntity of statesList) {
            const oldEntity = entityMap.value.get(newEntity.entity_id);
            if (oldEntity) {
              oldEntity.state = newEntity.state;
              oldEntity.attributes = newEntity.attributes;
            } else {
              sensors.value.push(newEntity);
            }
          }

          if (firstUpdate) {
            firstUpdate = false;
            resolve();
          }
        });

        setTimeout(() => {
          if (firstUpdate) resolve();
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  };

  const loadLocalData = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const dataUrl = baseUrl + "data/local-data.json";
      const response = await fetch(dataUrl);
      if (!response.ok) throw new Error("Local data file not found");
      const data = await response.json();
      sensors.value = data.sensors || [];
      devices.value = data.devices || [];
      areas.value = data.areas || [];
    } catch (error) {
      console.error("Error loading local data:", error);
      throw error;
    }
  };

  const clearAllSensors = () => {
    // Keep area entities (virtual) but clear the rest
    sensors.value = sensors.value.filter((s) =>
      s.entity_id.startsWith("area."),
    );
  };

  const fetchEntityRegistry = async () => {
    if (authStore.isLocalMode || !authStore.getConnection()) return;
    try {
      const connection = authStore.getConnection();
      const result = await connection.sendMessagePromise({
        type: "config/entity_registry/list",
      });
      const entityRegistry = Array.isArray(result)
        ? result
        : result?.result || [];
      const entityToDeviceMap = new Map();
      for (const entity of entityRegistry) {
        if (entity.entity_id && entity.device_id) {
          entityToDeviceMap.set(entity.entity_id, entity.device_id);
        }
      }
      for (const sensor of sensors.value) {
        if (!sensor.attributes) sensor.attributes = {};
        if (
          !sensor.attributes.device_id &&
          entityToDeviceMap.has(sensor.entity_id)
        ) {
          sensor.attributes.device_id = entityToDeviceMap.get(sensor.entity_id);
        }
      }
    } catch (error) {
      console.error("Error fetching entity registry:", error);
    }
  };

  const fetchAreaRegistry = async () => {
    if (authStore.isLocalMode || !authStore.getConnection()) return;
    try {
      const connection = authStore.getConnection();
      const result = await connection.sendMessagePromise({
        type: "config/area_registry/list",
      });
      const areasArray = Array.isArray(result) ? result : result?.result || [];
      if (areasArray.length > 0) {
        areas.value = areasArray.map((area) => ({
          ...area,
          entities: area.entities || [],
        }));
        for (const area of areasArray) {
          const areaEntity = {
            entity_id: `area.${area.area_id}`,
            state: area.name,
            attributes: {
              id: area.area_id,
              friendly_name: area.name,
              icon: area.icon,
              picture: area.picture,
              aliases: area.aliases,
            },
            entities: area.entities || [],
          };
          if (!entityMap.value.has(areaEntity.entity_id)) {
            sensors.value.push(areaEntity);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching area registry:", error);
    }
  };

  const mapEntitiesToDevices = () => {
    if (devices.value.length === 0) return;

    // Clear previous mappings to avoid duplicates on re-map
    for (const d of devices.value) d.entities = [];
    for (const a of areas.value) a.entities = [];

    const deviceMap = new Map(devices.value.map((d) => [d.id, d]));
    const areasMap = new Map(areas.value.map((a) => [a.area_id, a]));

    // 1. Map entities to devices using attributes.device_id
    for (const sensor of sensors.value) {
      const deviceId = sensor.attributes?.device_id;
      if (deviceId && deviceMap.has(deviceId)) {
        const device = deviceMap.get(deviceId);
        if (!device.entities.includes(sensor.entity_id)) {
          device.entities.push(sensor.entity_id);
        }
      }
    }

    // 2. Map devices to areas and aggregate entities into areas
    for (const device of devices.value) {
      if (device.area_id && areasMap.has(device.area_id)) {
        const area = areasMap.get(device.area_id);
        if (!area.entities) area.entities = [];
        for (const entityId of device.entities) {
          if (!area.entities.includes(entityId)) {
            area.entities.push(entityId);
          }
        }

        // 3. Update the virtual area sensor if it exists
        const virtualAreaEntity = entityMap.value.get(`area.${device.area_id}`);
        if (virtualAreaEntity) {
          virtualAreaEntity.entities = area.entities;
        }
      }
    }
  };

  const fetchDevicesAfterAuth = async () => {
    if (authStore.isLocalMode || !authStore.getConnection()) return;
    try {
      const connection = authStore.getConnection();
      const result = await connection.sendMessagePromise({
        type: "config/device_registry/list",
      });
      const deviceList = Array.isArray(result) ? result : result?.result || [];
      if (deviceList.length > 0) {
        devices.value = deviceList.map((device) => ({
          id: device.id,
          name: device.name || "Unknown",
          model: device.model || null,
          manufacturer: device.manufacturer || null,
          sw_version: device.sw_version || null,
          area_id: device.area_id || null,
          entities: [],
        }));
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  const subscribeToWeatherForecast = async (
    entityId,
    forecastType = "daily",
  ) => {
    if (entityId in forecastSubscriptions.value) return;
    const entity = entityMap.value.get(entityId);
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
            const ent = entityMap.value.get(entityId);
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

  const historyRequestCache = new Map();
  const HISTORY_CACHE_TTL = 5000;

  async function fetchHistory(entityId, hours = 24, maxPoints = 200) {
    if (authStore.isLocalMode || !authStore.haUrl || !authStore.accessToken)
      return [];
    const cacheKey = `${entityId}:${hours}`;
    const cached = historyRequestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL)
      return cached.promise;

    const promise = (async () => {
      try {
        const now = Date.now();
        const startTime = now - hours * 3600 * 1000;
        const start = new Date(startTime).toISOString();
        const end = new Date(now).toISOString();
        const base = authStore.haUrl.replace(/\/$/, "");
        const url = `${base}/api/history/period/${start}?end_time=${end}&filter_entity_id=${encodeURIComponent(entityId)}&minimal_response=true`;

        const res = await authStore.fetchWithTimeout(url, {
          headers: {
            Authorization: `Bearer ${authStore.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`History request failed: ${res.status}`);
        const body = await res.json();
        const arr = body[0] || [];
        const extracted = arr
          .map((s) => ({
            t: new Date(s.last_changed).getTime(),
            v: Number(s.state),
          }))
          .filter((p) => !Number.isNaN(p.v));
        if (extracted.length > maxPoints) {
          const step = extracted.length / maxPoints;
          const sampled = [];
          for (let i = 0; i < maxPoints; i++)
            sampled.push(extracted[Math.floor(i * step)]);
          return sampled;
        }
        return extracted;
      } catch (e) {
        console.error("fetchHistory error", e);
        throw e;
      }
    })();
    historyRequestCache.set(cacheKey, { promise, timestamp: Date.now() });
    setTimeout(() => historyRequestCache.delete(cacheKey), HISTORY_CACHE_TTL);
    return promise;
  }

  // Define formatBucketLabel internally
  const formatBucketLabel = (timestamp, days) => {
    const date = new Date(timestamp);
    if (days <= 1) return String(date.getHours()).padStart(2, "0");
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  async function fetchEnergyHistory(entityId, days = 1) {
    if (authStore.isLocalMode || !authStore.haUrl || !authStore.accessToken)
      return [];
    const cacheKey = `energy:${entityId}:${days}`;
    const cached = historyRequestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL)
      return cached.promise;

    const promise = (async () => {
      try {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const startIso = startDate.toISOString();
        const endIso = now.toISOString();
        const base = authStore.haUrl.replace(/\/$/, "");
        const url = `${base}/api/history/period/${startIso}?end_time=${encodeURIComponent(endIso)}&filter_entity_id=${encodeURIComponent(entityId)}&minimal_response=true`;

        const res = await authStore.fetchWithTimeout(url, {
          headers: {
            Authorization: `Bearer ${authStore.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok)
          throw new Error(`Energy history request failed: ${res.status}`);
        const body = await res.json();
        if (!body || !Array.isArray(body) || !body[0]) return [];
        const entries = body[0];

        const bucketMinutes = days <= 1 ? 60 : 1440;
        const bucketMs = bucketMinutes * 60 * 1000;
        const buckets = new Map();

        let start_ms = startDate.getTime();
        let bucketTime;
        if (bucketMinutes === 1440) {
          const now_midnight = new Date(now);
          now_midnight.setUTCHours(0, 0, 0, 0);
          now_midnight.setUTCDate(now_midnight.getUTCDate() + 1);
          bucketTime = now_midnight.getTime() - days * bucketMs;
          start_ms = bucketTime;
          for (let i = 0; i < days; i++) {
            buckets.set(bucketTime, { values: [], timestamp: bucketTime });
            bucketTime += bucketMs;
          }
        } else {
          bucketTime = Math.floor(start_ms / bucketMs) * bucketMs;
          for (let i = 0; i < days * 24; i++) {
            buckets.set(bucketTime, { values: [], timestamp: bucketTime });
            bucketTime += bucketMs;
          }
        }

        entries.forEach((entry) => {
          const ts = new Date(entry.last_changed).getTime();
          const bt = Math.floor(ts / bucketMs) * bucketMs;
          const val = Number(entry.state);
          if (!Number.isNaN(val) && buckets.has(bt))
            buckets.get(bt).values.push(val);
        });

        return Array.from(buckets.values())
          .map((bucket) => ({
            timestamp: bucket.timestamp,
            value:
              bucket.values.length > 0
                ? Math.round(
                    (bucket.values.reduce((a, b) => a + b, 0) /
                      bucket.values.length) *
                      100,
                  ) / 100
                : 0,
            label: formatBucketLabel(bucket.timestamp, days),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
      } catch (e) {
        console.error("fetchEnergyHistory error:", e);
        throw e;
      }
    })();
    historyRequestCache.set(cacheKey, { promise, timestamp: Date.now() });
    setTimeout(() => historyRequestCache.delete(cacheKey), HISTORY_CACHE_TTL);
    return promise;
  }

  /**
   * Save current sensor and device data to a local JSON file (Local Mode)
   */
  const saveLocalData = () => {
    const data = {
      sensors: sensors.value,
      devices: devices.value,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "local-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Helper methods for filtering and retrieving entities
   */
  const getBatterySensors = () =>
    sensors.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        s.attributes?.device_class === "battery" &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );

  const getWifiSensors = () =>
    sensors.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        s.attributes?.icon?.startsWith("mdi:wifi") &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );

  const getEntitiesForDevice = (deviceId) => {
    const device = devices.value.find((d) => d.id === deviceId);
    if (!device || !device.entities) return [];
    return sensors.value.filter((s) => device.entities.includes(s.entity_id));
  };

  const getAll = () => sensors.value;

  const getSuns = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("sun."));
  const getFans = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("fan."));
  const getSelects = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("select."));
  const getButtons = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("button."));
  const getSensors = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("sensor."));
  const getLights = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("light."));
  const getSwitches = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("switch."));
  const getAlarmPanels = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("alarm_control_panel."));
  const getDeviceTrackers = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("device_tracker."));
  const getMediaPlayers = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("media_player."));
  const getBinarySensors = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("binary_sensor."));
  const getEnergyConsumptionSensors = () =>
    sensors.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        s.attributes?.device_class === "energy" &&
        s.attributes?.state_class === "total" &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );
  const getPowerConsumptionSensors = () =>
    sensors.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        s.attributes?.device_class === "power" &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );
  const getWeatherEntities = () =>
    sensors.value.filter((s) => s.entity_id.startsWith("weather."));

  return {
    sensors,
    entityMap,
    devices,
    areas,
    forecasts,
    forecastSubscriptions,
    forecastSupport,
    forecastErrors,
    forecastLoading,
    fetchStates,
    loadLocalData,
    saveLocalData,
    fetchEntityRegistry,
    fetchAreaRegistry,
    clearAllSensors,
    mapEntitiesToDevices,
    fetchDevicesAfterAuth,
    subscribeToWeatherForecast,
    fetchHistory,
    fetchEnergyHistory,
    getBatterySensors,
    getWifiSensors,
    getEntitiesForDevice,
    getAll,
    getSuns,
    getFans,
    getSelects,
    getButtons,
    getSensors,
    getLights,
    getSwitches,
    getAlarmPanels,
    getDeviceTrackers,
    getMediaPlayers,
    getBinarySensors,
    getEnergyConsumptionSensors,
    getPowerConsumptionSensors,
    getWeatherEntities,
    unsubscribeEntities: () => {
      if (unsubscribeEntitiesFn) {
        unsubscribeEntitiesFn();
        unsubscribeEntitiesFn = null;
      }
    },
  };
});
