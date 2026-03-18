<template>
  <div class="view-manager p-3 border-bottom">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center">
        <button
          class="btn btn-link btn-sm p-0 text-decoration-none me-2"
          :class="{ 'text-muted': !isExpanded }"
          title="Toggle Views panel"
          @click="isExpanded = !isExpanded"
        >
          <i
            :class="`mdi ${isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'}`"
          ></i>
        </button>
        <h6 class="mb-0">Views</h6>
      </div>
      <button
        v-if="isExpanded"
        class="btn btn-sm btn-primary"
        title="Add new view"
        @click="showNewViewDialog"
      >
        <i class="mdi mdi-plus me-1"></i>
        Add
      </button>
    </div>

    <!-- Views List -->
    <div
      v-if="isExpanded"
      class="views-list"
      style="max-height: 300px; overflow-y: auto"
    >
      <div
        v-for="view in views"
        :key="view.name"
        class="view-item d-flex align-items-center justify-content-between p-2 mb-2 border rounded"
        :class="{ 'bg-light border-primary': isSelected(view.name) }"
      >
        <div
          class="d-flex align-items-center flex-grow-1"
          style="cursor: pointer"
          role="button"
          tabindex="0"
          @click="selectView(view.name)"
          @keydown.enter="selectView(view.name)"
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
        </div>
        <div class="btn-group btn-group-sm" role="group">
          <button
            class="btn btn-outline-secondary"
            title="Edit view properties"
            @click="editView(view)"
          >
            <i class="mdi mdi-pencil"></i>
          </button>
          <button
            class="btn btn-outline-secondary"
            title="Duplicate view"
            @click="duplicateView(view)"
          >
            <i class="mdi mdi-content-duplicate"></i>
          </button>
          <button
            v-if="views.length > 1"
            class="btn btn-outline-danger"
            title="Delete view"
            @click="confirmDeleteView(view)"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
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
import { ref, computed } from "vue";
import { useHaStore } from "../../stores/haStore";
import IconPicker from "./PropertyEditors/IconPicker.vue";

const emit = defineEmits([
  "view-created",
  "view-deleted",
  "view-updated",
  "view-selected",
]);

const props = defineProps({
  selectedViewName: {
    type: String,
    default: "",
  },
});

const store = useHaStore();

const isExpanded = ref(true);
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const editingView = ref(null);
const viewToDelete = ref(null);
const nameError = ref("");

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

const isSelected = (viewName) => {
  return viewName === props.selectedViewName;
};

const selectView = (viewName) => {
  emit("view-selected", viewName);
};

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
