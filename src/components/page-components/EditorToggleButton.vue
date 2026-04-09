<!--
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<template>
  <div>
    <!-- Developer Mode Toggle / Editor Access Button -->
    <button
      class="btn btn-sm btn-outline-secondary me-2"
      :title="buttonTitle"
      @click="handleClick"
    >
      <i :class="buttonIcon"></i>
    </button>

    <!-- Password Modal (only shown when enabling developer mode or opening editor) -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ modalTitle }}</h5>
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
                @keyup.enter="confirmAccess"
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
              @click="confirmAccess"
            >
              <i class="mdi mdi-shield-lock me-2"></i>
              {{ modalButtonText }}
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
import { useNormalizeIcon } from "@/composables/useNormalizeIcon";
import { createLogger } from "@/utils/logger";

const logger = createLogger("EditorToggleButton");

const props = defineProps({
  /** Is editor currently open */
  isEditorOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits([
  "open-editor", // Request to open editor
  "close-editor", // Request to close editor
]);

const authStore = useAuthStore();
const configStore = useConfigStore();
const normalizeIcon = useNormalizeIcon();

const passwordInput = ref<HTMLInputElement | null>(null);
const showModal = ref(false);
const password = ref("");
const error = ref("");
const modalAction = ref<"dev-mode" | "open-editor">("dev-mode"); // Track what action triggered the modal

const hasDeveloperPassword = computed(() => {
  const appConfig = (configStore.dashboardConfig as Record<string, unknown>)
    ?.app as Record<string, unknown> | undefined;
  return !!(appConfig?.password && String(appConfig.password).trim() !== "");
});

/**
 * Button icon: bug icon when dev mode OFF, pencil-ruler when ON
 */
const buttonIcon = computed(() => {
  if (authStore.developerMode) {
    return normalizeIcon("mdi-pencil-ruler") || "mdi mdi-pencil-ruler";
  }
  return "mdi mdi-bug";
});

/**
 * Button title based on current state
 */
const buttonTitle = computed(() => {
  if (authStore.developerMode) {
    return props.isEditorOpen ? "Close visual editor" : "Open visual editor";
  }
  return hasDeveloperPassword.value
    ? "Enable Developer Mode (password required)"
    : "Enable Developer Mode";
});

/**
 * Modal title based on what action triggered it
 */
const modalTitle = computed(() => {
  return modalAction.value === "open-editor"
    ? "Open Visual Editor"
    : "Enable Developer Mode";
});

/**
 * Modal button text based on action
 */
const modalButtonText = computed(() => {
  return modalAction.value === "open-editor"
    ? "Open Visual Editor"
    : "Enable Developer Mode";
});

/**
 * Handle button click
 * - If dev mode OFF: toggle dev mode (with password if required)
 * - If dev mode ON: toggle editor open/close
 */
const handleClick = () => {
  if (authStore.developerMode) {
    // Already in dev mode - just toggle editor
    if (props.isEditorOpen) {
      logger.log("[EditorToggleButton] Closing editor");
      emit("close-editor");
    } else {
      logger.log("[EditorToggleButton] Opening editor");
      emit("open-editor");
    }
    return;
  }

  // Not in dev mode - need to enable it first
  if (hasDeveloperPassword.value) {
    // Password required - show modal
    modalAction.value = "dev-mode";
    showModal.value = true;
    nextTick(() => passwordInput.value?.focus());
  } else {
    // No password - enable dev mode directly and open editor
    authStore.toggleDeveloperMode("");
    logger.log("[EditorToggleButton] Enabled dev mode without password");
    emit("open-editor");
  }
};

/**
 * Confirm password and enable developer mode or open editor
 */
const confirmAccess = () => {
  const success = authStore.toggleDeveloperMode(password.value);

  if (!success) {
    error.value = "Invalid password";
    password.value = "";
    nextTick(() => passwordInput.value?.focus());
    return;
  }

  logger.log(
    `[EditorToggleButton] Developer mode enabled with password, action: ${modalAction.value}`
  );
  closeModal();

  // After dev mode is enabled, open the editor
  emit("open-editor");
};

/**
 * Close the password modal
 */
const closeModal = () => {
  showModal.value = false;
  password.value = "";
  error.value = "";
  modalAction.value = "dev-mode";
};
</script>

<style scoped>
.modal {
  z-index: 9999;
}
</style>
