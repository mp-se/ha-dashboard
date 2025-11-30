import { describe, it, expect } from 'vitest';
import { validateConfig } from '../configValidator';

describe('configValidator', () => {
  describe('validateConfig - basic structure', () => {
    it('should reject null configuration', () => {
      const result = validateConfig(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject undefined configuration', () => {
      const result = validateConfig(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require app section', () => {
      const config = { views: [] };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('app'))).toBe(true);
    });

    it('should require views array', () => {
      const config = { app: { title: 'Test' } };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('views'))).toBe(true);
    });

    it('should require non-empty views array', () => {
      const config = { app: { title: 'Test' }, views: [] };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('empty'))).toBe(true);
    });
  });

  describe('validateConfig - app section', () => {
    it('should validate app.title is string', () => {
      const config = { app: { title: 123 }, views: [{ name: 'view1', label: 'View 1', icon: 'mdi:home', entities: [] }] };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('title'))).toBe(true);
    });

    it('should accept valid app title', () => {
      const config = { app: { title: 'Dashboard' }, views: [{ name: 'view1', label: 'View 1', icon: 'mdi:home', entities: [] }] };
      const result = validateConfig(config);
      expect(result.errors.filter(e => e.message.includes('title')).length).toBe(0);
    });
  });

  describe('validateConfig - views', () => {
    it('should require view name', () => {
      const config = {
        app: { title: 'Test' },
        views: [{ label: 'View 1', icon: 'mdi:home', entities: [] }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('name'))).toBe(true);
    });

    it('should require view label', () => {
      const config = {
        app: { title: 'Test' },
        views: [{ name: 'view1', icon: 'mdi:home', entities: [] }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('label'))).toBe(true);
    });

    it('should require view icon', () => {
      const config = {
        app: { title: 'Test' },
        views: [{ name: 'view1', label: 'View 1', entities: [] }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('icon'))).toBe(true);
    });

    it('should require entities array or undefined', () => {
      const config = {
        app: { title: 'Test' },
        views: [{ name: 'view1', label: 'View 1', icon: 'mdi:home', entities: 'invalid' }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('invalid "entities"'))).toBe(true);
    });

    it('should accept valid view', () => {
      const config = {
        app: { title: 'Dashboard' },
        views: [{ name: 'home', label: 'Home', icon: 'mdi:home', entities: [] }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateConfig - entities', () => {
    it('should validate entity with entity property', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ entity: 'sensor.test' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.errors.filter(e => e.message.includes('sensor.test')).length).toBe(0);
    });

    it('should validate entity with type property', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ entity: 'sensor.test', type: 'HaSensor' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should infer component type from domain', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ entity: 'light.bedroom' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject unknown component type', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ entity: 'sensor.test', type: 'UnknownComponent' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('Unknown component type'))).toBe(true);
    });

    it('should allow getter without entity for HaEntityList', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ type: 'HaEntityList', getter: 'getLights' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should skip entity requirement when getter provided', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ getter: 'getTemperatures', attributes: {} }],
        }],
      };
      const result = validateConfig(config);
      // Should not require entity when getter is present
      expect(result.errors.filter(e => e.message.includes('missing required prop')).length).toBe(0);
    });
  });

  describe('validateConfig - special components', () => {
    it('should allow HaLink with required props', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ type: 'HaLink', url: 'https://example.com', name: 'Link', header: 'External' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should allow HaImage with url', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ type: 'HaImage', url: 'https://example.com/image.jpg' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should allow HaHeader with name', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ type: 'HaHeader', name: 'Section Header' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should allow HaSpacer without entity', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ type: 'HaSpacer' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateConfig - conditional entities', () => {
    it('should validate HaWarning with required props', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{
            type: 'HaWarning',
            entity: 'sensor.temp',
            operator: '>',
            value: 30,
            message: 'Too hot',
          }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should require operator for HaWarning', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{
            type: 'HaWarning',
            entity: 'sensor.temp',
            value: 30,
            message: 'Too hot',
          }],
        }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('operator'))).toBe(true);
    });
  });

  describe('validateConfig - error handling', () => {
    it('should return proper error count', () => {
      const config = { app: { title: 123 }, views: [] };
      const result = validateConfig(config);
      expect(result.errorCount).toBe(result.errors.length);
    });

    it('should assign line numbers to errors', () => {
      const config = { views: [] };
      const result = validateConfig(config);
      expect(result.errors.some(e => typeof e.line === 'number')).toBe(true);
    });

    it('should collect multiple errors', () => {
      const config = {
        app: {},
        views: [],
      };
      const result = validateConfig(config);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateConfig - array entities', () => {
    it('should handle array of entity IDs', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ entity: ['light.bedroom', 'light.kitchen'] }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateConfig - optional props', () => {
    it('should allow optional attributes prop', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ entity: 'sensor.test', attributes: { min: 0, max: 100 } }],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject unknown props', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [{ entity: 'sensor.test', unknownProp: 'value' }],
        }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('unknown prop'))).toBe(true);
    });
  });

  describe('validateConfig - complex scenarios', () => {
    it('should validate complete dashboard config', () => {
      const config = {
        app: { title: 'Smart Home Dashboard' },
        views: [
          {
            name: 'living-room',
            label: 'Living Room',
            icon: 'mdi:sofa',
            entities: [
              { type: 'HaHeader', name: 'Lights' },
              { entity: 'light.main', attributes: {} },
              { entity: 'light.accent', attributes: {} },
              { type: 'HaSpacer' },
              { type: 'HaHeader', name: 'Temperature' },
              { entity: 'sensor.temp', attributes: { min: 15, max: 30 } },
            ],
          },
        ],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should handle mixed valid and invalid entities', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [
            { entity: 'sensor.test1' },
            { entity: 'light.test', unknownProp: 'bad' },
          ],
        }],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('unknownProp'))).toBe(true);
    });

    it('should warn about deprecated secondEntity prop in HaSensorGraph', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [
            { 
              entity: 'sensor.temperature',
              secondEntity: 'sensor.humidity',
              type: 'HaSensorGraph'
            },
          ],
        }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => 
        e.message.includes('DEPRECATED') && 
        e.message.includes('secondEntity') && 
        e.message.includes('array syntax')
      )).toBe(true);
    });

    it('should not warn about secondEntity for non-HaSensorGraph components', () => {
      const config = {
        app: { title: 'Test' },
        views: [{
          name: 'view1',
          label: 'View 1',
          icon: 'mdi:home',
          entities: [
            { 
              entity: 'sensor.temperature',
              type: 'HaSensor'
            },
          ],
        }],
      };
      const result = validateConfig(config);
      expect(result.errors.some(e => e.message.includes('DEPRECATED'))).toBe(false);
    });
  });
});
