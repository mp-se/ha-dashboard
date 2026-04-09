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
  <Transition name="fade">
    <div
      v-if="visible && lastError"
      class="error-banner alert m-0 p-3 border-0"
      :class="`alert-${alertType}`"
      role="alert"
    >
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-2">
            <i :class="`mdi ${iconClass}`"></i>
            <strong>{{ errorTitle }}</strong>
          </div>
          <div class="small" style="line-height: 1.5">
            {{ lastError }}
          </div>
        </div>
        <button
          class="btn-close"
          type="button"
          aria-label="Close"
          @click="dismiss"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const visible = ref(true);
let dismissTimer = null;

// Reference to current error
const lastError = computed(() => authStore.lastError);

// Categorize error type from message
const errorType = computed(() => {
  const error = authStore.lastError?.toLowerCase() || "";
  if (error.includes("not found") || error.includes("cannot connect")) {
    return "server-not-found";
  }
  if (
    error.includes("certificate") ||
    error.includes("untrusted") ||
    error.includes("ssl")
  ) {
    return "certificate";
  }
  if (error.includes("cors") || error.includes("cross-origin") || error.includes("failed to fetch")) {
    return "cors";
  }
  if (error.includes("authentication") || error.includes("invalid")) {
    return "auth";
  }
  return "generic";
});

const alertType = computed(() => {
  switch (errorType.value) {
    case "server-not-found":
    case "certificate":
    case "cors":
      return "danger";
    case "auth":
      return "warning";
    default:
      return "danger";
  }
});

const iconClass = computed(() => {
  switch (errorType.value) {
    case "server-not-found":
      return "mdi-server-off";
    case "certificate":
      return "mdi-lock-alert";
    case "cors":
      return "mdi-shield-alert";
    case "auth":
      return "mdi-alert-circle";
    default:
      return "mdi-alert";
  }
});

const errorTitle = computed(() => {
  switch (errorType.value) {
    case "server-not-found":
      return "Server Connection Failed";
    case "certificate":
      return "Certificate Validation Error";
    case "cors":
      return "CORS/Security Error";
    case "auth":
      return "Authentication Error";
    default:
      return "Connection Error";
  }
});

// Show banner when error changes
watch(
  () => authStore.lastError,
  (newError) => {
    if (newError) {
      visible.value = true;
      // Clear existing timer
      if (dismissTimer) clearTimeout(dismissTimer);
      // Auto-dismiss after 8 seconds for non-critical errors only
      // Keep critical errors visible: server failures, cert errors, CORS/network errors
      if (
        errorType.value !== "server-not-found" &&
        errorType.value !== "certificate" &&
        errorType.value !== "cors"
      ) {
        dismissTimer = setTimeout(() => {
          dismiss();
        }, 8000);
      }
    }
  },
);

const dismiss = () => {
  visible.value = false;
  authStore.clearError();
  if (dismissTimer) clearTimeout(dismissTimer);
};

onBeforeUnmount(() => {
  if (dismissTimer) clearTimeout(dismissTimer);
});
</script>

<style scoped>
.error-banner {
  position: relative;
  margin-left: 0;
  margin-right: 0;
  border-radius: 0;
  background-color: rgba(220, 53, 69, 0.1);
  backdrop-filter: blur(2px);
}

.alert-danger {
  background-color: rgba(220, 53, 69, 0.1) !important;
  border-top: 3px solid #dc3545;
  color: var(--bs-body-color);
}

.alert-warning {
  background-color: rgba(255, 193, 7, 0.1) !important;
  border-top: 3px solid #ffc107;
  color: var(--bs-body-color);
}

.btn-close {
  background-color: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0.5rem;
}

.btn-close:hover {
  opacity: 1;
}

/* Light mode */
[data-bs-theme="light"] .error-banner {
  background-color: rgba(220, 53, 69, 0.08);
}

[data-bs-theme="light"] .alert-danger {
  background-color: rgba(220, 53, 69, 0.08) !important;
}

[data-bs-theme="light"] .alert-warning {
  background-color: rgba(255, 193, 7, 0.08) !important;
}

/* Dark mode */
[data-bs-theme="dark"] .error-banner {
  background-color: rgba(220, 53, 69, 0.15);
}

[data-bs-theme="dark"] .alert-danger {
  background-color: rgba(220, 53, 69, 0.15) !important;
}

[data-bs-theme="dark"] .alert-warning {
  background-color: rgba(255, 193, 7, 0.15) !important;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
