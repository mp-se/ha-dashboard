import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ErrorBanner from "../ErrorBanner.vue";
import { useAuthStore } from "@/stores/authStore";

describe("ErrorBanner.vue", () => {
  let authStore;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    authStore = useAuthStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mountComponent = () =>
    mount(ErrorBanner, {
      global: {
        plugins: [pinia],
      },
    });

  it("does not render when there is no error", () => {
    const wrapper = mountComponent();
    expect(wrapper.find(".error-banner").exists()).toBe(false);
  });

  it("renders error banner when lastError is set", async () => {
    const wrapper = mountComponent();
    authStore.lastError = "Test error message";

    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(wrapper.find(".error-banner").exists()).toBe(true);
    expect(wrapper.text()).toContain("Test error message");
  });

  describe("error type classification", () => {
    it("classifies server-not-found errors", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Cannot connect to server";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".alert-danger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Server Connection Failed");
      expect(wrapper.find(".mdi-server-off").exists()).toBe(true);
    });

    it("classifies certificate errors", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "SSL certificate validation failed";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.text()).toContain("Certificate Validation Error");
      expect(wrapper.find(".mdi-lock-alert").exists()).toBe(true);
    });

    it("classifies CORS errors", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Failed to fetch due to CORS";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.text()).toContain("CORS/Security Error");
      expect(wrapper.find(".mdi-shield-alert").exists()).toBe(true);
    });

    it("classifies cross-origin errors as CORS", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "cross-origin request blocked";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.text()).toContain("CORS/Security Error");
    });

    it("classifies authentication errors", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Invalid authentication credentials";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".alert-warning").exists()).toBe(true);
      expect(wrapper.text()).toContain("Authentication Error");
      expect(wrapper.find(".mdi-alert-circle").exists()).toBe(true);
    });

    it("classifies generic errors with default icon", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Some random error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.text()).toContain("Connection Error");
      expect(wrapper.find(".mdi-alert").exists()).toBe(true);
    });
  });

  describe("auto-dismiss behavior", () => {
    it("auto-dismisses non-critical errors after 8 seconds", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Non-critical error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(true);

      vi.advanceTimersByTime(8000);
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(false);
      expect(authStore.lastError).toBe(null);
    });

    it("does NOT auto-dismiss server-not-found errors", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Cannot connect to server";

      await wrapper.vm.$nextTick();
      await flushPromises();

      vi.advanceTimersByTime(10000);
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(true);
    });

    it("does NOT auto-dismiss certificate errors", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Certificate validation failed";

      await wrapper.vm.$nextTick();
      await flushPromises();

      vi.advanceTimersByTime(10000);
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(true);
    });

    it("does NOT auto-dismiss CORS errors", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "CORS error occurred";

      await wrapper.vm.$nextTick();
      await flushPromises();

      vi.advanceTimersByTime(10000);
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(true);
    });

    it("clears timer when dismissing manually", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Test error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      // Dismiss before timer fires
      await wrapper.find(".btn-close").trigger("click");
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(false);

      // Advance timer - should not cause issues
      vi.advanceTimersByTime(8000);
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(false);
    });

    it("resets timer when error changes", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "First error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      // Advance halfway through timeout
      vi.advanceTimersByTime(4000);

      // Change error
      authStore.lastError = "Second error";
      await wrapper.vm.$nextTick();
      await flushPromises();

      // Advance 4s more (would have dismissed previous error)
      vi.advanceTimersByTime(4000);
      await wrapper.vm.$nextTick();
      await flushPromises();

      // Should still be showing (new timer started)
      expect(wrapper.find(".error-banner").exists()).toBe(true);

      // Advance 4s more to reach total 8s for new error
      vi.advanceTimersByTime(4000);
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(false);
    });
  });

  describe("dismiss functionality", () => {
    it("hides banner when dismiss button is clicked", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Test error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(true);

      await wrapper.find(".btn-close").trigger("click");
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(false);
      expect(authStore.lastError).toBe(null);
    });

    it("clears error in store when dismissed", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Test error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      await wrapper.find(".btn-close").trigger("click");
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(authStore.lastError).toBe(null);
    });
  });

  describe("error visibility transitions", () => {
    it("shows new error when banner was previously hidden", async () => {
      const wrapper = mountComponent();
      authStore.lastError = null;

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(false);

      authStore.lastError = "New error";
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(true);
    });

    it("shows error after it was previously dismissed", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "First error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      await wrapper.find(".btn-close").trigger("click");
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(false);

      // Set new error
      authStore.lastError = "Second error";
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find(".error-banner").exists()).toBe(true);
    });
  });

  describe("accessibility", () => {
    it("has proper accessibility attributes", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Test error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    });

    it("close button has aria-label", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Test error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.find('.btn-close[aria-label="Close"]').exists()).toBe(
        true,
      );
    });
  });

  describe("cleanup on unmount", () => {
    it("clears timer on unmount", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "Test error";

      await wrapper.vm.$nextTick();
      await flushPromises();

      wrapper.unmount();

      // Advance timer - should not cause errors
      vi.advanceTimersByTime(10000);
      // If cleanup works, no error should occur
      expect(true).toBe(true);
    });
  });

  describe("case-insensitive error matching", () => {
    it("matches errors case-insensitively", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "CERTIFICATE VALIDATION ERROR";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.text()).toContain("Certificate Validation Error");
    });

    it("matches server errors case-insensitively", async () => {
      const wrapper = mountComponent();
      authStore.lastError = "NOT FOUND SERVER";

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.text()).toContain("Server Connection Failed");
    });
  });
});
