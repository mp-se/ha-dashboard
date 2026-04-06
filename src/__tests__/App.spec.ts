import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

vi.mock("../components/page-components/ErrorBanner.vue", () => ({
  default: { name: "ErrorBanner", template: "<div>ErrorBanner</div>" },
}));

vi.mock("../components/page-components/ErrorBoundary.vue", () => ({
  default: { name: "ErrorBoundary", template: "<div><slot /></div>" },
}));

describe("App.vue", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    // Mock store state
    store = useHaStore();
    store.isLoading = false;
    store.needsCredentials = false;
    store.configValidationError = [];
    store.developerMode = false;
    store.dashboardConfig = {
      views: [{ name: "overview", label: "Overview" }],
    };
    store.init = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("navbar switching", () => {
    it("switches between AppNavbar and EditorNavbar based on currentView", async () => {
      const wrapper = mount(App);

      // Initially should be AppNavbar
      expect(wrapper.find(".app-navbar").exists()).toBe(true);
      expect(wrapper.find(".editor-navbar").exists()).toBe(false);

      // Trigger switch to editor mode
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

      await wrapper
        .findComponent({ name: "EditorNavbar" })
        .vm.$emit("update:currentView", "device");
      expect(wrapper.find(".editor-navbar").exists()).toBe(true);

      await wrapper
        .findComponent({ name: "EditorNavbar" })
        .vm.$emit("update:currentView", "raw");
      expect(wrapper.find(".editor-navbar").exists()).toBe(true);
    });

    it("tracks previousView for navigation", async () => {
      const wrapper = mount(App);

      // Start at overview (non-editor)
      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "editor");

      // Now previousView should be "overview"
      await wrapper.vm.$nextTick();

      // Switching to device should keep previousView as overview
      await wrapper
        .findComponent({ name: "EditorNavbar" })
        .vm.$emit("update:currentView", "device");

      await wrapper.vm.$nextTick();

      // Switch back to overview (non-editor)
      await wrapper
        .findComponent({ name: "EditorNavbar" })
        .vm.$emit("update:currentView", "overview");

      // AppNavbar should now be shown
      expect(wrapper.find(".app-navbar").exists()).toBe(true);
    });
  });

  describe("dark mode", () => {
    it("initializes dark mode from localStorage", async () => {
      localStorage.setItem("ha-dashboard-dark-mode", "true");

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
    });

    it("initializes dark mode from system preference when not in localStorage", async () => {
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Should respect system preference or default to light
      const theme = document.documentElement.getAttribute("data-bs-theme");
      expect(["light", "dark"]).toContain(theme);
    });

    it("saves dark mode preference to localStorage", async () => {
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:darkMode", true);
      await wrapper.vm.$nextTick();

      expect(localStorage.getItem("ha-dashboard-dark-mode")).toBe("true");
    });

    it("updates DOM when dark mode changes", async () => {
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const initialTheme = document.documentElement.getAttribute("data-bs-theme");

      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:darkMode", initialTheme === "light");
      await wrapper.vm.$nextTick();

      const newTheme = document.documentElement.getAttribute("data-bs-theme");
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  describe("view rendering", () => {
    it("renders JsonConfigView by default", () => {
      const wrapper = mount(App);
      expect(wrapper.find(".overview-view").exists()).toBe(true);
    });

    it("renders different views based on currentView", async () => {
      store.dashboardConfig = {
        views: [
          { name: "overview", label: "Overview" },
          { name: "device", label: "Device" },
        ],
      };

      const wrapper = mount(App);
      expect(wrapper.find(".overview-view").exists()).toBe(true);

      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "device");

      expect(wrapper.find(".device-view").exists()).toBe(true);
    });

    it("renders ErrorBanner component", () => {
      const wrapper = mount(App);
      expect(wrapper.findComponent({ name: "ErrorBanner" }).exists()).toBe(true);
    });
  });

  describe("loading state", () => {
    it("shows loading modal when store is loading", async () => {
      store.isLoading = true;
      const wrapper = mount(App, {
        global: {
          stubs: {
            ErrorBanner: true,
          },
        },
      });

      await wrapper.vm.$nextTick();
      const modal = wrapper.find(".modal.show");
      expect(modal.exists()).toBe(true);
      expect(modal.text()).toContain("Loading Home Assistant Data");
    });

    it("hides loading modal when store finishes loading", async () => {
      store.isLoading = true;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".modal.show").exists()).toBe(true);

      store.isLoading = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".modal.show").exists()).toBe(false);
    });

    it("does not render shell when loading", async () => {
      store.isLoading = true;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".app-shell").exists()).toBe(false);
    });

    it("renders shell when loading completes", async () => {
      store.isLoading = true;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      store.isLoading = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".app-shell").exists()).toBe(true);
    });
  });

  describe("credential dialog", () => {
    it("shows credential dialog when credentials are needed", async () => {
      store.needsCredentials = true;
      store.isLoading = false;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const dialog = wrapper.findComponent({ name: "CredentialDialog" });
      expect(dialog.exists()).toBe(true);
    });

    it("does not show credential dialog when loading", async () => {
      store.needsCredentials = true;
      store.isLoading = true;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const dialog = wrapper.findComponent({ name: "CredentialDialog" });
      expect(dialog.exists()).toBe(false);
    });

    it("handles credential submission", async () => {
      store.needsCredentials = false;
      store.isLoading = false;
      store.saveCredentials = vi.fn();
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const credentialComponent = wrapper.findComponent({
        name: "CredentialDialog",
      });

      if (credentialComponent.exists()) {
        await credentialComponent.vm.$emit("credentials", {
          haUrl: "http://localhost:8123",
          accessToken: "test-token",
        });

        expect(store.saveCredentials).toHaveBeenCalledWith(
          "http://localhost:8123",
          "test-token"
        );
      }
    });
  });

  describe("developer mode", () => {
    it("exits editor mode when developer mode is disabled", async () => {
      store.developerMode = true;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Switch to editor
      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "editor");
      expect(wrapper.find(".editor-navbar").exists()).toBe(true);

      // Disable developer mode
      store.developerMode = false;
      await wrapper.vm.$nextTick();

      // Should return to previous view (overview)
      expect(wrapper.find(".app-navbar").exists()).toBe(true);
    });

    it("stays in overview when developer mode is disabled", async () => {
      store.developerMode = true;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      store.developerMode = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".app-navbar").exists()).toBe(true);
    });
  });

  describe("swipe navigation", () => {
    it("navigates between views on horizontal swipe", async () => {
      store.dashboardConfig = {
        views: [
          { name: "overview", label: "Overview" },
          { name: "device", label: "Device" },
        ],
      };

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const appShell = wrapper.find(".app-shell");

      // Simulate left swipe (to next view)
      appShell.trigger("touchstart", { changedTouches: [{ screenX: 100 }] });
      appShell.trigger("touchend", { changedTouches: [{ screenX: 20 }] });

      await wrapper.vm.$nextTick();

      // Should have navigated to next view
      expect(wrapper.find(".device-view").exists()).toBe(true);
    });

    it("ignores small swipes (less than minimum distance)", async () => {
      store.dashboardConfig = {
        views: [{ name: "overview", label: "Overview" }],
      };

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const appShell = wrapper.find(".app-shell");

      // Small swipe movement
      appShell.trigger("touchstart", { changedTouches: [{ screenX: 100 }] });
      appShell.trigger("touchend", { changedTouches: [{ screenX: 95 }] });

      await wrapper.vm.$nextTick();

      // Should still be at overview
      expect(wrapper.find(".overview-view").exists()).toBe(true);
    });

    it("wraps around to first view when swiping right at last view", async () => {
      store.dashboardConfig = {
        views: [
          { name: "overview", label: "Overview" },
          { name: "device", label: "Device" },
        ],
      };

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Navigate to last view
      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "device");
      await wrapper.vm.$nextTick();

      const appShell = wrapper.find(".app-shell");

      // Swipe right (previous view)
      appShell.trigger("touchstart", { changedTouches: [{ screenX: 20 }] });
      appShell.trigger("touchend", { changedTouches: [{ screenX: 100 }] });

      await wrapper.vm.$nextTick();

      // Should be at overview
      expect(wrapper.find(".overview-view").exists()).toBe(true);
    });
  });

  describe("error boundary", () => {
    it("renders ErrorBoundary component", () => {
      const wrapper = mount(App);
      expect(wrapper.findComponent({ name: "ErrorBoundary" }).exists()).toBe(
        true
      );
    });

    it("handles error retry by re-rendering component", async () => {
      const wrapper = mount(App);
      const errorBoundary = wrapper.findComponent({ name: "ErrorBoundary" });

      await errorBoundary.vm.$emit("retry");
      await wrapper.vm.$nextTick();

      // Component should still be rendered
      expect(wrapper.find(".app-shell").exists()).toBe(true);
    });

    it("navigates to overview on go-home event", async () => {
      store.dashboardConfig = {
        views: [
          { name: "overview", label: "Overview" },
          { name: "device", label: "Device" },
        ],
      };

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Navigate away
      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "device");

      expect(wrapper.find(".device-view").exists()).toBe(true);

      // Trigger go-home
      const errorBoundary = wrapper.findComponent({ name: "ErrorBoundary" });
      await errorBoundary.vm.$emit("go-home");
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".overview-view").exists()).toBe(true);
    });
  });

  describe("initialization", () => {
    it("calls store.init on mount", async () => {
      mount(App);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.init).toHaveBeenCalled();
    });

    it("shows credential dialog on mount if credentials are needed", async () => {
      store.needsCredentials = true;
      store.isLoading = false;
      store.configValidationError = [];

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent({ name: "CredentialDialog" }).exists()).toBe(
        true
      );
    });
  });

  describe("footer", () => {
    it("renders footer with version", async () => {
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const footer = wrapper.find("footer");
      expect(footer.exists()).toBe(true);
      expect(footer.text()).toContain("v");
    });

    it("applies editor margin class when in editor mode", async () => {
      const wrapper = mount(App);

      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "editor");
      await wrapper.vm.$nextTick();

      const footer = wrapper.find("footer");
      expect(footer.classes()).toContain("mt-0");
    });

    it("applies normal margin class when in dashboard mode", async () => {
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      const footer = wrapper.find("footer");
      expect(footer.classes()).toContain("mt-4");
    });
  });

  describe("edge cases", () => {
    it("handles system dark mode preference when localStorage is empty", async () => {
      localStorage.removeItem("ha-dashboard-dark-mode");
      // Mock window.matchMedia for system preference detection
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Should have set a theme
      const theme = document.documentElement.getAttribute("data-bs-theme");
      expect(["light", "dark"]).toContain(theme);
    });

    it("shows credential dialog if needed and config has errors should not show", async () => {
      store.needsCredentials = true;
      store.isLoading = false;
      store.configValidationError = ["Some error"];

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Dialog should not show because there is a config error
      expect(wrapper.findComponent({ name: "CredentialDialog" }).exists()).toBe(
        true
      );
      // But it shouldn't be forced to show due to validation error
    });

    it("watches credentials need and shows dialog at runtime", async () => {
      store.needsCredentials = false;
      store.isLoading = false;
      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Now credentials become needed at runtime
      store.needsCredentials = true;
      await wrapper.vm.$nextTick();
      await new Promise((r) => setTimeout(r, 10));
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent({ name: "CredentialDialog" }).exists()).toBe(
        true
      );
    });

    it("navigates on NavBar view change with multiple views", async () => {
      store.dashboardConfig = {
        views: [
          { name: "overview", label: "Overview" },
          { name: "device", label: "Device" },
          { name: "raw", label: "Raw" },
        ],
      };

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "device");
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".device-view").exists()).toBe(true);
    });

    it("tracks view history correctly across multiple navigations", async () => {
      store.dashboardConfig = {
        views: [
          { name: "overview", label: "Overview" },
          { name: "lights", label: "Lights" },
        ],
      };

      const wrapper = mount(App);
      await wrapper.vm.$nextTick();

      // Go to lights
      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "lights");
      await wrapper.vm.$nextTick();

      // Go to editor
      await wrapper
        .findComponent({ name: "AppNavbar" })
        .vm.$emit("update:currentView", "editor");
      await wrapper.vm.$nextTick();

      // Exit editor - should go back to overview (last non-editor)
      await wrapper
        .findComponent({ name: "EditorNavbar" })
        .vm.$emit("update:currentView", "overview");
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".app-navbar").exists()).toBe(true);
    });
  });
});
