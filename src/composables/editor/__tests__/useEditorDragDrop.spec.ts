import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { useEditorDragDrop } from "../useEditorDragDrop";

/** Build a minimal drag event mock */
function makeDragEvent({
  clientX = 100,
  clientY = 50,
  jsonData = "",
  textData = "",
  boundingRect = { left: 0, top: 0, width: 200, height: 100 },
} = {}) {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      dropEffect: "",
      effectAllowed: "",
      getData: vi.fn((type: string) => {
        if (type === "application/json") return jsonData;
        if (type === "text/plain") return textData;
        return "";
      }),
      setData: vi.fn(),
    },
    clientX,
    clientY,
    currentTarget: {
      getBoundingClientRect: vi.fn(() => boundingRect),
    },
  };
}

describe("useEditorDragDrop", () => {
  let localEntities: ReturnType<typeof ref>;
  let emit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localEntities = ref([
      { entity: "sensor.temp", type: "HaSensor" },
      { entity: "light.room", type: "HaLight" },
    ]);
    emit = vi.fn();
  });

  describe("initial state", () => {
    it("starts with isDragging false", () => {
      const { isDragging } = useEditorDragDrop(localEntities, emit);
      expect(isDragging.value).toBe(false);
    });

    it("starts with isDragOver false", () => {
      const { isDragOver } = useEditorDragDrop(localEntities, emit);
      expect(isDragOver.value).toBe(false);
    });

    it("starts with isDropping false", () => {
      const { isDropping } = useEditorDragDrop(localEntities, emit);
      expect(isDropping.value).toBe(false);
    });

    it("starts with dragOverIndex null", () => {
      const { dragOverIndex } = useEditorDragDrop(localEntities, emit);
      expect(dragOverIndex.value).toBeNull();
    });

    it("starts with dragOverCounter 0", () => {
      const { dragOverCounter } = useEditorDragDrop(localEntities, emit);
      expect(dragOverCounter.value).toBe(0);
    });
  });

  describe("handleDragEnter", () => {
    it("increments dragOverCounter", () => {
      const { handleDragEnter, dragOverCounter } = useEditorDragDrop(
        localEntities,
        emit,
      );
      handleDragEnter();
      expect(dragOverCounter.value).toBe(1);
    });

    it("sets isDragOver and isDropping to true", () => {
      const { handleDragEnter, isDragOver, isDropping } = useEditorDragDrop(
        localEntities,
        emit,
      );
      handleDragEnter();
      expect(isDragOver.value).toBe(true);
      expect(isDropping.value).toBe(true);
    });

    it("accumulates counter on multiple enters (nested drag)", () => {
      const { handleDragEnter, dragOverCounter } = useEditorDragDrop(
        localEntities,
        emit,
      );
      handleDragEnter();
      handleDragEnter();
      expect(dragOverCounter.value).toBe(2);
    });
  });

  describe("handleDragLeave", () => {
    it("decrements dragOverCounter and resets state when counter reaches 0", () => {
      const { handleDragEnter, handleDragLeave, isDragOver, isDropping } =
        useEditorDragDrop(localEntities, emit);
      handleDragEnter();
      handleDragLeave();
      expect(isDragOver.value).toBe(false);
      expect(isDropping.value).toBe(false);
    });

    it("does not reset state while nested (counter > 0)", () => {
      const { handleDragEnter, handleDragLeave, isDragOver } =
        useEditorDragDrop(localEntities, emit);
      handleDragEnter();
      handleDragEnter();
      handleDragLeave(); // counter goes to 1, still dragging
      expect(isDragOver.value).toBe(true);
    });

    it("clamps dragOverCounter at 0 when it goes negative", () => {
      const { handleDragLeave, dragOverCounter } = useEditorDragDrop(
        localEntities,
        emit,
      );
      handleDragLeave(); // counter was 0, goes to -1, then clamped to 0
      expect(dragOverCounter.value).toBe(0);
    });
  });

  describe("handleDragOver", () => {
    it("calls preventDefault on the event", () => {
      const { handleDragOver } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent();
      handleDragOver(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("sets isDropping to true", () => {
      const { handleDragOver, isDropping } = useEditorDragDrop(
        localEntities,
        emit,
      );
      const event = makeDragEvent();
      handleDragOver(event);
      expect(isDropping.value).toBe(true);
    });

    it("sets dragOverIndex to 0 when localEntities is empty", () => {
      const empty = ref([]);
      const { handleDragOver, dragOverIndex } = useEditorDragDrop(empty, emit);
      const event = makeDragEvent();
      handleDragOver(event);
      expect(dragOverIndex.value).toBe(0);
    });

    it("sets dragOverIndex to length when localEntities are present and index is null", () => {
      const { handleDragOver, dragOverIndex } = useEditorDragDrop(
        localEntities,
        emit,
      );
      const event = makeDragEvent();
      handleDragOver(event);
      expect(dragOverIndex.value).toBe(localEntities.value.length);
    });
  });

  describe("handleEntityDragStart", () => {
    it("sets isDragging to true", () => {
      const { handleEntityDragStart, isDragging } = useEditorDragDrop(
        localEntities,
        emit,
      );
      const event = makeDragEvent();
      handleEntityDragStart(0, event);
      expect(isDragging.value).toBe(true);
    });

    it("sets dataTransfer effectAllowed to move", () => {
      const { handleEntityDragStart } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent();
      handleEntityDragStart(0, event);
      expect(event.dataTransfer.effectAllowed).toBe("move");
    });

    it("stores entity-reorder data in dataTransfer", () => {
      const { handleEntityDragStart } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent();
      handleEntityDragStart(1, event);
      expect(event.dataTransfer.setData).toHaveBeenCalledWith(
        "application/json",
        expect.stringContaining("entity-reorder"),
      );
    });
  });

  describe("handleEntityDragEnd", () => {
    it("resets isDragging, dragOverIndex, and isDropping", () => {
      const { handleEntityDragStart, handleEntityDragEnd, isDragging, dragOverIndex, isDropping } =
        useEditorDragDrop(localEntities, emit);
      const startEvent = makeDragEvent();
      handleEntityDragStart(0, startEvent);
      handleEntityDragEnd();
      expect(isDragging.value).toBe(false);
      expect(dragOverIndex.value).toBeNull();
      expect(isDropping.value).toBe(false);
    });
  });

  describe("handleEntityDragOver", () => {
    it("calls preventDefault and stopPropagation", () => {
      const { handleEntityDragOver } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent({ clientX: 50 });
      handleEntityDragOver(0, event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("sets dragOverIndex to index when dragging over left half", () => {
      const { handleEntityDragOver, dragOverIndex } = useEditorDragDrop(
        localEntities,
        emit,
      );
      // BoundingRect left=0, width=200 → midpointX=100; clientX=50 < 100 → index
      const event = makeDragEvent({ clientX: 50 });
      handleEntityDragOver(1, event);
      expect(dragOverIndex.value).toBe(1);
    });

    it("sets dragOverIndex to index+1 when dragging over right half", () => {
      const { handleEntityDragOver, dragOverIndex } = useEditorDragDrop(
        localEntities,
        emit,
      );
      // clientX=150 > midpointX=100 → index+1
      const event = makeDragEvent({ clientX: 150 });
      handleEntityDragOver(1, event);
      expect(dragOverIndex.value).toBe(2);
    });
  });

  describe("handleEntityDragLeave", () => {
    it("resets dragOverIndex when leaving targeted entity", () => {
      const { handleEntityDragOver, handleEntityDragLeave, dragOverIndex } =
        useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent({ clientX: 50 });
      handleEntityDragOver(0, event); // sets dragOverIndex to 0
      handleEntityDragLeave(0); // leaving index 0
      expect(dragOverIndex.value).toBeNull();
    });

    it("does not reset dragOverIndex when leaving an unrelated entity", () => {
      const { handleEntityDragOver, handleEntityDragLeave, dragOverIndex } =
        useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent({ clientX: 50 });
      handleEntityDragOver(0, event); // sets dragOverIndex to 0
      handleEntityDragLeave(1); // leaving index 1 (not relevant)
      expect(dragOverIndex.value).toBe(0);
    });
  });

  describe("handleDrop — canvas background", () => {
    it("calls preventDefault", () => {
      const { handleDrop } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent();
      handleDrop(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("resets drag state after drop", () => {
      const { handleDrop, isDragOver, isDropping, dragOverCounter } =
        useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent();
      handleDrop(event);
      expect(isDragOver.value).toBe(false);
      expect(isDropping.value).toBe(false);
      expect(dragOverCounter.value).toBe(0);
    });

    it("emits add-entity when dropping an entity from palette", () => {
      const { handleDrop } = useEditorDragDrop(localEntities, emit);
      const payload = { entity: "sensor.temperature" };
      const event = makeDragEvent({ jsonData: JSON.stringify(payload) });
      handleDrop(event);
      expect(emit).toHaveBeenCalledWith("add-entity", payload.entity);
    });

    it("emits add-entity for static component from palette", () => {
      const { handleDrop } = useEditorDragDrop(localEntities, emit);
      const payload = { isStatic: true, type: "HaHeader" };
      const event = makeDragEvent({ jsonData: JSON.stringify(payload) });
      handleDrop(event);
      expect(emit).toHaveBeenCalledWith("add-entity", { type: "HaHeader" });
    });

    it("handles plain text entity ID as fallback", () => {
      const { handleDrop } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent({ textData: "sensor.temperature" });
      handleDrop(event);
      expect(emit).toHaveBeenCalledWith("add-entity", "sensor.temperature");
    });

    it("handles invalid JSON without throwing", () => {
      const { handleDrop } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent({ jsonData: "not-valid-json{" });
      expect(() => handleDrop(event)).not.toThrow();
    });
  });

  describe("handleEntityDrop", () => {
    it("calls preventDefault and stopPropagation", () => {
      const { handleEntityDrop } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent();
      handleEntityDrop(0, event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("emits add-entity-at-index when dropping palette entity", () => {
      const { handleEntityDrop } = useEditorDragDrop(localEntities, emit);
      const payload = { entity: "sensor.temperature" };
      // clientY=50, boundingRect top=0, height=100, midpoint=50 → clientY not < midpoint → index+1
      const event = makeDragEvent({
        jsonData: JSON.stringify(payload),
        clientY: 30,
        boundingRect: { left: 0, top: 0, width: 200, height: 100 },
      });
      handleEntityDrop(1, event);
      expect(emit).toHaveBeenCalledWith(
        "add-entity-at-index",
        expect.objectContaining({ entity: "sensor.temperature" }),
      );
    });

    it("reorders entities when dropping entity-reorder type", () => {
      const entities = ref([
        { entity: "sensor.a" },
        { entity: "sensor.b" },
        { entity: "sensor.c" },
      ]);
      const { handleEntityDrop } = useEditorDragDrop(entities, emit);
      const payload = {
        type: "entity-reorder",
        draggedIndex: 0,
        entity: { entity: "sensor.a" },
      };
      const event = makeDragEvent({
        jsonData: JSON.stringify(payload),
        clientY: 30, // above midpoint → insert before index 1
        boundingRect: { left: 0, top: 0, width: 200, height: 100 },
      });
      handleEntityDrop(1, event);
      expect(emit).toHaveBeenCalledWith("reorder-entities", expect.any(Array));
    });

    it("handles invalid JSON without throwing", () => {
      const { handleEntityDrop } = useEditorDragDrop(localEntities, emit);
      const event = makeDragEvent({ jsonData: "{{invalid" });
      expect(() => handleEntityDrop(0, event)).not.toThrow();
    });
  });

  describe("return value", () => {
    it("exposes all expected state and handlers", () => {
      const result = useEditorDragDrop(localEntities, emit);
      expect(result.isDragging).toBeDefined();
      expect(result.isDragOver).toBeDefined();
      expect(result.isDropping).toBeDefined();
      expect(result.dragOverCounter).toBeDefined();
      expect(result.dragOverIndex).toBeDefined();
      expect(typeof result.handleDragOver).toBe("function");
      expect(typeof result.handleDragEnter).toBe("function");
      expect(typeof result.handleDragLeave).toBe("function");
      expect(typeof result.handleEntityDragStart).toBe("function");
      expect(typeof result.handleEntityDragOver).toBe("function");
      expect(typeof result.handleEntityDragLeave).toBe("function");
      expect(typeof result.handleEntityDrop).toBe("function");
      expect(typeof result.handleEntityDragEnd).toBe("function");
      expect(typeof result.handleDrop).toBe("function");
    });
  });
});
