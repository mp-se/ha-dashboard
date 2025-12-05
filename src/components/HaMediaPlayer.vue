<template>
  <div class="col-lg-4 col-md-6">
    <div
      :class="[
        'card',
        'card-control',
        'h-100',
        'rounded-4',
        'shadow-lg',
        !resolvedEntity ? 'border-warning' : cardBorderClass,
      ]"
    >
      <div :class="['card-body', !resolvedEntity ? 'text-center text-warning' : '']">
        <i v-if="!resolvedEntity" class="mdi mdi-alert-circle mdi-24px mb-2"></i>
        <div v-if="!resolvedEntity">
          Entity "{{ typeof entity === 'string' ? entity : entity?.entity_id }}" not found
        </div>

        <template v-else>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="card-title mb-0">{{ name }}</h6>
            <i :class="mediaIcon" class="media-icon"></i>
          </div>

          <!-- Media Info -->
          <div v-if="mediaTitle || mediaArtist" class="media-info mb-2 text-start">
            <div v-if="mediaTitle" class="fw-bold small">{{ mediaTitle }}</div>
            <div v-if="mediaArtist" class="text-muted small">{{ mediaArtist }}</div>
          </div>

          <!-- Volume and Source -->
          <div v-if="volumeLevel !== undefined || source" class="d-flex justify-content-between align-items-center mb-3">
            <div v-if="volumeLevel !== undefined" class="text-muted small">
              Volume: <span class="fw-bold">{{ Math.round(volumeLevel * 100) }}%</span>
            </div>
            <div v-if="source" class="text-muted small">
              Source: <span class="fw-bold">{{ source }}</span>
            </div>
          </div>

          <!-- Control Buttons -->
          <div v-if="isControllable" class="d-flex flex-wrap gap-2 mb-2">
            <button
              :class="['btn btn-sm', isOn ? 'btn-outline-success' : 'btn-outline-secondary']"
              title="Power Toggle"
              @click="callService(isOn ? 'turn_off' : 'turn_on')"
            >
              <i class="mdi mdi-power"></i>
            </button>
            <button
              class="btn btn-outline-secondary btn-sm"
              :disabled="!isOn"
              title="Previous Track"
              @click="callService('media_previous_track')"
            >
              <i class="mdi mdi-skip-previous"></i>
            </button>
            <button
              class="btn btn-outline-primary btn-sm"
              :disabled="!isOn"
              title="Play/Pause"
              @click="callService('media_play_pause')"
            >
              <i :class="isPlaying ? 'mdi mdi-pause' : 'mdi mdi-play'"></i>
            </button>
            <button
              class="btn btn-outline-secondary btn-sm"
              :disabled="!isOn"
              title="Next Track"
              @click="callService('media_next_track')"
            >
              <i class="mdi mdi-skip-next"></i>
            </button>
          </div>

          <!-- Volume Slider -->
          <div v-if="isOn && volumeLevel !== undefined" class="volume-control">
            <input
              type="range"
              class="form-range"
              min="0"
              max="1"
              step="0.01"
              :value="volumeLevel"
              @input="setVolume($event.target.value)"
            />
          </div>

        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHaStore } from '@/stores/haStore';
import { useEntityResolver } from '@/composables/useEntityResolver';

const props = defineProps({
  entity: {
    type: [Object, String],
    required: true,
    validator: (value) => {
      if (typeof value === 'string') {
        return /^[\w]+\.[\w_-]+$/.test(value);
      } else if (typeof value === 'object') {
        return value && value.entity_id && value.state && value.attributes;
      }
      return false;
    },
  },
});

const store = useHaStore();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const state = computed(() => resolvedEntity.value?.state ?? 'unknown');

const isUnavailable = computed(() => ['unavailable', 'unknown'].includes(state.value));
const isOn = computed(() => ['playing', 'paused', 'idle', 'on'].includes(state.value));
const isPlaying = computed(() => state.value === 'playing');

const cardBorderClass = computed(() => {
  if (isUnavailable.value) return 'border-warning';
  return 'border-info';
});

const name = computed(
  () =>
    resolvedEntity.value?.attributes?.friendly_name || resolvedEntity.value?.entity_id || 'Unknown'
);

const mediaIcon = computed(() => {
  const currentState = state.value?.toLowerCase();
  if (currentState === 'playing') {
    return 'mdi mdi-play-circle';
  } else if (currentState === 'paused') {
    return 'mdi mdi-pause-circle';
  } else if (currentState === 'idle' || currentState === 'off') {
    return 'mdi mdi-stop-circle';
  }
  return 'mdi mdi-speaker';
});

const isControllable = computed(() => {
  // Check if the entity supports basic media controls
  return isOn.value || ['off', 'standby'].includes(state.value);
});

// Media-specific attributes
const mediaTitle = computed(() => resolvedEntity.value?.attributes?.media_title);
const mediaArtist = computed(() => resolvedEntity.value?.attributes?.media_artist);
const volumeLevel = computed(() => resolvedEntity.value?.attributes?.volume_level);
const source = computed(() => resolvedEntity.value?.attributes?.source);

const callService = (service, data = {}) => {
  if (!resolvedEntity.value) return;
  const domain = resolvedEntity.value.entity_id.split('.')[0];
  store.callService(domain, service, {
    entity_id: resolvedEntity.value.entity_id,
    ...data,
  });
};

const setVolume = (volume) => {
  callService('volume_set', { volume_level: parseFloat(volume) });
};
</script>

<style scoped>
.media-icon {
  font-size: 1.5rem;
  color: var(--bs-info);
}

.media-info {
  font-size: 0.85rem;
  line-height: 1.4;
}

.volume-control {
  margin-top: 0.5rem;
}
</style>
