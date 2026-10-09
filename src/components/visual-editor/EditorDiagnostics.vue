<template>
  <section
    class="editor-diagnostics alert alert-light border mx-3"
    aria-labelledby="diagnostics-title"
    aria-live="polite"
  >
    <h2 id="diagnostics-title" class="h6">Dashboard checks</h2>
    <p v-if="!config" class="mb-0">No dashboard configuration is loaded.</p>
    <template v-else>
      <p v-if="!hasIssues" class="mb-0 text-success">
        <i class="mdi mdi-check-circle me-1" aria-hidden="true"></i>
        No configuration issues found{{
          canCheckEntities ? " and all referenced entities exist" : ""
        }}.
      </p>
      <ul v-else class="mb-0 ps-3">
        <li v-for="(issue, index) in issues" :key="`${issue.kind}-${index}`">
          <span
            :class="
              issue.kind === 'error' ? 'text-danger' : 'text-warning-emphasis'
            "
            >{{ issue.label }}:</span
          >
          {{ issue.message }}
        </li>
      </ul>
      <p v-if="!canCheckEntities" class="small text-muted mt-2 mb-0">
        Entity availability is checked when connected to Home Assistant.
      </p>
    </template>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { validateConfig } from "../../utils/configValidator";

const props = defineProps({
  config: { type: Object, default: null },
  entityMap: { type: Object, default: () => ({}) },
  isConnected: { type: Boolean, default: false },
});

const validation = computed(() => {
  if (!props.config) return { errors: [] };
  try {
    return validateConfig(props.config);
  } catch {
    return {
      errors: [{ message: "Configuration could not be checked safely." }],
    };
  }
});

const canCheckEntities = computed(
  () => props.isConnected && Object.keys(props.entityMap || {}).length > 0,
);

const configuredEntityIds = computed(() => {
  const ids = new Set();
  for (const view of Array.isArray(props.config?.views)
    ? props.config.views
    : []) {
    for (const card of Array.isArray(view?.entities) ? view.entities : []) {
      if (!card || typeof card !== "object") continue;
      const refs = Array.isArray(card.entity) ? card.entity : [card.entity];
      for (const entityId of refs) {
        if (typeof entityId === "string" && entityId.trim()) ids.add(entityId);
      }
      for (const item of Array.isArray(card.entities) ? card.entities : []) {
        const entityId = typeof item === "string" ? item : item?.entity;
        if (typeof entityId === "string" && entityId.trim()) ids.add(entityId);
      }
    }
  }
  return [...ids];
});

const issues = computed(() => {
  const items = (validation.value.errors || []).map((error) => ({
    kind: "error",
    label: "Configuration",
    message: error.message,
  }));
  if (canCheckEntities.value) {
    for (const entityId of configuredEntityIds.value) {
      if (!props.entityMap[entityId]) {
        items.push({
          kind: "warning",
          label: "Missing entity",
          message: `${entityId} was not found in Home Assistant.`,
        });
      }
    }
  }
  return items;
});

const hasIssues = computed(() => issues.value.length > 0);
</script>
