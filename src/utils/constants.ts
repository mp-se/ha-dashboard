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
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

// Network and API timeouts (in milliseconds)
export const TIMEOUT_DEFAULT = 10000; // 10 seconds
export const TIMEOUT_CONFIG = 15000; // 15 seconds for config loading
export const TIMEOUT_SERVICE_CALL = 30000; // 30 seconds for service calls
export const TIMEOUT_WEBSOCKET = 5000; // 5 seconds for WebSocket timeout

// Number formatting precision
export const PRECISION_TEMPERATURE = 1; // 1 decimal place for temperature
export const PRECISION_HUMIDITY = 0; // 0 decimal places for humidity
export const PRECISION_POWER = 0; // 0 decimal places for power (watts)
export const PRECISION_ENERGY = 2; // 2 decimal places for energy (kWh)
export const PRECISION_PERCENTAGE = 0; // 0 decimal places for percentages
export const PRECISION_DEFAULT = 2; // Default precision for other values

// UI and interaction
export const SWIPE_MIN_DISTANCE = 50; // Minimum pixels for swipe gesture
export const DEBOUNCE_DEFAULT = 300; // Default debounce delay in ms
export const BRIGHTNESS_MIN = 0; // Minimum brightness value
export const BRIGHTNESS_MAX = 100; // Maximum brightness value

// Light control
export const LIGHT_BRIGHTNESS_PCT_MIN = 0;
export const LIGHT_BRIGHTNESS_PCT_MAX = 100;
export const LIGHT_KELVIN_MIN = 2000; // Minimum color temperature
export const LIGHT_KELVIN_MAX = 6500; // Maximum color temperature

// Media player
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;
export const VOLUME_STEP = 0.01;

// Chart and graph
export const CHART_DAYS_DEFAULT = 7; // Default days to show in charts
export const CHART_ANIMATION_DURATION = 300; // Chart animation duration in ms

// WebSocket reconnection
export const RECONNECT_DELAY_INITIAL = 1000; // Initial reconnect delay
export const RECONNECT_DELAY_MAX = 30000; // Maximum reconnect delay
export const RECONNECT_MULTIPLIER = 2; // Exponential backoff multiplier

// PWA and caching
export const CACHE_MAX_AGE = 86400000; // 24 hours in ms
export const SW_UPDATE_CHECK_INTERVAL = 3600000; // 1 hour in ms

// Validation
export const MIN_PASSWORD_LENGTH = 4;
export const MAX_ENTITY_NAME_LENGTH = 255;

// Color presets (common in HA)
export const COLOR_UNAVAILABLE = "#6c757d"; // Gray
export const COLOR_OFF = "#e9ecef"; // Light gray
export const COLOR_ON = "#0078d4"; // Blue
export const COLOR_ERROR = "#dc3545"; // Red
export const COLOR_WARNING = "#ffc107"; // Yellow
export const COLOR_SUCCESS = "#28a745"; // Green

// State values
export const STATE_ON = "on";
export const STATE_OFF = "off";
export const STATE_UNAVAILABLE = "unavailable";
export const STATE_UNKNOWN = "unknown";
export const STATE_IDLE = "idle";
export const STATE_PLAYING = "playing";
export const STATE_PAUSED = "paused";

// Device classes
export const DEVICE_CLASS_TEMPERATURE = "temperature";
export const DEVICE_CLASS_HUMIDITY = "humidity";
export const DEVICE_CLASS_POWER = "power";
export const DEVICE_CLASS_ENERGY = "energy";
export const DEVICE_CLASS_BATTERY = "battery";
