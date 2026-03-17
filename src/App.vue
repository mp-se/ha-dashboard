<template>
  <AppNavbar
    v-model:current-view="currentView"
    v-model:dark-mode="dark_mode"
    @edit-credentials="handleEditCredentials"
  />

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
  <CredentialDialog
    v-if="!store.isLoading && store.needsCredentials"
    ref="credentialDialog"
    @credentials="handleCredentialSubmit"
  />

  <div
    v-if="!store.isLoading"
    class="container-fluid"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Dynamic View Rendering from Config -->
    <ErrorBoundary
      :view-name="currentView"
      @error="handleComponentError"
      @retry="handleErrorRetry"
      @go-home="handleGoHome"
    >
      <component
        :is="getViewComponent(currentView)"
        :key="currentView"
        :view-name="currentView"
      />
    </ErrorBoundary>

    <footer
      :class="[
        'text-center',
        'py-3',
        'text-muted',
        'mt-4',
        dark_mode ? 'bg-dark' : 'bg-light',
      ]"
    >
      <div class="small">(c) 2026 Magnus Persson, v{{ appVersion }}</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { useHaStore } from "./stores/haStore";
import { createLogger } from "./utils/logger";
import { SWIPE_MIN_DISTANCE } from "./utils/constants";
import AppNavbar from "./components/AppNavbar.vue";
import CredentialDialog from "./components/CredentialDialog.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
import JsonConfigView from "./views/JsonConfigView.vue";

import packageJson from "../package.json";

// Lazy-loaded development views for better performance
const devViewComponents = {
  device: defineAsyncComponent(() => import("./views/DevicesView.vue")),
  dev: defineAsyncComponent(() => import("./views/DevelopmentView.vue")),
  raw: defineAsyncComponent(() => import("./views/RawEntityView.vue")),
  editor: defineAsyncComponent(() => import("./views/VisualEditorView.vue")),
};

const logger = createLogger("App");
const store = useHaStore();
const currentView = ref("overview");
const dark_mode = ref(false);
const credentialDialog = ref(null);
const appVersion = packageJson.version;

/**
 * Ordered list of navigable view names, used for swipe gesture navigation.
 * Mirrors the menu logic in AppNavbar so swipe respects hidden/dev flags.
 */
const viewNames = computed(() => {
  const views =
    store.dashboardConfig?.views
      ?.filter((v) => v.hidden !== true)
      .map((v) => v.name) ?? [];
  if (store.developerMode) views.push("dev", "device", "raw");
  return views;
});

/**
 * Returns the view component for the given view name.
 * Dev views are checked first; everything else uses JsonConfigView.
 */
const getViewComponent = (viewName) =>
  devViewComponents[viewName] ?? JsonConfigView;

// Swipe gesture handling
let touchStartX = 0;
let touchEndX = 0;

const handleSwipe = () => {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) < SWIPE_MIN_DISTANCE) return;

  const currentIndex = viewNames.value.indexOf(currentView.value);
  if (currentIndex === -1) return;

  if (diff > 0) {
    currentView.value =
      viewNames.value[(currentIndex + 1) % viewNames.value.length];
  } else {
    currentView.value =
      viewNames.value[
        (currentIndex - 1 + viewNames.value.length) % viewNames.value.length
      ];
  }
};

const onTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX;
};

const onTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
};

/**
 * Handle credential submission from the dialog.
 * Saves credentials then re-runs initialization.
 */
const handleCredentialSubmit = async (credentials) => {
  store.saveCredentials(credentials.haUrl, credentials.accessToken);
  await store.init();
};

const handleEditCredentials = () => {
  credentialDialog.value?.showModal();
};

/**
 * Handle component errors caught by ErrorBoundary
 */
const handleComponentError = (errorData) => {
  logger.error("Component error in view:", errorData.viewName, errorData.error);
};

/**
 * Retry loading the component after an error
 */
const handleErrorRetry = () => {
  // Force re-render by changing key
  const current = currentView.value;
  currentView.value = "";
  setTimeout(() => {
    currentView.value = current;
  }, 0);
};

/**
 * Navigate to overview after an error
 */
const handleGoHome = () => {
  currentView.value = "overview";
};

onMounted(async () => {
  await store.init();

  // Show credentials dialog if config is valid but credentials are missing
  if (!store.configValidationError?.length && store.needsCredentials) {
    credentialDialog.value?.showModal();
  }

  // Initialize dark mode from localStorage or system preference
  const root = document.documentElement;
  const savedDarkMode = localStorage.getItem("ha-dashboard-dark-mode");
  dark_mode.value =
    savedDarkMode !== null
      ? savedDarkMode === "true"
      : (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false);

  root.setAttribute("data-bs-theme", dark_mode.value ? "dark" : "light");
  root.style.colorScheme = dark_mode.value ? "dark" : "light";
});

// Auto-show credentials dialog when credentials become needed at runtime
watch(
  () => store.needsCredentials,
  (needsCredentials) => {
    if (
      needsCredentials &&
      !store.isLoading &&
      !store.configValidationError?.length
    ) {
      setTimeout(() => credentialDialog.value?.showModal(), 0);
    }
  },
);
</script>

<style>
/* Shared styles imported globally - NOT scoped
 * Using scoped styles would prevent these styles from applying to child components
 * that need to use the shared classes (ha-control-button, ha-control-circle, etc.)
 */
@import "/styles/shared-styles.css";
</style>
