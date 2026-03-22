<template>
  <div>
    <!-- Bug Icon Button (in navbar) -->
    <button
      class="btn btn-sm btn-outline-secondary ms-2"
      :title="
        store.developerMode
          ? 'Click to disable Developer Mode'
          : hasPassword
            ? 'Click to enable Developer Mode (password required)'
            : 'Click to enable Developer Mode'
      "
      @click="handleClick"
    >
      <i class="mdi mdi-bug"></i>
    </button>

    <!-- Password Modal (only shown when enabling) -->
    <div
      v-if="showModal && !store.developerMode"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Enable Developer Mode</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="closeModal"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Enter Developer Password</label>
              <input
                ref="passwordInput"
                v-model="password"
                type="password"
                class="form-control"
                placeholder="Password"
                autocomplete="off"
                @keyup.enter="toggleMode"
              />
            </div>

            <div v-if="error" class="alert alert-danger mb-0">
              <i class="mdi mdi-alert-circle me-2"></i>
              {{ error }}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!password"
              @click="toggleMode"
            >
              <i class="mdi mdi-shield-lock me-2"></i>
              Enable Developer Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";

const store = useAuthStore();
const configStore = useConfigStore();
const passwordInput = ref<HTMLInputElement | null>(null);

const hasPassword = computed(() => {
  const appConfig = (configStore.dashboardConfig as Record<string, unknown>)
    ?.app as Record<string, unknown> | undefined;
  return !!(appConfig?.password && String(appConfig.password).trim() !== "");
});
const showModal = ref(false);
const password = ref("");
const error = ref("");

const handleClick = () => {
  if (store.developerMode) {
    // Disable developer mode directly (no password needed)
    toggleMode();
  } else if (hasPassword.value) {
    // Password is configured — show the modal
    showModal.value = true;
    nextTick(() => passwordInput.value?.focus());
  } else {
    // No password configured — enter developer mode freely
    toggleMode();
  }
};

const toggleMode = () => {
  const success = store.toggleDeveloperMode(password.value);
  if (success) {
    // Close modal on success
    closeModal();
  } else {
    // Show error message
    error.value = "Invalid password";
    password.value = "";
  }
};

const closeModal = () => {
  showModal.value = false;
  password.value = "";
  error.value = "";
};
</script>

<style scoped>
.modal {
  z-index: 9999;
}
</style>
