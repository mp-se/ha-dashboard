import { describe, it, expect } from "vitest";
import {
  formatAttributeValue,
  formatKey,
  attributeLabel,
} from "../attributeFormatters.ts";

describe("attributeFormatters", () => {
  describe("formatAttributeValue", () => {
    it("should format null or undefined as '-'", () => {
      expect(formatAttributeValue(null)).toBe("-");
      expect(formatAttributeValue(undefined)).toBe("-");
    });

    it("should format arrays as comma-separated strings", () => {
      expect(formatAttributeValue(["Lights", "Switches"])).toBe(
        "Lights, Switches",
      );
      expect(formatAttributeValue([])).toBe("");
    });

    it("should stringify objects", () => {
      const obj = { foo: "bar" };
      expect(formatAttributeValue(obj)).toBe(JSON.stringify(obj));
    });

    it("should return primitive values as strings", () => {
      expect(formatAttributeValue(123)).toBe("123");
      expect(formatAttributeValue(true)).toBe("true");
      expect(formatAttributeValue("hello")).toBe("hello");
    });
  });

  describe("formatKey", () => {
    it("should capitalize and replace underscores with spaces", () => {
      expect(formatKey("battery_level")).toBe("Battery Level");
      expect(formatKey("friendly_name")).toBe("Friendly Name");
      expect(formatKey("temp")).toBe("Temp");
    });
  });

  describe("attributeLabel", () => {
    it("should act as an alias for formatKey", () => {
      expect(attributeLabel("device_class")).toBe("Device Class");
    });
  });
});
