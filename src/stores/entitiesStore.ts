import { defineStore } from "pinia";
import { ref, computed, Ref, ComputedRef } from "vue";
import { createLogger } from "@/utils/logger";
import { useAuthStore } from "./authStore";
import { useForecastStore } from "./forecastStore";
import { subscribeEntities, Connection } from "home-assistant-js-websocket";
import { fetchJsonWithTimeout } from "@/utils/fetchWithTimeout";
import { TIMEOUT_CONFIG, TIMEOUT_WEBSOCKET } from "@/utils/constants";

interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  [key: string]: unknown;
}

interface Device {
  id: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  sw_version: string | null;
  area_id: string | null;
  entities: string[];
}

interface Area {
  area_id: string;
  name: string;
  icon?: string;
  picture?: string;
  aliases?: string[];
  entities: string[];
  [key: string]: unknown;
}

interface LocalData {
  sensors?: EntityState[];
  devices?: Device[];
  areas?: Area[];
}

interface HistoryPoint {
  t: number;
  v: number;
}

interface EnergyBucket {
  timestamp: number;
  value: number;
  label: string;
}

export const useEntitiesStore = defineStore("entities", () => {
  const authStore = useAuthStore();

  const entities: Ref<EntityState[]> = ref([]);
  const entityMap: ComputedRef<Map<string, EntityState>> = computed(() => {
    const map = new Map<string, EntityState>();
    entities.value.forEach((s) => map.set(s.entity_id, s));
    return map;
  });
  const devices: Ref<Device[]> = ref([]);
  const areas: Ref<Area[]> = ref([]);

  let unsubscribeEntitiesFn: (() => void) | null = null;
  const logger = createLogger("entitiesStore");

  const fetchStates = async (): Promise<void> => {
    if (authStore.isLocalMode) return;
    const connection = authStore.getConnection();
    if (!connection) {
      logger.warn("fetchStates: Connection not established");
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        let firstUpdate = true;
        unsubscribeEntitiesFn = subscribeEntities(
          connection,
          (haEntities: Record<string, EntityState>) => {
            const statesList = Object.values(haEntities).map((entity) => ({
              entity_id: entity.entity_id,
              state: entity.state,
              attributes: entity.attributes || {},
            }));

            const newMap = new Map(statesList.map((s) => [s.entity_id, s]));

            // Remove non-existent non-virtual entities
            let i = entities.value.length;
            while (i--) {
              const entityId = entities.value[i].entity_id;
              if (!newMap.has(entityId) && !entityId.startsWith("area.")) {
                entities.value.splice(i, 1);
              }
            }

            // Update or add
            for (const newEntity of statesList) {
              const oldEntity = entityMap.value.get(newEntity.entity_id);
              if (oldEntity) {
                oldEntity.state = newEntity.state;
                oldEntity.attributes = newEntity.attributes;
              } else {
                entities.value.push(newEntity);
              }
            }

            if (firstUpdate) {
              firstUpdate = false;
              resolve();
            }
          },
        );

        setTimeout(() => {
          if (firstUpdate) resolve();
        }, TIMEOUT_WEBSOCKET);
      } catch (error) {
        reject(error);
      }
    });
  };

  const loadLocalData = async (): Promise<void> => {
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const dataUrl = baseUrl + "data/local-data.json";
      const data = (await fetchJsonWithTimeout(
        dataUrl,
        {},
        TIMEOUT_CONFIG,
      )) as LocalData;
      entities.value = data.sensors || [];
      devices.value = data.devices || [];
      areas.value = data.areas || [];
    } catch (error) {
      logger.error("Error loading local data:", error);
      throw error;
    }
  };

  const clearAllSensors = (): void => {
    // Keep area entities (virtual) but clear the rest
    entities.value = entities.value.filter((s) =>
      s.entity_id.startsWith("area."),
    );
  };

  const fetchEntityRegistry = async (): Promise<void> => {
    if (authStore.isLocalMode || !authStore.getConnection()) return;
    try {
      const connection = authStore.getConnection();
      if (!connection) return;

      const result = (await connection.sendMessagePromise({
        type: "config/entity_registry/list",
      })) as Record<string, unknown>;

      const entityRegistry = Array.isArray(result)
        ? result
        : (result?.result as EntityState[]) || [];

      const entityToDeviceMap = new Map<string, string>();
      for (const entity of entityRegistry) {
        const ent = entity as Record<string, unknown>;
        if (ent.entity_id && ent.device_id) {
          entityToDeviceMap.set(String(ent.entity_id), String(ent.device_id));
        }
      }
      for (const sensor of entities.value) {
        if (!sensor.attributes) sensor.attributes = {};
        if (
          !sensor.attributes.device_id &&
          entityToDeviceMap.has(sensor.entity_id)
        ) {
          sensor.attributes.device_id = entityToDeviceMap.get(sensor.entity_id);
        }
      }
    } catch (error) {
      logger.error("Error fetching entity registry:", error);
    }
  };

  const fetchAreaRegistry = async (): Promise<void> => {
    if (authStore.isLocalMode || !authStore.getConnection()) return;
    try {
      const connection = authStore.getConnection();
      if (!connection) return;

      const result = (await connection.sendMessagePromise({
        type: "config/area_registry/list",
      })) as Record<string, unknown>;

      const areasArray = Array.isArray(result)
        ? result
        : (result?.result as Area[]) || [];

      if (areasArray.length > 0) {
        areas.value = areasArray.map((area) => {
          const areaData = area as Record<string, unknown>;
          return {
            ...areaData,
            entities: (areaData.entities as string[]) || [],
          } as Area;
        });

        for (const area of areasArray) {
          const areaData = area as Record<string, unknown>;
          const areaEntity: EntityState = {
            entity_id: `area.${areaData.area_id}`,
            state: String(areaData.name),
            attributes: {
              id: areaData.area_id,
              friendly_name: areaData.name,
              icon: areaData.icon,
              picture: areaData.picture,
              aliases: areaData.aliases,
            },
            entities: (areaData.entities as string[]) || [],
          };
          if (!entityMap.value.has(areaEntity.entity_id)) {
            entities.value.push(areaEntity);
          }
        }
      }
    } catch (error) {
      logger.error("Error fetching area registry:", error);
    }
  };

  const mapEntitiesToDevices = (): void => {
    if (devices.value.length === 0) return;

    // Clear previous mappings to avoid duplicates on re-map
    for (const d of devices.value) d.entities = [];
    for (const a of areas.value) a.entities = [];

    const deviceMap = new Map(devices.value.map((d) => [d.id, d]));
    const areasMap = new Map(areas.value.map((a) => [a.area_id, a]));

    // 1. Map entities to devices using attributes.device_id
    for (const sensor of entities.value) {
      const deviceId = sensor.attributes?.device_id;
      if (deviceId && deviceMap.has(String(deviceId))) {
        const device = deviceMap.get(String(deviceId));
        if (device && !device.entities.includes(sensor.entity_id)) {
          device.entities.push(sensor.entity_id);
        }
      }
    }

    // 2. Map devices to areas and aggregate entities into areas
    for (const device of devices.value) {
      if (device.area_id && areasMap.has(device.area_id)) {
        const area = areasMap.get(device.area_id);
        if (area) {
          if (!area.entities) area.entities = [];
          for (const entityId of device.entities) {
            if (!area.entities.includes(entityId)) {
              area.entities.push(entityId);
            }
          }

          // 3. Update the virtual area sensor if it exists
          const virtualAreaEntity = entityMap.value.get(
            `area.${device.area_id}`,
          );
          if (virtualAreaEntity) {
            virtualAreaEntity.entities = area.entities;
          }
        }
      }
    }
  };

  const fetchDevicesAfterAuth = async (): Promise<void> => {
    if (authStore.isLocalMode || !authStore.getConnection()) return;
    try {
      const connection = authStore.getConnection();
      if (!connection) return;

      const result = (await connection.sendMessagePromise({
        type: "config/device_registry/list",
      })) as Record<string, unknown>;

      const deviceList = Array.isArray(result)
        ? result
        : (result?.result as Record<string, unknown>[]) || [];

      if (deviceList.length > 0) {
        devices.value = deviceList.map((device) => {
          const dev = device as Record<string, unknown>;
          return {
            id: String(dev.id),
            name: String(dev.name) || "Unknown",
            model: (dev.model as string) || null,
            manufacturer: (dev.manufacturer as string) || null,
            sw_version: (dev.sw_version as string) || null,
            area_id: (dev.area_id as string) || null,
            entities: [],
          };
        });
      }
    } catch (error) {
      logger.error("Error fetching devices:", error);
    }
  };

  const subscribeToWeatherForecast = async (
    entityId: string,
    forecastType: string = "daily",
  ): Promise<void> => {
    // Delegate to forecastStore to keep this store focused on entity state
    const forecastStore = useForecastStore();
    return forecastStore.subscribeToWeatherForecast(entityId, forecastType);
  };

  const historyRequestCache = new Map<
    string,
    { promise: Promise<HistoryPoint[]>; timestamp: number }
  >();
  const HISTORY_CACHE_TTL = 5000;

  async function fetchHistory(
    entityId: string,
    hours: number = 24,
    maxPoints: number = 200,
  ): Promise<HistoryPoint[]> {
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
        const body = (await res.json()) as Array<EntityState[]>;
        const arr = body[0] || [];
        const extracted = arr
          .map((s) => ({
            t: new Date(s.last_changed as string).getTime(),
            v: Number(s.state),
          }))
          .filter((p) => !Number.isNaN(p.v));
        if (extracted.length > maxPoints) {
          const step = extracted.length / maxPoints;
          const sampled: HistoryPoint[] = [];
          for (let i = 0; i < maxPoints; i++)
            sampled.push(extracted[Math.floor(i * step)]);
          return sampled;
        }
        return extracted;
      } catch (e) {
        logger.error("fetchHistory error", e);
        throw e;
      }
    })();

    historyRequestCache.set(cacheKey, { promise, timestamp: Date.now() });
    setTimeout(() => historyRequestCache.delete(cacheKey), HISTORY_CACHE_TTL);
    return promise;
  }

  // Define formatBucketLabel internally
  const formatBucketLabel = (timestamp: number, days: number): string => {
    const date = new Date(timestamp);
    if (days <= 1) return String(date.getHours()).padStart(2, "0");
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  /**
   * @param {string} entityId
   * @param {number} days - Number of days of history to fetch
   * @param {number} offsetDays - Shift the window back by this many days (0 = current period)
   */
  async function fetchEnergyHistory(
    entityId: string,
    days: number = 1,
    offsetDays: number = 0,
  ): Promise<EnergyBucket[]> {
    if (authStore.isLocalMode || !authStore.haUrl || !authStore.accessToken)
      return [];

    const cacheKey = `energy:${entityId}:${days}:${offsetDays}`;
    const cached = historyRequestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL)
      return cached.promise as Promise<EnergyBucket[]>;

    const promise = (async (): Promise<EnergyBucket[]> => {
      try {
        const now = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
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
        const body = (await res.json()) as Array<EntityState[]>;
        if (!body || !Array.isArray(body) || !body[0]) return [];
        const entries = body[0];

        const bucketMinutes = days <= 1 ? 60 : 1440;
        const bucketMs = bucketMinutes * 60 * 1000;
        const buckets = new Map<
          number,
          { values: number[]; timestamp: number }
        >();

        let start_ms = startDate.getTime();
        let bucketTime: number;
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
          const ts = new Date(entry.last_changed as string).getTime();
          const bt = Math.floor(ts / bucketMs) * bucketMs;
          const val = Number(entry.state);
          if (!Number.isNaN(val) && buckets.has(bt))
            (buckets.get(bt) as { values: number[] }).values.push(val);
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
        logger.error("fetchEnergyHistory error:", e);
        throw e;
      }
    })();

    historyRequestCache.set(cacheKey, {
      promise: promise as Promise<EnergyBucket[]>,
      timestamp: Date.now(),
    });
    setTimeout(() => historyRequestCache.delete(cacheKey), HISTORY_CACHE_TTL);
    return promise;
  }

  /**
   * Save current sensor and device data to a local JSON file (Local Mode)
   */
  const saveLocalData = (): void => {
    const data = {
      sensors: entities.value,
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
  const getBatterySensors = (): EntityState[] =>
    entities.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        (s.attributes?.device_class as string) === "battery" &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );

  const getWifiSensors = (): EntityState[] =>
    entities.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        (s.attributes?.icon as string)?.startsWith("mdi:wifi") &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );

  const getEntitiesForDevice = (deviceId: string): EntityState[] => {
    const device = devices.value.find((d) => d.id === deviceId);
    if (!device || !device.entities) return [];
    return entities.value.filter((s) => device.entities.includes(s.entity_id));
  };

  const getAll = (): EntityState[] => entities.value;

  const getSuns = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("sun."));
  const getFans = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("fan."));
  const getSelects = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("select."));
  const getButtons = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("button."));
  const getSensors = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("sensor."));
  const getLights = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("light."));
  const getSwitches = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("switch."));
  const getAlarmPanels = (): EntityState[] =>
    entities.value.filter((s) =>
      s.entity_id.startsWith("alarm_control_panel."),
    );
  const getDeviceTrackers = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("device_tracker."));
  const getMediaPlayers = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("media_player."));
  const getBinarySensors = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("binary_sensor."));
  const getEnergyConsumptionSensors = (): EntityState[] =>
    entities.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        (s.attributes?.device_class as string) === "energy" &&
        (s.attributes?.state_class as string) === "total" &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );
  const getPowerConsumptionSensors = (): EntityState[] =>
    entities.value.filter(
      (s) =>
        s.entity_id.startsWith("sensor.") &&
        (s.attributes?.device_class as string) === "power" &&
        s.state !== "unavailable" &&
        s.state !== "unknown",
    );
  const getWeatherEntities = (): EntityState[] =>
    entities.value.filter((s) => s.entity_id.startsWith("weather."));

  return {
    entities,
    entityMap,
    devices,
    areas,
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
    unsubscribeEntities: (): void => {
      if (unsubscribeEntitiesFn) {
        unsubscribeEntitiesFn();
        unsubscribeEntitiesFn = null;
      }
    },
  };
});
