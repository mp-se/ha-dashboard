<template>
  <div class="row">
    <div class="col-md-12">
      <h1 class="h3 mb-4 text-center">
        <i v-if="normalizedIcon" :class="normalizedIcon" class="me-2"></i>
        {{ name }}
      </h1>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNormalizeIcon } from '@/composables/useNormalizeIcon';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: null,
  },
});

const normalizeIcon = useNormalizeIcon();

const normalizedIcon = computed(() => {
  return normalizeIcon(props.icon);
});
</script>

<style scoped></style>
