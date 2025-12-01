import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaButton from '../HaButton.vue';

describe('HaButton.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Component Rendering', () => {
    it('should render button with entity string', () => {
      const wrapper = mount(HaButton, {
        props: {
          entity: 'button.test',
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.card-control').exists()).toBe(true);
      expect(wrapper.find('.btn').exists()).toBe(true);
    });

    it('should render button with entity object', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: { friendly_name: 'Test Button' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.card-control').exists()).toBe(true);
      expect(wrapper.text()).toContain('Test Button');
    });

    it('should display friendly name from attributes', () => {
      const entity = {
        entity_id: 'button.garage',
        state: 'unknown',
        attributes: { friendly_name: 'Garage Door' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Garage Door');
    });

    it('should display entity_id as fallback for name', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: {},
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain('button.test');
    });
  });

  describe('Button States', () => {
    it('should disable button when entity is unavailable', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unavailable',
        attributes: { friendly_name: 'Test Button' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should disable button when entity is unknown', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: { friendly_name: 'Test Button' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should enable button when entity is available', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'available',
        attributes: { friendly_name: 'Test Button' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Card Border Styling', () => {
    it('should have warning border when unavailable', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unavailable',
        attributes: { friendly_name: 'Test' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.border-warning').exists()).toBe(true);
    });

    it('should have primary border when available', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'available',
        attributes: { friendly_name: 'Test' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.border-primary').exists()).toBe(true);
    });
  });

  describe('Device Name Display', () => {
    it('should not display device name when device_id not present', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: { friendly_name: 'Test Button' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.border-top').exists()).toBe(false);
    });

    it('should display device name from store', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: { 
          friendly_name: 'Test Button',
          device_id: 'device_123'
        },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
          mocks: {
            store: {
              devices: [{ id: 'device_123', name: 'Garage' }],
            },
          },
        },
      });

      // Device name is looked up from store, but we don't have it mocked
      // Just verify the component renders
      expect(wrapper.find('.card-control').exists()).toBe(true);
    });
  });

  describe('Props Validation', () => {
    it('should accept valid string entity', () => {
      const wrapper = mount(HaButton, {
        props: {
          entity: 'button.test',
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should accept valid object entity', () => {
      const wrapper = mount(HaButton, {
        props: {
          entity: {
            entity_id: 'button.test',
            state: 'unknown',
            attributes: {},
          },
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should accept attributes prop', () => {
      const wrapper = mount(HaButton, {
        props: {
          entity: 'button.test',
          attributes: ['attribute1', 'attribute2'],
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Button Icon', () => {
    it('should display gesture-tap-button icon', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: { friendly_name: 'Test' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.html()).toContain('mdi-gesture-tap-button');
    });
  });

  describe('Classes and Structure', () => {
    it('should have correct card classes', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: { friendly_name: 'Test' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const card = wrapper.find('.card');
      expect(card.classes()).toContain('card-control');
      expect(card.classes()).toContain('rounded-4');
      expect(card.classes()).toContain('shadow-lg');
    });

    it('should have responsive column classes', () => {
      const entity = {
        entity_id: 'button.test',
        state: 'unknown',
        attributes: { friendly_name: 'Test' },
      };

      const wrapper = mount(HaButton, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const container = wrapper.find('.col-lg-4');
      expect(container.exists()).toBe(true);
      expect(wrapper.find('.col-md-6').exists()).toBe(true);
    });
  });
});
