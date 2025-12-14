<template>
  <div class="col-lg-4 col-md-6">
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
      <div class="card-body d-flex align-items-center">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-0">{{ name }}</h6>
        </div>
        <div class="d-flex align-items-center">
          <button
            class="btn btn-outline-primary btn-wide"
            :disabled="isUnavailable"
            title="Press Button"
            @click="pressButton"
          >
            <i class="mdi mdi-gesture-tap-button"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useEntityResolver } from "@/composables/useEntityResolver";
import { useServiceCall } from "@/composables/useServiceCall";

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

const { callService } = useServiceCall();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? "unknown");

const isUnavailable = computed(() =>
  ["unavailable", "unknown"].includes(state.value),
);

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return "border-warning";
  return "border-primary";
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name ||
    resolvedEntity.value?.entity_id ||
    "Unknown",
);

const pressButton = async () => {
  if (!resolvedEntity.value) return;
  const domain = resolvedEntity.value.entity_id.split(".")[0];
  await callService(domain, "press", {
    entity_id: resolvedEntity.value.entity_id,
  });
};
</script>

<style scoped>
.btn-wide {
  min-width: 120px;
  padding-left: 2rem;
  padding-right: 2rem;
}
</style>
