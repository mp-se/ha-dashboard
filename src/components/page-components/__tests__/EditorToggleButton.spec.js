import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import EditorToggleButton from "../EditorToggleButton.vue";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/stores/configStore", () => ({
  useConfigStore: vi.fn(),
}));

const createMockAuthStore = (overrides = {}) => ({
  developerMode: false,
  toggleDeveloperMode: vi.fn(() => true),
  ...overrides,
});

const createMockConfigStore = (password = "secret") => ({
  dashboardConfig: {
    app: password ? { password } : {},
  },
});

describe("EditorToggleButton.vue", () => {
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    useAuthStore.mockReturnValue(createMockAuthStore());
    useConfigStore.mockReturnValue(createMockConfigStore("secret"));
  });

  // ─── Initial rendering ────────────────────────────────────────────────

  describe("rendering", () => {
    it("renders the button", () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button.btn").exists()).toBe(true);
    });

    it("shows bug icon when developer mode is OFF", () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });
      const icon = wrapper.find("button i");
      expect(icon.classes()).toContain("mdi-bug");
    });

    it("shows pencil-ruler icon when developer mode is ON", () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ developerMode: true }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });
      const icon = wrapper.find("button i");
      expect(icon.classes()).toContain("mdi-pencil-ruler");
    });
  });

  // ─── Button title (tooltip) ────────────────────────────────────────

  describe("button title", () => {
    it("shows 'Enable Developer Mode' when dev mode is OFF and no password", () => {
      useConfigStore.mockReturnValue(createMockConfigStore(null));
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("title")).toContain(
        "Enable Developer Mode",
      );
    });

    it("shows 'Enable Developer Mode (password required)' when dev mode is OFF and password exists", () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("title")).toContain(
        "Enable Developer Mode (password required)",
      );
    });

    it("shows 'Open visual editor' when dev mode is ON and editor is closed", () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ developerMode: true }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("title")).toContain(
        "Open visual editor",
      );
    });

    it("shows 'Close visual editor' when dev mode is ON and editor is open", () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ developerMode: true }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: true },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("title")).toContain(
        "Close visual editor",
      );
    });
  });

  // ─── Developer mode OFF - enable flow ──────────────────────────────

  describe("developer mode OFF - enable flow", () => {
    it("emits open-editor when dev mode is OFF, no password, and button clicked", async () => {
      useConfigStore.mockReturnValue(createMockConfigStore(null));
      const mockStore = createMockAuthStore();
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("");
      expect(wrapper.emitted("open-editor")).toBeTruthy();
    });

    it("shows password modal when dev mode is OFF, password exists, and button clicked", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.find(".modal").exists()).toBe(true);
    });

    it("shows 'Enable Developer Mode' title in modal", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.text()).toContain("Enable Developer Mode");
    });

    it("shows 'Enable Developer Mode' button text in modal", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      const confirmBtn = wrapper.find(".modal-footer .btn-primary");

      expect(confirmBtn.text()).toContain("Enable Developer Mode");
    });

    it("shows password input field in modal", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.find("input[type='password']").exists()).toBe(true);
    });

    it("disables confirm button when password is empty", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      const confirmBtn = wrapper.find(".modal-footer .btn-primary");

      expect(confirmBtn.attributes("disabled")).toBeDefined();
    });

    it("enables confirm button when password is entered", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("secret");
      const confirmBtn = wrapper.find(".modal-footer .btn-primary");

      expect(confirmBtn.attributes("disabled")).toBeUndefined();
    });
  });

  // ─── Developer mode ON - editor toggle flow ────────────────────────

  describe("developer mode ON - editor toggle flow", () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ developerMode: true }),
      );
    });

    it("emits open-editor when dev mode is ON and editor is closed", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.emitted("open-editor")).toBeTruthy();
      expect(wrapper.emitted("close-editor")).toBeFalsy();
    });

    it("emits close-editor when dev mode is ON and editor is open", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: true },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.emitted("close-editor")).toBeTruthy();
      expect(wrapper.emitted("open-editor")).toBeFalsy();
    });

    it("does not show modal when dev mode is ON", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.find(".modal").exists()).toBe(false);
    });
  });

  // ─── Password authentication ────────────────────────────────────────

  describe("password authentication", () => {
    it("calls toggleDeveloperMode with entered password on submit", async () => {
      const mockStore = createMockAuthStore();
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("secret");
      await wrapper.find(".modal-footer .btn-primary").trigger("click");

      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("secret");
    });

    it("closes modal on successful password entry", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ toggleDeveloperMode: vi.fn(() => true) }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("secret");
      await wrapper.find(".modal-footer .btn-primary").trigger("click");

      expect(wrapper.find(".modal").exists()).toBe(false);
    });

    it("emits open-editor after successful password entry", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ toggleDeveloperMode: vi.fn(() => true) }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("secret");
      await wrapper.find(".modal-footer .btn-primary").trigger("click");

      expect(wrapper.emitted("open-editor")).toBeTruthy();
    });

    it("shows error message on failed password", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ toggleDeveloperMode: vi.fn(() => false) }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("wrong");
      await wrapper.find(".modal-footer .btn-primary").trigger("click");

      expect(wrapper.find(".alert-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid password");
    });

    it("keeps modal open on failed password", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ toggleDeveloperMode: vi.fn(() => false) }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("wrong");
      await wrapper.find(".modal-footer .btn-primary").trigger("click");

      expect(wrapper.find(".modal").exists()).toBe(true);
    });

    it("clears password field on failed attempt", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ toggleDeveloperMode: vi.fn(() => false) }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("wrong");
      await wrapper.find(".modal-footer .btn-primary").trigger("click");

      expect(wrapper.find("input[type='password']").element.value).toBe("");
    });

    it("shows no error message on successful password", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ toggleDeveloperMode: vi.fn(() => true) }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("secret");
      await wrapper.find(".modal-footer .btn-primary").trigger("click");

      expect(wrapper.find(".alert-danger").exists()).toBe(false);
    });
  });

  // ─── Modal interaction ────────────────────────────────────────────

  describe("modal interaction", () => {
    it("closes modal when Cancel button is clicked", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(true);

      await wrapper.find(".modal-footer .btn-secondary").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(false);
    });

    it("closes modal when close (×) button is clicked", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(true);

      await wrapper.find(".btn-close").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(false);
    });

    it("clears password field when modal is closed via Cancel", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("secret");

      await wrapper.find(".modal-footer .btn-secondary").trigger("click");

      // Re-open to verify field is cleared
      await wrapper.find("button").trigger("click");
      expect(wrapper.find("input[type='password']").element.value).toBe("");
    });

    it("clears password field when modal is closed via close button", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("secret");

      await wrapper.find(".btn-close").trigger("click");

      // Re-open to verify field is cleared
      await wrapper.find("button").trigger("click");
      expect(wrapper.find("input[type='password']").element.value).toBe("");
    });

    it("does not emit events when modal is cancelled", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find(".modal-footer .btn-secondary").trigger("click");

      expect(wrapper.emitted("open-editor")).toBeFalsy();
      expect(wrapper.emitted("close-editor")).toBeFalsy();
    });
  });

  // ─── Keyboard interaction ───��─────────────────────────────────────

  describe("keyboard interaction", () => {
    it("submits password form on Enter key press", async () => {
      const mockStore = createMockAuthStore();
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      const pwInput = wrapper.find("input[type='password']");
      await pwInput.setValue("secret");
      await pwInput.trigger("keyup.enter");

      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("secret");
    });

    it("closes modal after successful Enter key submission", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ toggleDeveloperMode: vi.fn(() => true) }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      const pwInput = wrapper.find("input[type='password']");
      await pwInput.setValue("secret");
      await pwInput.trigger("keyup.enter");

      expect(wrapper.find(".modal").exists()).toBe(false);
    });
  });

  // ─── Props reactivity ────────────────────────────────────────────

  describe("props reactivity", () => {
    it("updates title when isEditorOpen prop changes", async () => {
      useAuthStore.mockReturnValue(
        createMockAuthStore({ developerMode: true }),
      );
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      expect(wrapper.find("button").attributes("title")).toContain("Open");

      await wrapper.setProps({ isEditorOpen: true });

      expect(wrapper.find("button").attributes("title")).toContain("Close");
    });
  });

  // ─── Modal titles for different actions ──────────────────────────

  describe("modal content based on action", () => {
    it("shows 'Enable Developer Mode' when initial action is dev mode", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.find(".modal-header").text()).toContain(
        "Enable Developer Mode",
      );
    });

    it("shows password input label", async () => {
      const wrapper = mount(EditorToggleButton, {
        props: { isEditorOpen: false },
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(wrapper.text()).toContain("Enter Developer Password");
    });
  });
});
