/**
 * Material Design Icons validator
 * Validates icon names against known MDI icons
 * 
 * MDI icons follow the pattern: mdi-icon-name
 * This validator checks if an icon name exists in the MDI library
 */

// Comprehensive list of valid MDI icon names
// This is a curated list of commonly used icons in Home Assistant dashboards
// For a complete list, visit: https://materialdesignicons.com/
const VALID_MDI_ICONS = new Set([
  // Common dashboard icons
  'view-dashboard',
  'home',
  'lightbulb',
  'power-plug',
  'thermometer',
  'battery',
  'wifi',
  'cloud',
  'lock',
  'door',
  'window',
  'sofa',
  'bed',
  'kitchen',
  'bathroom',
  'living-room',
  'garage',
  'hallway',
  'bedroom',
  
  // Weather icons
  'weather-sunny',
  'weather-cloudy',
  'weather-rainy',
  'weather-snowy',
  'weather-partly-cloudy',
  'weather-night',
  'weather-windy',
  'weather-fog',
  'weather-hail',
  'weather-lightning',
  'weather-tornado',
  'weather-windy-variant',
  'cloud-sun',
  'cloud-rain',
  'sun',
  'moon',
  'snowflake',
  
  // Light/control icons
  'lamp',
  'lamp-on',
  'lamp-off',
  'light-switch',
  'switch',
  'power',
  'power-on',
  'power-off',
  'toggle-switch',
  'toggle-switch-off',
  
  // Climate icons
  'fan',
  'fan-off',
  'air-conditioner',
  'air-purifier',
  'humidifier',
  'radiator',
  'heater',
  'snowflake-thermometer',
  
  // Media/entertainment icons
  'play',
  'pause',
  'stop',
  'skip-next',
  'skip-previous',
  'volume-high',
  'volume-low',
  'volume-mute',
  'speaker',
  'speaker-off',
  'tv',
  'tv-play',
  'music',
  'music-box',
  'video',
  'movie',
  
  // Security icons
  'alarm',
  'alarm-check',
  'alarm-off',
  'alarm-panel',
  'camera',
  'camera-off',
  'shield',
  'shield-alert',
  'shield-check',
  'shield-lock',
  'motion-sensor',
  'key',
  'key-plus',
  'lock-open',
  'lock-outline',
  'lock-alert',
  
  // Sensor icons
  'gauge',
  'gauge-low',
  'gauge-full',
  'gauge-empty',
  'speedometer',
  'humidity',
  'water',
  'water-percent',
  'air',
  'air-filter',
  'smoke-detector',
  'gas-cylinder',
  'leak',
  'droplet',
  
  // Device icons
  'phone',
  'tablet',
  'laptop',
  'desktop',
  'printer',
  'printer-3d',
  'washing-machine',
  'oven',
  'microwave',
  'dishwasher',
  'refrigerator',
  'vacuum',
  'robot-vacuum',
  'robot-vacuum-variant',
  'robot',
  'coffee-maker',
  'toaster',
  'blender',
  
  // Calendar/time icons
  'calendar',
  'calendar-today',
  'calendar-check',
  'clock',
  'clock-outline',
  'timer',
  'timer-off',
  'stopwatch',
  'alarm-multiple',
  'sunrise',
  'sunset',
  'chart',
  'chart-line',
  'chart-bar',
  'chart-box',
  
  // Activity icons
  'run',
  'walk',
  'bicycle',
  'car',
  'train',
  'airplane',
  'bed',
  'sleep',
  'dumbbell',
  'run-fast',
  
  // Information icons
  'information',
  'information-outline',
  'alert',
  'alert-box',
  'alert-circle',
  'help',
  'help-circle',
  'help-circle-outline',
  'comment',
  'comment-question',
  
  // Action icons
  'check',
  'check-circle',
  'close',
  'close-circle',
  'cancel',
  'plus',
  'plus-circle',
  'minus',
  'minus-circle',
  'delete',
  'delete-outline',
  'refresh',
  'reload',
  'sync',
  'sync-off',
  
  // File/folder icons
  'folder',
  'folder-open',
  'folder-plus',
  'file',
  'file-document',
  'file-pdf',
  'file-image',
  'file-export',
  'file-import',
  
  // Menu/navigation icons
  'menu',
  'menu-open',
  'menu-down',
  'menu-up',
  'menu-left',
  'menu-right',
  'navigation',
  'chevron-up',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'arrow-up',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  
  // Color icons
  'palette',
  'palette-advanced',
  'format-color-fill',
  'format-color-highlight',
  'rainbow',
  
  // Special
  'tools',
  'devices',
  'code-json',
  'code-braces',
  'cog',
  'cog-outline',
  'settings',
  'wrench',
  'hammer',
  'lightbulb-on-outline',
  'lightbulb-off-outline',
  'lightbulb-on',
  'lightbulb-off',
  'eye',
  'eye-off',
  'eye-outline',
  'eye-off-outline',
  'gesture-tap-button',
  'gesture-tap',
  'gesture-swipe',
  'gesture-swipe-up',
  'gesture-swipe-down',
  'gesture-swipe-left',
  'gesture-swipe-right',
  'gesture-double-tap',
  'gesture-spread',
  'gesture-pinch',
  'gesture-two-double-tap',
  'home-heart',
  'home-outline',
  'home-modern',
  'home-assistant',
  'help-box',
  'heart',
  'heart-outline',
  'star',
  'star-outline',
  'github',
  'gitlab',
  'google',
  'apple',
  'android',
  'ethereum',
  'ethereum-outline',
]);

/**
 * Validate if an icon name is a valid MDI icon
 * @param {string} iconName - Icon name to validate (can be in any format: "home", "mdi-home", "mdi:home", "mdi mdi-home")
 * @returns {boolean} True if the icon is valid
 */
export function isValidMdiIcon(iconName) {
  if (!iconName || typeof iconName !== 'string') {
    return false;
  }
  
  // Normalize the icon name to extract just the icon name
  let cleanIconName = iconName.toLowerCase();
  
  // Handle "mdi:icon" format (Home Assistant format)
  if (cleanIconName.includes(':')) {
    cleanIconName = cleanIconName.split(':')[1] || '';
  }
  
  // Remove any "mdi-" prefix(es) - handle cases like "mdi-mdi-home" or "mdi mdi-"
  while (cleanIconName.startsWith('mdi-')) {
    cleanIconName = cleanIconName.substring(4);
  }
  
  // Remove "mdi " prefix (space-separated)
  if (cleanIconName.startsWith('mdi ')) {
    cleanIconName = cleanIconName.substring(4);
  }
  
  // Remove just "mdi" prefix alone
  if (cleanIconName.startsWith('mdi')) {
    cleanIconName = cleanIconName.substring(3);
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
  if (!iconName || typeof iconName !== 'string') {
    return [];
  }
  
  const cleanIconName = iconName.replace(/^mdi-/, '').toLowerCase();
  const allIcons = Array.from(VALID_MDI_ICONS);
  
  // Simple similarity check - starts with same letters or contains the query
  const suggestions = allIcons
    .filter(icon => {
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
