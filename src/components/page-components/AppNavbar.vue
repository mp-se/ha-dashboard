<template>
  <header class="sticky-top bg-body shadow-sm app-navbar">
    <nav
      v-if="!store.isLoading"
      :class="[
        'navbar',
        'navbar-expand-lg',
        darkMode ? 'navbar-dark bg-dark' : 'navbar-light bg-light',
      ]"
    >
      <div class="container-fluid">
        <div class="navbar-nav flex-row w-100">
          <div class="d-flex flex-grow-1">
            <button
              v-for="item in menuItems"
              :key="item.name"
              class="btn btn-link nav-link text-decoration-none d-flex align-items-center px-2"
              :class="{ 'active fw-bold': currentView === item.name }"
              :aria-current="currentView === item.name ? 'page' : undefined"
              :title="item.label"
              role="tab"
              @click="$emit('update:current-view', item.name)"
            >
              <i :class="`${item.icon} me-1 nav-icon`"></i>
              <span class="d-none d-lg-inline">{{ item.label }}</span>
            </button>
            <PwaInstallModal ref="pwaInstallModal" />
          </div>
          <div class="d-flex align-items-center">
            <!-- Connection and mode indicators -->
            <span
              v-if="store.isLocalMode"
              class="badge bg-warning text-dark me-2 d-none d-lg-inline"
              title="Local Mode: using public/local-data.json"
              >Local Mode</span
            >
            <i
              v-if="store.isLocalMode"
              class="mdi mdi-record me-2 text-warning d-lg-none"
              title="Local Mode: using public/local-data.json"
            ></i>
            <span
              v-else-if="store.isConnected"
              class="badge bg-success text-light me-2 d-none d-lg-inline"
              title="Connected to Home Assistant"
              >Connected</span
            >
            <i
              v-if="store.isConnected"
              class="mdi mdi-record me-2 text-success d-lg-none"
              title="Connected to Home Assistant"
            ></i>
            <span
              v-else
              class="badge bg-danger text-light me-2 d-none d-lg-inline"
              title="Not connected to Home Assistant"
              >Disconnected</span
            >
            <i
              v-if="!store.isConnected && !store.isLocalMode"
              class="mdi mdi-record me-2 text-danger d-lg-none"
              title="Not connected to Home Assistant"
            ></i>

            <button
              class="btn btn-outline-secondary btn-sm me-2"
              title="Open visual editor"
              @click="openEditor"
            >
              <i :class="normalizeIcon('mdi-pencil-ruler')"></i>
            </button>

            <!-- Edit credentials button (only if set manually, not from config) -->
            <button
              v-if="
                store.haUrl && store.accessToken && !store.credentialsFromConfig
              "
              class="btn btn-outline-secondary btn-sm me-2"
              title="Edit Home Assistant credentials"
              @click="$emit('edit-credentials')"
            >
              <i class="mdi mdi-pencil"></i>
            </button>

            <button
              :class="[
                'btn',
                'btn-sm',
                darkMode
                  ? 'btn-outline-light text-light'
                  : 'btn-outline-dark text-dark',
              ]"
              :aria-pressed="String(darkMode)"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
              @click="toggleDarkMode"
            >
              <i
                :class="
                  darkMode
                    ? 'mdi mdi-white-balance-sunny'
                    : 'mdi mdi-moon-waning-crescent'
                "
              ></i>
            </button>

            <!-- Manual open for PWA install dialog -->
            <button
              v-if="!isPwaInstalled() && isPwaSupported()"
              class="btn btn-sm btn-outline-primary ms-2"
              title="Show PWA install dialog"
              @click="openPwaDialog"
            >
              <i class="mdi mdi-phone-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div
      v-if="showEditorPasswordModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Open Visual Editor</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="closeEditorPasswordModal"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Enter Developer Password</label>
              <input
                ref="editorPasswordInput"
                v-model="editorPassword"
                type="password"
                class="form-control"
                placeholder="Password"
                autocomplete="off"
                @keyup.enter="confirmEditorAccess"
              />
            </div>

            <div v-if="editorPasswordError" class="alert alert-danger mb-0">
              <i class="mdi mdi-alert-circle me-2"></i>
              {{ editorPasswordError }}
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeEditorPasswordModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!editorPassword"
              @click="confirmEditorAccess"
            >
              <i class="mdi mdi-shield-lock me-2"></i>
              Open Visual Editor
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection status alert -->
    <div v-if="!store.isLocalMode">
      <div
        v-if="!store.isConnected && store.lastError"
        class="alert alert-danger m-0 p-2 text-truncate"
        role="alert"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div class="me-2 small text-truncate">
            {{ store.lastError }}
          </div>
          <div>
            <button
              class="btn btn-sm btn-danger me-2"
              title="Retry connection"
              @click="store.retryConnection()"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
      <div
        v-else-if="!store.isConnected && store.isInitialized"
        class="alert alert-warning m-0 p-2"
        role="alert"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div class="me-2 small">
            Disconnected from Home Assistant — live data will not update.
          </div>
          <div>
            <button
              class="btn btn-sm btn-warning"
              title="Retry connection"
              @click="store.retryConnection()"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
      <div
        v-else-if="!store.isConnected && store.isLoading"
        class="alert alert-info m-0 p-2"
        role="alert"
      >
        <div class="small">Connecting to Home Assistant…</div>
      </div>
    </div>

    <!-- Update available banner -->
    <div
      v-if="updateAvailable"
      class="alert alert-success m-0 p-2"
      role="alert"
    >
      <div class="d-flex justify-content-between align-items-center">
        <div class="me-2 small">A new version of the app is available!</div>
        <div>
          <button
            class="btn btn-sm btn-success"
            title="Refresh to update"
            @click="refreshApp"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Configuration error banner -->
    <div
      v-if="configErrorBanner"
      :class="[
        'alert',
        'm-0',
        'p-3',
        store.configValidationError?.length > 0
          ? 'alert-danger'
          : 'alert-success',
      ]"
      role="alert"
    >
      <div
        v-if="store.configValidationError?.length > 0"
        class="d-flex flex-column gap-2"
      >
        <div class="fw-bold">
          Configuration error: {{ store.configErrorCount }} issue(s) found
        </div>
        <div class="small" style="max-height: 200px; overflow-y: auto">
          <div
            v-for="(error, idx) in store.configValidationError"
            :key="idx"
            class="mb-1"
          >
            <span
              v-if="error.line && error.line > 0"
              class="badge bg-danger me-2"
            >
              Line {{ error.line }}
            </span>
            <span>{{ error.message || error }}</span>
          </div>
        </div>
      </div>
      <div v-else class="d-flex justify-content-between align-items-center">
        <div class="me-2 small">Configuration reloaded successfully.</div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch, toRefs, nextTick } from "vue";
import { useHaStore } from "@/stores/haStore";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useNormalizeIcon } from "@/composables/useNormalizeIcon";
import { createLogger } from "@/utils/logger";
import PwaInstallModal from "./PwaInstallModal.vue";

const logger = createLogger("AppNavbar");

const props = defineProps({
  /** The currently active view name */
  currentView: { type: String, required: true },
  /** Current dark mode state */
  darkMode: { type: Boolean, required: true },
});

const { currentView, darkMode } = toRefs(props);

onMounted(() => {
  logger.log("[MOUNTED] AppNavbar is rendering");
});

const emit = defineEmits([
  "update:current-view",
  "update:darkMode",
  "edit-credentials",
]);

const store = useHaStore();
const authStore = useAuthStore();
const configStore = useConfigStore();
const normalizeIcon = useNormalizeIcon();
const pwaInstallModal = ref(null);
const editorPasswordInput = ref(null);
const updateAvailable = ref(false);
const configErrorBanner = ref(false);
const showEditorPasswordModal = ref(false);
const editorPassword = ref("");
const editorPasswordError = ref("");

// Show config error banner automatically whenever validation errors change
watch(
  () => store.configValidationError,
  (errors) => {
    if (errors?.length > 0) {
      configErrorBanner.value = true;
    }
  },
  { immediate: true },
);

/** Computed menu items derived from dashboard config */
const menuItems = computed(() => {
  if (!store.dashboardConfig?.views) return [];

  // Show all views
  return store.dashboardConfig.views
    .filter((view) => view.hidden !== true)
    .map((view) => ({
      name: view.name,
      label: view.label,
      icon: normalizeIcon(view.icon),
    }));
});

const hasDeveloperPassword = computed(() => {
  const appConfig = configStore.dashboardConfig?.app;
  return !!(appConfig?.password && String(appConfig.password).trim() !== "");
});

const closeEditorPasswordModal = () => {
  showEditorPasswordModal.value = false;
  editorPassword.value = "";
  editorPasswordError.value = "";
};

const enterEditorMode = () => {
  emit("update:current-view", "editor");
};

const confirmEditorAccess = () => {
  const success = authStore.toggleDeveloperMode(editorPassword.value);

  if (!success) {
    editorPasswordError.value = "Invalid password";
    editorPassword.value = "";
    nextTick(() => editorPasswordInput.value?.focus());
    return;
  }

  closeEditorPasswordModal();
  enterEditorMode();
};

const openEditor = () => {
  if (authStore.developerMode) {
    enterEditorMode();
    return;
  }

  if (hasDeveloperPassword.value) {
    showEditorPasswordModal.value = true;
    nextTick(() => editorPasswordInput.value?.focus());
    return;
  }

  authStore.toggleDeveloperMode("");
  enterEditorMode();
};

const openPwaDialog = () => {
  try {
    pwaInstallModal.value?.showModal();
  } catch {
    // Ignore — showModal may not be available during SSR
  }
};

/** Toggle dark mode and notify parent via v-model */
const toggleDarkMode = () => {
  const newValue = !darkMode.value;
  const root = document.documentElement;
  root.setAttribute("data-bs-theme", newValue ? "dark" : "light");
  root.style.colorScheme = newValue ? "dark" : "light";
  localStorage.setItem("ha-dashboard-dark-mode", String(newValue));
  // Remove iOS focus state after click
  const btn = document.querySelector('[aria-label="Toggle dark mode"]');
  if (btn) {
    btn.blur();
    btn.style.outline = "none";
    btn.style.boxShadow = "none";
    btn.style.backgroundColor = "transparent";
  }
  emit("update:darkMode", newValue);
};

const refreshApp = () => window.location.reload();

const isPwaInstalled = () => {
  try {
    if (typeof window === "undefined") return false;
    return (
      window.navigator?.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  } catch {
    return false;
  }
};

const isPwaSupported = () => {
  try {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    return (
      "serviceWorker" in navigator && ("beforeinstallprompt" in window || isIos)
    );
  } catch {
    return false;
  }
};

onMounted(() => {
  window.addEventListener("sw-need-refresh", () => {
    updateAvailable.value = true;
  });
});
</script>

<style scoped>
.app-navbar {
  position: sticky;
  top: env(safe-area-inset-top, 0);
  background-clip: padding-box;
}
</style>
