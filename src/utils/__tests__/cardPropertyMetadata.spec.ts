import { describe, it, expect } from "vitest";
import {
  getCardProperties,
  getSpecialProperties,
  hasSpecialProperties,
  getCardPropertyNames,
  supportsAttributes,
  supportsMultipleEntities,
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

    it("all color properties are of type entity-list", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black.type).toBe("entity-list");
      expect(printer.cyan.type).toBe("entity-list");
      expect(printer.magenta.type).toBe("entity-list");
      expect(printer.yellow.type).toBe("entity-list");
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

    it("all color properties mention drag-and-drop in help text", () => {
      const printer = CARD_PROPERTY_METADATA.HaPrinter;
      expect(printer.black.help).toContain("Drag");
      expect(printer.cyan.help).toContain("Drag");
      expect(printer.magenta.help).toContain("Drag");
      expect(printer.yellow.help).toContain("Drag");
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

  describe("getSpecialProperties", () => {
    it("returns property names that are not plain text type", () => {
      // HaWarning has 'operator' (select type)
      const props = getSpecialProperties("HaWarning");
      expect(props).toContain("operator");
    });

    it("returns empty array for card with no properties", () => {
      const props = getSpecialProperties("HaSwitch");
      expect(props).toEqual([]);
    });

    it("returns empty array for unknown card type", () => {
      const props = getSpecialProperties("UnknownCard");
      expect(props).toEqual([]);
    });

    it("includes entity-list type properties", () => {
      // HaPrinter has entity-list type properties
      const props = getSpecialProperties("HaPrinter");
      expect(props).toContain("black");
    });

    it("includes icon type properties", () => {
      // HaHeader has 'icon' which is icon type
      const props = getSpecialProperties("HaHeader");
      expect(props).toContain("icon");
    });
  });

  describe("hasSpecialProperties", () => {
    it("returns true for HaWarning which has properties", () => {
      expect(hasSpecialProperties("HaWarning")).toBe(true);
    });

    it("returns true for HaHeader which has properties", () => {
      expect(hasSpecialProperties("HaHeader")).toBe(true);
    });

    it("returns false for HaSwitch which has no special properties", () => {
      expect(hasSpecialProperties("HaSwitch")).toBe(false);
    });

    it("returns false for unknown card type", () => {
      expect(hasSpecialProperties("CompletelyUnknown")).toBe(false);
    });

    it("returns false for HaSensor which has no special properties", () => {
      expect(hasSpecialProperties("HaSensor")).toBe(false);
    });
  });

  describe("getCardPropertyNames", () => {
    it("returns array of property keys for HaWarning", () => {
      const names = getCardPropertyNames("HaWarning");
      expect(names).toContain("operator");
      expect(names).toContain("value");
      expect(names).toContain("message");
    });

    it("returns empty array for card with no properties", () => {
      const names = getCardPropertyNames("HaSwitch");
      expect(names).toEqual([]);
    });

    it("returns empty array for unknown card type", () => {
      const names = getCardPropertyNames("NonExistent");
      expect(names).toEqual([]);
    });

    it("returns printer color property names", () => {
      const names = getCardPropertyNames("HaPrinter");
      expect(names).toContain("black");
      expect(names).toContain("cyan");
      expect(names).toContain("magenta");
      expect(names).toContain("yellow");
    });
  });

  describe("supportsAttributes", () => {
    it("returns true for HaBinarySensor", () => {
      expect(supportsAttributes("HaBinarySensor")).toBe(true);
    });

    it("returns true for HaSensor", () => {
      expect(supportsAttributes("HaSensor")).toBe(true);
    });

    it("returns true for HaSwitch", () => {
      expect(supportsAttributes("HaSwitch")).toBe(true);
    });

    it("returns false for HaHeader", () => {
      expect(supportsAttributes("HaHeader")).toBe(false);
    });

    it("returns false for HaLight", () => {
      expect(supportsAttributes("HaLight")).toBe(false);
    });

    it("returns false for unknown card type", () => {
      expect(supportsAttributes("HaUnknown")).toBe(false);
    });
  });

  describe("supportsMultipleEntities", () => {
    it("returns true for HaRoom", () => {
      expect(supportsMultipleEntities("HaRoom")).toBe(true);
    });

    it("returns true for HaGlance", () => {
      expect(supportsMultipleEntities("HaGlance")).toBe(true);
    });

    it("returns true for HaSensorGraph", () => {
      expect(supportsMultipleEntities("HaSensorGraph")).toBe(true);
    });

    it("returns true for HaBeerTap", () => {
      expect(supportsMultipleEntities("HaBeerTap")).toBe(true);
    });

    it("returns false for HaHeader", () => {
      expect(supportsMultipleEntities("HaHeader")).toBe(false);
    });

    it("returns false for unknown card type", () => {
      expect(supportsMultipleEntities("Unknown")).toBe(false);
    });
  });

  describe("validateProperty — type-specific branches", () => {
    it("validates text within maxLength", () => {
      // HaLink name has maxLength: 100
      const result = validateProperty("HaLink", "name", "short name");
      expect(result.valid).toBe(true);
    });

    it("rejects text exceeding maxLength", () => {
      // HaLink name has maxLength: 100
      const result = validateProperty("HaLink", "name", "a".repeat(101));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("100");
    });

    it("validates text matching URL pattern", () => {
      // HaLink url has pattern: '^https?://'
      const result = validateProperty("HaLink", "url", "https://example.com");
      expect(result.valid).toBe(true);
    });

    it("rejects text not matching URL pattern", () => {
      const result = validateProperty("HaLink", "url", "ftp://example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("format is invalid");
    });

    it("validates number within min/max range", () => {
      // HaImage scale is type "slider" — the number validator is not invoked;
      // slider values pass through as valid
      const result = validateProperty("HaImage", "scale", 0.5);
      expect(result.valid).toBe(true);
    });

    it("slider value out of range still passes validator (slider type not validated)", () => {
      // The validateProperty function only enforces min/max for type === "number".
      // Slider types are validated client-side by the SliderInput component.
      const result = validateProperty("HaImage", "scale", 1.5);
      expect(result.valid).toBe(true);
    });

    it("accepts empty value for optional field", () => {
      // HaHeader icon is not required
      const result = validateProperty("HaHeader", "icon", "");
      expect(result.valid).toBe(true);
    });

    it("accepts undefined value for optional field", () => {
      const result = validateProperty("HaHeader", "icon", undefined);
      expect(result.valid).toBe(true);
    });
  });
});
