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
  <section
    class="getting-started card border-primary-subtle mb-3"
    aria-labelledby="getting-started-title"
  >
    <div class="card-body">
      <div class="d-flex align-items-start justify-content-between gap-3">
        <div>
          <h2 id="getting-started-title" class="h5 mb-1">
            Let’s build your first dashboard
          </h2>
          <p class="text-muted small mb-3">
            Home Assistant still runs your integrations and automations. This
            editor is where you design the dashboard UI.
          </p>
        </div>
        <button
          class="btn-close"
          type="button"
          aria-label="Dismiss getting started guide"
          title="Dismiss guide"
          @click="$emit('dismiss')"
        ></button>
      </div>

      <ol class="getting-started-steps list-unstyled mb-0">
        <li class="getting-started-step">
          <span class="step-icon" :class="isConnected ? 'complete' : ''">
            <i
              :class="
                isConnected
                  ? 'mdi mdi-check'
                  : 'mdi mdi-numeric-1-circle-outline'
              "
            ></i>
          </span>
          <div class="flex-grow-1">
            <strong>Connect to Home Assistant</strong>
            <div class="text-muted small">
              {{
                isConnected
                  ? "Connection is ready."
                  : "Your HA instance provides the live entities and controls."
              }}
            </div>
          </div>
          <button
            v-if="!isConnected"
            class="btn btn-sm btn-outline-primary"
            type="button"
            @click="$emit('connect')"
          >
            {{ hasCredentials ? "Retry connection" : "Connect" }}
          </button>
        </li>

        <li class="getting-started-step">
          <span class="step-icon" :class="hasViews ? 'complete' : ''">
            <i
              :class="
                hasViews ? 'mdi mdi-check' : 'mdi mdi-numeric-2-circle-outline'
              "
            ></i>
          </span>
          <div class="flex-grow-1">
            <strong>Create a view</strong>
            <div class="text-muted small">
              {{
                hasViews
                  ? "A view is ready to design."
                  : "Views give your dashboard sections such as Overview or Rooms."
              }}
            </div>
          </div>
          <button
            v-if="!hasViews"
            class="btn btn-sm btn-outline-primary"
            type="button"
            @click="$emit('create-view')"
          >
            Create view
          </button>
        </li>

        <li class="getting-started-step">
          <span class="step-icon">
            <i class="mdi mdi-numeric-3-circle-outline"></i>
          </span>
          <div class="flex-grow-1">
            <strong>Add your first card</strong>
            <div class="text-muted small">
              Choose an HA entity for an automatically selected card, or browse
              the built-in card catalog.
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button
              class="btn btn-sm btn-primary"
              type="button"
              :disabled="!hasViews"
              @click="$emit('browse-entities')"
            >
              Browse entities
            </button>
            <button
              class="btn btn-sm btn-outline-primary"
              type="button"
              :disabled="!hasViews"
              @click="$emit('browse-components')"
            >
              Built-in cards
            </button>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
defineProps({
  isConnected: { type: Boolean, default: false },
  hasCredentials: { type: Boolean, default: false },
  hasViews: { type: Boolean, default: false },
});

defineEmits([
  "connect",
  "create-view",
  "browse-entities",
  "browse-components",
  "dismiss",
]);
</script>

<style scoped>
.getting-started {
  border-width: 1px;
}

.getting-started-steps {
  display: grid;
  gap: 0.75rem;
}

.getting-started-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.step-icon {
  color: var(--bs-primary);
  font-size: 1.35rem;
  line-height: 1;
}

.step-icon.complete {
  color: var(--bs-success);
}

@media (max-width: 575.98px) {
  .getting-started-step {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .getting-started-step > .btn,
  .getting-started-step > .d-flex {
    margin-left: 2.1rem;
  }
}
</style>
