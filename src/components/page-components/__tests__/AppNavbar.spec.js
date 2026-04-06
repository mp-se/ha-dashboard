import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import AppNavbar from "../AppNavbar.vue";
import { useHaStore } from "@/stores/haStore";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";

// Stub PwaInstallModal to avoid complex PWA logic
const PwaInstallModalStub = {
  name: "PwaInstallModal",
  template: "<div class='pwa-install-modal-stub'></div>",
  methods: { showModal: vi.fn() },
};

const baseStoreState = () => ({
  isLoading: false,
  isLocalMode: false,
  isConnected: true,
  lastError: null,
  isInitialized: true,
  developerMode: false,
  dashboardConfig: {
    views: [
      { name: "overview", label: "Overview", icon: "mdi:home" },
      { name: "lights", label: "Lights", icon: "mdi:lightbulb" },
    ],
  },
  credentialsFromConfig: false,
  haUrl: "",
  accessToken: "",
  configValidationError: null,
  configErrorCount: 0,
});

describe("AppNavbar.vue", () => {
  let store;
  let authStore;
  let configStore;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    authStore = useAuthStore();
    configStore = useConfigStore();
    Object.assign(store, baseStoreState());
    authStore.developerMode = false;
    configStore.dashboardConfig = {
      views: [
        { name: "overview", label: "Overview", icon: "mdi:home" },
        { name: "lights", label: "Lights", icon: "mdi:lightbulb" },
      ],
      app: {},
    };
    vi.clearAllMocks();
    // Reset localStorage mock
    vi.stubGlobal("localStorage", {
      setItem: vi.fn(),
      getItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mountNavbar = (props = {}) =>
    mount(AppNavbar, {
      props: {
        currentView: "overview",
        darkMode: false,
        ...props,
      },
      global: {
        plugins: [pinia],
        stubs: {
          PwaInstallModal: PwaInstallModalStub,
        },
      },
    });

  describe("Rendering", () => {
    it("renders navbar when store is not loading", () => {
      const wrapper = mountNavbar();
      expect(wrapper.find("nav").exists()).toBe(true);
    });

    it("does not render navbar when store is loading", () => {
      store.isLoading = true;
      const wrapper = mountNavbar();
      expect(wrapper.find("nav").exists()).toBe(false);
    });

    it("renders menu buttons from dashboardConfig views", async () => {
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll("button.btn-link");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("applies active class to the current view button", async () => {
      const wrapper = mountNavbar({ currentView: "overview" });
      await wrapper.vm.$nextTick();
      const active = wrapper.find("button.active");
      expect(active.exists()).toBe(true);
    });

    it("shows dark mode button", () => {
      const wrapper = mountNavbar({ darkMode: false });
      const btn = wrapper.find('[aria-label="Toggle dark mode"]');
      expect(btn.exists()).toBe(true);
    });

    it("shows the editor toggle button on the right side", () => {
      const wrapper = mountNavbar();
      const btn = wrapper.findComponent({ name: "EditorToggleButton" });
      expect(btn.exists()).toBe(true);
    });
  });

  describe("Dark mode", () => {
    it("emits update:darkMode when dark mode toggle is clicked", async () => {
      const wrapper = mountNavbar({ darkMode: false });
      vi.stubGlobal("document", {
        documentElement: { setAttribute: vi.fn(), style: { colorScheme: "" } },
        querySelector: vi.fn(),
      });
      const btn = wrapper.find('[aria-label="Toggle dark mode"]');
      await btn.trigger("click");
      expect(wrapper.emitted("update:darkMode")).toBeTruthy();
      expect(wrapper.emitted("update:darkMode")[0]).toEqual([true]);
    });

    it("applies dark navbar class when darkMode is true", () => {
      const wrapper = mountNavbar({ darkMode: true });
      const nav = wrapper.find("nav");
      expect(nav.classes()).toContain("navbar-dark");
      expect(nav.classes()).toContain("bg-dark");
    });

    it("applies light navbar class when darkMode is false", () => {
      const wrapper = mountNavbar({ darkMode: false });
      const nav = wrapper.find("nav");
      expect(nav.classes()).toContain("navbar-light");
      expect(nav.classes()).toContain("bg-light");
    });
  });

  describe("Connection indicators", () => {
    it("shows Connected badge when connected and not local mode", async () => {
      store.isConnected = true;
      store.isLocalMode = false;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("Connected");
    });

    it("shows Disconnected badge when not connected and not local mode", async () => {
      store.isConnected = false;
      store.isLocalMode = false;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("Disconnected");
    });

    it("shows Local Mode badge when in local mode", async () => {
      store.isLocalMode = true;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("Local Mode");
    });
  });

  describe("Connection alerts", () => {
    it("shows danger alert when disconnected with lastError", async () => {
      store.isConnected = false;
      store.isLocalMode = false;
      store.lastError = "Connection refused";
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".alert-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Connection refused");
    });

    it("shows warning alert when disconnected, initialized, no error", async () => {
      store.isConnected = false;
      store.isLocalMode = false;
      store.lastError = null;
      store.isInitialized = true;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".alert-warning").exists()).toBe(true);
    });

    it("shows info alert when not connected and loading", async () => {
      store.isConnected = false;
      store.isLocalMode = false;
      store.lastError = null;
      store.isInitialized = false;
      store.isLoading = false; // navbar visible but connection loading
      // Override to show the loading alert: isLoading for connection sub-state
      // The component checks store.isLoading for the info alert
      // We need isConnected false, no lastError, no isInitialized, and isLoading true
      store.isLoading = true;
      // But nav is hidden when isLoading… test the alert div only
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".alert-info").exists()).toBe(true);
    });

    it("does not show connection alerts in local mode", async () => {
      store.isLocalMode = true;
      store.isConnected = false;
      store.lastError = "Error";
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".alert-danger").exists()).toBe(false);
    });
  });

  describe("Config error banner", () => {
    it("shows config error banner when configValidationError has entries", async () => {
      store.configValidationError = [{ message: "Missing views key" }];
      store.configErrorCount = 1;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".alert-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Missing views key");
    });

    it("shows error count in config error banner", async () => {
      store.configValidationError = [
        { message: "Error one" },
        { message: "Error two" },
      ];
      store.configErrorCount = 2;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("2 issue(s)");
    });

    it("shows config error line badge when error has line number", async () => {
      store.configValidationError = [{ message: "Parse error", line: 5 }];
      store.configErrorCount = 1;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".badge.bg-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Line 5");
    });
  });

  describe("Developer mode", () => {
    it("does not show reload config button in the normal navbar", async () => {
      store.developerMode = true;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      const btn = wrapper.find(
        'button[title="Reload dashboard configuration"]',
      );
      expect(btn.exists()).toBe(false);
    });

    it("does not show save data button in the normal navbar", async () => {
      store.developerMode = true;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      const btn = wrapper.find(
        'button[title="Save current data for local testing"]',
      );
      expect(btn.exists()).toBe(false);
    });
  });

  describe("Menu navigation", () => {
    it("emits update:current-view when a menu item is clicked", async () => {
      const wrapper = mountNavbar({ currentView: "overview" });
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll("button.btn-link");
      await buttons[1].trigger("click"); // Click 'lights'
      expect(wrapper.emitted("update:current-view")).toBeTruthy();
    });

  describe("Editor access", () => {
    it("editor toggle button is rendered and receives correct props", () => {
      const wrapper = mountNavbar({ currentView: "overview" });
      const btn = wrapper.findComponent({ name: "EditorToggleButton" });
      expect(btn.exists()).toBe(true);
      expect(btn.props("isEditorOpen")).toBe(false);
    });

    it("editor toggle button shows editor is open", () => {
      const wrapper = mountNavbar({ currentView: "editor" });
      const btn = wrapper.findComponent({ name: "EditorToggleButton" });
      expect(btn.props("isEditorOpen")).toBe(true);
    });

    it("emits update:current-view when EditorToggleButton emits open-editor", async () => {
      const wrapper = mountNavbar();
      const btn = wrapper.findComponent({ name: "EditorToggleButton" });
      await btn.vm.$emit("open-editor");
      expect(wrapper.emitted("update:current-view")).toBeTruthy();
      expect(wrapper.emitted("update:current-view").at(-1)).toEqual(["editor"]);
    });

    it("emits update:current-view when EditorToggleButton emits close-editor", async () => {
      const wrapper = mountNavbar({ currentView: "editor" });
      const btn = wrapper.findComponent({ name: "EditorToggleButton" });
      await btn.vm.$emit("close-editor");
      expect(wrapper.emitted("update:current-view")).toBeTruthy();
      expect(wrapper.emitted("update:current-view").at(-1)).toEqual(["overview"]);
    });
  });

    it("filters out hidden views from menu", async () => {
      store.dashboardConfig = {
        views: [
          { name: "overview", label: "Overview", icon: "mdi:home" },
          {
            name: "hidden-view",
            label: "Hidden",
            icon: "mdi:eye-off",
            hidden: true,
          },
        ],
      };
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll("button.btn-link");
      expect(buttons.length).toBe(1);
    });

    it("returns empty menuItems when dashboardConfig has no views", async () => {
      store.dashboardConfig = null;
      const wrapper = mountNavbar();
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll("button.btn-link");
      expect(buttons.length).toBe(0);
    });
  });
});
