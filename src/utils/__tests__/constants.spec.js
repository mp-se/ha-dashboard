import { describe, it, expect } from "vitest";
import * as constants from "../constants.js";

describe("constants.js", () => {
  describe("Network and API timeouts", () => {
    it("should have reasonable timeout values", () => {
      expect(constants.TIMEOUT_DEFAULT).toBe(10000);
      expect(constants.TIMEOUT_CONFIG).toBe(15000);
      expect(constants.TIMEOUT_SERVICE_CALL).toBe(30000);
      expect(constants.TIMEOUT_WEBSOCKET).toBe(5000);
    });

    it("should have service call timeout greater than default", () => {
      expect(constants.TIMEOUT_SERVICE_CALL).toBeGreaterThan(
        constants.TIMEOUT_DEFAULT,
      );
    });
  });

  describe("Number formatting precision", () => {
    it("should have valid precision values", () => {
      expect(constants.PRECISION_TEMPERATURE).toBe(1);
      expect(constants.PRECISION_HUMIDITY).toBe(0);
      expect(constants.PRECISION_POWER).toBe(0);
      expect(constants.PRECISION_ENERGY).toBe(2);
      expect(constants.PRECISION_PERCENTAGE).toBe(0);
      expect(constants.PRECISION_DEFAULT).toBe(2);
    });

    it("should have non-negative precision values", () => {
      expect(constants.PRECISION_TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(constants.PRECISION_HUMIDITY).toBeGreaterThanOrEqual(0);
      expect(constants.PRECISION_DEFAULT).toBeGreaterThanOrEqual(0);
    });
  });

  describe("UI and interaction", () => {
    it("should have reasonable swipe and debounce values", () => {
      expect(constants.SWIPE_MIN_DISTANCE).toBe(50);
      expect(constants.DEBOUNCE_DEFAULT).toBe(300);
    });

    it("should have valid brightness range", () => {
      expect(constants.BRIGHTNESS_MIN).toBe(0);
      expect(constants.BRIGHTNESS_MAX).toBe(100);
      expect(constants.BRIGHTNESS_MAX).toBeGreaterThan(
        constants.BRIGHTNESS_MIN,
      );
    });
  });

  describe("Light control", () => {
    it("should have valid kelvin range", () => {
      expect(constants.LIGHT_KELVIN_MIN).toBe(2000);
      expect(constants.LIGHT_KELVIN_MAX).toBe(6500);
      expect(constants.LIGHT_KELVIN_MAX).toBeGreaterThan(
        constants.LIGHT_KELVIN_MIN,
      );
    });

    it("should have valid brightness percentage range", () => {
      expect(constants.LIGHT_BRIGHTNESS_PCT_MIN).toBe(0);
      expect(constants.LIGHT_BRIGHTNESS_PCT_MAX).toBe(100);
    });
  });

  describe("Media player", () => {
    it("should have valid volume range", () => {
      expect(constants.VOLUME_MIN).toBe(0);
      expect(constants.VOLUME_MAX).toBe(1);
      expect(constants.VOLUME_STEP).toBe(0.01);
      expect(constants.VOLUME_MAX).toBeGreaterThan(constants.VOLUME_MIN);
    });
  });

  describe("WebSocket reconnection", () => {
    it("should have reasonable reconnect delays", () => {
      expect(constants.RECONNECT_DELAY_INITIAL).toBe(1000);
      expect(constants.RECONNECT_DELAY_MAX).toBe(30000);
      expect(constants.RECONNECT_MULTIPLIER).toBe(2);
    });

    it("should have max delay greater than initial", () => {
      expect(constants.RECONNECT_DELAY_MAX).toBeGreaterThan(
        constants.RECONNECT_DELAY_INITIAL,
      );
    });
  });

  describe("Color presets", () => {
    it("should have valid hex color values", () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(constants.COLOR_UNAVAILABLE).toMatch(hexColorRegex);
      expect(constants.COLOR_OFF).toMatch(hexColorRegex);
      expect(constants.COLOR_ON).toMatch(hexColorRegex);
      expect(constants.COLOR_ERROR).toMatch(hexColorRegex);
      expect(constants.COLOR_WARNING).toMatch(hexColorRegex);
      expect(constants.COLOR_SUCCESS).toMatch(hexColorRegex);
    });
  });

  describe("State values", () => {
    it("should have common HA state strings", () => {
      expect(constants.STATE_ON).toBe("on");
      expect(constants.STATE_OFF).toBe("off");
      expect(constants.STATE_UNAVAILABLE).toBe("unavailable");
      expect(constants.STATE_UNKNOWN).toBe("unknown");
      expect(constants.STATE_IDLE).toBe("idle");
      expect(constants.STATE_PLAYING).toBe("playing");
      expect(constants.STATE_PAUSED).toBe("paused");
    });

    it("should have distinct state values", () => {
      const states = [
        constants.STATE_ON,
        constants.STATE_OFF,
        constants.STATE_UNAVAILABLE,
        constants.STATE_UNKNOWN,
      ];
      const uniqueStates = new Set(states);
      expect(uniqueStates.size).toBe(states.length);
    });
  });

  describe("Device classes", () => {
    it("should have common device class strings", () => {
      expect(constants.DEVICE_CLASS_TEMPERATURE).toBe("temperature");
      expect(constants.DEVICE_CLASS_HUMIDITY).toBe("humidity");
      expect(constants.DEVICE_CLASS_POWER).toBe("power");
      expect(constants.DEVICE_CLASS_ENERGY).toBe("energy");
      expect(constants.DEVICE_CLASS_BATTERY).toBe("battery");
    });
  });

  describe("Validation", () => {
    it("should have reasonable validation constants", () => {
      expect(constants.MIN_PASSWORD_LENGTH).toBe(4);
      expect(constants.MAX_ENTITY_NAME_LENGTH).toBe(255);
    });
  });

  describe("PWA and caching", () => {
    it("should have reasonable cache and update intervals", () => {
      expect(constants.CACHE_MAX_AGE).toBe(86400000); // 24 hours
      expect(constants.SW_UPDATE_CHECK_INTERVAL).toBe(3600000); // 1 hour
    });

    it("should have update interval less than cache max age", () => {
      expect(constants.SW_UPDATE_CHECK_INTERVAL).toBeLessThan(
        constants.CACHE_MAX_AGE,
      );
    });
  });
});
