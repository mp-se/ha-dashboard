import { describe, it, expect, vi } from "vitest";
import { useEditorSelection } from "../useEditorSelection";

describe("useEditorSelection", () => {
  describe("isEntitySelected", () => {
    it("returns true when selectedEntityId matches index", () => {
      const emit = vi.fn();
      const { isEntitySelected } = useEditorSelection(emit);
      expect(isEntitySelected(2, 2)).toBe(true);
    });

    it("returns false when selectedEntityId does not match index", () => {
      const emit = vi.fn();
      const { isEntitySelected } = useEditorSelection(emit);
      expect(isEntitySelected(1, 2)).toBe(false);
    });

    it("returns true when both are null", () => {
      const emit = vi.fn();
      const { isEntitySelected } = useEditorSelection(emit);
      expect(isEntitySelected(null, null)).toBe(true);
    });

    it("returns false when selectedEntityId is null and index is 0", () => {
      const emit = vi.fn();
      const { isEntitySelected } = useEditorSelection(emit);
      expect(isEntitySelected(null, 0)).toBe(false);
    });

    it("returns false when selectedEntityId is 0 and index is null", () => {
      const emit = vi.fn();
      const { isEntitySelected } = useEditorSelection(emit);
      expect(isEntitySelected(0, null)).toBe(false);
    });

    it("handles first entity (index 0) selection", () => {
      const emit = vi.fn();
      const { isEntitySelected } = useEditorSelection(emit);
      expect(isEntitySelected(0, 0)).toBe(true);
      expect(isEntitySelected(0, 1)).toBe(false);
    });
  });

  describe("handleSelectClick", () => {
    it("emits select-entity with null when clicking already-selected entity", () => {
      const emit = vi.fn();
      const { handleSelectClick } = useEditorSelection(emit);
      handleSelectClick(3, 3);
      expect(emit).toHaveBeenCalledWith("select-entity", null);
    });

    it("emits select-entity with the new index when clicking different entity", () => {
      const emit = vi.fn();
      const { handleSelectClick } = useEditorSelection(emit);
      handleSelectClick(1, 3);
      expect(emit).toHaveBeenCalledWith("select-entity", 3);
    });

    it("selects entity 0 when none is selected", () => {
      const emit = vi.fn();
      const { handleSelectClick } = useEditorSelection(emit);
      handleSelectClick(null, 0);
      expect(emit).toHaveBeenCalledWith("select-entity", 0);
    });

    it("deselects entity 0 when entity 0 is already selected", () => {
      const emit = vi.fn();
      const { handleSelectClick } = useEditorSelection(emit);
      handleSelectClick(0, 0);
      expect(emit).toHaveBeenCalledWith("select-entity", null);
    });

    it("calls emit exactly once per click", () => {
      const emit = vi.fn();
      const { handleSelectClick } = useEditorSelection(emit);
      handleSelectClick(2, 5);
      expect(emit).toHaveBeenCalledTimes(1);
    });
  });

  describe("onCardClick", () => {
    it("delegates to handleSelectClick — selects a new entity", () => {
      const emit = vi.fn();
      const { onCardClick } = useEditorSelection(emit);
      onCardClick(null, 2);
      expect(emit).toHaveBeenCalledWith("select-entity", 2);
    });

    it("delegates to handleSelectClick — deselects the same entity", () => {
      const emit = vi.fn();
      const { onCardClick } = useEditorSelection(emit);
      onCardClick(5, 5);
      expect(emit).toHaveBeenCalledWith("select-entity", null);
    });
  });

  describe("return value", () => {
    it("exposes isEntitySelected, handleSelectClick, and onCardClick", () => {
      const emit = vi.fn();
      const result = useEditorSelection(emit);
      expect(typeof result.isEntitySelected).toBe("function");
      expect(typeof result.handleSelectClick).toBe("function");
      expect(typeof result.onCardClick).toBe("function");
    });
  });
});
