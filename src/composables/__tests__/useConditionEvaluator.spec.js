import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConditionEvaluator } from "../useConditionEvaluator";

vi.mock("@/stores/haStore", () => ({
  useHaStore: vi.fn(),
}));

import { useHaStore } from "@/stores/haStore";

const createMockStore = (entities = []) => ({
  entityMap: new Map(entities.map((e) => [e.entity_id, e])),
});

const sensorEntity = {
  entity_id: "sensor.temperature",
  state: "22",
  attributes: { unit_of_measurement: "°C", temperature: 22 },
};

const buildProps = (overrides = {}) => ({
  entity: "sensor.temperature",
  attribute: "state",
  operator: "=",
  value: "22",
  editorMode: false,
  ...overrides,
});

describe("useConditionEvaluator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useHaStore.mockReturnValue(createMockStore([sensorEntity]));
  });

  // ─── resolvedEntity ──────────────────────────────────────────────────────

  describe("resolvedEntity", () => {
    it("resolves string entity ID to entity object", () => {
      const { resolvedEntity } = useConditionEvaluator(
        buildProps({ entity: "sensor.temperature" }),
      );
      expect(resolvedEntity.value).toEqual(sensorEntity);
    });

    it("passes through a pre-resolved entity object", () => {
      const { resolvedEntity } = useConditionEvaluator(
        buildProps({ entity: sensorEntity }),
      );
      expect(resolvedEntity.value).toEqual(sensorEntity);
    });

    it("returns null for unknown entity ID", () => {
      const { resolvedEntity } = useConditionEvaluator(
        buildProps({ entity: "sensor.unknown" }),
      );
      expect(resolvedEntity.value).toBeNull();
    });

    it("returns null when entity prop is null", () => {
      const { resolvedEntity } = useConditionEvaluator(
        buildProps({ entity: null }),
      );
      expect(resolvedEntity.value).toBeNull();
    });
  });

  // ─── currentValue ────────────────────────────────────────────────────────

  describe("currentValue", () => {
    it("returns state when attribute is 'state'", () => {
      const { currentValue } = useConditionEvaluator(
        buildProps({ attribute: "state" }),
      );
      expect(currentValue.value).toBe("22");
    });

    it("returns attribute value when attribute is not 'state'", () => {
      const { currentValue } = useConditionEvaluator(
        buildProps({ attribute: "temperature" }),
      );
      expect(currentValue.value).toBe(22);
    });

    it("returns null when attribute does not exist", () => {
      const { currentValue } = useConditionEvaluator(
        buildProps({ attribute: "nonexistent" }),
      );
      expect(currentValue.value).toBeNull();
    });

    it("returns null when entity is not resolved", () => {
      const { currentValue } = useConditionEvaluator(
        buildProps({ entity: "sensor.missing" }),
      );
      expect(currentValue.value).toBeNull();
    });
  });

  // ─── isConditionTrue — editorMode ───────────────────────────────────────

  describe("isConditionTrue — editorMode", () => {
    it("always returns true in editor mode regardless of condition", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "=", value: "999", editorMode: true }),
      );
      expect(isConditionTrue.value).toBe(true);
    });
  });

  // ─── isConditionTrue — no entity ────────────────────────────────────────

  describe("isConditionTrue — missing entity or value", () => {
    it("returns false when entity is not found", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ entity: "sensor.missing" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });

    it("returns false when current value is null", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ attribute: "nonexistent" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });
  });

  // ─── isConditionTrue — equality operators ────────────────────────────────

  describe("isConditionTrue — equality operators", () => {
    it("= returns true when values are loosely equal", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "=", value: "22" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("= returns false when values differ", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "=", value: "0" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });

    it("!= returns true when values differ", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "!=", value: "0" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("!= returns false when values are equal", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "!=", value: "22" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });
  });

  // ─── isConditionTrue — numeric comparison operators ──────────────────────

  describe("isConditionTrue — numeric comparison operators", () => {
    it("> returns true when current > expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: ">", value: "20" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("> returns false when current == expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: ">", value: "22" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });

    it("< returns true when current < expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "<", value: "30" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("< returns false when current == expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "<", value: "22" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });

    it(">= returns true when current == expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: ">=", value: "22" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it(">= returns false when current < expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: ">=", value: "30" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });

    it("<= returns true when current == expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "<=", value: "22" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("<= returns false when current > expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "<=", value: "10" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });
  });

  // ─── isConditionTrue — string operators ──────────────────────────────────

  describe("isConditionTrue — string operators", () => {
    it("contains returns true when state includes expected substring", () => {
      useHaStore.mockReturnValue(
        createMockStore([{ entity_id: "sensor.temperature", state: "heating_mode_active", attributes: {} }]),
      );
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "contains", value: "heating" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("contains returns false when state does not include expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "contains", value: "cooling" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });

    it("not_contains returns true when state does not include expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "not_contains", value: "cooling" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("not_contains returns false when state includes expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "not_contains", value: "22" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });
  });

  // ─── isConditionTrue — in / not_in operators ─────────────────────────────

  describe("isConditionTrue — in / not_in operators", () => {
    it("in returns true when current is in an array expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "in", value: ["22", "23", "24"] }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("in returns false when current is not in an array expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "in", value: ["0", "1"] }),
      );
      expect(isConditionTrue.value).toBe(false);
    });

    it("in returns true when expected string includes current as substring", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "in", value: "20,22,24" }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("not_in returns true when current is not in an array expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "not_in", value: ["0", "1"] }),
      );
      expect(isConditionTrue.value).toBe(true);
    });

    it("not_in returns false when current is in an array expected", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "not_in", value: ["22", "23"] }),
      );
      expect(isConditionTrue.value).toBe(false);
    });
  });

  // ─── isConditionTrue — unknown operator ──────────────────────────────────

  describe("isConditionTrue — unknown operator", () => {
    it("returns false for an unrecognised operator", () => {
      const { isConditionTrue } = useConditionEvaluator(
        buildProps({ operator: "between" }),
      );
      expect(isConditionTrue.value).toBe(false);
    });
  });
});
