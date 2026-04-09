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
  <div v-if="shouldShowError">
    <div
      :class="[
        'ha-error',
        'h-100',
        'rounded-4',
        'shadow-lg',
        'p-3',
        'border',
        'border-danger',
        'border-3',
        'card-status',
        'error',
      ]"
    >
      <div class="card-body d-flex align-items-center">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-1">Error</h6>
          <div class="text-muted small">{{ message }}</div>
        </div>
        <div class="d-flex align-items-center">
          <div class="icon-circle-wrapper">
            <svg width="40" height="40" viewBox="0 0 40 40" class="icon-circle">
              <circle cx="20" cy="20" r="18" fill="#DC3545" />
            </svg>
            <i class="mdi mdi-exclamation icon-overlay"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useConditionEvaluator } from "@/composables/useConditionEvaluator";

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
  },
  attribute: {
    type: String,
    default: "state",
  },
  operator: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number, Boolean, Array],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  editorMode: {
    type: Boolean,
    default: false,
  },
});

const { isConditionTrue: shouldShowError } = useConditionEvaluator(props);
</script>
