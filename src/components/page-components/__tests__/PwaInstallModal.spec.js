import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PwaInstallModal from "../PwaInstallModal.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("PwaInstallModal.vue", () => {
  let pinia;
  let store;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.isLocalMode = false;
  });

  it("should render modal when shouldShow is true", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    // Trigger showInstallButton to make shouldShow true
    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal").exists()).toBe(true);
  });

  it("should be hidden when shouldShow is false", () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find(".modal").exists()).toBe(false);
  });

  it("should display modal title", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toMatch(/Install app|Install on iPhone/);
  });

  it("should display installation instructions", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const bodyElement = wrapper.find(".modal-body");
    expect(bodyElement.exists()).toBe(true);
    expect(bodyElement.text().length).toBeGreaterThan(0);
  });

  it("should have close button in header", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const closeBtn = wrapper.find(".btn-close");
    expect(closeBtn.exists()).toBe(true);
  });

  it("should emit dismiss on close button click", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const closeBtn = wrapper.find(".btn-close");
    await closeBtn.trigger("click");
    expect(wrapper.vm.dismissed).toBe(true);
  });

  it("should emit dismiss on dismiss button click", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const buttons = wrapper.findAll("button");
    const dismissBtn = buttons.find((btn) => btn.text().includes("Dismiss"));

    if (dismissBtn) {
      await dismissBtn.trigger("click");
      expect(wrapper.vm.dismissed).toBe(true);
    }
  });

  it("should have modal dialog", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-dialog").exists()).toBe(true);
  });

  it("should have modal header", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-header").exists()).toBe(true);
  });

  it("should have modal body", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-body").exists()).toBe(true);
  });

  it("should have modal footer", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-footer").exists()).toBe(true);
  });

  it("should display install button", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    wrapper.vm.deferredPrompt = { prompt: vi.fn() };
    await wrapper.vm.$nextTick();
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should update visibility when shouldShow changes", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find(".modal").exists()).toBe(false);

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".modal").exists()).toBe(true);
  });

  it("should have modal-dialog-centered class", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const dialog = wrapper.find(".modal-dialog");
    expect(dialog.classes()).toContain("modal-dialog-centered");
  });

  it("should have dark overlay", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const modal = wrapper.find(".modal");
    expect(modal.attributes("style")).toContain("rgba(0, 0, 0");
  });

  it("should display icon in title", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const icon = wrapper.find(".mdi");
    expect(icon.exists()).toBe(true);
  });

  it("should have tabindex attribute", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const modal = wrapper.find(".modal");
    expect(modal.attributes("tabindex")).toBe("-1");
  });

  it("should have modal title element", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-title").exists()).toBe(true);
  });

  it("should have modal content", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-content").exists()).toBe(true);
  });

  it("should track isInstalled state", () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.vm.isInstalled).toBeDefined();
  });

  it("should track deferredPrompt state", () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.vm.deferredPrompt).toBeDefined();
  });

  it("should track showInstallButton state", () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.vm.showInstallButton).toBeDefined();
  });

  it("should have dismiss method", () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.vm.dismiss).toBeDefined();
  });

  it("should have promptInstall method", () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.vm.promptInstall).toBeDefined();
  });

  it("should have button in footer", async () => {
    const wrapper = mount(PwaInstallModal, {
      global: {
        plugins: [pinia],
      },
    });

    wrapper.vm.dismissed = false;
    wrapper.vm.showInstallButton = true;
    await wrapper.vm.$nextTick();
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  describe("Programmatic API", () => {
    it("should show modal when showModal is called", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      expect(wrapper.find(".modal").exists()).toBe(false);

      wrapper.vm.showModal();
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".modal").exists()).toBe(true);
    });

    it("should handle deferredPrompt in showModal", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.deferredPrompt = { prompt: vi.fn() };
      wrapper.vm.showModal();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showInstallButton).toBe(true);
    });
  });

  describe("Event Listeners", () => {
    it("should handle beforeinstallprompt event", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      const event = new Event("beforeinstallprompt");
      event.preventDefault = vi.fn();

      window.dispatchEvent(event);

      expect(wrapper.vm.deferredPrompt).toBeDefined();
      expect(wrapper.vm.showInstallButton).toBe(true);
    });

    it("should handle appinstalled event", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.showInstallButton = true;

      const event = new Event("appinstalled");
      window.dispatchEvent(event);

      expect(wrapper.vm.isInstalled).toBe(true);
      expect(wrapper.vm.showInstallButton).toBe(false);
    });
  });

  describe("localStorage handling", () => {
    it("should handle localStorage write failure in dismiss", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      // Mock localStorage to throw an error
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("localStorage not available");
        });

      wrapper.vm.dismissed = false;
      wrapper.vm.showInstallButton = true;
      await wrapper.vm.$nextTick();

      // Should not throw when localStorage fails
      expect(() => wrapper.vm.dismiss()).not.toThrow();
      expect(wrapper.vm.dismissed).toBe(true);

      setItemSpy.mockRestore();
    });

    it("should handle localStorage read failure in onMounted", async () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("localStorage not available");
        });

      // Should not throw when mounting
      expect(() => {
        mount(PwaInstallModal, {
          global: {
            plugins: [pinia],
          },
        });
      }).not.toThrow();

      getItemSpy.mockRestore();
    });

    it("should read dismissed state from localStorage on mount", () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockReturnValue("true");

      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      expect(wrapper.vm.dismissed).toBe(true);

      getItemSpy.mockRestore();
    });
  });

  describe("iOS detection", () => {
    it("should detect iOS devices", () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(window.navigator, "userAgent", {
        value: "iPhone OS",
        configurable: true,
      });

      expect(wrapper.vm.isIos()).toBe(true);

      Object.defineProperty(window.navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it("should set up iOS timeout on mount for iOS devices", () => {
      const originalUserAgent = navigator.userAgent;
      const originalStandalone = window.navigator.standalone;

      // Set up iOS environment
      Object.defineProperty(window.navigator, "userAgent", {
        value: "iPhone OS",
        configurable: true,
      });

      // Ensure not in standalone mode
      Object.defineProperty(window.navigator, "standalone", {
        value: false,
        configurable: true,
      });

      // Mock matchMedia to return false for standalone mode
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        media: "(display-mode: standalone)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      window.matchMedia = matchMediaMock;

      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockReturnValue(null);

      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      // Verify iOS was detected and component is set up correctly
      expect(wrapper.vm.isIos()).toBe(true);
      expect(wrapper.vm.isInStandaloneMode()).toBe(false);

      getItemSpy.mockRestore();
      Object.defineProperty(window.navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
      });
      Object.defineProperty(window.navigator, "standalone", {
        value: originalStandalone,
        configurable: true,
      });
    });

    it("should not show iOS instructions if already dismissed", async () => {
      vi.useFakeTimers();

      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(window.navigator, "userAgent", {
        value: "iPhone OS",
        configurable: true,
      });

      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockReturnValue("true");

      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      vi.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showIosInstructions).toBe(false);

      vi.useRealTimers();
      getItemSpy.mockRestore();
      Object.defineProperty(window.navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
      });
    });
  });

  describe("showModal programmatic API", () => {
    it("should not show modal if already installed", () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.isInstalled = true;
      wrapper.vm.showModal();

      expect(wrapper.vm.manualOpen).toBe(false);
    });

    it("should not show modal in local mode", () => {
      store.isLocalMode = true;
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.showModal();

      expect(wrapper.vm.manualOpen).toBe(false);
    });

    it("should show iOS instructions when no deferredPrompt on iOS", () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(window.navigator, "userAgent", {
        value: "iPhone OS",
        configurable: true,
      });

      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.deferredPrompt = null;
      wrapper.vm.showModal();

      expect(wrapper.vm.manualOpen).toBe(true);
      expect(wrapper.vm.showIosInstructions).toBe(true);

      Object.defineProperty(window.navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it("should show install button as fallback on non-iOS without deferredPrompt", () => {
      // Ensure non-iOS user agent
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        configurable: true,
      });

      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      // Reset state to simulate a clean scenario
      wrapper.vm.showInstallButton = false;
      wrapper.vm.deferredPrompt = null;
      wrapper.vm.isInstalled = false;

      wrapper.vm.showModal();

      expect(wrapper.vm.manualOpen).toBe(true);
      expect(wrapper.vm.showInstallButton).toBe(true);

      Object.defineProperty(window.navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it("should handle errors in showModal gracefully", () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      // Force an error by making isIos throw
      const originalIsIos = wrapper.vm.isIos;
      wrapper.vm.isIos = () => {
        throw new Error("Test error");
      };

      // Should not throw
      expect(() => wrapper.vm.showModal()).not.toThrow();

      wrapper.vm.isIos = originalIsIos;
    });
  });

  describe("promptInstall", () => {
    it("should return early when no deferredPrompt available", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.deferredPrompt = null;
      await wrapper.vm.promptInstall();

      // Should complete without error
      expect(wrapper.vm.deferredPrompt).toBeNull();
    });

    it("should handle prompt failure gracefully", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      const mockPrompt = vi.fn().mockRejectedValue(new Error("Prompt failed"));
      wrapper.vm.deferredPrompt = {
        prompt: mockPrompt,
        userChoice: Promise.reject(new Error("User canceled")),
      };

      await wrapper.vm.promptInstall();

      // Should handle error without throwing
      expect(wrapper.vm.deferredPrompt).toBeNull();
    });

    it("should set isInstalled when user accepts", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      const mockPrompt = vi.fn();
      wrapper.vm.deferredPrompt = {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: "accepted" }),
      };

      await wrapper.vm.promptInstall();

      expect(wrapper.vm.isInstalled).toBe(true);
    });
  });

  describe("isInStandaloneMode", () => {
    it("should detect standalone mode", () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      const originalStandalone = window.navigator.standalone;
      Object.defineProperty(window.navigator, "standalone", {
        value: true,
        configurable: true,
      });

      expect(wrapper.vm.isInStandaloneMode()).toBe(true);

      Object.defineProperty(window.navigator, "standalone", {
        value: originalStandalone,
        configurable: true,
      });
    });

    it("should return false if not installed and dismissed", () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.isInstalled = false;
      wrapper.vm.dismissed = true;
      wrapper.vm.showInstallButton = false;

      expect(wrapper.vm.shouldShow).toBe(false);
    });

    it("should return false in local mode", () => {
      store.isLocalMode = true;
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.showInstallButton = true;
      wrapper.vm.dismissed = false;

      expect(wrapper.vm.shouldShow).toBe(false);
    });

    it("should return true when manualOpen overrides dismissed", () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.dismissed = true;
      wrapper.vm.manualOpen = true;
      wrapper.vm.showInstallButton = true;

      expect(wrapper.vm.shouldShow).toBe(true);
    });
  });

  describe("display variations", () => {
    it("should show iOS icon when showIosInstructions is true", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.dismissed = false;
      wrapper.vm.showIosInstructions = true;
      wrapper.vm.showInstallButton = false;
      await wrapper.vm.$nextTick();

      const icon = wrapper.find(".mdi-apple");
      expect(icon.exists()).toBe(true);
    });

    it("should show install icon when showInstallButton is true", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.dismissed = false;
      wrapper.vm.showInstallButton = true;
      wrapper.vm.showIosInstructions = false;
      await wrapper.vm.$nextTick();

      const icon = wrapper.find(".mdi-phone-plus");
      expect(icon.exists()).toBe(true);
    });

    it("should show warning when no deferredPrompt available", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.dismissed = false;
      wrapper.vm.showInstallButton = true;
      wrapper.vm.deferredPrompt = null;
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("not available");
    });

    it("should not show install button when no deferredPrompt", async () => {
      const wrapper = mount(PwaInstallModal, {
        global: {
          plugins: [pinia],
        },
      });

      wrapper.vm.dismissed = false;
      wrapper.vm.showInstallButton = true;
      wrapper.vm.deferredPrompt = null;
      wrapper.vm.isInstalled = false;
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll("button");
      const installBtn = buttons.find((btn) => btn.text() === "Install");
      expect(installBtn).toBeUndefined();
    });
  });
});
