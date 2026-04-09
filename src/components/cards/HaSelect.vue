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
    :class="[
      'card',
      'card-control',
      cardBorderClass,
      'h-100',
      'rounded-4',
      'shadow-lg',
    ]"
  >
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h6 class="card-title mb-0">{{ name }}</h6>
        <i :class="selectIcon" class="select-icon"></i>
      </div>

      <div v-if="options && options.length > 0" class="d-flex flex-wrap">
        <div class="btn-group" role="group">
          <template v-for="option in options" :key="option">
            <input
              :id="`${resolvedEntity.value?.entity_id}-${option}`"
              v-model="selectedOption"
              type="radio"
              :name="`${resolvedEntity.value?.entity_id}-select`"
              class="btn-check"
              :value="option"
              :disabled="isUnavailable"
            />
            <label
              :for="`${resolvedEntity.value?.entity_id}-${option}`"
              :class="[
                'btn',
                'btn-sm',
                isUnavailable ? 'disabled' : '',
                selectedOption === option
                  ? 'btn-primary'
                  : 'btn-outline-primary',
              ]"
            >
              {{ option }}
            </label>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useHaStore } from "@/stores/haStore";
import { useEntityResolver } from "@/composables/useEntityResolver";

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === "string") {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === "object") {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
});

const store = useHaStore();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? "unknown");

const selectedOption = ref(state.value);

// Update selectedOption when state changes from external source
watch(state, (newState) => {
  selectedOption.value = newState;
});

// Call service when selectedOption changes
watch(selectedOption, (newOption) => {
  if (newOption !== state.value && resolvedEntity.value) {
    const domain = resolvedEntity.value.entity_id.split(".")[0];
    store.callService(domain, "select_option", {
      entity_id: resolvedEntity.value.entity_id,
      option: newOption,
    });
  }
});

const isUnavailable = computed(() =>
  ["unavailable", "unknown"].includes(state.value),
);

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return "border-warning";
  return "border-info";
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name ||
    resolvedEntity.value?.entity_id ||
    "Unknown",
);

const selectIcon = computed(() => {
  return "mdi mdi-format-list-bulleted";
});

// Select-specific attributes
const options = computed(() => resolvedEntity.value?.attributes?.options || []);
</script>
