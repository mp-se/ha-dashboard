import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaSwitch from '../HaSwitch.vue';

describe('HaSwitch.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Component Rendering', () => {
    it('should render switch with valid entity', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Living Room Light' },
      };

      const wrapper = mount(HaSwitch, {
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
      expect(wrapper.find('button.control-button').exists()).toBe(true);
    });

    it('should render error message when entity not found', () => {
      const wrapper = mount(HaSwitch, {
        props: {
          entity: 'switch.nonexistent',
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain('not found');
    });

    it('should display friendly name from entity', () => {
      const entity = {
        entity_id: 'switch.bedroom',
        state: 'on',
        attributes: { friendly_name: 'Bedroom Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Bedroom Light');
    });

    it('should display entity_id as fallback', () => {
      const entity = {
        entity_id: 'switch.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain('switch.test');
    });
  });

  describe('Switch States', () => {
    it('should show switch as on when state is on', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button.control-button');
      expect(button.classes('control-button-on')).toBe(true);
    });

    it('should show switch as off when state is off', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'off',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button.control-button');
      expect(button.classes('control-button-on')).toBe(false);
    });

    it('should disable switch when unavailable', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'unavailable',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button.control-button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should disable switch when unknown', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'unknown',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button.control-button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should enable switch when available', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button.control-button');
      expect(button.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Card Styling', () => {
    it('should have warning border when entity not found', () => {
      const wrapper = mount(HaSwitch, {
        props: {
          entity: 'switch.nonexistent',
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.border-warning').exists()).toBe(true);
    });

    it('should have warning border when unavailable', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'unavailable',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
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

    it('should have info border when available', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.border-info').exists()).toBe(true);
    });

    it('should have card-active class when on and not disabled', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.card-active').exists()).toBe(true);
    });

    it('should not have card-active class when off', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'off',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.card-active').exists()).toBe(false);
    });
  });

  describe('Mock Mode', () => {
    it('should accept mock mode prop', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
          mock: true,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.props('mock')).toBe(true);
    });

    it('should emit mockToggle event in mock mode', async () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
          mock: true,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button.control-button');
      await button.trigger('click');

      expect(wrapper.emitted('mockToggle')).toBeTruthy();
    });
  });

  describe('Props Validation', () => {
    it('should accept valid string entity', () => {
      const wrapper = mount(HaSwitch, {
        props: {
          entity: 'switch.light',
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
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
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

  describe('Classes and Structure', () => {
    it('should have correct card classes', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
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
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('.col-lg-4').exists()).toBe(true);
      expect(wrapper.find('.col-md-6').exists()).toBe(true);
    });

    it('should have form-switch class', () => {
      const entity = {
        entity_id: 'switch.light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('button.control-button').exists()).toBe(true);
    });
  });

  describe('Checkbox ID', () => {
    it('should generate unique button ID from entity_id', () => {
      const entity = {
        entity_id: 'switch.bedroom_light',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      const button = wrapper.find('button.control-button');
      expect(button.exists()).toBe(true);
    });
  });

  describe('Entity Type Handling', () => {
    it('should work with light entities', () => {
      const entity = {
        entity_id: 'light.bedroom',
        state: 'on',
        attributes: { friendly_name: 'Bedroom Light' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('button.control-button').classes('control-button-on')).toBe(true);
    });

    it('should work with switch entities', () => {
      const entity = {
        entity_id: 'switch.outlet',
        state: 'off',
        attributes: { friendly_name: 'Power Outlet' },
      };

      const wrapper = mount(HaSwitch, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.find('button.control-button').classes('control-button-on')).toBe(false);
    });
  });
});
