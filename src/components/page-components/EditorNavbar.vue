<script setup lang="ts">
import { computed, toRefs, onMounted, ref, watch, nextTick } from "vue";
import { useConfigStore } from "@/stores/configStore";
import { useHaStore } from "../../stores/haStore";
import { useNormalizeIcon } from "../../composables/useNormalizeIcon";
import { useDarkMode } from "../../composables/useDarkMode";
import { useVisualEditorToolbar } from "../../composables/useVisualEditorToolbar";
import { createLogger } from "../../utils/logger";
import EditorToggleButton from "./EditorToggleButton.vue";

const logger = createLogger("EditorNavbar");
onMounted(() => {
  logger.log("[MOUNTED] EditorNavbar is rendering");
});

const props = defineProps({
  currentView: {
    type: String,
    required: true,
  },
  darkMode: {
    type: Boolean,
    required: true,
  },
  previousView: {
    type: String,
    default: "overview",
  },
});

const { currentView, darkMode, previousView } = toRefs(props);

const emit = defineEmits(["update:current-view", "update:darkMode"]);

const store = useHaStore();
const normalizeIcon = useNormalizeIcon();
const { toggleDarkMode: handleToggleDarkMode } = useDarkMode();
const { hasChanges, isSaving, saveStatus, triggerSave } =
  useVisualEditorToolbar();
const showRawEntityView = (window as any).__appCapabilities?.rawEntityView ?? true;
const showLocalDataSave = (window as any).__appCapabilities?.localDataSave ?? true;
// Import/Export is enabled by the native build; default to false in source
const configImportExport = (window as any).__appCapabilities?.configImportExport ?? false;
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Import/Export modal state
const showImportExport = ref(false);
const importErrors = ref<string[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const importInProgress = ref(false);
const importSuccess = ref<string | null>(null);
const modalDialogRef = ref<HTMLElement | null>(null);

const configStore = useConfigStore();

import { validateConfig } from "@/utils/configValidator";

const handleExport = async () => {
  try {
    const config = store.dashboardConfig;
    const json = JSON.stringify(config, null, 2);
    const now = new Date();
    const ts = now
      .toISOString()
      .replace(/[:T]/g, "-")
      .replace(/\.\d+Z$/, "");
    const filename = `dashboard-${ts}.json`;

    // If a native export hook is injected at runtime, call it. Otherwise trigger download.
    const nativeExport = (window as any).__nativeExport;
    if (typeof nativeExport === "function") {
      try {
        await nativeExport({ filename, content: json });
        showImportExport.value = false;
        return;
      } catch (e) {
        console.warn("Native export hook failed, falling back to download", e);
      }
    }

    // Web fallback: trigger download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showImportExport.value = false;
  } catch (e) {
    console.error("Export failed", e);
  }
};

const handleImportClick = async () => {
  importErrors.value = [];
  importSuccess.value = null;

  // Confirm overwrite/back up
  const doImport = window.confirm(
    "Importing a configuration will overwrite the current dashboard. Continue? (A local backup will be created automatically)"
  );
  if (!doImport) return;

  // create a local backup (best-effort)
  try {
    const backupKey = `dashboard-config-backup-${Date.now()}`;
    const current = JSON.stringify(store.dashboardConfig || {});
    localStorage.setItem(backupKey, current);
    console.log("Created local backup", backupKey);
  } catch (e) {
    console.warn("Failed to create local backup before import", e);
  }

  // If a native import hook is injected at runtime, call it. Otherwise open file input.
  const nativeImport = (window as any).__nativeImport;
  if (typeof nativeImport === "function") {
    importInProgress.value = true;
    try {
      const res = await nativeImport({});
      // Native import expected to write file; reload config
      const validation = await configStore.loadDashboardConfig();
      if (validation.valid) {
        importSuccess.value = "Imported configuration successfully";
        setTimeout(() => { showImportExport.value = false; importSuccess.value = null; }, 900);
      } else {
        importErrors.value = validation.errors.map((e) => String(e.message || e));
      }
    } catch (err) {
      importErrors.value = [String(err) || "Native import failed"];
    } finally {
      importInProgress.value = false;
    }
    return;
  }

  // Web fallback: open hidden file input
  if (fileInputRef.value) fileInputRef.value.value = "";
  if (fileInputRef.value) fileInputRef.value.click();
};

const handleFileSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input || !input.files || input.files.length === 0) return;
  const file = input.files[0];
  try {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      importErrors.value = ["Invalid JSON file"];
      return;
    }
    const validation = validateConfig(parsed);
    if (!validation.valid) {
      importErrors.value = validation.errors.map((e) => String(e.message || e));
      return;
    }

    // Backup current config to localStorage (best-effort)
    try {
      const backupKey = `dashboard-config-backup-${Date.now()}`;
      const current = JSON.stringify(store.dashboardConfig || {});
      localStorage.setItem(backupKey, current);
      console.log("Created local backup", backupKey);
    } catch (bkErr) {
      console.warn("Failed to create local backup", bkErr);
    }

    // Save via existing store flow (native saver used when available)
    try {
      await store.saveDashboardConfig(parsed);
      showImportExport.value = false;
    } catch (saveErr) {
      importErrors.value = [String(saveErr)];
    }
  } catch (err) {
    importErrors.value = [String(err)];
  }
};

const menuItems = computed(() => {
  const items = [
    {
      name: "device",
      label: "DevicesView",
      icon: normalizeIcon("mdi-devices") || "mdi mdi-devices",
    },
  ];

  // Insert Import/Export menu item after Devices if enabled by runtime
  if (configImportExport) {
    items.push({
      name: "import-export",
      label: "Import/Export",
      icon: normalizeIcon("mdi-file-import") || "mdi mdi-file-import",
    });
  }

  // Optionally show RawEntityView based on platform capability flag
  if (showRawEntityView) {
    items.push({
      name: "raw",
      label: "RawEntityView",
      icon: normalizeIcon("mdi-database") || "mdi mdi-database",
    });
  }

  return items;
});

const handleMenuClick = (item: { name: string }) => {
  if (item.name === "import-export") {
    showImportExport.value = true;
    return;
  }
  // default behaviour: switch view
  emit("update:current-view", item.name);
};

// Focus modal dialog when opened so it's interactive and add Escape handler
watch(showImportExport, async (val) => {
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") {
      showImportExport.value = false;
    }
  };

  if (val) {
    await nextTick();
    try {
      if (modalDialogRef.value) {
        modalDialogRef.value.setAttribute("tabindex", "-1");
        (modalDialogRef.value as HTMLElement).focus();
      }
    } catch (e) {
      // ignore
    }
    document.addEventListener("keydown", onKeyDown);
  } else {
    document.removeEventListener("keydown", onKeyDown);
  }
});

const toggleDarkMode = () => {
  handleToggleDarkMode(darkMode.value, (key, value) => emit(key, value));
};

const handleEditorToggle = () => {
  // Toggle between editor and the previous view
  logger.log("[EditorNavbar] handleEditorToggle CALLED with currentView.value =", currentView.value);
  const nextView = currentView.value === "editor" ? previousView.value : "editor";
  logger.log("[EditorNavbar] About to emit update:current-view with nextView =", nextView);
  emit("update:current-view", nextView);
};
</script>

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
  <header class="sticky-top bg-body shadow-sm editor-navbar">
    <nav
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
              class="btn btn-link nav-link text-decoration-none d-flex align-items-center px-2"
              :class="{ 'active fw-bold': currentView === 'editor' }"
              :aria-current="currentView === 'editor' ? 'page' : undefined"
              title="Editor"
              role="tab"
              @click="handleEditorToggle"
            >
              <i
                :class="`${normalizeIcon('mdi-pencil-ruler')} me-1 nav-icon`"
              ></i>
              <span class="d-none d-lg-inline">Editor</span>
            </button>
            <button
              v-for="item in menuItems"
              :key="item.name"
              class="btn btn-link nav-link text-decoration-none d-flex align-items-center px-2"
              :class="{ 'active fw-bold': currentView === item.name }"
              :aria-current="currentView === item.name ? 'page' : undefined"
              :title="item.label"
              role="tab"
              @click="handleMenuClick(item)"
            >
              <i :class="`${item.icon} me-1 nav-icon`"></i>
              <span class="d-none d-lg-inline">{{ item.label }}</span>
            </button>
          </div>
          <div class="d-flex align-items-center">
            <div
              v-if="saveStatus"
              class="badge me-2"
              :class="
                saveStatus.includes('Error')
                  ? 'bg-danger text-white'
                  : saveStatus.includes('Saved')
                    ? 'bg-success text-white'
                    : 'bg-info text-white'
              "
            >
              {{ saveStatus }}
            </div>

            <button
              class="btn btn-success btn-sm me-2"
              :disabled="!hasChanges || isSaving"
              title="Save config to backend"
              @click="triggerSave"
            >
              <i
                :class="
                  isSaving ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-content-save'
                "
              ></i>
              <span class="d-none d-lg-inline ms-1">
                {{ isSaving ? "Saving..." : "Save config" }}
              </span>
            </button>

            <button
              v-if="store.developerMode && showLocalDataSave && isLocalhost"
              class="btn btn-outline-info btn-sm me-2"
              title="Save current data for local testing"
              @click="store.saveLocalData()"
            >
              <i class="mdi mdi-content-save-outline"></i>
              <span class="d-none d-lg-inline ms-1">Save local data</span>
            </button>

            <!-- Import / Export is now in the left menu; no duplicate button -->

            <!-- Editor Toggle Button (Developer Mode Toggle + Editor Control) -->
            <EditorToggleButton
              :is-editor-open="currentView === 'editor'"
              @open-editor="handleEditorToggle"
              @close-editor="handleEditorToggle"
            />

            <button
              :class="[
                'btn',
                'btn-sm',
                'me-2',
                darkMode
                  ? 'btn-outline-light text-light'
                  : 'btn-outline-dark text-dark',
              ]"
              :aria-pressed="darkMode"
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
          </div>
        </div>
      </div>
    </nav>
  </header>
  <!-- Import / Export Modal -->
  <div v-if="showImportExport" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" style="z-index:2000;">
    <div class="modal-backdrop fade show" style="z-index:1990"></div>
    <div ref="modalDialogRef" class="modal-dialog modal-dialog-centered" role="document" style="z-index:2001; outline: none;" tabindex="-1">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Import / Export Configuration</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="showImportExport = false"></button>
        </div>
        <div class="modal-body">
          <p class="mb-2">You can export the current dashboard configuration or import a previously exported JSON file.</p>

          <div v-if="importErrors.length" class="alert alert-danger">
            <strong>Import errors:</strong>
            <ul>
              <li v-for="(err, idx) in importErrors" :key="idx">{{ err }}</li>
            </ul>
          </div>

          <div v-if="importSuccess" class="alert alert-success">
            {{ importSuccess }}
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary" @click="handleExport">Export configuration</button>
            <button class="btn btn-outline-secondary" @click="handleImportClick" :disabled="importInProgress">
              <span v-if="importInProgress" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Import configuration
            </button>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="application/json"
            style="display:none"
            @change="handleFileSelected"
          />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showImportExport = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-navbar {
  position: sticky;
  top: env(safe-area-inset-top, 0);
  border-bottom: 2px solid var(--bs-warning);
  background-clip: padding-box;
}

.nav-link.active {
  color: var(--bs-primary) !important;
}
</style>
