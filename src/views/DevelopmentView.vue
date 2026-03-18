<script setup>
import { computed } from "vue";
import { useHaStore } from "@/stores/haStore";

defineProps({
  viewName: {
    type: String,
    default: "dev",
  },
});

const store = useHaStore();

const entitiesList = computed(() => store.getAll().map((s) => s.entity_id));
</script>

<template>
  <div class="container-fluid overflow-hidden text-center">
    <p>&nbsp;</p>
    <p class="h3">Component Development View</p>
    <div class="row g-3">
      <EntityList :entities="entitiesList.map((id) => ({ entityId: id }))" />
    </div>
  </div>
</template>
