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
      <div
        :class="[
          'card-body',
          !resolvedEntity ? 'text-center text-warning' : '',
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
          <!-- Header: Entity Icon | Title/Subtitle | Source -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <!-- Entity Icon -->
            <div class="icon-bg-wrapper">
              <div
                class="icon-bg"
                :style="{ backgroundColor: iconBackgroundColor }"
              >
                <i
                  class="mdi mdi-speaker"
                  :style="{ fontSize: '1.5rem', color: iconColor }"
                ></i>
              </div>
            </div>

            <!-- Title and Subtitle -->
            <div style="flex: 1; min-width: 0" class="text-start">
              <h6 class="card-title mb-1">{{ name }}</h6>
              <p
                class="text-muted mb-0"
                style="font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
              >
                {{ mediaSubtitle }}
              </p>
            </div>
          </div>

          <!-- Middle Row: Volume + Playback Controls + Power -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <!-- Volume Control (Left) - Always show -->
            <div class="d-flex align-items-center gap-2" style="flex: 1">
              <i
                class="mdi mdi-volume-high"
                style="font-size: 1.2rem; color: #666; flex-shrink: 0"
              ></i>
              <input
                type="range"
                class="form-range"
                style="flex: 1"
                min="0"
                max="1"
                step="0.01"
                :value="volumeLevel || 0"
                @input="setVolume($event.target.value)"
              />
            </div>

            <!-- Playback Controls (Center) -->
            <div
              class="d-flex align-items-center gap-2"
              style="flex-shrink: 0"
            >
              <!-- Skip Previous -->
              <button
                class="btn btn-outline-secondary btn-sm"
                :disabled="!isOn"
                title="Previous Track"
                @click="callService('media_previous_track')"
              >
                <i class="mdi mdi-skip-previous"></i>
              </button>

              <!-- Play/Pause -->
              <button
                class="btn btn-primary btn-sm"
                :disabled="!isOn"
                title="Play/Pause"
                @click="callService('media_play_pause')"
              >
                <i
                  :class="[
                    isPlaying ? 'mdi mdi-pause' : 'mdi mdi-play'
                  ]"
                  style="color: white"
                ></i>
              </button>

              <!-- Skip Next -->
              <button
                class="btn btn-outline-secondary btn-sm"
                :disabled="!isOn"
                title="Next Track"
                @click="callService('media_next_track')"
              >
                <i class="mdi mdi-skip-next"></i>
              </button>

              <!-- Power Button (Right, after playback controls) -->
              <button
                class="btn btn-outline-secondary btn-sm"
                style="margin-left: 0.5rem"
                title="Power Toggle"
                @click="callService(isOn ? 'turn_off' : 'turn_on')"
              >
                <i class="mdi mdi-power"></i>
              </button>
            </div>
          </div>

          <!-- Bottom: Progress Bar -->
          <div v-if="mediaPosition !== undefined && mediaDuration" class="progress-container">
            <div
              :class="{ 'progress-indeterminate': isPlaying && mediaPosition === 0 && mediaDuration > 0 }"
              style="
                background-color: #e9ecef;
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
                cursor: pointer;
              "
            >
              <div
                :style="{ width: progressWidth }"
                style="
                  background-color: #0078d4;
                  height: 100%;
                  transition: width 0.1s linear;
                "
              ></div>
              <!-- Draggable handle -->
              <div
                :style="{ left: progressWidth }"
                style="
                  position: absolute;
                  top: 50%;
                  transform: translate(-50%, -50%);
                  width: 16px;
                  height: 16px;
                  background-color: #0078d4;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                "
              ></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useHaStore } from "@/stores/haStore";
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

const store = useHaStore();

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(props.entity);

const currentTime = ref(Date.now());

const state = computed(() => resolvedEntity.value?.state ?? "unknown");

const isUnavailable = computed(() =>
  ["unavailable", "unknown"].includes(state.value),
);
const isOn = computed(() =>
  ["playing", "paused", "idle", "on"].includes(state.value),
);
const isPlaying = computed(() => state.value === "playing");

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

const iconColor = computed(() => {
  if (isUnavailable.value) return "#ff6b6b";
  return "#0078d4";
});

const iconBackgroundColor = computed(() => {
  if (isUnavailable.value) return "rgba(255, 107, 107, 0.2)";
  return "rgba(0, 120, 212, 0.2)";
});

// Media-specific attributes
const mediaTitle = computed(
  () => resolvedEntity.value?.attributes?.media_title,
);
const mediaArtist = computed(
  () => resolvedEntity.value?.attributes?.media_artist,
);
const mediaSubtitle = computed(() => {
  if (mediaTitle.value && mediaArtist.value) {
    return `${mediaTitle.value} - ${mediaArtist.value}`;
  }
  return mediaTitle.value || mediaArtist.value || "";
});
const volumeLevel = computed(
  () => resolvedEntity.value?.attributes?.volume_level,
);
const mediaPosition = computed(() => {
  return resolvedEntity.value?.attributes?.media_position;
});

const mediaDuration = computed(() => {
  return resolvedEntity.value?.attributes?.media_duration;
});

const mediaPositionUpdatedAt = computed(() => {
  const timestamp = resolvedEntity.value?.attributes?.media_position_updated_at;
  return timestamp ? new Date(timestamp).getTime() : null;
});

// Calculate estimated position using timestamp + elapsed time
const estimatedPosition = computed(() => {
  if (!isPlaying.value || mediaPosition.value === undefined || !mediaPositionUpdatedAt.value) {
    return mediaPosition.value || 0;
  }
  
  const elapsedSeconds = (currentTime.value - mediaPositionUpdatedAt.value) / 1000;
  const estimated = mediaPosition.value + elapsedSeconds;
  return Math.min(estimated, mediaDuration.value || estimated);
});

const progressPercentage = computed(() => {
  // If playing but position is 0 and no timestamp, show indeterminate progress (50%)
  if (isPlaying.value && mediaPosition.value === 0 && mediaDuration.value > 0 && !mediaPositionUpdatedAt.value) {
    return 50;
  }
  // Check if we have the required attributes
  if (
    estimatedPosition.value === undefined ||
    !mediaDuration.value ||
    mediaDuration.value === 0
  ) {
    return 0;
  }
  return (estimatedPosition.value / mediaDuration.value) * 100;
});

const progressWidth = computed(() => `${progressPercentage.value}%`);

// Update currentTime for smooth progress tracking
let updateInterval = null;
onMounted(() => {
  updateInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 100);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

const callService = (service, data = {}) => {
  if (!resolvedEntity.value) return;
  const domain = resolvedEntity.value.entity_id.split(".")[0];
  store.callService(domain, service, {
    entity_id: resolvedEntity.value.entity_id,
    ...data,
  });
};

const setVolume = (volume) => {
  callService("volume_set", { volume_level: parseFloat(volume) });
};
</script>

<style scoped>
.progress-container {
  margin-top: 0.5rem;
}

@keyframes pulse-progress {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.progress-indeterminate {
  animation: pulse-progress 2s ease-in-out infinite;
}
</style>
