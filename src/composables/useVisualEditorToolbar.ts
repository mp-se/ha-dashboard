import { ref } from "vue";

type SaveHandler = () => void | Promise<void>;

const hasChanges = ref(false);
const isSaving = ref(false);
const saveStatus = ref("");
const saveHandler = ref<SaveHandler | null>(null);

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
    setHasChanges,
    setIsSaving,
    setSaveStatus,
    setSaveHandler,
    triggerSave,
  };
};

export const resetVisualEditorToolbar = () => {
  hasChanges.value = false;
  isSaving.value = false;
  saveStatus.value = "";
  saveHandler.value = null;
};
