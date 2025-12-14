<template>
  <div class="col-lg-4 col-md-6">
    <div
      :class="[
        'card',
        'card-display',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : cardBorderClass,
      ]"
    >
      <div
        :class="[
          'card-body',
          !resolvedEntity ? 'text-center text-warning' : 'py-2',
        ]"
      >
        <i
          v-if="!resolvedEntity"
          class="mdi mdi-alert-circle mdi-24px mb-2"
        ></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === "string" ? entity : entity?.entity_id }}"
          not found
        </div>
        <template v-else>
          <div class="d-flex align-items-center">
            <div class="flex-grow-1 text-start">
              <h6 class="card-title mb-1">{{ name }}</h6>
              <div class="d-flex align-items-center mb-1">
                <i :class="sunIcon" class="sun-icon me-2"></i>
                <div class="sun-condition fw-bold">
                  {{ formatStateText(state) }}
                </div>
              </div>
            </div>
            <div class="text-end small">
              <div class="mb-1">
                <span class="text-muted"
                  >{{
                    state === "above_horizon" ? "Sunrise" : "Next Sunrise"
                  }}:</span
                >
                <span class="fw-bold">{{ formatTime24h(nextRising) }}</span>
              </div>
              <div>
                <span class="text-muted"
                  >{{
                    state === "above_horizon" ? "Sunset" : "Next Sunset"
                  }}:</span
                >
                <span class="fw-bold">{{ formatTime24h(nextSetting) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
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

const { resolvedEntity } = useEntityResolver(computed(() => props.entity));

const state = computed(() => resolvedEntity.value?.state ?? "unknown");

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

const sunIcon = computed(() => {
  const currentState = state.value?.toLowerCase();
  if (currentState === "above_horizon") {
    return "mdi mdi-weather-sunny";
  } else if (currentState === "below_horizon") {
    return "mdi mdi-weather-night";
  }
  return "mdi mdi-weather-sunset";
});

// Sun-specific attributes
const nextRising = computed(
  () =>
    resolvedEntity.value?.attributes?.next_rising ||
    resolvedEntity.value?.attributes?.sunrise,
);
const nextSetting = computed(
  () =>
    resolvedEntity.value?.attributes?.next_setting ||
    resolvedEntity.value?.attributes?.sunset,
);

const formatTime24h = (dateString) => {
  if (!dateString) return "--:--";
  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--:--";
  }
};

const formatStateText = (text) => {
  return text
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
</script>

<style scoped>
.sun-condition {
  font-size: 1rem;
  color: var(--bs-primary);
}

.sun-icon {
  font-size: 1.5rem;
  color: var(--bs-warning);
}

.sun-times {
  font-size: 0.85rem;
}
</style>
