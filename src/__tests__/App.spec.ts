import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import App from "../App.vue";
import { useHaStore } from "../stores/haStore";

vi.mock("../views/JsonConfigView.vue", () => ({
  default: {
    name: "JsonConfigView",
    template: '<div class="overview-view"></div>',
  },
}));

vi.mock("../views/DevicesView.vue", () => ({
  default: { name: "DevicesView", template: '<div class="device-view"></div>' },
}));

vi.mock("../views/RawEntityView.vue", () => ({
  default: { name: "RawEntityView", template: '<div class="raw-view"></div>' },
}));

vi.mock("../views/VisualEditorView.vue", () => ({
  default: {
    name: "VisualEditorView",
    template: '<div class="editor-view"></div>',
  },
}));

// Mock components that might be problematic or lazy loaded
vi.mock("../components/page-components/AppNavbar.vue", () => ({
  default: {
    name: "AppNavbar",
    template:
      "<div class=\"app-navbar\" @click=\"$emit('update:currentView', 'editor')\">AppNavbar</div>",
    props: ["currentView", "darkMode"],
    emits: ["update:currentView", "update:darkMode", "edit-credentials"],
  },
}));

vi.mock("../components/page-components/EditorNavbar.vue", () => ({
  default: {
    name: "EditorNavbar",
    template:
      "<div class=\"editor-navbar\" @click=\"$emit('update:currentView', 'overview')\">EditorNavbar</div>",
    props: ["currentView", "darkMode"],
    emits: ["update:currentView", "update:darkMode"],
  },
}));

vi.mock("../components/page-components/CredentialDialog.vue", () => ({
  default: {
    name: "CredentialDialog",
    template: "<div>CredentialDialog</div>",
    methods: {
      showModal: vi.fn(),
    },
  },
}));

vi.mock("../components/page-components/ErrorBoundary.vue", () => ({
  default: { name: "ErrorBoundary", template: "<div><slot /></div>" },
}));

describe("App.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Mock store state
    const store = useHaStore();
    store.isLoading = false;
    store.dashboardConfig = {
      views: [{ name: "overview", label: "Overview" }],
    };
  });

  it("switches between AppNavbar and EditorNavbar based on currentView", async () => {
    const wrapper = mount(App);

    // Initially should be AppNavbar
    expect(wrapper.find(".app-navbar").exists()).toBe(true);
    expect(wrapper.find(".editor-navbar").exists()).toBe(false);

    // Trigger switch to editor mode
    // Note: We need to trigger the event on the component if the mock doesn't handle v-model properly
    await wrapper
      .findComponent({ name: "AppNavbar" })
      .vm.$emit("update:currentView", "editor");

    // Now should be EditorNavbar
    expect(wrapper.find(".app-navbar").exists()).toBe(false);
    expect(wrapper.find(".editor-navbar").exists()).toBe(true);

    // Trigger switch back
    await wrapper
      .findComponent({ name: "EditorNavbar" })
      .vm.$emit("update:currentView", "overview");
    expect(wrapper.find(".app-navbar").exists()).toBe(true);
  });

  it("keeps the editor navbar for editor-related views", async () => {
    const wrapper = mount(App);

    await wrapper
      .findComponent({ name: "AppNavbar" })
      .vm.$emit("update:currentView", "editor");
    expect(wrapper.find(".editor-navbar").exists()).toBe(true);
    expect(wrapper.find(".app-navbar").exists()).toBe(false);

    await wrapper
      .findComponent({ name: "EditorNavbar" })
      .vm.$emit("update:currentView", "device");
    expect(wrapper.find(".editor-navbar").exists()).toBe(true);
    expect(wrapper.find(".app-navbar").exists()).toBe(false);

    await wrapper
      .findComponent({ name: "EditorNavbar" })
      .vm.$emit("update:currentView", "raw");
    expect(wrapper.find(".editor-navbar").exists()).toBe(true);
    expect(wrapper.find(".app-navbar").exists()).toBe(false);
  });
});
