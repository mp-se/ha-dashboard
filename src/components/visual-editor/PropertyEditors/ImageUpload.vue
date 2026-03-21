<template>
  <div class="property-editor">
    <label class="form-label small mb-1" :for="inputId">
      <strong>{{ label }}</strong>
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div class="image-upload-container">
      <!-- Current Value / Preview Section -->
      <div v-if="modelValue" class="image-preview-wrapper mb-2">
        <img :src="resolveImageUrl(modelValue)" class="image-preview-img" alt="Preview" />
        <button 
          type="button" 
          class="btn btn-sm btn-danger remove-image-btn" 
          @click="removeImage"
          title="Remove image"
        >
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <!-- Upload Controls -->
      <div class="upload-controls d-flex gap-2">
        <input
          type="text"
          class="form-control form-control-sm flex-grow-1"
          :id="inputId"
          :placeholder="placeholder || 'Enter URL or upload file'"
          :value="modelValue"
          @input="emit('update:modelValue', $event.target.value)"
        />
        
        <label class="btn btn-sm btn-outline-primary mb-0 d-flex align-items-center" :class="{ disabled: isUploading }">
          <i v-if="isUploading" class="mdi mdi-loading mdi-spin me-1"></i>
          <i v-else class="mdi mdi-cloud-upload-outline me-1"></i>
          Upload
          <input
            type="file"
            class="d-none"
            accept="image/*"
            @change="handleFileUpload"
            :disabled="isUploading"
          />
        </label>
      </div>

      <small v-if="help" class="text-muted d-block mt-1">{{ help }}</small>
      <small v-if="uploadError" class="text-danger d-block mt-1">{{ uploadError }}</small>
      <small v-if="error" class="text-danger d-block mt-1">{{ error }}</small>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    required: true,
  },
  help: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const isUploading = ref(false);
const uploadError = ref("");
const inputId = computed(() => `image-upload-${Math.random().toString(36).substr(2, 9)}`);

/** Resolves the image URL for the preview. Handles ./data relative paths. */
const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("./data/")) {
    // In production/dev, server serves data/ from root usually
    return url.replace("./", "/");
  }
  return url;
};

const removeImage = () => {
  emit("update:modelValue", "");
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Reset errors
  uploadError.ref = "";
  isUploading.value = true;

  try {
    const formData = new FormData();
    formData.append("image", file);

    const apiBase = ""; // Assuming API is relative to the current host
    const response = await fetch(`${apiBase}/api/upload`, {
      method: "POST",
      body: formData,
      // Authentication is handled by standard mechanisms (e.g., token in headers if required)
      // Usually, the editor's axios config or store handles this, but here we use fetch.
      // We may need to pull the password from localStorage or the store.
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("dashboard_password") || ""}`
      }
    });

    const result = await response.json();

    if (result.success && result.data?.url) {
      emit("update:modelValue", result.data.url);
    } else {
      uploadError.value = result.error || "Upload failed";
    }
  } catch (err) {
    uploadError.value = "Failed to upload image. Server unreachable?";
    console.error("Upload error:", err);
  } finally {
    isUploading.value = false;
    // Clear the file input so the same file can be uploaded again if needed
    event.target.value = "";
  }
};
</script>

<style scoped>
.image-upload-container {
  width: 100%;
}

.image-preview-wrapper {
  position: relative;
  width: 100%;
  max-height: 150px;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--bs-border-color);
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview-img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.8;
}

.remove-image-btn:hover {
  opacity: 1;
}

.disabled {
  pointer-events: none;
  opacity: 0.6;
}
</style>