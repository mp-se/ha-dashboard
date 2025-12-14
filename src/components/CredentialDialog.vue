<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-labelledby="credentialDialogLabel"
    aria-hidden="false"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="credentialDialogLabel" class="modal-title">
            Home Assistant Credentials
          </h5>
        </div>
        <form
          class="needs-validation"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <div class="modal-body">
            <div class="mb-3">
              <label for="ha-url-input" class="form-label"
                >Home Assistant URL</label
              >
              <input
                id="ha-url-input"
                v-model="formData.haUrl"
                type="url"
                class="form-control"
                :class="{ 'is-invalid': submitted && !formData.haUrl }"
                placeholder="https://192.168.1.100:8123"
                required
              />
              <div
                v-if="submitted && !formData.haUrl"
                class="invalid-feedback d-block"
              >
                Home Assistant URL is required
              </div>
            </div>

            <div class="mb-3">
              <label for="ha-token-input" class="form-label"
                >Access Token</label
              >
              <input
                id="ha-token-input"
                v-model="formData.accessToken"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': submitted && !formData.accessToken }"
                placeholder="Enter your Long-Lived Access Token"
                required
              />
              <div
                v-if="submitted && !formData.accessToken"
                class="invalid-feedback d-block"
              >
                Access Token is required
              </div>
            </div>

            <div class="text-muted small">
              You can create a Long-Lived Access Token in Home Assistant under
              Profile → Long-Lived Access Tokens.
            </div>
          </div>

          <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Connect</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const show = ref(false);
const submitted = ref(false);

const formData = ref({
  haUrl: "",
  accessToken: "",
});

const emit = defineEmits(["credentials"]);

/**
 * Show the credential dialog
 */
const showModal = () => {
  show.value = true;
  submitted.value = false;
  formData.value = {
    haUrl: "",
    accessToken: "",
  };
};

/**
 * Handle form submission
 */
const handleSubmit = () => {
  submitted.value = true;

  // Validate required fields
  if (!formData.value.haUrl || !formData.value.accessToken) {
    return;
  }

  // Emit credentials and close dialog
  emit("credentials", {
    haUrl: formData.value.haUrl.trim(),
    accessToken: formData.value.accessToken.trim(),
  });

  show.value = false;
  submitted.value = false;
};

defineExpose({
  showModal,
});
</script>

<style scoped>
.invalid-feedback {
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 0.25rem;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}
</style>
