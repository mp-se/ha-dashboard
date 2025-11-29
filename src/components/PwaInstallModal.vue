<template>
  <div v-if="shouldShow">
    <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.6)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i v-if="showInstallButton" class="mdi mdi-phone-plus me-2"></i>
              <i v-else class="mdi mdi-apple me-2"></i>
              <span>{{ showInstallButton ? 'Install app' : 'Install on iPhone/iPad' }}</span>
            </h5>
            <button type="button" class="btn-close" aria-label="Close" @click="dismiss"></button>
          </div>
          <div class="modal-body">
            <div v-if="showInstallButton">
              <p>Add this dashboard to your device for a fullscreen experience and quick access.</p>
              <div v-if="!deferredPrompt" class="alert alert-warning mt-2">
                <small
                  >Programmatic installation is not available in this browser. Please use your
                  browser's menu or settings to install the app manually.</small
                >
              </div>
            </div>
            <div v-else>
              <p>
                To install on iPhone / iPad: Tap the <strong>Share</strong> button in Safari and
                choose <strong>Add to Home Screen</strong>.
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button
              v-if="showInstallButton && !isInstalled && deferredPrompt"
              type="button"
              class="btn btn-primary"
              :title="'Install'"
              @click="promptInstall"
            >
              Install
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="dismiss">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useHaStore } from '@/stores/haStore';

const store = useHaStore();
const showInstallButton = ref(false);
const showIosInstructions = ref(false);
const deferredPrompt = ref(null);
const isInstalled = ref(false);
const dismissed = ref(false);
const manualOpen = ref(false);

const LOCAL_STORAGE_KEY = 'hassio_dashboard_pwa_prompt_dismissed';

const isIos = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isInStandaloneMode = () => {
  return (
    window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  );
};

const dismiss = () => {
  dismissed.value = true;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  } catch (e) {
    // Ignored intentionally - localStorage write is non-critical
    console.warn('Failed to write localStorage key for PWA prompt:', e);
  }
  showInstallButton.value = false;
  showIosInstructions.value = false;
  manualOpen.value = false;
};

const promptInstall = async () => {
  console.log('[PWA] promptInstall called; deferredPrompt?', !!deferredPrompt.value);
  if (!deferredPrompt.value) {
    console.warn('[PWA] No deferred prompt available - cannot programmatically trigger install.');
    return;
  }
  try {
    deferredPrompt.value.prompt();
    const choice = await deferredPrompt.value.userChoice;
    if (choice.outcome === 'accepted') {
      isInstalled.value = true;
    }
  } catch (e) {
    console.warn('PWA prompt failed', e);
  } finally {
    deferredPrompt.value = null;
    showInstallButton.value = false;
    manualOpen.value = false;
  }
};

const onBeforeInstallPrompt = (e) => {
  e.preventDefault();
  // log the event for debugging
  console.log('[PWA] beforeinstallprompt event fired', e);
  deferredPrompt.value = e;
  showInstallButton.value = true;
  // For debugging: log if this modal is currently mounted and whether we will show the button
  if (import.meta.env.DEV)
    console.log('[PWA] beforeinstallprompt: will show install button', showInstallButton.value);
};

const onAppInstalled = () => {
  isInstalled.value = true;
  // hide install UI when app installation is detected
  showInstallButton.value = false;
  showIosInstructions.value = false;
  manualOpen.value = false;
  console.log('[PWA] appinstalled event fired');
};

onMounted(() => {
  try {
    dismissed.value = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
  } catch (e) {
    dismissed.value = false;
  }

  if (isInStandaloneMode()) {
    isInstalled.value = true;
    return;
  }

  if (store.isLocalMode) return;

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
  if (import.meta.env.DEV)
    console.log(
      '[PWA] listeners attached, dismissed:',
      dismissed.value,
      'isInstalled:',
      isInstalled.value
    );

  if (isIos() && !isInstalled.value && !dismissed.value) {
    setTimeout(() => {
      if (!isInStandaloneMode() && !dismissed.value) {
        showIosInstructions.value = true;
      }
    }, 1500);
  }
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.removeEventListener('appinstalled', onAppInstalled);
  if (import.meta.env.DEV) console.log('[PWA] listeners removed');
});

// If manualOpen is set this runtime-only override allows the user to re-open the modal even
// if they've previously dismissed it in localStorage.
const shouldShow = computed(() => {
  if (isInstalled.value) return false;
  if (store.isLocalMode) return false;
  if (manualOpen.value) return showInstallButton.value || showIosInstructions.value;
  if (dismissed.value) return false;
  return showInstallButton.value || showIosInstructions.value;
});

// Programmatic API for parent components to re-open the prompt on demand. This will temporarily
// override the dismissed flag at runtime and show the modal (not persisted).
const showModal = () => {
  if (isInstalled.value || store.isLocalMode) return;
  manualOpen.value = true;
  try {
    // If a deferred prompt is available we can show the install button, otherwise show iOS instructions (or try showing button)
    if (deferredPrompt.value) {
      showInstallButton.value = true;
    } else if (isIos()) {
      showIosInstructions.value = true;
    } else {
      // Fallback: show install button even if beforeinstallprompt hasn't fired; in some browsers this still allows user to find installation options
      showInstallButton.value = true;
    }
  } catch (e) {
    console.warn('Failed to open PWA modal programmatically:', e);
  }
};

defineExpose({ showModal });
</script>

<style scoped>
.modal {
  z-index: 1200;
}
.modal-backdrop.show {
  z-index: 1199;
}
</style>
