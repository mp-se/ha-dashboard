/**
 * Composable to calculate icon circle background color based on entity type and value
 * Returns color for battery, temperature, humidity, WiFi, power, air quality, and more
 */

export const useIconCircleColor = (entity, entityId) => {
  if (!entity) return '#d0d0d0'; // Light muted grey for unavailable

  const state = entity.state;
  const unit = entity.attributes?.unit_of_measurement || '';
  const deviceClass = entity.attributes?.device_class || '';

  // Handle unavailable/unknown states
  if (state === 'unavailable' || state === 'unknown') {
    return '#d0d0d0'; // Light muted grey - distinct from active states
  }

  // Get domain and device class
  const domain = entityId ? (typeof entityId === 'string' ? entityId.split('.')[0] : entityId.split('.')[0]) : '';

  // Battery sensors
  if (deviceClass === 'battery' || (domain === 'sensor' && entityId.includes('battery'))) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      if (value <= 20) return '#dc3545'; // Red - Critical
      if (value <= 50) return '#ffc107'; // Yellow - Low
      if (value <= 80) return '#28a745'; // Light green - Good
      return '#20c997'; // Dark green - Excellent
    }
  }

  // Temperature sensors
  if (deviceClass === 'temperature' || /°C|°F|°/.test(unit)) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      if (value < 15) return '#0dcaf0'; // Blue - Cold
      if (value <= 22) return '#28a745'; // Green - Comfortable
      if (value <= 28) return '#fd7e14'; // Orange - Warm
      return '#dc3545'; // Red - Hot
    }
  }

  // WiFi signal strength (percentage or dBm) - check before humidity since WiFi can be %
  if (deviceClass === 'signal_strength' || /wifi|signal|strength|rssi|dBm/i.test(unit)) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      // Handle percentage
      if (/%/i.test(unit)) {
        if (value >= 75) return '#28a745'; // Green - Excellent
        if (value >= 50) return '#20c997'; // Light green - Good
        if (value >= 25) return '#ffc107'; // Yellow - Fair
        return '#dc3545'; // Red - Poor
      }
      // Handle dBm (negative values, closer to 0 is better)
      if (value > -50) return '#28a745'; // Green - Excellent
      if (value > -60) return '#20c997'; // Light green - Good
      if (value > -70) return '#ffc107'; // Yellow - Fair
      return '#dc3545'; // Red - Poor
    }
  }

  // Humidity sensors - check for device_class or 'humidity' keyword
  if (deviceClass === 'humidity' || /humidity/i.test(unit)) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      if (value < 30) return '#dc3545'; // Red - Too low
      if (value <= 60) return '#28a745'; // Green - Ideal
      if (value <= 80) return '#fd7e14'; // Orange - Too high
      return '#dc3545'; // Red - Very high
    }
  }

  // Generic percentage sensors (% unit with no device class)
  if (!deviceClass && unit === '%') {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      // Default to humidity interpretation for bare %
      if (value < 30) return '#dc3545'; // Red - Too low
      if (value <= 60) return '#28a745'; // Green - Ideal
      if (value <= 80) return '#fd7e14'; // Orange - Too high
      return '#dc3545'; // Red - Very high
    }
  }

  // Power/Energy sensors - check energy first since it's more specific
  if (deviceClass === 'energy' || /kwh|mwh|wh(?!\w)/i.test(unit)) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      // For cumulative energy, just show green (it's informational)
      return '#28a745'; // Green - Energy tracking
    }
  }

  // Power sensors
  if (deviceClass === 'power' || /power|watt|kW|W(?!\w)/.test(unit)) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      if (value === 0) return '#28a745'; // Green - Off/Idle
      if (value < 500) return '#20c997'; // Light green - Low consumption
      if (value < 2000) return '#ffc107'; // Yellow - Medium consumption
      return '#dc3545'; // Red - High consumption
    }
  }

  // Air Quality sensors (CO2, PM2.5, PM10, AQI)
  if (deviceClass === 'aqi' || /co2|ppm|air.*quality|aqi|pm2\.5|pm10|ug\/m|µg\/m/i.test(unit)) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      if (/ppm|co2/i.test(unit)) {
        // CO2 levels
        if (value < 600) return '#28a745'; // Green - Good
        if (value < 1000) return '#ffc107'; // Yellow - Moderate
        return '#dc3545'; // Red - Poor
      }
      if (/pm2\.5|pm10|ug\/m|µg\/m/i.test(unit)) {
        // PM2.5/PM10 levels
        if (value < 35) return '#28a745'; // Green - Good
        if (value < 75) return '#ffc107'; // Yellow - Moderate
        if (value < 115) return '#fd7e14'; // Orange - Unhealthy for sensitive
        return '#dc3545'; // Red - Unhealthy
      }
      // Generic AQI (0-500 scale)
      if (value < 50) return '#28a745'; // Green - Good
      if (value < 100) return '#ffc107'; // Yellow - Moderate
      if (value < 150) return '#fd7e14'; // Orange - Unhealthy for sensitive
      if (value < 200) return '#dc3545'; // Red - Unhealthy
      return '#7d1f1f'; // Dark red - Hazardous
    }
  }

  // Pressure sensors (barometric)
  if (deviceClass === 'pressure' || /hPa|mbar|inHg|pressure/.test(unit)) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      // Normal range is ~1010-1020 hPa
      if (value >= 1010 && value <= 1020) return '#28a745'; // Green - Normal
      if (value >= 1000 && value < 1010) return '#ffc107'; // Yellow - Low
      if (value > 1020 && value <= 1030) return '#ffc107'; // Yellow - High
      return '#dc3545'; // Red - Abnormal
    }
  }

  // Illuminance/Light level sensors
  if (deviceClass === 'illuminance' || /lux|illuminance|light.*level/.test(unit.toLowerCase())) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      if (value < 50) return '#1f1f7d'; // Dark blue - Night
      if (value < 500) return '#ffc107'; // Yellow - Twilight
      return '#28a745'; // Green - Day
    }
  }

  // Moisture/Water sensors
  if (deviceClass === 'moisture' || /moisture|water/.test(unit.toLowerCase())) {
    const value = Number(state);
    if (!Number.isNaN(value)) {
      if (value <= 30) return '#28a745'; // Green - Dry (OK)
      if (value <= 60) return '#ffc107'; // Yellow - Moist (caution)
      return '#dc3545'; // Red - Wet (alert)
    }
  }

  // Smoke/Gas detection (binary)
  if (deviceClass === 'smoke' || deviceClass === 'gas' || deviceClass === 'problem') {
    if (state === 'on' || state === 'detected') return '#dc3545'; // Red - Detected
    return '#28a745'; // Green - Clear
  }

  // Door/Window/Opening sensors (binary)
  if (deviceClass === 'door' || deviceClass === 'window' || deviceClass === 'opening') {
    if (state === 'on' || state === 'open') return '#dc3545'; // Red - Open
    return '#28a745'; // Green - Closed
  }

  // Occupancy/Motion sensors (binary)
  if (deviceClass === 'motion' || deviceClass === 'occupancy') {
    if (state === 'on' || state === 'detected') return '#ffc107'; // Yellow - Motion detected
    return '#6c757d'; // Grey - No motion
  }

  // State-based entities (switches, lights, binary sensors, etc.)
  if (domain === 'switch' || domain === 'light' || domain === 'person' || domain === 'device_tracker') {
    if (state === 'on' || state === 'home' || state === 'true') {
      return '#28a745'; // Green - Active
    }
    return '#6c757d'; // Grey - Inactive
  }

  // Default: grey
  return '#6c757d';
};
