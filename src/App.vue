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
    <component
      :is="getViewComponent(currentView)"
      :key="currentView"
      :view-name="currentView"
    />

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
import { ref, computed, onMounted, watch } from "vue";
import { useHaStore } from "./stores/haStore";
import AppNavbar from "./components/AppNavbar.vue";
import CredentialDialog from "./components/CredentialDialog.vue";

// Static imports for development views
import DevelopmentView from "./views/DevelopmentView.vue";
import RawEntityView from "./views/RawEntityView.vue";
import DevicesView from "./views/DevicesView.vue";
import JsonConfigView from "./views/JsonConfigView.vue";

import packageJson from "../package.json";

const devViewComponents = {
  device: DevicesView,
  dev: DevelopmentView,
  raw: RawEntityView,
};

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
  if (Math.abs(diff) < 50) return;

  const currentIndex = viewNames.value.indexOf(currentView.value);
  if (currentIndex === -1) return;

  if (diff > 0) {
    currentView.value = viewNames.value[(currentIndex + 1) % viewNames.value.length];
  } else {
    currentView.value =
      viewNames.value[(currentIndex - 1 + viewNames.value.length) % viewNames.value.length];
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
    if (needsCredentials && !store.isLoading && !store.configValidationError?.length) {
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
