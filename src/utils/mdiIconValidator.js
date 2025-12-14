/**
 * Material Design Icons validator
 * Validates icon names against known MDI icons
 *
 * MDI icons follow the pattern: mdi-icon-name
 * This validator checks if an icon name exists in the MDI library
 * Dynamically loads all 7447+ icons from @mdi/js package
 */

import * as mdiIcons from "@mdi/js";

// Build Set of all valid MDI icon names from @mdi/js package
// Filter out non-icon exports (default, __esModule) and convert camelCase to kebab-case
const VALID_MDI_ICONS = new Set(
  Object.keys(mdiIcons)
    .filter((key) => {
      // Only include keys that start with 'mdi' and are actual icon exports
      if (!key.startsWith("mdi")) return false;
      if (key === "__esModule" || key === "default") return false;
      return typeof mdiIcons[key] === "string";
    })
    .map((key) => {
      // Convert camelCase to kebab-case: mdiThermometer -> thermometer
      return key
        .substring(3)
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase();
    }),
);

/**
 * Validate if an icon name is a valid MDI icon
 * @param {string} iconName - Icon name to validate (can be in any format: "home", "mdi-home", "mdi:home", "mdi mdi-home")
 * @returns {boolean} True if the icon is valid
 */
export function isValidMdiIcon(iconName) {
  if (!iconName || typeof iconName !== "string") {
    return false;
  }

  // Normalize the icon name to extract just the icon name
  let cleanIconName = iconName.trim().toLowerCase();

  // Handle "mdi:icon" format (Home Assistant format)
  if (cleanIconName.includes(":")) {
    cleanIconName = cleanIconName.split(":")[1] || "";
  }

  // Handle "mdi mdi-icon" format (old format) - remove first "mdi " if present
  if (cleanIconName.startsWith("mdi ")) {
    cleanIconName = cleanIconName.substring(4).trim();
  }

  // Remove any "mdi-" prefix(es) - handle cases like "mdi-home"
  while (cleanIconName.startsWith("mdi-")) {
    cleanIconName = cleanIconName.substring(4);
  }

  // Check if icon exists in our known icons
  return VALID_MDI_ICONS.has(cleanIconName);
}

/**
 * Get a list of similar icon names for suggestions
 * @param {string} iconName - Icon name to find suggestions for
 * @returns {string[]} Array of similar icon names
 */
export function suggestMdiIcons(iconName) {
  if (!iconName || typeof iconName !== "string") {
    return [];
  }

  // Clean the icon name first
  let cleanIconName = iconName.trim().toLowerCase();

  // Remove prefixes
  if (cleanIconName.startsWith("mdi ")) {
    cleanIconName = cleanIconName.substring(4).trim();
  }
  while (cleanIconName.startsWith("mdi-")) {
    cleanIconName = cleanIconName.substring(4);
  }

  const allIcons = Array.from(VALID_MDI_ICONS);

  // Simple similarity check - starts with same letters or contains the query
  const suggestions = allIcons
    .filter((icon) => {
      const lowerIcon = icon.toLowerCase();
      return (
        lowerIcon.startsWith(cleanIconName) ||
        lowerIcon.includes(cleanIconName) ||
        cleanIconName.includes(lowerIcon.substring(0, 3))
      );
    })
    .slice(0, 5); // Return top 5 suggestions

  return suggestions;
}

/**
 * Get all valid MDI icon names
 * @returns {string[]} Array of all valid MDI icon names
 */
export function getAllMdiIcons() {
  return Array.from(VALID_MDI_ICONS).sort();
}

/**
 * Get count of valid MDI icons
 * @returns {number} Total count of valid MDI icons
 */
export function getMdiIconCount() {
  return VALID_MDI_ICONS.size;
}
