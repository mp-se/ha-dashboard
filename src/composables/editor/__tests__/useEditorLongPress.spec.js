import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useEditorLongPress } from "../useEditorLongPress";

describe("useEditorLongPress", () => {
  let longPress;
  let onLongPressMock;

  beforeEach(() => {
    vi.useFakeTimers();
    longPress = useEditorLongPress();
    onLongPressMock = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should emit long press after 500ms of uninterrupted touch", () => {
    const touchEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    };

    longPress.startLongPress(touchEvent, 0, onLongPressMock);
    expect(onLongPressMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).toHaveBeenCalledWith(0);
  });

  it("should cancel long press if finger moves beyond threshold", () => {
    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    };

    longPress.startLongPress(startEvent, 0, onLongPressMock);

    // Move 10px horizontally (threshold is 8px)
    const moveEvent = {
      touches: [{ clientX: 110, clientY: 100 }],
    };
    longPress.moveLongPress(moveEvent);

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).not.toHaveBeenCalled();
  });

  it("should cancel long press if finger moves up beyond threshold", () => {
    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    };

    longPress.startLongPress(startEvent, 0, onLongPressMock);

    // Move 10px vertically (threshold is 8px)
    const moveEvent = {
      touches: [{ clientX: 100, clientY: 110 }],
    };
    longPress.moveLongPress(moveEvent);

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).not.toHaveBeenCalled();
  });

  it("should not cancel long press if finger moves within threshold", () => {
    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    };

    longPress.startLongPress(startEvent, 0, onLongPressMock);

    // Move only 5px (threshold is 8px)
    const moveEvent = {
      touches: [{ clientX: 105, clientY: 105 }],
    };
    longPress.moveLongPress(moveEvent);

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).toHaveBeenCalledWith(0);
  });

  it("should cancel long press on touchend", () => {
    const touchEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    };

    longPress.startLongPress(touchEvent, 0, onLongPressMock);
    longPress.endLongPress();

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).not.toHaveBeenCalled();
  });

  it("should ignore multi-touch events", () => {
    const touchEvent = {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
    };

    longPress.startLongPress(touchEvent, 0, onLongPressMock);

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).not.toHaveBeenCalled();
  });

  it("should ignore move events with invalid touch data", () => {
    const moveEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    };

    // Move without starting
    longPress.moveLongPress(moveEvent);

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).not.toHaveBeenCalled();
  });

  it("should pass correct cardIndex to callback", () => {
    const touchEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    };

    longPress.startLongPress(touchEvent, 5, onLongPressMock);

    vi.advanceTimersByTime(500);
    expect(onLongPressMock).toHaveBeenCalledWith(5);
  });

  it("should handle rapid successive long press attempts", () => {
    const touchEvent1 = {
      touches: [{ clientX: 100, clientY: 100 }],
    };
    const touchEvent2 = {
      touches: [{ clientX: 200, clientY: 200 }],
    };

    // First touch
    longPress.startLongPress(touchEvent1, 0, onLongPressMock);
    vi.advanceTimersByTime(250);

    // End and start new touch
    longPress.endLongPress();
    longPress.startLongPress(touchEvent2, 1, onLongPressMock);

    vi.advanceTimersByTime(250);
    expect(onLongPressMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    expect(onLongPressMock).toHaveBeenCalledWith(1);
    expect(onLongPressMock).toHaveBeenCalledTimes(1);
  });
});
