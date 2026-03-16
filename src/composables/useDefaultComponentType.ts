/**
 * Composable for determining default component types based on entity domains
 * Used by both JsonConfigView and configValidator to keep type detection consistent
 */

interface EntityConfig {
  type?: string;
  entity_id?: string;
}

// Default mapping for entity domains -> component types
export const DEFAULT_DOMAIN_MAP: Record<string, string> = {
  switch: "HaSwitch",
  binary_sensor: "HaBinarySensor",
  sensor: "HaSensor",
  light: "HaLight",
  alarm_control_panel: "HaAlarmPanel",
  weather: "HaWeather",
  update: "HaBinarySensor",
  sun: "HaSun",
  fan: "HaSwitch",
  media_player: "HaMediaPlayer",
  select: "HaSelect",
  input_select: "HaSelect",
  button: "HaButton",
  input_button: "HaButton",
  person: "HaPerson",
  camera: "HaImage",
  area: "HaRoom",
  device_tracker: "HaSensor",
};

/**
 * Get the default component type for a given entity ID or getter name
 * @param entityId - The entity ID (e.g., "light.living_room"), getter name, array of entities, or entity config object
 * @param getterName - Optional getter function name for type hints
 * @returns Component type (e.g., "HaLight", "HaSensor")
 */
export function getDefaultComponentType(
  entityId: string | string[] | EntityConfig | null | undefined,
  getterName: string = "",
): string {
  // Handle object with type property (entity config)
  if (entityId && typeof entityId === "object" && !Array.isArray(entityId)) {
    const config = entityId as EntityConfig;
    if (config.type) {
      return config.type;
    }
    if (config.entity_id) {
      // Use entity_id property if type not provided
      entityId = config.entity_id;
    } else {
      return "HaSensor";
    }
  }

  if (!entityId && !getterName) return "HaSensor";

  const getter = getterName?.toLowerCase() || "";

  // Getter-based hints for special cases
  if (getter.includes("battery")) return "HaSensor";
  if (getter.includes("wifi")) return "HaSensor";
  if (getter.includes("energy")) return "HaEnergy";
  if (getter.includes("power")) return "HaEnergy";
  if (getter.includes("light")) return "HaLight";
  if (getter.includes("switch")) return "HaSwitch";
  if (getter.includes("button")) return "HaButton";
  if (getter.includes("select")) return "HaSelect";
  if (getter.includes("fan")) return "HaSwitch";
  if (getter.includes("mediaplayer")) return "HaMediaPlayer";
  if (getter.includes("alarmpanel")) return "HaAlarmPanel";
  if (getter.includes("binary")) return "HaBinarySensor";

  // Entity ID-based type detection
  if (!entityId) return "HaSensor";

  // Handle arrays - use first element
  const entityStr = Array.isArray(entityId) ? entityId[0] : entityId;

  // Ensure entityStr is a string
  if (typeof entityStr !== "string") {
    return "HaSensor";
  }

  // IMPORTANT: Domain matching is case-sensitive!
  const parts = entityStr.split(".");
  const domain = parts[0];

  // Only match if domain is lowercase (case-sensitive)
  if (domain === domain.toLowerCase()) {
    return DEFAULT_DOMAIN_MAP[domain] || "HaSensor";
  }

  // Domain is not all lowercase, return HaSensor
  return "HaSensor";
}

/**
 * Get the default component type for an entity config object
 * Handles both string and array entity values
 * @param entityConfig - Entity configuration with optional entity/getter
 * @returns Component type
 */
export function getDefaultTypeForEntityConfig(
  entityConfig: Record<string, unknown>,
): string {
  if (entityConfig.getter) {
    return getDefaultComponentType("", entityConfig.getter as string);
  }

  if (entityConfig.entity) {
    // Handle array of entities - use first for type detection
    const entityId = Array.isArray(entityConfig.entity)
      ? entityConfig.entity[0]
      : entityConfig.entity;
    return getDefaultComponentType(entityId as string | string[]);
  }

  // Special cases
  if (
    entityConfig.type === "HaLink" ||
    entityConfig.type === "HaSpacer" ||
    entityConfig.type === "HaRowSpacer"
  ) {
    return entityConfig.type as string;
  }

  return "HaSensor";
}

// Composable alias for getDefaultComponentType
export const useDefaultComponentType = getDefaultComponentType;
