import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaBinarySensor from '../HaBinarySensor.vue';

describe('HaBinarySensor.vue', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render a binary sensor card', () => {
      const entity = {
        entity_id: 'binary_sensor.motion',
        state: 'on',
        attributes: {
          friendly_name: 'Motion Sensor',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card').exists()).toBe(true);
      expect(wrapper.find('.card-display').exists()).toBe(true);
    });

    it('should display entity name', () => {
      const entity = {
        entity_id: 'binary_sensor.door',
        state: 'off',
        attributes: {
          friendly_name: 'Front Door',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Front Door');
    });

    it('should show error when entity not found', () => {
      const wrapper = mount(HaBinarySensor, {
        props: {
          entity: 'binary_sensor.nonexistent',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('not found');
    });
  });

  describe('State Display', () => {
    it('should show on state with check icon', () => {
      const entity = {
        entity_id: 'binary_sensor.motion',
        state: 'on',
        attributes: {
          friendly_name: 'Motion Detected',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.classes()).toContain('state-on');
      expect(wrapper.find('i.mdi-check-circle').exists()).toBe(true);
    });

    it('should show off state with circle icon', () => {
      const entity = {
        entity_id: 'binary_sensor.motion',
        state: 'off',
        attributes: {
          friendly_name: 'No Motion',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.classes()).toContain('state-off');
      expect(wrapper.find('i.mdi-circle-outline').exists()).toBe(true);
    });

    it('should handle true state like on', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'true',
        attributes: {
          friendly_name: 'Test',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.classes()).toContain('state-on');
    });

    it('should handle false state like off', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'false',
        attributes: {
          friendly_name: 'Test',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.classes()).toContain('state-off');
    });

    it('should show unavailable state with warning', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'unavailable',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.classes()).toContain('state-unavailable');
      expect(wrapper.find('i.mdi-help-circle-outline').exists()).toBe(true);
    });
  });

  describe('Card Styling', () => {
    it('should have success border when on', () => {
      const entity = {
        entity_id: 'binary_sensor.active',
        state: 'on',
        attributes: {
          friendly_name: 'Active',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-success').exists()).toBe(true);
    });

    it('should have secondary border when off', () => {
      const entity = {
        entity_id: 'binary_sensor.inactive',
        state: 'off',
        attributes: {
          friendly_name: 'Inactive',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-secondary').exists()).toBe(true);
    });

    it('should have warning border when unavailable', () => {
      const entity = {
        entity_id: 'binary_sensor.unavail',
        state: 'unavailable',
        attributes: {
          friendly_name: 'Unavailable',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-warning').exists()).toBe(true);
    });

    it('should have responsive column class', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-md-4').exists()).toBe(true);
    });

    it('should have rounded corners and shadow', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.rounded-4').exists()).toBe(true);
      expect(wrapper.find('.shadow-lg').exists()).toBe(true);
    });
  });

  describe('Display State Label', () => {
    it('should show "Active" when on', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.attributes('title')).toBe('Active');
    });

    it('should show "Inactive" when off', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'off',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.attributes('title')).toBe('Inactive');
    });

    it('should show "Unavailable" when unavailable', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'unavailable',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const indicator = wrapper.find('.binary-state-indicator');
      expect(indicator.attributes('title')).toBe('Unavailable');
    });
  });

  describe('Props Validation', () => {
    it('should accept string entity_id', () => {
      const wrapper = mount(HaBinarySensor, {
        props: {
          entity: 'binary_sensor.valid',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should accept object entity', () => {
      const entity = {
        entity_id: 'binary_sensor.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });



  describe('Breadth Coverage', () => {
    it('should render complete structure for on state', () => {
      const entity = {
        entity_id: 'binary_sensor.door',
        state: 'on',
        attributes: {
          friendly_name: 'Door Open',
          device_id: 'device_123',
        },
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-md-4').exists()).toBe(true);
      expect(wrapper.find('.card').exists()).toBe(true);
      expect(wrapper.find('.card-body').exists()).toBe(true);
      expect(wrapper.find('.card-title').exists()).toBe(true);
      expect(wrapper.find('.binary-state-indicator').exists()).toBe(true);
    });

    it('should handle case-insensitive states', () => {
      const states = ['ON', 'On', 'TRUE', 'True', 'OFF', 'Off', 'FALSE', 'False'];
      
      states.forEach((state) => {
        const entity = {
          entity_id: 'binary_sensor.test',
          state,
          attributes: {
            friendly_name: 'Test',
          },
        };

        const wrapper = mount(HaBinarySensor, {
          props: {
            entity,
          },
          global: {
            stubs: {
              i: true,
              svg: true,
            },
          },
        });

        const indicator = wrapper.find('.binary-state-indicator');
        if (['ON', 'On', 'TRUE', 'True'].includes(state)) {
          expect(indicator.classes()).toContain('state-on');
        } else {
          expect(indicator.classes()).toContain('state-off');
        }
      });
    });

    it('should use entity_id as fallback when friendly_name missing', () => {
      const entity = {
        entity_id: 'binary_sensor.bedroom_motion',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaBinarySensor, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('binary_sensor.bedroom_motion');
    });
  });
});
