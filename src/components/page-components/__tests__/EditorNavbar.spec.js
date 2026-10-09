import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import EditorNavbar from "../EditorNavbar.vue";
import { useHaStore } from "@/stores/haStore";
import { useConfigStore } from "@/stores/configStore";
import {
  resetVisualEditorToolbar,
  useVisualEditorToolbar,
} from "@/composables/useVisualEditorToolbar";

describe("EditorNavbar.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    resetVisualEditorToolbar();
    store = useHaStore();
    store.developerMode = false;
    store.reloadConfig = vi.fn().mockResolvedValue({ valid: true, errors: [] });
    store.saveLocalData = vi.fn();
  });

  const mountNavbar = (props = {}) =>
    mount(EditorNavbar, {
      props: {
        currentView: "editor",
        darkMode: false,
        ...props,
      },
      global: {
        plugins: [pinia],
      },
    });

  it("does not render dashboard view buttons", () => {
    const wrapper = mountNavbar();
    expect(wrapper.find('[title="Overview"]').exists()).toBe(false);
    expect(wrapper.find('[title="Lights"]').exists()).toBe(false);
  });

  it("shows developer navigation items in developer mode", async () => {
    store.developerMode = true;
    const wrapper = mountNavbar();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[title="DevicesView"]').exists()).toBe(true);
    expect(wrapper.find('[title="RawEntityView"]').exists()).toBe(true);
  });

  it("shows editor-side navigation items even when developer mode is disabled", async () => {
    const wrapper = mountNavbar();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[title="DevicesView"]').exists()).toBe(true);
    expect(wrapper.find('[title="RawEntityView"]').exists()).toBe(true);
    expect(wrapper.find('[title="Saved versions"]').exists()).toBe(true);
  });

  it("emits the device view name used by App.vue", async () => {
    store.developerMode = true;
    const wrapper = mountNavbar();
    await wrapper.find('[title="DevicesView"]').trigger("click");

    expect(wrapper.emitted("update:current-view")).toBeTruthy();
    expect(wrapper.emitted("update:current-view").at(-1)).toEqual(["device"]);
  });

  it("highlights the editor tab only for the editor view", async () => {
    const wrapper = mountNavbar({ currentView: "device" });
    await wrapper.vm.$nextTick();

    const editorButton = wrapper.find('[title="Editor"]');
    expect(editorButton.classes()).not.toContain("active");

    await wrapper.setProps({ currentView: "editor" });
    expect(editorButton.classes()).toContain("active");
  });

  it("shows editor-only tools in developer mode", async () => {
    store.developerMode = true;
    const wrapper = mountNavbar();
    await wrapper.vm.$nextTick();

    expect(
      wrapper
        .find('button[title="Save current data for local testing"]')
        .exists(),
    ).toBe(true);
  });

  it("keeps editor-only tools hidden when developer mode is disabled", async () => {
    const wrapper = mountNavbar();
    await wrapper.vm.$nextTick();

    expect(
      wrapper
        .find('button[title="Save current data for local testing"]')
        .exists(),
    ).toBe(false);
  });

  it("shows save action when the editor has pending changes", async () => {
    const toolbar = useVisualEditorToolbar();
    toolbar.setHasChanges(true);
    const handler = vi.fn().mockResolvedValue(undefined);
    toolbar.setSaveHandler(handler);

    const wrapper = mountNavbar();
    const saveButton = wrapper.find('button[title="Save config to backend"]');

    expect(saveButton.exists()).toBe(true);
    expect(saveButton.attributes("disabled")).toBeUndefined();

    await saveButton.trigger("click");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("shows unsaved state and discard action when edits are pending", async () => {
    const toolbar = useVisualEditorToolbar();
    toolbar.setHasChanges(true);
    const discard = vi.fn();
    toolbar.setHistoryHandlers({
      undo: vi.fn(),
      redo: vi.fn(),
      discard,
      resetSavedBaseline: vi.fn(),
    });

    const wrapper = mountNavbar();
    expect(wrapper.text()).toContain("Unsaved changes");
    const discardButton = wrapper.find(
      'button[aria-label="Discard unsaved edits"]',
    );
    expect(discardButton.exists()).toBe(true);
    await discardButton.trigger("click");
    expect(discard).toHaveBeenCalledOnce();
  });

  it("exposes undo and redo controls with availability state", async () => {
    const toolbar = useVisualEditorToolbar();
    const undo = vi.fn();
    const redo = vi.fn();
    toolbar.setHistoryHandlers({
      undo,
      redo,
      discard: vi.fn(),
      resetSavedBaseline: vi.fn(),
    });
    toolbar.setHistoryState(true, false);

    const wrapper = mountNavbar();
    const undoButton = wrapper.find('button[aria-label="Undo last edit"]');
    const redoButton = wrapper.find('button[aria-label="Redo last edit"]');
    expect(undoButton.attributes("disabled")).toBeUndefined();
    expect(redoButton.attributes("disabled")).toBeDefined();
    await undoButton.trigger("click");
    expect(undo).toHaveBeenCalledOnce();
  });

  it("loads and restores a saved dashboard version", async () => {
    const configStore = useConfigStore();
    configStore.listConfigBackups = vi
      .fn()
      .mockResolvedValue([
        { sequence: 7, createdAt: "2026-10-01T12:00:00.000Z" },
      ]);
    configStore.restoreConfigBackup = vi.fn().mockResolvedValue(true);
    const resetSavedBaseline = vi.fn();
    const toolbar = useVisualEditorToolbar();
    toolbar.setHistoryHandlers({
      undo: vi.fn(),
      redo: vi.fn(),
      discard: vi.fn(),
      resetSavedBaseline,
    });
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    window.__appCapabilities = { configImportExport: true };

    try {
      const wrapper = mountNavbar();
      await wrapper.find('button[title="Import/Export"]').trigger("click");
      const loadButton = wrapper
        .findAll("button")
        .find((button) => button.text().includes("Load versions"));
      await loadButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Version 7");
      const restoreButton = wrapper
        .findAll("button")
        .find((button) => button.text().trim() === "Restore");
      await restoreButton.trigger("click");

      expect(configStore.restoreConfigBackup).toHaveBeenCalledWith(7);
      expect(resetSavedBaseline).toHaveBeenCalledOnce();
    } finally {
      delete window.__appCapabilities;
      vi.unstubAllGlobals();
    }
  });
});
