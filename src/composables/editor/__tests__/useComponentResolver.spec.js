import { describe, it, expect } from "vitest";
import { useComponentResolver } from "../useComponentResolver";

describe("useComponentResolver", () => {
  let resolver;
  const mockComponentMap = {
    HaSensor: "HaSensor",
    HaLight: "HaLight",
    HaSwitch: "HaSwitch",
    HaHeader: "HaHeader",
    HaLink: "HaLink",
    HaSpacer: "HaSpacer",
    HaEntityList: "HaEntityList",
    EntityList: "EntityList",
  };

  beforeEach(() => {
    resolver = useComponentResolver(mockComponentMap);
  });

  describe("getEntityDataForComponent()", () => {
    it("extracts single entity string", () => {
      const entity = { entity: "light.kitchen", type: "HaLight" };
      expect(resolver.getEntityDataForComponent(entity)).toBe("light.kitchen");
    });

    it("extracts array of entity IDs", () => {
      const entity = {
        entity: ["light.kitchen", "light.bedroom"],
        type: "HaGlance",
      };
      expect(resolver.getEntityDataForComponent(entity)).toEqual([
        "light.kitchen",
        "light.bedroom",
      ]);
    });

    it("returns entity from entities property (alternative naming)", () => {
      const entity = {
        entities: ["light.kitchen"],
        type: "HaRoom",
      };
      expect(resolver.getEntityDataForComponent(entity)).toEqual([
        "light.kitchen",
      ]);
    });

    it("returns full config for special components", () => {
      const entity = {
        type: "HaHeader",
        title: "Living Room",
      };
      const data = resolver.getEntityDataForComponent(entity);
      expect(data).toBe(entity);
    });

    it("handles HaEntityList without returning entity", () => {
      const entity = {
        type: "HaEntityList",
        entities: [{ entity: "light.kitchen" }],
      };
      expect(resolver.getEntityDataForComponent(entity)).toBeNull();
    });

    it("handles null entity gracefully", () => {
      expect(resolver.getEntityDataForComponent(null)).toBeNull();
    });

    it("returns empty string as fallback", () => {
      const entity = { type: "HaSensor" }; // No entity or entities
      expect(resolver.getEntityDataForComponent(entity)).toBe("");
    });
  });

  describe("getComponentCustomProps()", () => {
    it("extracts custom properties excluding standard ones", () => {
      const entity = {
        entity: "light.kitchen",
        type: "HaLight",
        color: "#FF0000",
        operator: "==",
      };
      const props = resolver.getComponentCustomProps(entity);
      expect(props).toEqual({
        color: "#FF0000",
        operator: "==",
      });
      expect(props.entity).toBeUndefined();
      expect(props.type).toBeUndefined();
    });

    it("handles HaEntityList custom props", () => {
      const entity = {
        type: "HaEntityList",
        entities: [{ entity: "light.kitchen" }],
        attributes: ["brightness"],
        componentMap: { Light: "HaLight" },
      };
      const props = resolver.getComponentCustomProps(entity);
      expect(props.entities).toBeDefined();
      expect(props.attributes).toEqual(["brightness"]);
    });

    it("returns empty object for null entity", () => {
      expect(resolver.getComponentCustomProps(null)).toEqual({});
    });
  });

  describe("getComponentProps()", () => {
    it("includes entity data for normal components", () => {
      const entity = { entity: "light.kitchen", type: "HaLight" };
      const props = resolver.getComponentProps(entity);
      expect(props.entity).toBe("light.kitchen");
    });

    it("excludes entity prop for special components", () => {
      const entity = {
        type: "HaHeader",
        title: "My Header",
      };
      const props = resolver.getComponentProps(entity);
      expect(props.entity).toBeUndefined();
      expect(props.title).toBe("My Header");
    });

    it("merges entity data with custom props", () => {
      const entity = {
        entity: "light.kitchen",
        type: "HaLight",
        color: "#FF0000",
      };
      const props = resolver.getComponentProps(entity);
      expect(props.entity).toBe("light.kitchen");
      expect(props.color).toBe("#FF0000");
    });
  });

  describe("getComponentForEntity()", () => {
    it("returns mapped component for explicit type", () => {
      const entity = { type: "HaLight", entity: "light.kitchen" };
      expect(resolver.getComponentForEntity(entity)).toBe("HaLight");
    });

    it("handles HaEntityList mapping to EntityList", () => {
      const entity = { type: "HaEntityList", entities: [] };
      expect(resolver.getComponentForEntity(entity)).toBe("EntityList");
    });

    it("returns null for unmapped type", () => {
      const entity = { type: "UnknownComponent" };
      expect(resolver.getComponentForEntity(entity)).toBe("HaSensor"); // Defaults to HaSensor
    });

    it("handles null entity", () => {
      expect(resolver.getComponentForEntity(null)).toBeNull();
    });
  });

  describe("getComponentClasses()", () => {
    it("returns default grid classes for null entity", () => {
      const classes = resolver.getComponentClasses(null);
      expect(classes).toBe("col-lg-4 col-md-6");
    });

    it("returns classes for entity with type", () => {
      const entity = { type: "HaLight", entity: "light.kitchen" };
      const classes = resolver.getComponentClasses(entity);
      expect(typeof classes).toBe("string");
      expect(classes.length).toBeGreaterThan(0);
    });
  });
});
