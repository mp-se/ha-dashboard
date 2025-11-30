import { describe, it, expect } from 'vitest';
import { useIconCircleColor } from '../useIconCircleColor';

describe('useIconCircleColor', () => {
  describe('Unavailable and Unknown states', () => {
    it('should return light grey for null entity', () => {
      const color = useIconCircleColor(null, 'sensor.test');
      expect(color).toBe('#d0d0d0');
    });

    it('should return light grey for unavailable state', () => {
      const entity = { state: 'unavailable', attributes: {} };
      const color = useIconCircleColor(entity, 'sensor.test');
      expect(color).toBe('#d0d0d0');
    });

    it('should return light grey for unknown state', () => {
      const entity = { state: 'unknown', attributes: {} };
      const color = useIconCircleColor(entity, 'sensor.test');
      expect(color).toBe('#d0d0d0');
    });
  });

  describe('Battery sensors', () => {
    it('should return red for battery <= 20%', () => {
      const entity = { state: '15', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#dc3545');
    });

    it('should return yellow for battery 20-50%', () => {
      const entity = { state: '35', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#ffc107');
    });

    it('should return light green for battery 50-80%', () => {
      const entity = { state: '65', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#28a745');
    });

    it('should return dark green for battery > 80%', () => {
      const entity = { state: '95', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#20c997');
    });

    it('should detect battery by unit_of_measurement', () => {
      const entity = { state: '42', attributes: { unit_of_measurement: '%' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#ffc107');
    });

    it('should handle battery at boundary: 20%', () => {
      const entity = { state: '20', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#dc3545');
    });

    it('should handle battery at boundary: 50%', () => {
      const entity = { state: '50', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#ffc107');
    });

    it('should handle battery at boundary: 80%', () => {
      const entity = { state: '80', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#28a745');
    });
  });

  describe('Temperature sensors', () => {
    it('should return blue for temp < 15°C', () => {
      const entity = { state: '10', attributes: { device_class: 'temperature' } };
      expect(useIconCircleColor(entity, 'sensor.temp')).toBe('#0dcaf0');
    });

    it('should return green for temp 15-22°C', () => {
      const entity = { state: '18', attributes: { device_class: 'temperature' } };
      expect(useIconCircleColor(entity, 'sensor.temp')).toBe('#28a745');
    });

    it('should return orange for temp 22-28°C', () => {
      const entity = { state: '25', attributes: { device_class: 'temperature' } };
      expect(useIconCircleColor(entity, 'sensor.temp')).toBe('#fd7e14');
    });

    it('should return red for temp > 28°C', () => {
      const entity = { state: '30', attributes: { device_class: 'temperature' } };
      expect(useIconCircleColor(entity, 'sensor.temp')).toBe('#dc3545');
    });

    it('should detect temperature by unit °C', () => {
      const entity = { state: '22', attributes: { unit_of_measurement: '°C' } };
      expect(useIconCircleColor(entity, 'sensor.temp')).toBe('#28a745');
    });

    it('should handle temperature boundaries', () => {
      expect(useIconCircleColor({ state: '15', attributes: { device_class: 'temperature' } }, 'sensor.temp')).toBe('#28a745');
      expect(useIconCircleColor({ state: '22', attributes: { device_class: 'temperature' } }, 'sensor.temp')).toBe('#28a745');
      expect(useIconCircleColor({ state: '28', attributes: { device_class: 'temperature' } }, 'sensor.temp')).toBe('#fd7e14');
    });
  });

  describe('Humidity sensors', () => {
    it('should return red for humidity < 30%', () => {
      const entity = { state: '20', attributes: { device_class: 'humidity' } };
      expect(useIconCircleColor(entity, 'sensor.humidity')).toBe('#dc3545');
    });

    it('should return green for humidity 30-60%', () => {
      const entity = { state: '45', attributes: { device_class: 'humidity' } };
      expect(useIconCircleColor(entity, 'sensor.humidity')).toBe('#28a745');
    });

    it('should return orange for humidity 60-80%', () => {
      const entity = { state: '70', attributes: { device_class: 'humidity' } };
      expect(useIconCircleColor(entity, 'sensor.humidity')).toBe('#fd7e14');
    });

    it('should return red for humidity > 80%', () => {
      const entity = { state: '90', attributes: { device_class: 'humidity' } };
      expect(useIconCircleColor(entity, 'sensor.humidity')).toBe('#dc3545');
    });

    it('should detect humidity by unit', () => {
      const entity = { state: '50', attributes: { unit_of_measurement: '%' } };
      expect(useIconCircleColor(entity, 'sensor.humidity')).toBe('#28a745');
    });
  });

  describe('WiFi signal strength', () => {
    it('should handle percentage: excellent (>= 75%)', () => {
      const entity = { state: '85', attributes: { device_class: 'signal_strength', unit_of_measurement: '%' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#28a745');
    });

    it('should handle percentage: good (50-75%)', () => {
      const entity = { state: '60', attributes: { device_class: 'signal_strength', unit_of_measurement: '%' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#20c997');
    });

    it('should handle percentage: fair (25-50%)', () => {
      const entity = { state: '35', attributes: { device_class: 'signal_strength', unit_of_measurement: '%' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#ffc107');
    });

    it('should handle percentage: poor (< 25%)', () => {
      const entity = { state: '10', attributes: { device_class: 'signal_strength', unit_of_measurement: '%' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#dc3545');
    });

    it('should handle dBm: excellent (> -50)', () => {
      const entity = { state: '-40', attributes: { device_class: 'signal_strength', unit_of_measurement: 'dBm' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#28a745');
    });

    it('should handle dBm: good (-50 to -60)', () => {
      const entity = { state: '-55', attributes: { device_class: 'signal_strength', unit_of_measurement: 'dBm' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#20c997');
    });

    it('should handle dBm: fair (-60 to -70)', () => {
      const entity = { state: '-65', attributes: { device_class: 'signal_strength', unit_of_measurement: 'dBm' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#ffc107');
    });

    it('should handle dBm: poor (< -70)', () => {
      const entity = { state: '-80', attributes: { device_class: 'signal_strength', unit_of_measurement: 'dBm' } };
      expect(useIconCircleColor(entity, 'sensor.wifi')).toBe('#dc3545');
    });
  });

  describe('Power sensors', () => {
    it('should return green for 0W (off)', () => {
      const entity = { state: '0', attributes: { device_class: 'power' } };
      expect(useIconCircleColor(entity, 'sensor.power')).toBe('#28a745');
    });

    it('should return light green for < 500W', () => {
      const entity = { state: '250', attributes: { device_class: 'power' } };
      expect(useIconCircleColor(entity, 'sensor.power')).toBe('#20c997');
    });

    it('should return yellow for 500-2000W', () => {
      const entity = { state: '1000', attributes: { device_class: 'power' } };
      expect(useIconCircleColor(entity, 'sensor.power')).toBe('#ffc107');
    });

    it('should return red for > 2000W', () => {
      const entity = { state: '3000', attributes: { device_class: 'power' } };
      expect(useIconCircleColor(entity, 'sensor.power')).toBe('#dc3545');
    });

    it('should detect power by unit', () => {
      const entity = { state: '1500', attributes: { unit_of_measurement: 'W' } };
      expect(useIconCircleColor(entity, 'sensor.power')).toBe('#ffc107');
    });
  });

  describe('Energy sensors', () => {
    it('should return green for energy', () => {
      const entity = { state: '45.2', attributes: { device_class: 'energy' } };
      expect(useIconCircleColor(entity, 'sensor.energy')).toBe('#28a745');
    });

    it('should detect energy by unit kWh', () => {
      const entity = { state: '123.45', attributes: { unit_of_measurement: 'kWh' } };
      expect(useIconCircleColor(entity, 'sensor.energy')).toBe('#28a745');
    });
  });

  describe('Air Quality sensors', () => {
    it('should handle CO2: good (< 600 ppm)', () => {
      const entity = { state: '500', attributes: { unit_of_measurement: 'ppm' } };
      expect(useIconCircleColor(entity, 'sensor.co2')).toBe('#28a745');
    });

    it('should handle CO2: moderate (600-1000 ppm)', () => {
      const entity = { state: '800', attributes: { unit_of_measurement: 'ppm' } };
      expect(useIconCircleColor(entity, 'sensor.co2')).toBe('#ffc107');
    });

    it('should handle CO2: poor (> 1000 ppm)', () => {
      const entity = { state: '1200', attributes: { unit_of_measurement: 'ppm' } };
      expect(useIconCircleColor(entity, 'sensor.co2')).toBe('#dc3545');
    });

    it('should handle PM2.5: good (< 35 µg/m³)', () => {
      const entity = { state: '25', attributes: { unit_of_measurement: 'µg/m³' } };
      expect(useIconCircleColor(entity, 'sensor.pm25')).toBe('#28a745');
    });

    it('should handle PM2.5: moderate (35-75)', () => {
      const entity = { state: '50', attributes: { unit_of_measurement: 'µg/m³' } };
      expect(useIconCircleColor(entity, 'sensor.pm25')).toBe('#ffc107');
    });

    it('should handle PM2.5: unhealthy for sensitive (75-115)', () => {
      const entity = { state: '90', attributes: { unit_of_measurement: 'µg/m³' } };
      expect(useIconCircleColor(entity, 'sensor.pm25')).toBe('#fd7e14');
    });

    it('should handle PM2.5: unhealthy (> 115)', () => {
      const entity = { state: '150', attributes: { unit_of_measurement: 'µg/m³' } };
      expect(useIconCircleColor(entity, 'sensor.pm25')).toBe('#dc3545');
    });

    it('should handle AQI: good (< 50)', () => {
      const entity = { state: '30', attributes: { device_class: 'aqi' } };
      expect(useIconCircleColor(entity, 'sensor.aqi')).toBe('#28a745');
    });

    it('should handle AQI: moderate (50-100)', () => {
      const entity = { state: '75', attributes: { device_class: 'aqi' } };
      expect(useIconCircleColor(entity, 'sensor.aqi')).toBe('#ffc107');
    });

    it('should handle AQI: unhealthy for sensitive (100-150)', () => {
      const entity = { state: '125', attributes: { device_class: 'aqi' } };
      expect(useIconCircleColor(entity, 'sensor.aqi')).toBe('#fd7e14');
    });

    it('should handle AQI: unhealthy (150-200)', () => {
      const entity = { state: '175', attributes: { device_class: 'aqi' } };
      expect(useIconCircleColor(entity, 'sensor.aqi')).toBe('#dc3545');
    });

    it('should handle AQI: hazardous (> 200)', () => {
      const entity = { state: '300', attributes: { device_class: 'aqi' } };
      expect(useIconCircleColor(entity, 'sensor.aqi')).toBe('#7d1f1f');
    });
  });

  describe('Pressure sensors', () => {
    it('should return green for normal pressure (1010-1020 hPa)', () => {
      const entity = { state: '1015', attributes: { unit_of_measurement: 'hPa' } };
      expect(useIconCircleColor(entity, 'sensor.pressure')).toBe('#28a745');
    });

    it('should return yellow for low pressure (1000-1010 hPa)', () => {
      const entity = { state: '1005', attributes: { unit_of_measurement: 'hPa' } };
      expect(useIconCircleColor(entity, 'sensor.pressure')).toBe('#ffc107');
    });

    it('should return yellow for high pressure (1020-1030 hPa)', () => {
      const entity = { state: '1025', attributes: { unit_of_measurement: 'hPa' } };
      expect(useIconCircleColor(entity, 'sensor.pressure')).toBe('#ffc107');
    });

    it('should return red for very abnormal pressure', () => {
      const entity = { state: '980', attributes: { unit_of_measurement: 'hPa' } };
      expect(useIconCircleColor(entity, 'sensor.pressure')).toBe('#dc3545');
    });
  });

  describe('Illuminance sensors', () => {
    it('should return dark blue for night (< 50 lux)', () => {
      const entity = { state: '10', attributes: { device_class: 'illuminance' } };
      expect(useIconCircleColor(entity, 'sensor.light')).toBe('#1f1f7d');
    });

    it('should return yellow for twilight (50-500 lux)', () => {
      const entity = { state: '200', attributes: { device_class: 'illuminance' } };
      expect(useIconCircleColor(entity, 'sensor.light')).toBe('#ffc107');
    });

    it('should return green for day (> 500 lux)', () => {
      const entity = { state: '5000', attributes: { device_class: 'illuminance' } };
      expect(useIconCircleColor(entity, 'sensor.light')).toBe('#28a745');
    });
  });

  describe('Moisture sensors', () => {
    it('should return green for dry (<= 30%)', () => {
      const entity = { state: '20', attributes: { device_class: 'moisture' } };
      expect(useIconCircleColor(entity, 'sensor.moisture')).toBe('#28a745');
    });

    it('should return yellow for moist (30-60%)', () => {
      const entity = { state: '45', attributes: { device_class: 'moisture' } };
      expect(useIconCircleColor(entity, 'sensor.moisture')).toBe('#ffc107');
    });

    it('should return red for wet (> 60%)', () => {
      const entity = { state: '75', attributes: { device_class: 'moisture' } };
      expect(useIconCircleColor(entity, 'sensor.moisture')).toBe('#dc3545');
    });
  });

  describe('Smoke/Gas detection', () => {
    it('should return green for clear state', () => {
      const entity = { state: 'off', attributes: { device_class: 'smoke' } };
      expect(useIconCircleColor(entity, 'sensor.smoke')).toBe('#28a745');
    });

    it('should return red for detected state', () => {
      const entity = { state: 'on', attributes: { device_class: 'smoke' } };
      expect(useIconCircleColor(entity, 'sensor.smoke')).toBe('#dc3545');
    });

    it('should handle gas detection', () => {
      const entity = { state: 'detected', attributes: { device_class: 'gas' } };
      expect(useIconCircleColor(entity, 'sensor.gas')).toBe('#dc3545');
    });
  });

  describe('Door/Window sensors', () => {
    it('should return green for closed', () => {
      const entity = { state: 'off', attributes: { device_class: 'door' } };
      expect(useIconCircleColor(entity, 'sensor.door')).toBe('#28a745');
    });

    it('should return red for open', () => {
      const entity = { state: 'on', attributes: { device_class: 'door' } };
      expect(useIconCircleColor(entity, 'sensor.door')).toBe('#dc3545');
    });

    it('should handle window sensors', () => {
      const entity = { state: 'open', attributes: { device_class: 'window' } };
      expect(useIconCircleColor(entity, 'sensor.window')).toBe('#dc3545');
    });
  });

  describe('Motion/Occupancy sensors', () => {
    it('should return yellow for motion detected', () => {
      const entity = { state: 'on', attributes: { device_class: 'motion' } };
      expect(useIconCircleColor(entity, 'sensor.motion')).toBe('#ffc107');
    });

    it('should return grey for no motion', () => {
      const entity = { state: 'off', attributes: { device_class: 'motion' } };
      expect(useIconCircleColor(entity, 'sensor.motion')).toBe('#6c757d');
    });

    it('should handle occupancy sensors', () => {
      const entity = { state: 'detected', attributes: { device_class: 'occupancy' } };
      expect(useIconCircleColor(entity, 'sensor.occupancy')).toBe('#ffc107');
    });
  });

  describe('State-based entities', () => {
    it('should return green for switch on', () => {
      const entity = { state: 'on', attributes: {} };
      expect(useIconCircleColor(entity, 'switch.outlet')).toBe('#28a745');
    });

    it('should return grey for switch off', () => {
      const entity = { state: 'off', attributes: {} };
      expect(useIconCircleColor(entity, 'switch.outlet')).toBe('#6c757d');
    });

    it('should handle light domain', () => {
      const entity = { state: 'on', attributes: {} };
      expect(useIconCircleColor(entity, 'light.bedroom')).toBe('#28a745');
    });

    it('should handle person domain (home)', () => {
      const entity = { state: 'home', attributes: {} };
      expect(useIconCircleColor(entity, 'person.user')).toBe('#28a745');
    });

    it('should handle person domain (away)', () => {
      const entity = { state: 'away', attributes: {} };
      expect(useIconCircleColor(entity, 'person.user')).toBe('#6c757d');
    });

    it('should handle device_tracker domain', () => {
      const entity = { state: 'true', attributes: {} };
      expect(useIconCircleColor(entity, 'device_tracker.phone')).toBe('#28a745');
    });
  });

  describe('Edge cases', () => {
    it('should handle NaN state gracefully', () => {
      const entity = { state: 'invalid', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.test')).toBe('#6c757d');
    });

    it('should handle missing attributes', () => {
      const entity = { state: 'on' };
      expect(useIconCircleColor(entity, 'switch.test')).toBe('#28a745');
    });

    it('should handle missing unit_of_measurement', () => {
      const entity = { state: '42', attributes: {} };
      expect(useIconCircleColor(entity, 'sensor.unknown')).toBe('#6c757d');
    });

    it('should handle numeric state as string', () => {
      const entity = { state: '45.5', attributes: { device_class: 'battery' } };
      expect(useIconCircleColor(entity, 'sensor.battery')).toBe('#ffc107');
    });

    it('should handle zero values', () => {
      const entity = { state: '0', attributes: { device_class: 'temperature' } };
      expect(useIconCircleColor(entity, 'sensor.temp')).toBe('#0dcaf0');
    });
  });
});
