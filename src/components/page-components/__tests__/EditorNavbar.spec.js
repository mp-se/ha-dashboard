import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import EditorNavbar from "../EditorNavbar.vue";
import { useHaStore } from "@/stores/haStore";
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
    const saveButton = wrapper.find('button[title="Save changes to backend"]');

    expect(saveButton.exists()).toBe(true);
    expect(saveButton.attributes("disabled")).toBeUndefined();

    await saveButton.trigger("click");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
