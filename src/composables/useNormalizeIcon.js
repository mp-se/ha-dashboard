/**
 * Composable to normalize icon names
 * Accepts both "mdi-icon" and "mdi mdi-icon" formats
 * Always returns "mdi mdi-icon" format
 */
export const useNormalizeIcon = () => {
  const normalizeIcon = (icon) => {
    if (!icon || typeof icon !== "string") {
      return icon;
    }

    // Handle empty string - return as is (falsy check would filter it out)
    if (icon === "") {
      return icon;
    }

    // If already in "mdi mdi-icon" format (with flexible spacing), return as is
    if (icon.match(/^mdi\s+mdi-/)) {
      return icon;
    }

    // If in "mdi:icon" format (from Home Assistant), convert
    if (icon.startsWith("mdi:")) {
      return `mdi mdi-${icon.split(":")[1]}`;
    }

    // If just "mdi-icon" format, add "mdi " prefix
    if (icon.startsWith("mdi-")) {
      return `mdi ${icon}`;
    }

    // If it doesn't start with mdi, assume it's just the icon name and add prefix
    return `mdi mdi-${icon}`;
  };

  return normalizeIcon;
};
