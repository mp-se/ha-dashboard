<script setup lang="ts">
import { computed, toRefs, onMounted } from "vue";
import { useHaStore } from "../../stores/haStore";
import { useNormalizeIcon } from "../../composables/useNormalizeIcon";
import { useVisualEditorToolbar } from "../../composables/useVisualEditorToolbar";
import { createLogger } from "../../utils/logger";
import DeveloperModeToggle from "./DeveloperModeToggle.vue";

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
const { hasChanges, isSaving, saveStatus, triggerSave } =
  useVisualEditorToolbar();

const menuItems = computed(() => {
  return [
    {
      name: "device",
      label: "DevicesView",
      icon: normalizeIcon("mdi-devices") || "mdi mdi-devices",
    },
    {
      name: "raw",
      label: "RawEntityView",
      icon: normalizeIcon("mdi-database") || "mdi mdi-database",
    },
  ];
});

const toggleDarkMode = () => {
  emit("update:darkMode", !darkMode.value);
};

const handleEditorToggle = () => {
  // Toggle between editor and the previous view
  logger.log("[EditorNavbar] handleEditorToggle CALLED with currentView.value =", currentView.value);
  const nextView = currentView.value === "editor" ? previousView.value : "editor";
  logger.log("[EditorNavbar] About to emit update:current-view with nextView =", nextView);
  emit("update:current-view", nextView);
};
</script>

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
              @click="$emit('update:current-view', item.name)"
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
              title="Save changes to backend"
              @click="triggerSave"
            >
              <i
                :class="
                  isSaving ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-content-save'
                "
              ></i>
              <span class="d-none d-lg-inline ms-1">
                {{ isSaving ? "Saving..." : "Save" }}
              </span>
            </button>

            <button
              v-if="store.developerMode"
              class="btn btn-outline-info btn-sm me-2"
              title="Save current data for local testing"
              @click="store.saveLocalData()"
            >
              <i class="mdi mdi-content-save"></i>
            </button>

            <button
              :class="[
                'btn',
                'btn-sm',
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

            <!-- Developer Mode Toggle -->
            <DeveloperModeToggle />
          </div>
        </div>
      </div>
    </nav>
  </header>
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
