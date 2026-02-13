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
});
