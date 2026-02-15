/**
 * Utility functions for formatting and labeling entity attributes
 * Used by components that display additional entity attributes
 */

/**
 * Format an attribute value for display
 * Handles various data types: null, arrays, objects, primitives
 * @param {*} value - The value to format
 * @returns {string} Formatted string representation
 */
export const formatAttributeValue = (v) => {
  if (v === null || v === undefined) return "-";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }
  return String(v);
};

/**
 * Convert an attribute key to a human-readable label
 * Replaces underscores with spaces and capitalizes each word
 * @param {string} key - The attribute key (e.g., "battery_level", "friendly_name")
 * @returns {string} Formatted label (e.g., "Battery level", "Friendly name")
 */
export const formatKey = (key) => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Convert an attribute key to a human-readable label
 * Replaces underscores with spaces and capitalizes each word
 * @param {string} key - The attribute key (e.g., "battery_level", "friendly_name")
 * @returns {string} Formatted label (e.g., "Battery level", "Friendly name")
 */
export const attributeLabel = (k) => {
  return formatKey(k);
};
