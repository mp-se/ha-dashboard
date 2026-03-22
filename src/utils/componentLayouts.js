/**
 * Component layout configuration
 * Maps component types to their Bootstrap grid classes
 * Used by EditorCanvas, views, and any layout management
 */

export const COMPONENT_LAYOUTS = {
  // Full-width components
  HaHeader: {
    classes: "col-12",
    desktop: "col-lg-12",
    tablet: "col-md-12",
    mobile: "col-12",
    description: "Full width header",
  },
  HaRowSpacer: {
    classes: "col-12",
    desktop: "col-lg-12",
    tablet: "col-md-12",
    mobile: "col-12",
    description: "Full width row spacer",
  },

  // Half-width small components
  HaChip: {
    classes: "col-6 col-sm-4 col-md-2",
    desktop: "col-md-2",
    tablet: "col-sm-4",
    mobile: "col-6",
    description: "Small compact chips",
  },

  // Standard 3-column layout (most components)
  HaAlarmPanel: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaBeerTap: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaBinarySensor: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaButton: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaEnergy: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaEntityList: {
    classes: "col-12",
    desktop: "col-lg-12",
    tablet: "col-md-12",
    mobile: "col-12",
    description: "Full width entity list container",
  },
  HaGauge: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaGlance: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaImage: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaLight: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaLink: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaMediaPlayer: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaPerson: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaPrinter: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaRoom: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaSensor: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaSensorGraph: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaSpacer: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column spacer",
  },
  HaSun: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaSwitch: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaWarning: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
  HaWeather: {
    classes: "col-lg-4 col-md-6",
    desktop: "col-lg-4",
    tablet: "col-md-6",
    mobile: "col-12",
    description: "3-column card",
  },
};

/**
 * Get layout classes for a component type
 * @param {string} componentType - The component type (e.g., "HaLight", "HaHeader")
 * @returns {string} Bootstrap grid classes
 */
export const getComponentLayoutClasses = (componentType) => {
  const layout = COMPONENT_LAYOUTS[componentType];
  return layout?.classes || "col-lg-4 col-md-6"; // Default to 3-column
};

/**
 * Get layout configuration for a component type
 * @param {string} componentType - The component type
 * @returns {object} Layout configuration with breakpoints
 */
export const getComponentLayoutConfig = (componentType) => {
  return COMPONENT_LAYOUTS[componentType] || COMPONENT_LAYOUTS.HaSensor;
};
