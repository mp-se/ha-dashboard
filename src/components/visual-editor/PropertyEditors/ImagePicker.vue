<template>
  <div class="image-picker">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="search-container flex-grow-1 me-2">
        <div class="input-group input-group-sm">
          <span class="input-group-text bg-dark border-secondary text-light">
            <i class="mdi mdi-magnify"></i>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control form-control-sm bg-dark border-secondary text-light shadow-none"
            placeholder="Search images..."
          />
        </div>
      </div>
      <button
        class="btn btn-sm btn-primary"
        @click="$refs.fileInput.click()"
        :disabled="isUploading"
      >
        <i v-if="isUploading" class="mdi mdi-loading mdi-spin me-1"></i>
        <i v-else class="mdi mdi-upload me-1"></i>
        Upload
      </button>
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
    <div v-if="isUploading" class="progress mb-3" style="height: 4px;">
      <div
        class="progress-bar progress-bar-striped progress-bar-animated"
        role="progressbar"
        :style="{ width: uploadProgress + '%' }"
      ></div>
    </div>

    <!-- Image Grid -->
    <div class="image-grid custom-scrollbar">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
      </div>
      
      <div v-else-if="filteredImages.length === 0" class="text-center py-5 text-muted small">
        No images found
      </div>

      <div v-else class="row g-2">
        <div
          v-for="image in filteredImages"
          :key="image.id"
          class="col-4"
        >
          <div
            class="image-card position-relative overflow-hidden rounded border border-secondary"
            :class="{ 'border-primary shadow-sm': modelValue === image.url }"
            @click="selectImage(image.url)"
          >
            <div class="ratio ratio-1x1 bg-dark">
              <img
                :src="getImageUrl(image)"
                class="object-fit-contain"
                loading="lazy"
                :alt="image.name"
              />
            </div>
            
            <div class="image-overlay position-absolute bottom-0 start-0 end-0 p-1 d-flex justify-content-between align-items-end">
              <div class="image-name text-truncate small text-light ps-1" :title="image.name">
                {{ image.name }}
              </div>
              <button
                class="btn btn-link btn-sm text-danger p-0 border-0 me-1 mb-1"
                @click.stop="confirmDelete(image)"
                title="Delete image"
              >
                <i class="mdi mdi-delete-outline"></i>
              </button>
            </div>

            <!-- Selection indicator -->
            <div v-if="modelValue === image.url" class="position-absolute top-0 end-0 p-1">
              <i class="mdi mdi-check-circle text-primary bg-white rounded-circle"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Info -->
    <div v-if="modelValue" class="mt-2 d-flex align-items-center justify-content-between border-top border-secondary pt-2">
      <div class="text-truncate small text-muted font-monospace" :title="modelValue">
        {{ modelValue }}
      </div>
      <button class="btn btn-link btn-sm text-muted p-0 ms-2" @click="selectImage('')">
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Image'
  }
});

const emit = defineEmits(['update:modelValue']);

const images = ref([]);
const searchQuery = ref('');
const isLoading = ref(true);
const isUploading = ref(false);
const uploadProgress = ref(0);
const fileInput = ref(null);

// Get server URL from local storage or default to current host
const getServerUrl = () => {
  const stored = localStorage.getItem('ha-dashboard-server-config');
  if (stored) {
    try {
      const config = JSON.parse(stored);
      return config.api_url || '';
    } catch (e) {
      console.error('Error parsing server config', e);
    }
  }
  return '';
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
    console.error('Failed to fetch images', error);
  } finally {
    isLoading.value = false;
  }
};

const filteredImages = computed(() => {
  if (!searchQuery.value) return images.value;
  const query = searchQuery.value.toLowerCase();
  return images.value.filter(img => 
    img.name.toLowerCase().includes(query) || 
    img.id.toLowerCase().includes(query)
  );
});

const selectImage = (url) => {
  emit('update:modelValue', url);
};

const getImageUrl = (image) => {
  // Use a small preview if available on the server
  return `${API_SERVER}${image.url}?width=100&height=100&quality=60`;
};

const handleUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    // We use XHR to track progress
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_SERVER}/api/images/upload`);

    // Authentication header if exists
    const config = JSON.parse(localStorage.getItem('ha-dashboard-server-config') || '{}');
    if (config.api_password) {
      xhr.setRequestHeader('Authorization', `Bearer ${config.api_password}`);
    }

    xhr.upload.addEventListener('progress', (e) => {
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
        alert('Upload failed: ' + (JSON.parse(xhr.responseText).error || xhr.statusText));
      }
      isUploading.value = false;
      uploadProgress.value = 0;
      if (fileInput.value) fileInput.value.value = '';
    };

    xhr.onerror = () => {
      alert('Upload failed. Network error.');
      isUploading.value = false;
    };

    xhr.send(formData);
  } catch (error) {
    console.error('Upload error', error);
    isUploading.value = false;
  }
};

const confirmDelete = async (image) => {
  if (!confirm(`Are you sure you want to delete ${image.name}?`)) return;

  try {
    const config = JSON.parse(localStorage.getItem('ha-dashboard-server-config') || '{}');
    const response = await fetch(`${API_SERVER}/api/images/${image.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': config.api_password ? `Bearer ${config.api_password}` : ''
      }
    });
    
    const data = await response.json();
    if (data.success) {
      // If deleted image was selected, clear it
      if (props.modelValue === image.url) {
        selectImage('');
      }
      fetchImages();
    } else {
      alert('Delete failed: ' + data.error);
    }
  } catch (error) {
    console.error('Delete error', error);
  }
};

onMounted(fetchImages);
</script>

<style scoped>
.image-grid {
  max-height: 250px;
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

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-overlay {
  background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
  opacity: 0.8;
  transition: opacity 0.2s;
}

.image-name {
  font-size: 0.65rem;
  max-width: 70%;
}

.ratio img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Custom scrollbar for small space */
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