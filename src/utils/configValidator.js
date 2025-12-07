/**
 * Configuration validator for dashboard components
 * Validates entity configurations against component prop requirements
 */

import { getDefaultComponentType } from '../composables/useDefaultComponentType';
import { isValidMdiIcon, suggestMdiIcons } from './mdiIconValidator';

// Component prop schemas - defines required and optional props for each component
const componentSchemas = {
  HaWarning: {
    required: ['entity', 'operator', 'value', 'message'],
    optional: ['attribute', 'type'],
  },
  HaError: {
    required: ['entity', 'operator', 'value', 'message'],
    optional: ['attribute', 'type'],
  },
  HaGauge: {
    required: ['entity'],
    optional: ['min', 'max', 'attributes'],
  },
  HaSensor: {
    required: ['entity'],
    optional: ['attributes', 'secondEntity'],
  },
  HaLight: {
    required: ['entity'],
    optional: ['attributes'],
  },
  HaBinarySensor: {
    required: ['entity'],
    optional: ['attributes'],
  },
  HaChip: {
    required: ['entity'],
    optional: [],
  },
  HaWeather: {
    required: ['entity'],
    optional: ['attributes', 'forecast'],
  },
  HaSensorGraph: {
    required: ['entity'],
    optional: ['attributes', 'hours', 'maxPoints'],
  },
  HaMediaPlayer: {
    required: ['entity'],
    optional: [],
  },
  HaSun: {
    required: ['entity'],
    optional: [],
  },
  HaPrinter: {
    required: ['entity'],
    optional: ['black', 'cyan', 'magenta', 'yellow', 'attributes'],
  },
  HaEnergy: {
    required: [],
    optional: ['entity'],
  },
  HaEntityList: {
    required: [],
    optional: ['entities', 'getter', 'componentMap'],
  },
  HaGlance: {
    required: ['entity'],
    optional: [],
  },
  HaAlarmPanel: {
    required: ['entity'],
    optional: [],
  },
  HaButton: {
    required: ['entity'],
    optional: [],
  },
  HaSelect: {
    required: ['entity'],
    optional: [],
  },
  HaSwitch: {
    required: ['entity'],
    optional: [],
  },
  HaImage: {
    required: ['url'],
    optional: ['title'],
  },
  HaHeader: {
    required: ['name'],
    optional: ['icon'],
  },
  HaLink: {
    required: ['url', 'name', 'header'],
    optional: ['entity'],
  },
  HaPerson: {
    required: ['entity'],
    optional: [],
  },
  HaSpacer: {
    required: [],
    optional: [],
  },
  HaRowSpacer: {
    required: [],
    optional: [],
  },
  HaRoom: {
    required: ['entity'],
    optional: ['color'],
  },
  HaBeerTap: {
    required: ['entity'],
    optional: [],
  },
};

/**
 * Validate a single entity configuration against component schema
 * @param {Object} entityConfig - Entity configuration object
 * @param {string} viewName - Name of the view containing this entity
 * @param {number} entityIndex - Index of entity in the view
 * @returns {Object} Validation result { valid: boolean, errors: Array<{message: string, line?: number}> }
 */
function validateEntity(entityConfig, viewName, entityIndex) {
  const errors = [];
  
  // Get entity identifier for error messages
  let entityId = '';
  if (entityConfig.entity) {
    const entityVal = Array.isArray(entityConfig.entity) ? entityConfig.entity[0] : entityConfig.entity;
    entityId = entityVal || 'unknown';
  } else if (entityConfig.getter) {
    entityId = `getter:${entityConfig.getter}`;
  } else if (entityConfig.type === 'HaLink' || entityConfig.type === 'HaSpacer' || entityConfig.type === 'HaRowSpacer') {
    entityId = entityConfig.name || entityConfig.type;
  } else {
    entityId = 'entity-' + entityIndex;
  }

  // Determine component type (explicit or default) - type is now optional
  const componentType = entityConfig.type || getDefaultComponentType(entityConfig.entity, entityConfig.getter);

  const schema = componentSchemas[componentType];
  if (!schema) {
    errors.push({
      message: `Unknown component type '${componentType}' in view '${viewName}' for entity '${entityId}'`,
    });
    return { valid: false, errors };
  }

  // Check required props - skip 'entity' if using getter (getter provides entities)
  for (const prop of schema.required) {
    // If using a getter and the required prop is 'entity', skip this requirement
    if (prop === 'entity' && entityConfig.getter) {
      continue;
    }
    
    if (!(prop in entityConfig)) {
      errors.push({
        message: `Component '${componentType}' in view '${viewName}' entity '${entityId}' is missing required prop '${prop}'`,
      });
    }
  }

  // Warn about unknown props
  const allowedProps = new Set([
    'type', 'getter', 'entity', 'attributes',
    // Common optional props
    'operator', 'value', 'message', 'attribute',
    // HaSensorGraph / HaSensor (secondEntity is deprecated for HaSensorGraph)
    'secondEntity',
    // HaPrinter
    'black', 'cyan', 'magenta', 'yellow',
    // HaLink
    'url', 'name', 'header', 'label', 'icon',
    // HaImage
    'title',
    // Gauge
    'min', 'max',
    // HaSensorGraph
    'hours', 'maxPoints',
    // Add all component-specific schema props
    ...Object.values(schema.required),
    ...Object.values(schema.optional),
  ]);
  
  for (const prop of Object.keys(entityConfig)) {
    if (!allowedProps.has(prop)) {
      errors.push({
        message: `Component '${componentType}' in view '${viewName}' entity '${entityId}' has unknown prop '${prop}'`,
      });
    }
  }

  // Validate icon prop if present (HaHeader, HaLink, etc.)
  if (entityConfig.icon && typeof entityConfig.icon === 'string') {
    if (!isValidMdiIcon(entityConfig.icon)) {
      const suggestions = suggestMdiIcons(entityConfig.icon);
      const suggestionText = suggestions.length > 0 
        ? ` Did you mean: ${suggestions.map(s => `"mdi-${s}"`).join(', ')}?`
        : '';
      errors.push({
        message: `Component '${componentType}' in view '${viewName}' entity '${entityId}' has invalid icon '${entityConfig.icon}'. Not a valid MDI icon.${suggestionText}`,
      });
    }
  }

  // Warn about deprecated secondEntity prop in HaSensorGraph
  if (componentType === 'HaSensorGraph' && entityConfig.secondEntity) {
    errors.push({
      message: `⚠️  DEPRECATED: Component 'HaSensorGraph' in view '${viewName}' entity '${entityId}' uses deprecated 'secondEntity' prop. ` +
        `Update your config to use array syntax instead: "entity": ["${entityConfig.entity}", "${entityConfig.secondEntity}"] ` +
        `(supports up to 3 entities)`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate the entire dashboard configuration
 * @param {Object} config - Dashboard configuration object
 * @returns {Object} Validation result { valid: boolean, errors: Array<{message: string, line?: number}>, errorCount: number }
 */
export function validateConfig(config) {
  const errors = [];

  if (!config) {
    return {
      valid: false,
      errors: [{ message: 'Configuration is null or undefined', line: 1 }],
      errorCount: 1,
    };
  }

  // Validate app config
  if (!config.app) {
    errors.push({ message: 'Missing "app" section in configuration', line: 2 });
  } else {
    if (typeof config.app.title !== 'string') {
      errors.push({ message: 'app.title must be a string', line: 3 });
    }
  }

  // Validate views
  if (!Array.isArray(config.views)) {
    errors.push({ message: 'Configuration must have a "views" array', line: 10 });
    return {
      valid: false,
      errors,
      errorCount: errors.length,
    };
  }

  if (config.views.length === 0) {
    errors.push({ message: 'Views array cannot be empty', line: 11 });
  }

  // Validate each view
  for (let viewIndex = 0; viewIndex < config.views.length; viewIndex++) {
    const view = config.views[viewIndex];
    if (!view.name) {
      errors.push({ message: `View ${viewIndex} must have a "name" property`, line: 12 + viewIndex });
      continue;
    }

    if (!view.label) {
      errors.push({
        message: `View '${view.name}' is missing "label" property`,
        line: 13 + viewIndex,
      });
    }

    if (!view.icon) {
      errors.push({
        message: `View '${view.name}' is missing "icon" property`,
        line: 14 + viewIndex,
      });
    } else if (view.icon && !isValidMdiIcon(view.icon)) {
      // Validate icon is a real MDI icon
      const suggestions = suggestMdiIcons(view.icon);
      const suggestionText = suggestions.length > 0 
        ? ` Did you mean: ${suggestions.map(s => `"mdi-${s}"`).join(', ')}?`
        : '';
      errors.push({
        message: `View '${view.name}' has invalid icon '${view.icon}'. Not a valid MDI icon.${suggestionText}`,
        line: 14 + viewIndex,
      });
    }

    // Validate hidden is boolean if present
    if (view.hidden !== undefined && typeof view.hidden !== 'boolean') {
      errors.push({
        message: `View '${view.name}' hidden property must be a boolean`,
        line: 15 + viewIndex,
      });
    }

    // Validate entities in this view
    if (Array.isArray(view.entities)) {
      for (let entityIndex = 0; entityIndex < view.entities.length; entityIndex++) {
        const entity = view.entities[entityIndex];
        const validation = validateEntity(entity, view.name, entityIndex);
        if (!validation.valid) {
          // Add line number hints for entities
          const entityLine = 20 + viewIndex * 10 + entityIndex;
          validation.errors.forEach((err) => {
            errors.push({
              message: err.message,
              line: entityLine,
            });
          });
        }
      }
    } else if (view.entities !== undefined) {
      errors.push({
        message: `View '${view.name}' has invalid "entities" - must be an array`,
        line: 15 + viewIndex,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    errorCount: errors.length,
  };
}
