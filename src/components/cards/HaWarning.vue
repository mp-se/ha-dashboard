<template>
  <div v-if="shouldShowWarning">
    <div
      :class="[
        'h-100',
        'rounded-4',
        'shadow-lg',
        'p-3',
        'border',
        'border-warning',
        'border-3',
        'card-status',
      ]"
    >
      <div class="card-body d-flex align-items-center">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-1">Warning</h6>
          <div class="text-muted small">{{ message }}</div>
        </div>
        <div class="d-flex align-items-center">
          <div class="ha-icon-circle-wrapper">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              class="ha-icon-circle"
            >
              <circle cx="20" cy="20" r="18" fill="#FFC107" />
            </svg>
            <i class="mdi mdi-alert-outline ha-icon-overlay"></i>
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

const { isConditionTrue: shouldShowWarning } = useConditionEvaluator(props);
</script>
