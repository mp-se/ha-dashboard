<template>
  <div v-if="error" class="error-boundary-container">
    <div class="container-fluid py-5">
      <div class="row justify-content-center">
        <div class="col-lg-6 col-md-8">
          <div class="card border-danger shadow-lg">
            <div class="card-header bg-danger text-white">
              <h5 class="mb-0">
                <i class="mdi mdi-alert-circle me-2"></i>
                Component Error
              </h5>
            </div>
            <div class="card-body">
              <p class="text-muted mb-3">
                An error occurred while rendering this view. The error has been
                logged for debugging.
              </p>
              <div v-if="developerMode" class="alert alert-secondary">
                <strong>Error Details:</strong>
                <pre class="mb-0 mt-2">{{ error.toString() }}</pre>
                <div v-if="errorInfo" class="mt-2">
                  <strong>Component Stack:</strong>
                  <pre class="mb-0 mt-2">{{ errorInfo }}</pre>
                </div>
              </div>
              <div class="d-flex gap-2">
                <!-- When in the editor view, only offer 'Go to Overview' to exit the editor
                     Retry may re-render the failing component but is confusing in editor context -->
                <button
                  v-if="viewName !== 'editor'"
                  class="btn btn-primary"
                  @click="retry"
                >
                  <i class="mdi mdi-refresh me-1"></i>
                  Retry
                </button>
                <button class="btn btn-outline-secondary" @click="goHome">
                  <i class="mdi mdi-home me-1"></i>
                  Go to Overview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured, computed } from "vue";
import { useHaStore } from "@/stores/haStore";
import { createLogger } from "@/utils/logger";

const props = defineProps({
  viewName: {
    type: String,
    default: "unknown",
  },
});

const emit = defineEmits(["error", "retry", "goHome"]);

const store = useHaStore();
const logger = createLogger("ErrorBoundary");

const error = ref(null);
const errorInfo = ref(null);

const developerMode = computed(() => store.developerMode);

// Capture errors from child components
onErrorCaptured((err, instance, info) => {
  error.value = err;
  errorInfo.value = info;

  logger.error(
    `Error in ${props.viewName} view:`,
    err,
    "\nComponent:",
    instance?.$options?.name || "unknown",
    "\nInfo:",
    info,
  );

  emit("error", { error: err, info, viewName: props.viewName });

  // Prevent the error from propagating further
  return false;
});

const retry = () => {
  error.value = null;
  errorInfo.value = null;
  emit("retry");
};

const goHome = () => {
  error.value = null;
  errorInfo.value = null;
  emit("goHome");
};
</script>

<style scoped>
.error-boundary-container pre {
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  border-radius: 0.25rem;
}

[data-bs-theme="dark"] .error-boundary-container pre {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
