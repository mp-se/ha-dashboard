<template>
  <div class="image-picker">
    <div class="mb-3">
      <div class="search-container mb-3">
        <div class="input-group input-group-sm">
          <input
            v-model="searchQuery"
            type="text"
            class="form-control bg-dark border-secondary text-light shadow-none"
            placeholder="Search images..."
          />
        </div>
      </div>

      <!-- Drag & Drop Zone -->
      <div
        class="upload-zone d-flex flex-column align-items-center justify-content-center p-4 mb-3 border border-secondary rounded"
        :class="{ 'dragging-over': isDragging }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <i class="mdi mdi-cloud-upload-outline mdi-48px mb-2"></i>
        <div class="upload-text text-center">
          <span class="fw-bold">Drag images here</span> or
          <button
            class="btn btn-link p-0 fw-bold border-0 text-decoration-none"
            style="vertical-align: baseline"
            @click="$refs.fileInput.click()"
          >
            click to browse
          </button>
        </div>
        <div class="upload-hint text-muted mt-2">
          Supported: JPEG, PNG, GIF, WebP, SVG (Max 50MB per file)
        </div>
        <input
          ref="fileInput"
          type="file"
          class="d-none"
          accept="image/*"
          multiple
          @change="handleUpload"
        />
      </div>

      <!-- Upload Progress -->
      <div v-if="isUploading" class="progress mb-3" style="height: 4px">
        <div
          class="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Image Grid -->
    <div class="image-grid custom-scrollbar">
      <div v-if="isLoading" class="text-center py-5">
        <div
          class="spinner-border spinner-border-sm text-primary"
          role="status"
        ></div>
      </div>

      <div
        v-else-if="filteredImages.length === 0"
        class="text-center py-5 text-muted small"
      >
        No images found
      </div>

      <div v-else class="row g-2">
        <div v-for="image in filteredImages" :key="image.id" class="col-4">
          <div
            class="image-card position-relative overflow-hidden rounded border border-secondary p-1"
            :class="{ 'border-primary shadow-sm': modelValue === image.url }"
            @click="selectImage(image.url)"
          >
            <div class="ratio ratio-1x1 mb-1">
              <img
                :src="getImageUrl(image)"
                class="object-fit-contain rounded-top"
                loading="lazy"
                :alt="image.name"
              />
            </div>

            <div class="image-info border-top border-secondary pt-1 mt-1">
              <div
                class="image-name text-truncate small fw-bold text-light"
                :title="image.name"
              >
                {{ image.name }}
              </div>
              <div class="image-size text-muted" style="font-size: 0.6rem">
                {{ formatFileSize(image.size) }}
              </div>
            </div>

            <button
              class="btn btn-link btn-sm text-danger p-0 border-0 position-absolute top-0 end-0 m-1 delete-hidden"
              title="Delete image"
              @click.stop="confirmDelete(image)"
            >
              <i class="mdi mdi-delete-outline"></i>
            </button>

            <!-- Selection indicator -->
            <div
              v-if="modelValue === image.url"
              class="position-absolute top-0 start-0 p-1"
            >
              <i
                class="mdi mdi-check-circle text-primary bg-white rounded-circle"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="text-muted small mt-3">
      Select or upload an image from the server
    </div>

    <!-- Selection Info -->
    <div class="mt-3">
      <div class="mb-2">
        <label class="form-label small text-light mb-1">Title</label>
        <input
          type="text"
          class="form-control form-control-sm bg-dark border-secondary text-light"
          placeholder="Image"
        />
        <div class="form-text small text-muted">
          Optional title shown below the image
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useConfigStore } from "@/stores/configStore";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "Image",
  },
});

const emit = defineEmits(["update:modelValue"]);

const configStore = useConfigStore();
const images = ref([]);
const searchQuery = ref("");
const isLoading = ref(true);
const isUploading = ref(false);
const uploadProgress = ref(0);
const fileInput = ref(null);
const isDragging = ref(false);

const getEditorPassword = () => {
  // 1. Try password from active dashboard config
  const configPassword = configStore.dashboardConfig?.app?.password;
  if (configPassword) return configPassword;

  // 2. Fallback to legacy local storage config
  const stored = localStorage.getItem("ha-dashboard-server-config");
  if (stored) {
    try {
      const config = JSON.parse(stored);
      return config.api_password || "";
    } catch (e) {
      console.error("Error parsing legacy server config", e);
    }
  }
  return "";
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const onDragOver = () => {
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = async (event) => {
  isDragging.value = false;
  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
    uploadFiles(files);
  }
};

// Get server URL from local storage or default to current host
const getServerUrl = () => {
  const stored = localStorage.getItem("ha-dashboard-server-config");
  if (stored) {
    try {
      const config = JSON.parse(stored);
      return config.api_url || "";
    } catch (e) {
      console.error("Error parsing server config", e);
    }
  }

  // Fallback to origin for local dev/Docker environments
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }

  return window.location.origin;
};

const API_SERVER = getServerUrl();

const fetchImages = async () => {
  isLoading.value = true;
  try {
    const response = await fetch(`${API_SERVER}/api/images`);
    const data = await response.json();
    if (data.success) {
      images.value = data.data.images;
    }
  } catch (error) {
    console.error("Failed to fetch images", error);
  } finally {
    isLoading.value = false;
  }
};

const filteredImages = computed(() => {
  if (!searchQuery.value) return images.value;
  const query = searchQuery.value.toLowerCase();
  return images.value.filter(
    (img) =>
      img.name.toLowerCase().includes(query) ||
      img.id.toLowerCase().includes(query),
  );
});

const selectImage = (url) => {
  emit("update:modelValue", url);
};

const getImageUrl = (image) => {
  // Use a small preview if available on the server
  return `${API_SERVER}${image.url}?width=200&height=200&quality=80`;
};

const handleUpload = (event) => {
  const files = event.target.files;
  if (files) uploadFiles(files);
};

const uploadFiles = async (files) => {
  if (!files || files.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("images", files[i]);
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    // We use XHR to track progress
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_SERVER}/api/images/upload`);

    // Authentication header from active dashboard config
    const password = getEditorPassword();
    if (password) {
      xhr.setRequestHeader("Authorization", `Bearer ${password}`);
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          fetchImages();
          // Auto-select first uploaded image if only one
          if (data.data.images.length === 1) {
            selectImage(data.data.images[0].url);
          }
        }
      } else {
        alert(
          "Upload failed: " +
            (JSON.parse(xhr.responseText).error || xhr.statusText),
        );
      }
      isUploading.value = false;
      uploadProgress.value = 0;
      if (fileInput.value) fileInput.value.value = "";
    };

    xhr.onerror = () => {
      alert("Upload failed. Network error.");
      isUploading.value = false;
    };

    xhr.send(formData);
  } catch (error) {
    console.error("Upload error", error);
    isUploading.value = false;
  }
};

const confirmDelete = async (image) => {
  if (!confirm(`Are you sure you want to delete ${image.name}?`)) return;

  try {
    const password = getEditorPassword();
    const response = await fetch(`${API_SERVER}/api/images/${image.id}`, {
      method: "DELETE",
      headers: {
        Authorization: password ? `Bearer ${password}` : "",
      },
    });

    const data = await response.json();
    if (data.success) {
      // If deleted image was selected, clear it
      if (props.modelValue === image.url) {
        selectImage("");
      }
      fetchImages();
    } else {
      alert("Delete failed: " + data.error);
    }
  } catch (error) {
    console.error("Delete error", error);
  }
};

onMounted(fetchImages);
</script>

<style scoped>
.image-picker {
  position: relative;
}

.upload-zone {
  border: 1px dashed rgba(255, 255, 255, 0.2) !important;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease-in-out;
}

.upload-zone.dragging-over {
  border-color: #0d6efd !important;
  background: rgba(13, 110, 253, 0.05);
  color: #0d6efd;
}

.upload-text {
  font-size: 0.9rem;
}

.upload-hint {
  font-size: 0.75rem;
}

.image-grid {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.image-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background: #1e1e1e;
}

.image-card:hover {
  border-color: #0d6efd !important;
  transform: translateY(-2px);
}

.delete-hidden {
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .delete-hidden {
  opacity: 1;
}

.image-name {
  font-size: 0.7rem;
}

.image-size {
  font-size: 0.6rem;
}

.ratio img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
