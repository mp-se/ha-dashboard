<template>
  <header class="sticky-top bg-body shadow-sm">
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
              @click="$emit('update:currentView', item.name)"
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

            <!-- Reload config button (dev mode only) -->
            <button
              v-if="store.developerMode"
              class="btn btn-outline-secondary btn-sm me-2"
              :disabled="configReloading"
              title="Reload dashboard configuration"
              @click="handleReloadConfig"
            >
              <i v-if="!configReloading" class="mdi mdi-refresh"></i>
              <span
                v-if="configReloading"
                class="spinner-border spinner-border-sm"
                role="status"
              >
                <span class="visually-hidden">Loading...</span>
              </span>
            </button>

            <!-- Save data button (dev mode only) -->
            <button
              v-if="store.developerMode"
              class="btn btn-outline-info btn-sm me-2"
              title="Save current data for local testing"
              @click="store.saveLocalData()"
            >
              <i class="mdi mdi-content-save"></i>
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

            <!-- Developer Mode Toggle -->
            <DeveloperModeToggle />

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
import { ref, computed, onMounted, watch } from "vue";
import { useHaStore } from "@/stores/haStore";
import { useNormalizeIcon } from "@/composables/useNormalizeIcon";
import PwaInstallModal from "./PwaInstallModal.vue";
import DeveloperModeToggle from "./DeveloperModeToggle.vue";

const props = defineProps({
  /** The currently active view name */
  currentView: { type: String, required: true },
  /** Current dark mode state */
  darkMode: { type: Boolean, required: true },
});

const emit = defineEmits([
  "update:currentView",
  "update:darkMode",
  "edit-credentials",
]);

const store = useHaStore();
const pwaInstallModal = ref(null);
const updateAvailable = ref(false);
const configReloading = ref(false);
const configErrorBanner = ref(false);
const configErrorBannerTimeout = ref(null);

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
  const normalizeIcon = useNormalizeIcon();
  const filtered = store.dashboardConfig.views
    .filter((view) => view.hidden !== true)
    .map((view) => ({
      name: view.name,
      label: view.label,
      icon: normalizeIcon(view.icon),
    }));

  if (store.developerMode) {
    filtered.push(
      {
        name: "editor",
        label: "Editor",
        icon: normalizeIcon("mdi-pencil-ruler"),
      },
      { name: "dev", label: "Dev", icon: normalizeIcon("mdi-tools") },
      { name: "device", label: "Devices", icon: normalizeIcon("mdi-devices") },
      { name: "raw", label: "Raw", icon: normalizeIcon("mdi-code-json") },
    );
  }
  return filtered;
});

const openPwaDialog = () => {
  try {
    pwaInstallModal.value?.showModal();
  } catch {
    // Ignore — showModal may not be available during SSR
  }
};

/** Reload dashboard configuration in-memory */
const handleReloadConfig = async () => {
  configReloading.value = true;
  configErrorBanner.value = false;

  try {
    const validationResult = await store.reloadConfig();
    configErrorBanner.value = true;
    if (configErrorBannerTimeout.value)
      clearTimeout(configErrorBannerTimeout.value);
    if (validationResult.valid) {
      // Auto-dismiss on success
      configErrorBannerTimeout.value = setTimeout(() => {
        configErrorBanner.value = false;
      }, 2000);
    }
  } catch {
    configErrorBanner.value = true;
    if (configErrorBannerTimeout.value)
      clearTimeout(configErrorBannerTimeout.value);
  } finally {
    configReloading.value = false;
  }
};

/** Toggle dark mode and notify parent via v-model */
const toggleDarkMode = () => {
  const newValue = !props.darkMode;
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
