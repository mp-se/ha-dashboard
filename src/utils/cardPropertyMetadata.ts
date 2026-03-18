/**
 * Card Property Metadata System
 * 
 * Defines all configurable properties for each card type.
 * Used by the Entity Inspector to dynamically render property editors.
 */

export interface PropertyDefinition {
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'entity-list' | 'complex-entity-list' | 'icon' | 'color' | 'number';
  label: string;
  default?: any;
  required?: boolean;
  options?: string[] | { label: string; value: any }[];
  help?: string;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface CardPropertiesDefinition {
  [key: string]: PropertyDefinition;
}

// Define all card types and their configurable properties
export const CARD_PROPERTY_METADATA: Record<string, CardPropertiesDefinition> = {
  // ==============================
  // Cards with Conditional Logic
  // ==============================
  HaWarning: {
    operator: {
      type: 'select',
      label: 'Operator',
      required: true,
      options: [
        { label: 'Equals (=)', value: '=' },
        { label: 'Not Equals (!=)', value: '!=' },
        { label: 'Greater Than (>)', value: '>' },
        { label: 'Less Than (<)', value: '<' },
        { label: 'Greater or Equal (>=)', value: '>=' },
        { label: 'Less or Equal (<=)', value: '<=' },
        { label: 'Contains', value: 'contains' },
        { label: 'Not Contains', value: 'not_contains' },
        { label: 'In List', value: 'in' },
        { label: 'Not In List', value: 'not_in' },
      ],
      help: 'How to evaluate the condition',
    },
    attribute: {
      type: 'text',
      label: 'Attribute to Check',
      default: 'state',
      required: false,
      help: "Leave empty to use entity's state property",
    },
    value: {
      type: 'text',
      label: 'Comparison Value',
      required: true,
      help: 'Value to compare against. Use comma-separated list for "in"/"not_in" operators',
    },
    message: {
      type: 'textarea',
      label: 'Warning Message',
      required: true,
      maxLength: 500,
      help: 'Message to display when condition is true',
    },
  },

  HaError: {
    operator: {
      type: 'select',
      label: 'Operator',
      required: true,
      options: [
        { label: 'Equals (=)', value: '=' },
        { label: 'Not Equals (!=)', value: '!=' },
        { label: 'Greater Than (>)', value: '>' },
        { label: 'Less Than (<)', value: '<' },
        { label: 'Greater or Equal (>=)', value: '>=' },
        { label: 'Less or Equal (<=)', value: '<=' },
        { label: 'Contains', value: 'contains' },
        { label: 'Not Contains', value: 'not_contains' },
        { label: 'In List', value: 'in' },
        { label: 'Not In List', value: 'not_in' },
      ],
      help: 'How to evaluate the condition',
    },
    attribute: {
      type: 'text',
      label: 'Attribute to Check',
      default: 'state',
      required: false,
      help: "Leave empty to use entity's state property",
    },
    value: {
      type: 'text',
      label: 'Comparison Value',
      required: true,
      help: 'Value to compare against',
    },
    message: {
      type: 'textarea',
      label: 'Error Message',
      required: true,
      maxLength: 500,
      help: 'Message to display when condition is true',
    },
  },

  // ==============================
  // Cards with Navigation/Links
  // ==============================
  HaLink: {
    url: {
      type: 'text',
      label: 'URL',
      required: true,
      pattern: '^https?://',
      help: 'Full URL (must start with http:// or https://)',
    },
    name: {
      type: 'text',
      label: 'Link Name',
      required: true,
      maxLength: 100,
      help: 'Text to display for the link',
    },
    header: {
      type: 'text',
      label: 'Card Title',
      required: true,
      maxLength: 100,
      help: 'Title shown at top of card',
    },
  },

  // ==============================
  // Cards with Headers
  // ==============================
  HaHeader: {
    name: {
      type: 'text',
      label: 'Title',
      required: true,
      maxLength: 200,
      help: 'Header text to display',
    },
    icon: {
      type: 'icon',
      label: 'Icon',
      required: false,
      help: 'MDI icon name (e.g., mdi-home)',
    },
  },

  // ==============================
  // Cards with Multiple Entities
  // ==============================
  HaRoom: {
    color: {
      type: 'color',
      label: 'Icon Color',
      required: false,
      help: 'Color for the main room icon',
    },
  },

  HaGlance: {
    // No special properties beyond entity list
    // Entity selection is handled separately
  },

  HaSensorGraph: {
    // No special properties beyond entity list
    // Entity selection and hours selector handled in component
  },

  // ==============================
  // Cards with Display Options
  // ==============================
  HaWeather: {
    forecast: {
      type: 'boolean',
      label: 'Show Forecast',
      required: false,
      default: false,
      help: 'Display weather forecast section',
    },
  },

  // HaEntityList has complex getter logic - handled separately
  HaEntityList: {
    // Complex property handling via componentMap and getters
    // Inspector handles this with special UI
  },

  // ==============================
  // Standard Cards (No Special Properties)
  // ==============================
  HaSwitch: {},
  HaBinarySensor: {},
  HaSensor: {},
  HaLight: {},
  HaSelect: {},
  HaButton: {},
  HaGauge: {},
  HaPerson: {},
  HaPrinter: {},
  HaImage: {},
  HaSun: {},
  HaMediaPlayer: {},
  HaAlarmPanel: {},
  HaBeerTap: {},
  HaChip: {},
};

/**
 * Get property metadata for a specific card type
 */
export function getCardProperties(cardType: string): CardPropertiesDefinition {
  return CARD_PROPERTY_METADATA[cardType] || {};
}

/**
 * Get list of property names that have special editors (not standard attributes)
 */
export function getSpecialProperties(cardType: string): string[] {
  const props = getCardProperties(cardType);
  return Object.keys(props).filter((key) => {
    const prop = props[key];
    return prop.type !== 'text' || prop.type === 'entity-list';
  });
}

/**
 * Check if a card type has special properties
 */
export function hasSpecialProperties(cardType: string): boolean {
  const props = getCardProperties(cardType);
  return Object.keys(props).length > 0;
}

/**
 * Validate a property value against its definition
 */
export function validateProperty(
  cardType: string,
  propertyName: string,
  value: any,
): { valid: boolean; error?: string } {
  const props = getCardProperties(cardType);
  const prop = props[propertyName];

  if (!prop) {
    return { valid: true }; // Unknown property is allowed
  }

  // Check required
  if (prop.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${prop.label} is required` };
  }

  // Skip validation for empty optional values
  if (!prop.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Type-specific validation
  if (prop.type === 'text' && prop.maxLength && String(value).length > prop.maxLength) {
    return { valid: false, error: `${prop.label} must be ${prop.maxLength} characters or less` };
  }

  if (prop.type === 'text' && prop.pattern && !new RegExp(prop.pattern).test(String(value))) {
    return { valid: false, error: `${prop.label} format is invalid` };
  }

  if (prop.type === 'number') {
    if (prop.min !== undefined && Number(value) < prop.min) {
      return { valid: false, error: `${prop.label} must be at least ${prop.min}` };
    }
    if (prop.max !== undefined && Number(value) > prop.max) {
      return { valid: false, error: `${prop.label} must be at most ${prop.max}` };
    }
  }

  return { valid: true };
}

/**
 * Get all property names that need to be persisted for a card type
 */
export function getCardPropertyNames(cardType: string): string[] {
  return Object.keys(getCardProperties(cardType));
}
