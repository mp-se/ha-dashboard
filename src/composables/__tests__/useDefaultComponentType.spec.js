import { describe, it, expect } from "vitest";
import { 
  useDefaultComponentType, 
  getDefaultTypeForEntityConfig 
} from "../useDefaultComponentType";

describe("useDefaultComponentType", () => {
  describe("Direct domain mappings", () => {
    it("should map light domain to HaLight", () => {
      expect(useDefaultComponentType("light.bedroom")).toBe("HaLight");
    });

    it("should map switch domain to HaSwitch", () => {
      expect(useDefaultComponentType("switch.outlet")).toBe("HaSwitch");
    });

    it("should map binary_sensor domain to HaBinarySensor", () => {
      expect(useDefaultComponentType("binary_sensor.motion")).toBe(
        "HaBinarySensor",
      );
    });

    it("should map sensor domain to HaSensor", () => {
      expect(useDefaultComponentType("sensor.temperature")).toBe("HaSensor");
    });

    it("should map weather domain to HaWeather", () => {
      expect(useDefaultComponentType("weather.home")).toBe("HaWeather");
    });

    it("should map sun domain to HaSun", () => {
      expect(useDefaultComponentType("sun.sun")).toBe("HaSun");
    });

    it("should map person domain to HaPerson", () => {
      expect(useDefaultComponentType("person.user")).toBe("HaPerson");
    });

    it("should map media_player domain to HaMediaPlayer", () => {
      expect(useDefaultComponentType("media_player.living_room")).toBe(
        "HaMediaPlayer",
      );
    });

    it("should map alarm_control_panel domain to HaAlarmPanel", () => {
      expect(useDefaultComponentType("alarm_control_panel.home")).toBe(
        "HaAlarmPanel",
      );
    });

    it("should map input_select domain to HaSelect", () => {
      expect(useDefaultComponentType("input_select.mode")).toBe("HaSelect");
    });

    it("should map input_button domain to HaButton", () => {
      expect(useDefaultComponentType("input_button.restart")).toBe("HaButton");
    });

    it("should map device_tracker domain to HaSensor", () => {
      expect(useDefaultComponentType("device_tracker.phone")).toBe("HaSensor");
    });
  });

  describe("Unknown domains", () => {
    it("should return HaSensor for unknown domain", () => {
      expect(useDefaultComponentType("unknown.entity")).toBe("HaSensor");
    });

    it("should return HaSensor for empty string", () => {
      expect(useDefaultComponentType("")).toBe("HaSensor");
    });

    it("should return HaSensor for null", () => {
      expect(useDefaultComponentType(null)).toBe("HaSensor");
    });
  });

  describe("Getter-based hints", () => {
    it("should use component property if provided as object", () => {
      const entity = { type: "HaLight" };
      expect(useDefaultComponentType(entity)).toBe("HaLight");
    });

    it("should use entity id from object if type not provided", () => {
      const entity = { entity_id: "light.bedroom" };
      expect(useDefaultComponentType(entity)).toBe("HaLight");
    });

    it("should return HaSensor if object has no type or entity_id", () => {
      const entity = { state: "on" };
      expect(useDefaultComponentType(entity)).toBe("HaSensor");
    });
  });

  describe("Case sensitivity", () => {
    it("should handle lowercase entity domains", () => {
      expect(useDefaultComponentType("LIGHT.BEDROOM")).toBe("HaSensor");
    });

    it("should be case sensitive for domain matching", () => {
      expect(useDefaultComponentType("Light.bedroom")).toBe("HaSensor");
    });
  });

  describe("Getter-based hints", () => {
    it("should use getter name to hint type", () => {
      expect(useDefaultComponentType("", "getBatteryLevel")).toBe("HaSensor");
      expect(useDefaultComponentType("", "getEnergyUsage")).toBe("HaEnergy");
      expect(useDefaultComponentType("", "getPowerUsage")).toBe("HaEnergy");
      expect(useDefaultComponentType("", "getLightStatus")).toBe("HaLight");
      expect(useDefaultComponentType("", "getSwitchStatus")).toBe("HaSwitch");
      expect(useDefaultComponentType("", "getButtonPress")).toBe("HaButton");
      expect(useDefaultComponentType("", "getSelectOption")).toBe("HaSelect");
      expect(useDefaultComponentType("", "getFanSpeed")).toBe("HaSwitch");
      expect(useDefaultComponentType("", "getMediaPlayer")).toBe("HaMediaPlayer");
      expect(useDefaultComponentType("", "getAlarmPanel")).toBe("HaAlarmPanel");
      expect(useDefaultComponentType("", "getBinaryState")).toBe("HaBinarySensor");
      expect(useDefaultComponentType("", "getWifiStrength")).toBe("HaSensor");
      expect(useDefaultComponentType("", "unknownGetter")).toBe("HaSensor");
    });
  });

  describe("Array handling", () => {
    it("should use first element of array for type detection", () => {
      expect(useDefaultComponentType(["light.bedroom", "switch.outlet"])).toBe("HaLight");
    });

    it("should return HaSensor for non-string array elements", () => {
      expect(useDefaultComponentType([123])).toBe("HaSensor");
    });
  });

  describe("getDefaultTypeForEntityConfig", () => {
    it("should use getter if provided", () => {
      expect(getDefaultTypeForEntityConfig({ getter: "getLightStatus" })).toBe("HaLight");
    });

    it("should use entity if provided", () => {
      expect(getDefaultTypeForEntityConfig({ entity: "switch.outlet" })).toBe("HaSwitch");
    });

    it("should handle array of entities in config", () => {
      expect(getDefaultTypeForEntityConfig({ entity: ["light.living_room"] })).toBe("HaLight");
    });

    it("should return type if it is a special type", () => {
      expect(getDefaultTypeForEntityConfig({ type: "HaLink" })).toBe("HaLink");
      expect(getDefaultTypeForEntityConfig({ type: "HaSpacer" })).toBe("HaSpacer");
      expect(getDefaultTypeForEntityConfig({ type: "HaRowSpacer" })).toBe("HaRowSpacer");
    });

    it("should return HaSensor if nothing else matches", () => {
      expect(getDefaultTypeForEntityConfig({})).toBe("HaSensor");
    });
  });

  describe("Entity id formats", () => {
    it("should handle entity id with multiple dots", () => {
      expect(useDefaultComponentType("light.living.room")).toBe("HaLight");
    });

    it("should handle entity id with underscores", () => {
      expect(useDefaultComponentType("sensor.temp_living_room")).toBe(
        "HaSensor",
      );
    });

    it("should handle entity id with numbers", () => {
      expect(useDefaultComponentType("light.room_2")).toBe("HaLight");
    });
  });
});
