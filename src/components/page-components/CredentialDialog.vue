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
  <div
    v-if="show"
    class="credential-dialog modal fade show d-block"
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
            <button
              type="button"
              class="btn btn-secondary"
              @click="show = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {{ formData.haUrl && formData.accessToken ? "Update" : "Connect" }}
            </button>
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
 * Show the credential dialog with optional initial values
 * @param {Object} initialValues - Object with haUrl and accessToken to pre-fill the form
 */
const showModal = (initialValues = {}) => {
  show.value = true;
  submitted.value = false;
  formData.value = {
    haUrl: initialValues.haUrl || "",
    accessToken: initialValues.accessToken || "",
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
