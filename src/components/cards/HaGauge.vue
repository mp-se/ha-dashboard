<!--
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<template>
  <div
    :class="[
      'card',
      'card-display',
      'h-100',
      'rounded-4',
      'shadow-lg',
      !resolvedEntity ? 'border-warning' : 'border-info',
    ]"
  >
    <div v-if="!resolvedEntity" class="card-body text-center text-warning">
      <i class="mdi mdi-alert-circle mdi-24px mb-2"></i>
      <div>
        Entity "{{ typeof entity === "string" ? entity : entity?.entity_id }}"
        not found
      </div>
    </div>
    <div v-else class="card-body d-flex flex-column">
      <!-- Title and Icon Row -->
      <div class="d-flex align-items-center mb-3">
        <div class="text-start flex-grow-1">
          <h6 class="card-title mb-0">{{ entityName }}</h6>
        </div>
        <i v-if="iconClass" :class="iconClass" style="font-size: 1.5rem"></i>
      </div>

      <!-- Gauge -->
      <div class="d-flex justify-content-center flex-grow-1">
        <svg :width="160" :height="160" viewBox="0 0 160 160" class="gauge-svg">
          <!-- Background circle -->
          <circle
            cx="80"
            cy="80"
            :r="radius"
            stroke="#e9ecef"
            stroke-width="6"
            fill="none"
            class="gauge-background"
          />

          <!-- Gauge arc -->
          <path
            :d="gaugeArc"
            stroke="#dee2e6"
            stroke-width="6"
            fill="none"
            stroke-linecap="round"
            class="gauge-arc"
          />

          <!-- Value arc -->
          <path
            :d="valueArc"
            stroke="#007bff"
            stroke-width="10"
            fill="none"
            stroke-linecap="round"
            class="gauge-value"
          />

          <!-- Value display in center -->
          <text
            x="80"
            y="80"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="14"
            font-weight="bold"
            fill="#212529"
            class="gauge-center-value"
          >
            {{ formattedValue }}
            <tspan v-if="entityUnit" font-size="10" fill="#6c757d">
              {{ entityUnit }}
            </tspan>
          </text>
        </svg>
      </div>

      <!-- Min/Max labels aligned with bottom of gauge -->
      <div
        class="d-flex justify-content-between px-2 text-muted small"
        style="margin-top: -1.5rem"
      >
        <span
          >{{ min
          }}<span v-if="entityUnit" class="ms-1">{{ entityUnit }}</span></span
        >
        <span
          >{{ max
          }}<span v-if="entityUnit" class="ms-1">{{ entityUnit }}</span></span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useEntityResolver } from "@/composables/useEntityResolver";

const props = defineProps({
  // Entity properties
  entity: {
    type: [Object, String],
    default: null,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
});

// Use composable for entity resolution
const { resolvedEntity } = useEntityResolver(computed(() => props.entity));

// Get name from entity's friendly_name attribute
const entityName = computed(() => {
  return (
    resolvedEntity.value?.attributes?.friendly_name ||
    (typeof props.entity === "string"
      ? props.entity
      : props.entity?.entity_id) ||
    "Gauge"
  );
});

// Get unit from entity's unit_of_measurement attribute
const entityUnit = computed(() => {
  return resolvedEntity.value?.attributes?.unit_of_measurement || "";
});

// Get numeric value from entity state
const numericValue = computed(() => {
  if (!resolvedEntity.value) return 0;
  const state = parseFloat(resolvedEntity.value.state);
  return isNaN(state) ? 0 : state;
});

// Get icon class from entity
const iconClass = computed(() => {
  if (!resolvedEntity.value) return null;

  let icon = resolvedEntity.value.attributes?.icon;

  // If no icon attribute, try to infer from entity domain or unit
  if (!icon) {
    const entityId =
      typeof props.entity === "string" ? props.entity : props.entity?.entity_id;
    const domain = entityId?.split(".")[0];
    const unit = resolvedEntity.value.attributes?.unit_of_measurement || "";

    // Infer icon based on domain or unit
    if (domain === "sensor") {
      if (unit.includes("°") || unit.includes("C") || unit.includes("F")) {
        icon = "mdi:thermometer";
      } else if (unit.includes("%")) {
        icon = "mdi:percent";
      } else if (unit.includes("kW") || unit.includes("W")) {
        icon = "mdi:lightning-bolt";
      } else {
        icon = "mdi:gauge";
      }
    }
  }

  if (icon && icon.startsWith("mdi:")) {
    return `mdi mdi-${icon.split(":")[1]}`;
  }
  return null;
});

// Gauge geometry (hardcoded for simplicity)
const radius = computed(() => 77); // (160 - 6) / 2
const startAngle = computed(() => Math.PI * 0.75); // 135 degrees
const endAngle = computed(() => Math.PI * 2.25); // 405 degrees (135 + 270)
const angleRange = computed(() => endAngle.value - startAngle.value);

// Arc calculations
const gaugeArc = computed(() => {
  const x1 = 80 + radius.value * Math.cos(startAngle.value);
  const y1 = 80 + radius.value * Math.sin(startAngle.value);
  const x2 = 80 + radius.value * Math.cos(endAngle.value);
  const y2 = 80 + radius.value * Math.sin(endAngle.value);

  const largeArcFlag = angleRange.value > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${radius.value} ${radius.value} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
});

const valueArc = computed(() => {
  const normalizedValue = Math.max(
    props.min,
    Math.min(props.max, numericValue.value),
  );
  const ratio = (normalizedValue - props.min) / (props.max - props.min);
  const valueAngle = startAngle.value + ratio * angleRange.value;

  const x1 = 80 + radius.value * Math.cos(startAngle.value);
  const y1 = 80 + radius.value * Math.sin(startAngle.value);
  const x2 = 80 + radius.value * Math.cos(valueAngle);
  const y2 = 80 + radius.value * Math.sin(valueAngle);

  const largeArcFlag = valueAngle - startAngle.value > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${radius.value} ${radius.value} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
});

// Formatted value (1 decimal place)
const formattedValue = computed(() => {
  return numericValue.value.toFixed(1);
});
</script>
