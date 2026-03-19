<template>
  <div>
    <!-- Bug Icon Button (in navbar) -->
    <button
      class="btn btn-sm btn-outline-secondary ms-2"
      title="Toggle Developer Mode (password required)"
      @click="showModal = true"
    >
      <i class="mdi mdi-bug"></i>
    </button>

    <!-- Password Modal -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Developer Mode</h5>
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
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!password"
              @click="toggleMode"
            >
              <i class="mdi mdi-shield-lock me-2"></i>
              Toggle Developer Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";

const store = useAuthStore();
const showModal = ref(false);
const password = ref("");
const error = ref("");

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
