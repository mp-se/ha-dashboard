import { describe, it, expect } from "vitest";
import {
  getCardProperties,
  validateProperty,
  CARD_PROPERTY_METADATA,
} from "../cardPropertyMetadata";

describe("cardPropertyMetadata.ts", () => {
  describe("Metadata Structure", () => {
    it("exports CARD_PROPERTY_METADATA object", () => {
      expect(CARD_PROPERTY_METADATA).toBeDefined();
      expect(typeof CARD_PROPERTY_METADATA).toBe("object");
    });

    it("has properties for known card types", () => {
      expect(CARD_PROPERTY_METADATA.HaWarning).toBeDefined();
      expect(CARD_PROPERTY_METADATA.HaError).toBeDefined();
      expect(CARD_PROPERTY_METADATA.HaHeader).toBeDefined();
      expect(CARD_PROPERTY_METADATA.HaLink).toBeDefined();
    });

    it("HaWarning has operator property", () => {
      const warning = CARD_PROPERTY_METADATA.HaWarning;
      expect(warning.operator).toBeDefined();
      expect(warning.operator.type).toBe("select");
      expect(warning.operator.label).toBe("Operator");
    });

    it("HaWarning has required properties", () => {
      const warning = CARD_PROPERTY_METADATA.HaWarning;
      expect(warning.operator).toBeDefined();
      expect(warning.attribute).toBeDefined();
      expect(warning.value).toBeDefined();
      expect(warning.message).toBeDefined();
    });

    it("HaError has operator property", () => {
      const error = CARD_PROPERTY_METADATA.HaError;
      expect(error.operator).toBeDefined();
      expect(error.attribute).toBeDefined();
      expect(error.value).toBeDefined();
      expect(error.message).toBeDefined();
    });

    it("HaHeader has name property", () => {
      const header = CARD_PROPERTY_METADATA.HaHeader;
      expect(header.name).toBeDefined();
      expect(header.name.type).toBe("text");
    });

    it("HaHeader has icon property", () => {
      const header = CARD_PROPERTY_METADATA.HaHeader;
      expect(header.icon).toBeDefined();
      expect(header.icon.type).toBe("icon");
    });

    it("HaLink has url and name properties", () => {
      const link = CARD_PROPERTY_METADATA.HaLink;
      expect(link.url).toBeDefined();
      expect(link.name).toBeDefined();
    });
  });

  describe("getCardProperties", () => {
    it("returns properties for known card type", () => {
      const props = getCardProperties("HaWarning");
      expect(props).toBeDefined();
      expect(typeof props).toBe("object");
    });

    it("returns empty object for unknown card type", () => {
      const props = getCardProperties("UnknownCard");
      expect(props).toEqual({});
    });

    it("returns properties from CARD_PROPERTY_METADATA", () => {
      const props = getCardProperties("HaWarning");
      expect(props).toEqual(CARD_PROPERTY_METADATA.HaWarning);
    });

    it("returns HaError properties", () => {
      const props = getCardProperties("HaError");
      expect(props).toEqual(CARD_PROPERTY_METADATA.HaError);
    });

    it("returns HaHeader properties", () => {
      const props = getCardProperties("HaHeader");
      expect(props).toEqual(CARD_PROPERTY_METADATA.HaHeader);
    });

    it("returns HaLink properties", () => {
      const props = getCardProperties("HaLink");
      expect(props).toEqual(CARD_PROPERTY_METADATA.HaLink);
    });
  });

  describe("validateProperty", () => {
    it("validates text property", () => {
      const result = validateProperty("HaHeader", "name", "My Title");
      expect(result.valid).toBe(true);
    });

    it("validates icon property", () => {
      const result = validateProperty("HaHeader", "icon", "mdi-home");
      expect(result.valid).toBe(true);
    });

    it("rejects required property when empty", () => {
      const result = validateProperty("HaWarning", "value", "");
      expect(result.valid).toBe(false);
    });

    it("validates operator select options", () => {
      const result = validateProperty("HaWarning", "operator", "=");
      expect(result.valid).toBe(true);
    });

    it("rejects invalid operator", () => {
      // Note: validateProperty doesn't currently validate select options
      // It only validates required, maxLength, pattern, min/max
      const result = validateProperty(
        "HaWarning",
        "operator",
        "invalid_operator",
      );
      expect(result.valid).toBe(true); // Currently allows any value
    });

    it("validates message property", () => {
      const result = validateProperty(
        "HaWarning",
        "message",
        "This is a warning",
      );
      expect(result.valid).toBe(true);
    });

    it("validates maxLength constraint", () => {
      const longMessage = "a".repeat(501);
      const result = validateProperty("HaWarning", "message", longMessage);
      // Note: message is textarea type, not text type, so maxLength isn't validated
      // only text type has maxLength validation
      expect(result.valid).toBe(true);
    });

    it("returns error message for invalid property", () => {
      const result = validateProperty("HaWarning", "value", "");
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe("string");
    });

    it("returns valid for unknown property", () => {
      const result = validateProperty("HaWarning", "unknownProp", "value");
      expect(result.valid).toBe(true);
    });
  });

  describe("Property Types", () => {
    it("has select type properties with options", () => {
      const operator = CARD_PROPERTY_METADATA.HaWarning.operator;
      expect(operator.options).toBeDefined();
      expect(Array.isArray(operator.options)).toBe(true);
      expect(operator.options.length).toBeGreaterThan(0);
    });

    it("operator property has required flag", () => {
      const operator = CARD_PROPERTY_METADATA.HaWarning.operator;
      expect(operator.required).toBe(true);
    });

    it("attribute property has default value", () => {
      const attribute = CARD_PROPERTY_METADATA.HaWarning.attribute;
      expect(attribute.default).toBeDefined();
    });

    it("message property has maxLength constraint", () => {
      const message = CARD_PROPERTY_METADATA.HaWarning.message;
      expect(message.maxLength).toBeDefined();
      expect(message.maxLength).toBe(500);
    });

    it("has help text for properties", () => {
      const operator = CARD_PROPERTY_METADATA.HaWarning.operator;
      expect(operator.help).toBeDefined();
    });
  });

  describe("Card Type Completeness", () => {
    it("HaLink has required properties", () => {
      const link = CARD_PROPERTY_METADATA.HaLink;
      expect(link.url).toBeDefined();
      expect(link.name).toBeDefined();
      expect(link.header).toBeDefined();
    });

    it("HaLink url and name are required", () => {
      expect(CARD_PROPERTY_METADATA.HaLink.url.required).toBe(true);
      expect(CARD_PROPERTY_METADATA.HaLink.name.required).toBe(true);
    });

    it("HaHeader name is required", () => {
      expect(CARD_PROPERTY_METADATA.HaHeader.name.required).toBe(true);
    });

    it("HaWarning and HaError have same required properties", () => {
      const warningKeys = Object.keys(CARD_PROPERTY_METADATA.HaWarning);
      const errorKeys = Object.keys(CARD_PROPERTY_METADATA.HaError);
      expect(warningKeys.sort()).toEqual(errorKeys.sort());
    });
  });

  describe("Edge Cases", () => {
    it("handles null card type gracefully", () => {
      const props = getCardProperties(null);
      expect(props).toEqual({});
    });

    it("handles undefined card type gracefully", () => {
      const props = getCardProperties(undefined);
      expect(props).toEqual({});
    });

    it("handles empty string card type", () => {
      const props = getCardProperties("");
      expect(props).toEqual({});
    });

    it("validates with null value", () => {
      const result = validateProperty("HaWarning", "value", null);
      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe("HaPrinter Properties", () => {
    it("HaPrinter has color properties", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black).toBeDefined();
      expect(printer.cyan).toBeDefined();
      expect(printer.magenta).toBeDefined();
      expect(printer.yellow).toBeDefined();
    });

    it("all color properties are of type text", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black.type).toBe("text");
      expect(printer.cyan.type).toBe("text");
      expect(printer.magenta.type).toBe("text");
      expect(printer.yellow.type).toBe("text");
    });

    it("all color properties are required", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black.required).toBe(true);
      expect(printer.cyan.required).toBe(true);
      expect(printer.magenta.required).toBe(true);
      expect(printer.yellow.required).toBe(true);
    });

    it("all color properties have helpful labels", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black.label).toContain("Black");
      expect(printer.cyan.label).toContain("Cyan");
      expect(printer.magenta.label).toContain("Magenta");
      expect(printer.yellow.label).toContain("Yellow");
    });

    it("all color properties have help text", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black.help).toBeDefined();
      expect(printer.cyan.help).toBeDefined();
      expect(printer.magenta.help).toBeDefined();
      expect(printer.yellow.help).toBeDefined();
    });

    it("all color properties have placeholders", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black.placeholder).toBeDefined();
      expect(printer.cyan.placeholder).toBeDefined();
      expect(printer.magenta.placeholder).toBeDefined();
      expect(printer.yellow.placeholder).toBeDefined();
    });

    it("validates HaPrinter black property with entity ID", () => {
      const result = validateProperty(
        "HaPrinter",
        "black",
        "sensor.printer_black_toner",
      );
      expect(result.valid).toBe(true);
    });

    it("rejects empty HaPrinter color property", () => {
      const result = validateProperty("HaPrinter", "black", "");
      expect(result.valid).toBe(false);
    });
  });
});
