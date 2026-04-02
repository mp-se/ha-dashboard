import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DeveloperModeToggle from "../DeveloperModeToggle.vue";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/stores/configStore", () => ({
  useConfigStore: vi.fn(),
}));

const createMockStore = (overrides = {}) => ({
  developerMode: false,
  toggleDeveloperMode: vi.fn(() => true),
  ...overrides,
});

/** Build a mock config store. Pass null/undefined/empty to simulate no password. */
const createMockConfigStore = (password = "secret") => ({
  dashboardConfig: {
    app: password ? { password } : {},
  },
});

describe("DeveloperModeToggle.vue", () => {
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    useAuthStore.mockReturnValue(createMockStore());
    // Default: password is configured
    useConfigStore.mockReturnValue(createMockConfigStore("secret"));
  });

  // ─── Initial render ────────────────────────────────────────────────────

  describe("rendering", () => {
    it("renders the toggle button", () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button.btn").exists()).toBe(true);
    });

    it("shows 'enable' tooltip when developer mode is off", () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("title")).toContain(
        "Click to enable Developer Mode",
      );
    });

    it("shows 'disable' tooltip when developer mode is on", () => {
      useAuthStore.mockReturnValue(createMockStore({ developerMode: true }));
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("title")).toContain(
        "Click to disable Developer Mode",
      );
    });

    it("does not show password modal initially", () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".modal").exists()).toBe(false);
    });
  });

  // ─── Opening the modal ─────────────────────────────────────────────────

  describe("opening password modal", () => {
    it("shows password modal when button is clicked in disabled mode", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(true);
    });

    it("shows modal title", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      expect(wrapper.text()).toContain("Enable Developer Mode");
    });

    it("shows password input in modal", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      expect(wrapper.find("input[type='password']").exists()).toBe(true);
    });

    it("the confirm button is disabled when password is empty", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      const confirmBtn = wrapper.find(".modal-footer .btn-primary");
      expect(confirmBtn.attributes("disabled")).toBeDefined();
    });
  });

  // ─── Closing the modal ────────────────────────────────────────────────

  describe("closing the modal", () => {
    it("closes modal when Cancel button is clicked", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(true);

      await wrapper.find(".btn-secondary").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(false);
    });

    it("closes modal when the × close button is clicked", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      await wrapper.find(".btn-close").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(false);
    });

    it("clears the password field when modal is closed", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");

      const pwInput = wrapper.find("input[type='password']");
      await pwInput.setValue("secret");
      expect(pwInput.element.value).toBe("secret");

      await wrapper.find(".btn-secondary").trigger("click");

      // Re-open to check field is cleared
      await wrapper.find("button").trigger("click");
      const freshInput = wrapper.find("input[type='password']");
      expect(freshInput.element.value).toBe("");
    });
  });

  // ─── Successful authentication ────────────────────────────────────────

  describe("successful authentication", () => {
    it("calls toggleDeveloperMode with the entered password", async () => {
      const mockStore = createMockStore({
        toggleDeveloperMode: vi.fn(() => true),
      });
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("correct-pw");
      await wrapper.find(".btn-primary").trigger("click");

      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("correct-pw");
    });

    it("closes the modal when toggle succeeds", async () => {
      useAuthStore.mockReturnValue(
        createMockStore({ toggleDeveloperMode: vi.fn(() => true) }),
      );
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("correct-pw");
      await wrapper.find(".btn-primary").trigger("click");

      expect(wrapper.find(".modal").exists()).toBe(false);
    });

    it("shows no error when authentication succeeds", async () => {
      useAuthStore.mockReturnValue(
        createMockStore({ toggleDeveloperMode: vi.fn(() => true) }),
      );
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("correct-pw");
      await wrapper.find(".btn-primary").trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".alert-danger").exists()).toBe(false);
    });
  });

  // ─── Failed authentication ────────────────────────────────────────────

  describe("failed authentication", () => {
    it("shows error message when password is wrong", async () => {
      useAuthStore.mockReturnValue(
        createMockStore({ toggleDeveloperMode: vi.fn(() => false) }),
      );
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("wrong-pw");
      await wrapper.find(".btn-primary").trigger("click");

      expect(wrapper.find(".alert-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid password");
    });

    it("keeps the modal open when password is wrong", async () => {
      useAuthStore.mockReturnValue(
        createMockStore({ toggleDeveloperMode: vi.fn(() => false) }),
      );
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("wrong-pw");
      await wrapper.find(".btn-primary").trigger("click");

      expect(wrapper.find(".modal").exists()).toBe(true);
    });

    it("clears the password field after a failed attempt", async () => {
      useAuthStore.mockReturnValue(
        createMockStore({ toggleDeveloperMode: vi.fn(() => false) }),
      );
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      await wrapper.find("input[type='password']").setValue("wrong-pw");
      await wrapper.find(".btn-primary").trigger("click");

      expect(wrapper.find("input[type='password']").element.value).toBe("");
    });
  });

  // ─── When already in developer mode ──────────────────────────────────

  describe("disabling developer mode (already enabled)", () => {
    it("calls toggleDeveloperMode directly without opening the modal", async () => {
      const mockStore = createMockStore({
        developerMode: true,
        toggleDeveloperMode: vi.fn(() => true),
      });
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");

      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("");
      expect(wrapper.find(".modal").exists()).toBe(false);
    });
  });

  // ─── Enter key submits form ─────────────────────────────────────────

  describe("keyboard interaction", () => {
    it("pressing Enter in the password field submits the form", async () => {
      const mockStore = createMockStore({
        toggleDeveloperMode: vi.fn(() => true),
      });
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });

      await wrapper.find("button").trigger("click");
      const pwInput = wrapper.find("input[type='password']");
      await pwInput.setValue("correct-pw");
      await pwInput.trigger("keyup.enter");

      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("correct-pw");
    });
  });

  // ─── No password configured ───────────────────────────────────────────

  describe("no password configured", () => {
    beforeEach(() => {
      useConfigStore.mockReturnValue(createMockConfigStore(null));
    });

    it("does not show the modal when no password is configured", async () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      expect(wrapper.find(".modal").exists()).toBe(false);
    });

    it("calls toggleDeveloperMode directly when no password is configured", async () => {
      const mockStore = createMockStore({
        toggleDeveloperMode: vi.fn(() => true),
      });
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("");
    });

    it("calls toggleDeveloperMode directly when password is an empty string", async () => {
      useConfigStore.mockReturnValue(createMockConfigStore(""));
      const mockStore = createMockStore({
        toggleDeveloperMode: vi.fn(() => true),
      });
      useAuthStore.mockReturnValue(mockStore);
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      await wrapper.find("button").trigger("click");
      expect(mockStore.toggleDeveloperMode).toHaveBeenCalledWith("");
    });

    it("shows generic enable tooltip when no password is configured", () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("title")).toContain(
        "Click to enable Developer Mode",
      );
    });

    it("button is not disabled when no password is configured", () => {
      const wrapper = mount(DeveloperModeToggle, {
        global: { plugins: [pinia] },
      });
      expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
    });
  });
});
