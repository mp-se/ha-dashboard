<template>
  <!-- Always renders as an inline flex row.
       For floating/fixed positioning, wrap in a .floating-toolbar in the parent. -->
  <div class="editor-action-bar" @touchstart.stop>
    <!-- Move Up -->
    <button
      v-if="showUp"
      class="btn-fab"
      :disabled="!canMoveUp"
      :title="upLabel"
      @touchend.prevent="$emit('move-up')"
      @click="$emit('move-up')"
    >
      <i class="mdi mdi-arrow-up" />
    </button>

    <!-- Move Down -->
    <button
      v-if="showDown"
      class="btn-fab"
      :disabled="!canMoveDown"
      :title="downLabel"
      @touchend.prevent="$emit('move-down')"
      @click="$emit('move-down')"
    >
      <i class="mdi mdi-arrow-down" />
    </button>

    <!-- Delete (danger) -->
    <button
      v-if="showDelete"
      class="btn-fab btn-fab-danger"
      :title="deleteLabel"
      @touchend.prevent="$emit('delete')"
      @click="$emit('delete')"
    >
      <i class="mdi mdi-delete" />
    </button>

    <!-- Edit -->
    <button
      v-if="showEdit"
      class="btn-fab"
      :title="editLabel"
      @touchend.prevent="$emit('edit')"
      @click="$emit('edit')"
    >
      <i class="mdi mdi-pencil" />
    </button>

    <!-- Add -->
    <button
      v-if="showAdd"
      class="btn-fab"
      :title="addLabel"
      @touchend.prevent="$emit('add')"
      @click="$emit('add')"
    >
      <i class="mdi mdi-plus" />
    </button>

    <!-- Close / Deselect -->
    <button
      v-if="showClose"
      class="btn-fab btn-fab-secondary"
      :title="closeLabel"
      @touchend.prevent="$emit('close')"
      @click="$emit('close')"
    >
      <i class="mdi mdi-close" />
    </button>

    <!-- Slot for extra context-specific buttons (e.g. Duplicate in ViewManager) -->
    <slot />
  </div>
</template>

<script setup>
defineProps({
  showUp: { type: Boolean, default: true },
  showDown: { type: Boolean, default: true },
  showEdit: { type: Boolean, default: false },
  showDelete: { type: Boolean, default: false },
  showAdd: { type: Boolean, default: false },
  showClose: { type: Boolean, default: false },
  canMoveUp: { type: Boolean, default: true },
  canMoveDown: { type: Boolean, default: true },
  upLabel: { type: String, default: "Move up" },
  downLabel: { type: String, default: "Move down" },
  editLabel: { type: String, default: "Edit" },
  deleteLabel: { type: String, default: "Delete" },
  addLabel: { type: String, default: "Add" },
  closeLabel: { type: String, default: "Close" },
});

defineEmits(["move-up", "move-down", "edit", "delete", "add", "close"]);
</script>
