<template>
  <div class="col-md-4">
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
          resolvedEntity
            ? 'd-flex align-items-center'
            : 'text-center text-warning',
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

        <div v-if="resolvedEntity" class="text-start flex-grow-1">
          <h6 class="ha-entity-name mb-0">{{ name }}</h6>
          <!-- Display requested attributes if provided -->
          <div v-if="requestedAttributes.length > 0" class="mt-1">
            <div
              v-for="[key, value] in requestedAttributes"
              :key="key"
              class="small d-flex gap-2 mb-0"
            >
              <div class="ha-attribute-key">
                {{ formatKey(key) }}:
                <span class="ha-attribute-value">{{
                  formatAttributeValue(value)
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="resolvedEntity" class="d-flex align-items-center ms-2">
          <div
            class="binary-state-indicator"
            :class="{
              'state-on': getActiveState(),
              'state-off': !getActiveState() && !isUnavailable,
              'state-unavailable': isUnavailable,
            }"
            :title="displayStateLabel"
          >
            <i :class="stateIcon" class="state-icon"></i>
          </div>
        </div>
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
  attributes: {
    type: Array,
    default: () => [],
  },
});

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state || "unknown");

const isUnavailable = computed(() =>
  ["unavailable", "unknown"].includes(state.value),
);

const displayStateLabel = computed(() => {
  if (isUnavailable.value) return "Unavailable";
  const lowerState = state.value.toLowerCase();

  // Map common binary sensor states to labels
  const stateMap = {
    on: "Active",
    off: "Inactive",
    true: "Active",
    false: "Inactive",
    open: "Open",
    closed: "Closed",
    locked: "Locked",
    unlocked: "Unlocked",
    detected: "Detected",
    clear: "Clear",
    armed: "Armed",
    disarmed: "Disarmed",
    triggered: "Triggered",
  };

  return stateMap[lowerState] || (getActiveState() ? "Active" : "Inactive");
});

// Determine if state is considered "active" (on, open, detected, etc.)
const getActiveState = () => {
  const lowerState = state.value.toLowerCase();
  const activeStates = [
    "on",
    "true",
    "open",
    "detected",
    "armed",
    "triggered",
    "locked",
    "unlocked",
  ];
  return activeStates.includes(lowerState);
};

const stateIcon = computed(() => {
  if (isUnavailable.value) return "mdi mdi-help-circle-outline";

  const lowerState = state.value.toLowerCase();

  // Map states to appropriate icons
  const iconMap = {
    on: "mdi mdi-check-circle",
    off: "mdi mdi-circle-outline",
    true: "mdi mdi-check-circle",
    false: "mdi mdi-circle-outline",
    open: "mdi mdi-door-open",
    closed: "mdi mdi-door-closed",
    locked: "mdi mdi-lock",
    unlocked: "mdi mdi-lock-open",
    detected: "mdi mdi-check-circle",
    clear: "mdi mdi-circle-outline",
    armed: "mdi mdi-shield-check",
    disarmed: "mdi mdi-shield-off",
    triggered: "mdi mdi-alert-circle",
  };

  return (
    iconMap[lowerState] ||
    (getActiveState() ? "mdi mdi-check-circle" : "mdi mdi-circle-outline")
  );
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name ||
    resolvedEntity.value?.entity_id ||
    "Unknown",
);

// card border color
const cardBorderClass = computed(() => {
  if (isUnavailable.value) return "border-warning";
  return getActiveState() ? "border-success" : "border-secondary";
});

// Return requested attributes as [key, value] pairs
const requestedAttributes = computed(() => {
  if (!props.attributes || props.attributes.length === 0) return [];
  if (!resolvedEntity.value) return [];

  const attrs = resolvedEntity.value.attributes || {};
  const result = [];

  for (const key of props.attributes) {
    if (key in attrs) {
      result.push([key, attrs[key]]);
    }
  }

  return result;
});

const formatKey = (key) => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatAttributeValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};
</script>

<style scoped>
.binary-state-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: default;
}

.binary-state-indicator.state-on {
  color: #28a745;
}

.binary-state-indicator.state-off {
  color: #6c757d;
}

.binary-state-indicator.state-unavailable {
  color: #ffc107;
}

.state-icon {
  font-size: 2rem;
  display: block;
}
</style>
