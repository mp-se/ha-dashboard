import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetVisualEditorToolbar,
  useVisualEditorToolbar,
} from "../useVisualEditorToolbar";

describe("useVisualEditorToolbar", () => {
  beforeEach(() => {
    resetVisualEditorToolbar();
  });

  it("tracks save state across consumers", () => {
    const toolbarA = useVisualEditorToolbar();
    const toolbarB = useVisualEditorToolbar();

    toolbarA.setHasChanges(true);
    toolbarA.setSaveStatus("Saved!");

    expect(toolbarB.hasChanges.value).toBe(true);
    expect(toolbarB.saveStatus.value).toBe("Saved!");
  });

  it("invokes the registered save handler", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const toolbar = useVisualEditorToolbar();

    toolbar.setSaveHandler(handler);
    await toolbar.triggerSave();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not invoke save handler while already saving", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const toolbar = useVisualEditorToolbar();

    toolbar.setSaveHandler(handler);
    toolbar.setIsSaving(true);
    await toolbar.triggerSave();

    expect(handler).not.toHaveBeenCalled();
  });

  it("tracks undo and redo availability and invokes history handlers", () => {
    const toolbar = useVisualEditorToolbar();
    const handlers = {
      undo: vi.fn(),
      redo: vi.fn(),
      discard: vi.fn(),
      resetSavedBaseline: vi.fn(),
    };

    toolbar.setHistoryHandlers(handlers);
    toolbar.setHistoryState(true, false);
    expect(toolbar.canUndo.value).toBe(true);
    expect(toolbar.canRedo.value).toBe(false);

    toolbar.triggerUndo();
    toolbar.triggerRedo();
    toolbar.triggerDiscard();
    toolbar.triggerResetSavedBaseline();

    expect(handlers.undo).toHaveBeenCalledOnce();
    expect(handlers.redo).toHaveBeenCalledOnce();
    expect(handlers.discard).toHaveBeenCalledOnce();
    expect(handlers.resetSavedBaseline).toHaveBeenCalledOnce();
  });
});
