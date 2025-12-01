<template>
  <nav
    v-if="!store.isLoading"
    :class="[
      'navbar',
      'navbar-expand-lg',
      dark_mode ? 'navbar-dark bg-dark' : 'navbar-light bg-light',
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
            @click="currentView = item.name"
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
            <span v-if="configReloading" class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </span>
          </button>

          <!-- Save data button (dev mode only) -->
          <button
            v-if="store.developerMode"
            class="btn btn-outline-info btn-sm me-2"
            title="Save current data for local testing"
            @click="saveLocalData"
          >
            <i class="mdi mdi-content-save"></i>
          </button>

          <!-- Retry button moved to alert below to avoid duplication -->

          <!-- Edit credentials button (only if set manually, not from config) -->
          <button
            v-if="store.haUrl && store.accessToken && !store.credentialsFromConfig"
            class="btn btn-outline-secondary btn-sm me-2"
            title="Edit Home Assistant credentials"
            @click="handleEditCredentials"
          >
            <i class="mdi mdi-pencil"></i>
          </button>

          <button
            :class="[
              'btn',
              'btn-sm',
              dark_mode ? 'btn-outline-light text-light' : 'btn-outline-dark text-dark',
            ]"
            :aria-pressed="String(dark_mode)"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
            @click="toggleDarkMode"
          >
            <i
              :class="dark_mode ? 'mdi mdi-white-balance-sunny' : 'mdi mdi-moon-waning-crescent'"
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
        <div class="me-2 small">Disconnected from Home Assistant — live data will not update.</div>
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
  <div v-if="updateAvailable" class="alert alert-success m-0 p-2" role="alert">
    <div class="d-flex justify-content-between align-items-center">
      <div class="me-2 small">A new version of the app is available!</div>
      <div>
        <button class="btn btn-sm btn-success" title="Refresh to update" @click="refreshApp">
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
      store.configValidationError?.length > 0 ? 'alert-danger' : 'alert-success',
    ]"
    role="alert"
  >
    <div v-if="store.configValidationError?.length > 0" class="d-flex flex-column gap-2">
      <div class="fw-bold">Configuration error: {{ store.configErrorCount }} issue(s) found</div>
      <div class="small" style="max-height: 200px; overflow-y: auto">
        <div v-for="(error, idx) in store.configValidationError" :key="idx" class="mb-1">
          <span v-if="error.line && error.line > 0" class="badge bg-danger me-2">
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

  <!-- Loading Modal -->
  <div
    v-if="store.isLoading"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-body text-center p-4">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <h5>Loading Home Assistant Data</h5>
          <p class="text-muted mb-0">
            Please wait while we connect to your Home Assistant instance...
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Credential Dialog - only show when NOT loading and credentials are needed -->
  <CredentialDialog v-if="!store.isLoading && store.needsCredentials" ref="credentialDialog" @credentials="handleCredentialSubmit" />

  <div v-if="!store.isLoading" class="container-fluid" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- Dynamic View Rendering from Config -->
    <component :is="getViewComponent(currentView)" :key="currentView" :view-name="currentView" />

    <footer
      :class="[
        'text-center',
        'py-3',
        'text-muted',
        'mt-4',
        dark_mode ? 'bg-dark' : 'bg-light',
      ]"
    >
      <div class="small">(c) 2025 Magnus Persson, v{{ appVersion }}</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useHaStore } from './stores/haStore';
import { useNormalizeIcon } from './composables/useNormalizeIcon';
import PwaInstallModal from './components/PwaInstallModal.vue';
import CredentialDialog from './components/CredentialDialog.vue';

// Import version from package.json
import packageJson from '../package.json';

// Static imports for development views
import DevelopmentView from './views/DevelopmentView.vue';
import RawEntityView from './views/RawEntityView.vue';
import DevicesView from './views/DevicesView.vue';

// Generic config-driven view component
import JsonConfigView from './views/JsonConfigView.vue';

// Static development view components
const devViewComponents = {
  device: DevicesView,
  dev: DevelopmentView,
  raw: RawEntityView,
};

const store = useHaStore();
const currentView = ref('overview');
const dark_mode = ref(false);
const updateAvailable = ref(false);
const configReloading = ref(false);
const configErrorBanner = ref(false);
const configErrorBannerTimeout = ref(null);
const appVersion = packageJson.version;

// Computed menu items from dashboard config
const menuItems = computed(() => {
  if (!store.dashboardConfig?.views) {
    console.log('No views found in dashboardConfig');
    return [];
  }
  const normalizeIcon = useNormalizeIcon();
  const filtered = store.dashboardConfig.views
    .filter((view) => view.enabled !== false)
    .map((view) => ({
      name: view.name,
      label: view.label,
      icon: normalizeIcon(view.icon),
    }));
  
  // Add dev views if developer mode is enabled
  if (store.developerMode) {
    filtered.push(
      { name: 'dev', label: 'Dev', icon: normalizeIcon('mdi-tools') },
      { name: 'device', label: 'Devices', icon: normalizeIcon('mdi-devices') },
      { name: 'raw', label: 'Raw', icon: normalizeIcon('mdi-code-json') }
    );
  }
  
  console.log('Menu items computed. Total views:', store.dashboardConfig.views.length, 'Filtered:', filtered.length, 'Developer mode:', store.developerMode, 'Items:', filtered);
  return filtered;
});

/**
 * Get the view component for the given view name
 * Static dev views are checked first, otherwise renders JsonConfigView
 */
const getViewComponent = (viewName) => {
  // Check static dev views first
  if (devViewComponents[viewName]) {
    return devViewComponents[viewName];
  }
  // All other views use the generic JsonConfigView component
  return JsonConfigView;
};

// Swipe gesture handling
let touchStartX = 0;
let touchEndX = 0;

const handleSwipe = () => {
  const swipeThreshold = 50; // minimum distance for swipe
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) < swipeThreshold) return;

  const currentIndex = menuItems.value.findIndex((item) => item.name === currentView.value);
  if (currentIndex === -1) return;

  if (diff > 0) {
    // Swiped left - go to next view
    const nextIndex = (currentIndex + 1) % menuItems.value.length;
    currentView.value = menuItems.value[nextIndex].name;
  } else {
    // Swiped right - go to previous view
    const prevIndex = (currentIndex - 1 + menuItems.value.length) % menuItems.value.length;
    currentView.value = menuItems.value[prevIndex].name;
  }
};

const onTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX;
};

const onTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
};

// Reference to the PWA modal so we can programmatically open it
const pwaInstallModal = ref(null);
const openPwaDialog = () => {
  try {
    pwaInstallModal.value?.showModal();
  } catch (e) {
    // Ignore errors; showModal may not be present during SSR or if the component was removed
    console.warn('Failed to open PWA dialog:', e);
  }
};

// Reference to credential dialog
const credentialDialog = ref(null);

/**
 * Handle credential submission from dialog
 */
const handleCredentialSubmit = async (credentials) => {
  console.log('Credentials submitted:', credentials.haUrl);
  store.saveCredentials(credentials.haUrl, credentials.accessToken);
  // Resume initialization after credentials are provided
  await store.init();
};

/**
 * Reload dashboard configuration in-memory
 */
const handleReloadConfig = async () => {
  configReloading.value = true;
  configErrorBanner.value = false;

  try {
    const validationResult = await store.reloadConfig();

    if (!validationResult.valid) {
      configErrorBanner.value = true;
      // Don't auto-dismiss error banner - keep it visible so user has time to fix issues
      if (configErrorBannerTimeout.value) clearTimeout(configErrorBannerTimeout.value);
    } else {
      // Show success briefly then auto-dismiss on success
      configErrorBanner.value = true;
      if (configErrorBannerTimeout.value) clearTimeout(configErrorBannerTimeout.value);
      configErrorBannerTimeout.value = setTimeout(() => {
        configErrorBanner.value = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Error reloading config:', error);
    configErrorBanner.value = true;
    // Don't auto-dismiss error banner - keep it visible so user has time to fix issues
    if (configErrorBannerTimeout.value) clearTimeout(configErrorBannerTimeout.value);
  } finally {
    configReloading.value = false;
  }
};

const toggleDarkMode = () => {
  dark_mode.value = !dark_mode.value;
  const root = document.documentElement;
  if (dark_mode.value) {
    root.setAttribute('data-bs-theme', 'dark');
  } else {
    root.setAttribute('data-bs-theme', 'light');
  }
};

const handleEditCredentials = () => {
  // Show credential dialog in edit mode
  credentialDialog.value?.showModal();
};

const saveLocalData = () => {
  store.saveLocalData();
};

const refreshApp = () => {
  window.location.reload();
};

const isPwaInstalled = () => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.navigator?.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  } catch (e) {
    return false;
  }
};

const isPwaSupported = () => {
  try {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    return 'serviceWorker' in navigator && ('beforeinstallprompt' in window || isIos);
  } catch (e) {
    return false;
  }
};

onMounted(async () => {
  console.log('App.vue onMounted called');

  // Listen for service worker update
  window.addEventListener('sw-need-refresh', () => {
    updateAvailable.value = true;
  });

  // Initialize the Home Assistant store
  await store.init();

  // Show config errors if any were found during init
  if (store.configValidationError?.length > 0) {
    console.log('Config validation errors detected during init:', store.configValidationError);
    configErrorBanner.value = true;
    // Don't auto-dismiss - keep visible so user can fix issues
    // Don't show credentials dialog if there are config errors (e.g., JSON syntax error)
  } else if (store.needsCredentials) {
    // Only show credentials dialog if config is valid and credentials are needed
    credentialDialog.value?.showModal();
  }

  // Start with dark_mode OFF explicitly
  dark_mode.value = false;
  const root = document.documentElement;
  root.setAttribute('data-bs-theme', 'light');
});

// Watch for credentials being needed and auto-show dialog
watch(
  () => store.needsCredentials,
  (needsCredentials) => {
    // Don't show credentials dialog if there are config errors
    if (needsCredentials && !store.isLoading && !store.configValidationError?.length) {
      console.log('Credentials needed - auto-showing dialog');
      // Use nextTick to ensure dialog is mounted
      setTimeout(() => {
        credentialDialog.value?.showModal();
      }, 0);
    }
  }
);

</script>

<style>
.navbar-icon {
  font-size: 1.2rem;
}

.nav-icon {
  font-size: 1.5rem; /* larger on small screens */
  line-height: 1;
}

@media (min-width: 992px) {
  .nav-icon {
    font-size: 1.1rem; /* slightly smaller on large screens to match label layout */
  }
}

/* Cards use default Bootstrap styling */
.card {
  background-color: transparent !important;
  border: 2px solid rgba(222, 226, 230, 0.6) !important;
  transition: all 0.2s ease !important;
}

/* Control cards - more prominent, interactive */
.card-control {
  border: 2px solid rgba(0, 123, 255, 0.3) !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 123, 255, 0.1) !important;
}

.card-control:hover {
  border-color: rgba(0, 123, 255, 0.6) !important;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 6px 16px rgba(0, 123, 255, 0.15) !important;
  transform: translateY(-2px);
}

.card-control.card-active {
  border-color: #28a745 !important;
  background: linear-gradient(
    135deg,
    rgba(200, 255, 200, 0.15) 0%,
    rgba(200, 255, 200, 0.05) 100%
  ) !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(40, 167, 69, 0.15) !important;
}

/* Display cards - subtle */
.card-display {
  border: 1px solid rgba(222, 226, 230, 0.4) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

.card-display:hover {
  border-color: rgba(222, 226, 230, 0.6) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
}

/* Status cards - prominent alert styling */
.card-status {
  border: 2px solid rgba(255, 193, 7, 0.5) !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(255, 193, 7, 0.1) !important;
}

.card-status.error {
  border-color: rgba(220, 53, 69, 0.5) !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(220, 53, 69, 0.1) !important;
}

/* Dark mode variants */
[data-bs-theme='dark'] .card-control {
  border-color: rgba(0, 123, 255, 0.4) !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 4px 12px rgba(0, 123, 255, 0.15) !important;
}

[data-bs-theme='dark'] .card-control:hover {
  border-color: rgba(0, 123, 255, 0.7) !important;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 6px 16px rgba(0, 123, 255, 0.2) !important;
}

[data-bs-theme='dark'] .card-control.card-active {
  border-color: #28a745 !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 4px 12px rgba(40, 167, 69, 0.15) !important;
}

[data-bs-theme='dark'] .card-display {
  border-color: rgba(73, 80, 87, 0.3) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
}

[data-bs-theme='dark'] .card-display:hover {
  border-color: rgba(73, 80, 87, 0.5) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
}

[data-bs-theme='dark'] .card-status {
  border-color: rgba(255, 193, 7, 0.5) !important;
  background: linear-gradient(
    135deg,
    rgba(255, 193, 7, 0.2) 0%,
    rgba(255, 193, 7, 0.08) 100%
  ) !important;
}

[data-bs-theme='dark'] .card-status.error {
  border-color: rgba(220, 53, 69, 0.5) !important;
  background: linear-gradient(
    135deg,
    rgba(220, 53, 69, 0.2) 0%,
    rgba(220, 53, 69, 0.08) 100%
  ) !important;
}

/* Unavailable cards - desaturated appearance */
.card.border-warning {
  opacity: 0.7 !important;
  border: 2px dashed rgba(255, 193, 7, 0.5) !important;
}

.card.border-warning .card-body {
  opacity: 0.75;
}

.card.border-warning input,
.card.border-warning select,
.card.border-warning button:not(.btn-outline-secondary) {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.card.border-warning .card-title {
  color: #6c757d !important;
}

[data-bs-theme='dark'] .card.border-warning {
  border-color: rgba(255, 193, 7, 0.3) !important;
}
</style>
