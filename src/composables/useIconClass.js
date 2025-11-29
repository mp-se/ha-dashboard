/**
 * Composable to get MDI icon class based on entity attributes
 * Returns icon from entity.attributes.icon or infers from unit/domain
 */

export const useIconClass = (entity, entityId) => {
  try {
    if (!entity) return null;

    // First priority: explicit icon attribute
    const icon = entity.attributes?.icon;
    if (icon && icon.startsWith('mdi:')) {
      return `mdi mdi-${icon.split(':')[1]}`;
    }

    // Second priority: infer from unit of measurement
    const unit = entity.attributes?.unit_of_measurement || '';
    if (unit) {
      if (/°|°C|°F/.test(unit)) {
        return 'mdi mdi-thermometer';
      }
      if (/%|percent/i.test(unit)) {
        return 'mdi mdi-percent';
      }
      if (/kW|W(?!\w)|watt|power/i.test(unit)) {
        return 'mdi mdi-lightning-bolt';
      }
      if (/V$|volt|voltage/i.test(unit)) {
        return 'mdi mdi-flash';
      }
      if (/A$|amp|ampere|current/i.test(unit)) {
        return 'mdi mdi-current-ac';
      }
      if (/Hz|frequency/i.test(unit)) {
        return 'mdi mdi-sine-wave';
      }
      if (/m³|m3|L|liter|gallon/i.test(unit)) {
        return 'mdi mdi-water';
      }
      if (/km|m(?!d)|mile|mile|distance|length/i.test(unit)) {
        return 'mdi mdi-ruler';
      }
      if (/dB|sound|noise|level/i.test(unit)) {
        return 'mdi mdi-volume-high';
      }
      if (/rpm|speed/i.test(unit)) {
        return 'mdi mdi-speedometer';
      }
    }

    // Third priority: infer from domain
    if (entityId) {
      // Handle case where entityId might be an object instead of string
      const idString = typeof entityId === 'string' ? entityId : entity?.entity_id;
      if (idString) {
        const domain = idString.split('.')[0];
        const domainIconMap = {
          sensor: 'mdi mdi-gauge',
          binary_sensor: 'mdi mdi-eye',
          switch: 'mdi mdi-toggle-switch',
          light: 'mdi mdi-lightbulb',
          climate: 'mdi mdi-thermostat',
          fan: 'mdi mdi-fan',
          media_player: 'mdi mdi-speaker',
          vacuum: 'mdi mdi-robot-vacuum',
          lock: 'mdi mdi-lock',
          alarm_control_panel: 'mdi mdi-shield-home',
          camera: 'mdi mdi-camera',
          device_tracker: 'mdi mdi-map-marker',
          person: 'mdi mdi-account',
          zone: 'mdi mdi-map-marker-radius',
        };
        return domainIconMap[domain] || null;
      }
    }

    return null;
  } catch (error) {
    console.warn('Error in useIconClass for entity:', entityId, error);
    return null;
  }
};
