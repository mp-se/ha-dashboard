import { ref } from "vue";

type SaveHandler = () => void | Promise<void>;
type HistoryHandlers = {
  undo: () => void;
  redo: () => void;
  discard: () => void;
  resetSavedBaseline: () => void;
};

const hasChanges = ref(false);
const isSaving = ref(false);
const saveStatus = ref("");
const saveHandler = ref<SaveHandler | null>(null);
const isDialogOpen = ref(false);
const canUndo = ref(false);
const canRedo = ref(false);
const historyHandlers = ref<HistoryHandlers | null>(null);

export const useVisualEditorToolbar = () => {
  const setHasChanges = (value: boolean) => {
    hasChanges.value = value;
  };

  const setIsSaving = (value: boolean) => {
    isSaving.value = value;
  };

  const setSaveStatus = (value: string) => {
    saveStatus.value = value;
  };

  const setSaveHandler = (handler: SaveHandler | null) => {
    saveHandler.value = handler;
  };

  const setDialogOpen = (value: boolean) => {
    isDialogOpen.value = value;
  };

  const setHistoryState = (undoAvailable: boolean, redoAvailable: boolean) => {
    canUndo.value = undoAvailable;
    canRedo.value = redoAvailable;
  };

  const setHistoryHandlers = (handlers: HistoryHandlers | null) => {
    historyHandlers.value = handlers;
  };

  const triggerUndo = () => historyHandlers.value?.undo();
  const triggerRedo = () => historyHandlers.value?.redo();
  const triggerDiscard = () => historyHandlers.value?.discard();
  const triggerResetSavedBaseline = () =>
    historyHandlers.value?.resetSavedBaseline();

  const triggerSave = async () => {
    if (!saveHandler.value || isSaving.value) {
      return;
    }

    await saveHandler.value();
  };

  return {
    hasChanges,
    isSaving,
    saveStatus,
    isDialogOpen,
    canUndo,
    canRedo,
    setHasChanges,
    setIsSaving,
    setSaveStatus,
    setSaveHandler,
    setDialogOpen,
    setHistoryState,
    setHistoryHandlers,
    triggerSave,
    triggerUndo,
    triggerRedo,
    triggerDiscard,
    triggerResetSavedBaseline,
  };
};

export const resetVisualEditorToolbar = () => {
  hasChanges.value = false;
  isSaving.value = false;
  saveStatus.value = "";
  saveHandler.value = null;
  canUndo.value = false;
  canRedo.value = false;
  historyHandlers.value = null;
};
