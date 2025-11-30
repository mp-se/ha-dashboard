<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';

const store = useHaStore();

// Configurable list of entities to display — now automatically populated with all available switch.* entities from HA
const entitiesList = computed(() => {
  return store
    .getAll()
    .filter((s) => !s.entity_id.includes('button.'))
    .filter((s) => !s.entity_id.includes('visonic'))
    .filter((s) => !s.entity_id.includes('light.'))
    .filter((s) => !s.entity_id.includes('event.'))
    .filter((s) => !s.entity_id.includes('conversation.'))
    .filter((s) => !s.entity_id.includes('scene.'))
    .filter((s) => !s.entity_id.includes('input_number.'))
    .filter((s) => !s.entity_id.includes('input_boolean.'))
    .filter((s) => !s.entity_id.includes('input_select.'))
    .filter((s) => !s.entity_id.includes('zone.'))
    .filter((s) => !s.entity_id.includes('person.'))
    .filter((s) => !s.entity_id.includes('script.'))
    .filter((s) => !s.entity_id.includes('todo.'))
    .filter((s) => !s.entity_id.includes('notify.'))
    .filter((s) => !s.entity_id.includes('automation.'))
    .filter((s) => !s.entity_id.includes('tts.'))
    .filter((s) => !s.entity_id.includes('number.'))
    .filter((s) => !s.entity_id.includes('remote.'))
    .filter((s) => !s.entity_id.includes('camera.'))
    .map((s) => s.entity_id)
    .slice(0, 50); // Limit to 50 entities to prevent render performance issues
});
</script>

<template>
  <div class="container-fluid overflow-hidden text-center">
    <p>&nbsp;</p>
    <p class="h3">Component Development View</p>
    <div class="row g-3">
      <HaEntityList :entities="entitiesList.map((id) => ({ entityId: id }))" />
    </div>
  </div>
</template>
