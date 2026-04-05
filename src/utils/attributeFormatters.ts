/**
 * Format a numeric value for display 
 * Strips decimals off integers, otherwise limits to fractional digits.
 * @param {number|string|null} val - Value to format
 * @param {number} fractionalDigits - Number of decimals
 * @returns {string} Formatted number
 */
export const formatNumericValue = (val: number | string | null | undefined, fractionalDigits = 2): string => {
  if (val == null || val === "") return "";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num % 1 === 0 ? num.toString() : num.toFixed(fractionalDigits);
};

/**
 * Format a number with thousands (k) abbreviation
 * @param {number} value - Value to format
 * @returns {string} Formatted string
 */
export const formatKValue = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(1);
};
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
export const formatAttributeValue = (v: unknown): string => {
  if (v === null || v === undefined) return "-";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
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
export const formatKey = (key: string): string => {
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
export const attributeLabel = (k: string): string => {
  return formatKey(k);
};
