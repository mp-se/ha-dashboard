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
  <div class="view-manager p-3">
    <!-- Header -->
    <div class="d-flex align-items-center mb-3">
      <h6 class="mb-0">Views</h6>
    </div>

    <!-- Views List -->
    <div class="views-list">
      <div
        v-for="(view, index) in views"
        :key="view.name"
        class="view-item d-flex align-items-center p-2 mb-2 border rounded"
        :class="{ 'bg-light border-primary': isIndexSelected(index) }"
        style="cursor: pointer"
        role="button"
        tabindex="0"
        @click="selectViewByIndex(index, view.name)"
        @keydown.enter="selectViewByIndex(index, view.name)"
      >
        <i :class="`mdi ${view.icon} me-2`"></i>
        <div class="flex-grow-1">
          <div class="small">{{ view.label }}</div>
          <div class="text-muted" style="font-size: 0.75rem">
            {{ view.name }}
          </div>
        </div>
        <span
          v-if="view.hidden"
          class="badge bg-secondary me-2"
          title="This view is hidden"
          >Hidden</span
        >
        <i
          v-if="isIndexSelected(index)"
          class="mdi mdi-check text-primary"
        />
      </div>

      <p v-if="views.length === 0" class="text-muted small mb-0">
        No views found. Create one to get started!
      </p>
    </div>

    <!-- New/Edit View Modal -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingView ? "Edit View" : "Create New View" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="viewLabel" class="form-label">Label</label>
              <input
                id="viewLabel"
                v-model="formData.label"
                type="text"
                class="form-control"
                placeholder="View name"
              />
            </div>

            <div class="mb-3">
              <label for="viewName" class="form-label">Name (ID)</label>
              <input
                id="viewName"
                v-model="formData.name"
                type="text"
                class="form-control"
                placeholder="view-name"
                :disabled="editingView"
                @blur="validateName"
              />
              <small v-if="nameError" class="text-danger">{{
                nameError
              }}</small>
              <small class="text-muted d-block mt-1"
                >Lowercase letters, numbers, and hyphens only</small
              >
            </div>

            <div class="mb-3">
              <IconPicker
                :model-value="formData.icon"
                label="Icon"
                help="Select an MDI icon for the view"
                @update:model-value="formData.icon = $event"
              />
            </div>

            <div class="mb-3 form-check">
              <input
                id="viewHidden"
                v-model="formData.hidden"
                type="checkbox"
                class="form-check-input"
              />
              <label for="viewHidden" class="form-check-label">
                Hide this view from navigation
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!isFormValid"
              @click="saveView"
            >
              {{ editingView ? "Update" : "Create" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Delete View?</h5>
            <button
              type="button"
              class="btn-close"
              @click="showDeleteConfirm = false"
            ></button>
          </div>
          <div class="modal-body">
            <p>
              Are you sure you want to delete the view
              <strong>{{ viewToDelete?.label }}</strong
              >? This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="deleteView">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useHaStore } from "../../stores/haStore";
import IconPicker from "./PropertyEditors/IconPicker.vue";
import { useVisualEditorToolbar } from "../../composables/useVisualEditorToolbar";

const emit = defineEmits([
  "view-created",
  "view-deleted",
  "view-updated",
  "view-selected",
  "view-index-selected",
]);

const props = defineProps({
  selectedViewName: {
    type: String,
    default: "",
  },
});

const store = useHaStore();

const showModal = ref(false);
const showDeleteConfirm = ref(false);
const editingView = ref(null);
const viewToDelete = ref(null);
const nameError = ref("");
const localSelectedIndex = ref(null);

const formData = ref({
  name: "",
  label: "",
  icon: "mdi-home-outline",
  hidden: false,
});

const views = computed(() => {
  return store.dashboardConfig?.views ?? [];
});

const isFormValid = computed(() => {
  return (
    formData.value.label.trim() &&
    formData.value.name.trim() &&
    formData.value.icon.trim() &&
    !nameError.value
  );
});

const isIndexSelected = (index) => index === localSelectedIndex.value;

const selectViewByIndex = (index, viewName) => {
  if (localSelectedIndex.value === index) {
    // Toggle off
    localSelectedIndex.value = null;
    emit("view-index-selected", null);
  } else {
    localSelectedIndex.value = index;
    emit("view-index-selected", index);
    emit("view-selected", viewName);
  }
};

// Keep localSelectedIndex in sync with parent-controlled selectedViewName
watch(
  () => [props.selectedViewName, views.value],
  ([name, currentViews]) => {
    if (!name) {
      localSelectedIndex.value = null;
      return;
    }
    const idx = currentViews.findIndex((v) => v.name === name);
    localSelectedIndex.value = idx !== -1 ? idx : null;
  },
  { immediate: true }
);

const validateName = () => {
  const name = formData.value.name.trim();
  nameError.value = "";

  if (!name) {
    nameError.value = "Name is required";
    return;
  }

  // Check if name is valid format
  if (!/^[a-z0-9-]+$/.test(name)) {
    nameError.value =
      "Name must contain only lowercase letters, numbers, and hyphens";
    return;
  }

  // Check if name already exists (unless editing)
  if (!editingView.value) {
    const exists = views.value.some((v) => v.name === name);
    if (exists) {
      nameError.value = "A view with this name already exists";
    }
  }
};

const showNewViewDialog = () => {
  editingView.value = null;
  formData.value = {
    name: "",
    label: "",
    icon: "mdi-home-outline",
    hidden: false,
  };
  nameError.value = "";
  showModal.value = true;
};

const editView = (view) => {
  editingView.value = view;
  formData.value = {
    name: view.name,
    label: view.label,
    icon: view.icon || "mdi-home-outline",
    hidden: view.hidden || false,
  };
  nameError.value = "";
  showModal.value = true;
};

const duplicateView = (view) => {
  // Generate a new unique name
  let newName = `${view.name}-copy`;
  let counter = 1;
  while (views.value.some((v) => v.name === newName)) {
    newName = `${view.name}-copy-${counter}`;
    counter++;
  }

  const newView = {
    ...view,
    name: newName,
    label: `${view.label} (Copy)`,
    entities: JSON.parse(JSON.stringify(view.entities || [])), // Deep copy
  };

  store.addView(newView);
  emit("view-created", newView);
};

const confirmDeleteView = (view) => {
  viewToDelete.value = view;
  showDeleteConfirm.value = true;
};

// Inform toolbar when a modal is open so floating toolbar can hide
const { setDialogOpen } = useVisualEditorToolbar();

watch(showModal, (val) => {
  setDialogOpen(Boolean(val || showDeleteConfirm.value));
});

watch(showDeleteConfirm, (val) => {
  setDialogOpen(Boolean(val || showModal.value));
});

const deleteView = () => {
  if (viewToDelete.value) {
    store.deleteView(viewToDelete.value.name);
    emit("view-deleted", viewToDelete.value);
    showDeleteConfirm.value = false;
    viewToDelete.value = null;
  }
};

const closeModal = () => {
  showModal.value = false;
  editingView.value = null;
};

const moveView = (view, direction) => {
  const viewsArr = store.dashboardConfig?.views;
  if (!viewsArr) return;
  const index = viewsArr.indexOf(view);
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= viewsArr.length) return;
  const moved = viewsArr.splice(index, 1)[0];
  viewsArr.splice(newIndex, 0, moved);
  store.dashboardConfig.views = [...viewsArr];
  emit('view-updated', view);
};

const saveView = () => {
  validateName();
  if (!isFormValid.value) return;

  if (editingView.value) {
    // Update existing view
    store.updateView(editingView.value.name, {
      label: formData.value.label,
      icon: formData.value.icon,
      hidden: formData.value.hidden,
    });
    emit("view-updated", formData.value);
  } else {
    // Create new view
    const newView = {
      name: formData.value.name,
      label: formData.value.label,
      icon: formData.value.icon,
      hidden: formData.value.hidden,
      entities: [],
    };
    store.addView(newView);
    emit("view-created", newView);
  }

  closeModal();
};

// --- Exposed methods called by VisualEditorView floating toolbar ---
const triggerAdd = () => showNewViewDialog();
const triggerEdit = (idx) => { const v = views.value[idx ?? localSelectedIndex.value]; if (v) editView(v); };
const triggerDuplicate = (idx) => { const v = views.value[idx ?? localSelectedIndex.value]; if (v) duplicateView(v); };
const triggerDelete = (idx) => { const v = views.value[idx ?? localSelectedIndex.value]; if (v) confirmDeleteView(v); };
const triggerMoveUp = (idx) => { const v = views.value[idx ?? localSelectedIndex.value]; if (v) { moveView(v, -1); if (localSelectedIndex.value !== null) { localSelectedIndex.value = localSelectedIndex.value - 1; emit("view-index-selected", localSelectedIndex.value); } } };
const triggerMoveDown = (idx) => { const v = views.value[idx ?? localSelectedIndex.value]; if (v) { moveView(v, 1); if (localSelectedIndex.value !== null) { localSelectedIndex.value = localSelectedIndex.value + 1; emit("view-index-selected", localSelectedIndex.value); } } };
const triggerDeselect = () => { localSelectedIndex.value = null; emit("view-index-selected", null); };

defineExpose({
  triggerAdd,
  triggerEdit,
  triggerDelete,
  triggerDuplicate,
  triggerMoveUp,
  triggerMoveDown,
  triggerDeselect,
  localSelectedIndex,
  viewCount: computed(() => views.value.length),
});
</script>

<style scoped>
.view-manager {
  background-color: var(--bs-light);
}

.views-list {
  max-height: 300px;
  overflow-y: auto;
}

.view-item {
  transition: all 0.2s ease;
}

.view-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.view-item.bg-light {
  background-color: var(--bs-light) !important;
}

.btn-group-sm {
  display: flex;
  gap: 2px;
}
</style>
