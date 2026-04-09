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
/**
 * Composable to get MDI icon class based on entity attributes
 * Returns icon from entity.attributes.icon or infers from unit/domain
 *
 * Priority order:
 * 1. Explicit icon attribute (entity.attributes.icon)
 * 2. Inferred from unit_of_measurement
 * 3. Inferred from entity domain
 *
 * @param entity - The entity object with attributes
 * @param entityId - The entity ID string (e.g., 'sensor.temperature')
 * @returns MDI icon class string (e.g., 'mdi mdi-thermometer') or null
 */
import { createLogger } from "@/utils/logger";

const logger = createLogger("useIconClass");

interface EntityData {
  attributes?: Record<string, unknown>;
}

export const useIconClass = (
  entity: EntityData | null,
  entityId: string | null,
): string | null => {
  try {
    if (!entity) return null;

    // First priority: explicit icon attribute
    const icon = entity.attributes?.icon as string | undefined;
    if (icon && icon.startsWith("mdi:")) {
      return `mdi mdi-${icon.split(":")[1]}`;
    }

    // Second priority: infer from unit of measurement
    const unit = (entity.attributes?.unit_of_measurement as string) || "";
    if (unit) {
      if (/°|°C|°F/.test(unit)) {
        return "mdi mdi-thermometer";
      }
      if (/%|percent/i.test(unit)) {
        return "mdi mdi-percent";
      }
      if (/kW|W(?!\w)|watt|power/i.test(unit)) {
        return "mdi mdi-lightning-bolt";
      }
      if (/V$|volt|voltage/i.test(unit)) {
        return "mdi mdi-flash";
      }
      if (/A$|amp|ampere|current/i.test(unit)) {
        return "mdi mdi-current-ac";
      }
      if (/Hz|frequency/i.test(unit)) {
        return "mdi mdi-sine-wave";
      }
      if (/m³|m3|L|liter|gallon/i.test(unit)) {
        return "mdi mdi-water";
      }
      if (/km|m(?!d)|mile|mile|distance|length/i.test(unit)) {
        return "mdi mdi-ruler";
      }
      if (/dB|sound|noise|level/i.test(unit)) {
        return "mdi mdi-volume-high";
      }
      if (/rpm|speed/i.test(unit)) {
        return "mdi mdi-speedometer";
      }
    }

    // Third priority: infer from domain
    if (entityId) {
      // Handle case where entityId might be an object instead of string
      const idString =
        typeof entityId === "string" ? entityId : (entity as any)?.entity_id;
      if (idString) {
        const domain = idString.split(".")[0];
        const domainIconMap: Record<string, string> = {
          sensor: "mdi mdi-gauge",
          binary_sensor: "mdi mdi-eye",
          switch: "mdi mdi-toggle-switch",
          light: "mdi mdi-lightbulb",
          climate: "mdi mdi-thermostat",
          fan: "mdi mdi-fan",
          media_player: "mdi mdi-speaker",
          vacuum: "mdi mdi-robot-vacuum",
          lock: "mdi mdi-lock",
          alarm_control_panel: "mdi mdi-shield-home",
          camera: "mdi mdi-camera",
          device_tracker: "mdi mdi-map-marker",
          person: "mdi mdi-account",
          zone: "mdi mdi-map-marker-radius",
        };
        return domainIconMap[domain] || null;
      }
    }

    return null;
  } catch (error) {
    logger.warn("Error in useIconClass for entity:", entityId, error);
    return null;
  }
};
