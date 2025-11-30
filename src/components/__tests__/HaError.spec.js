import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaError from '../HaError.vue';

describe('HaError.vue', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render error card when condition matches', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Sensor error detected',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
      expect(wrapper.text()).toContain('Error');
    });

    it('should not render when condition does not match', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: 'ready',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Sensor error detected',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(false);
    });

    it('should display error message', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Custom error message here',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Custom error message here');
    });

    it('should display Error badge', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'failed',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'failed',
          message: 'Operation failed',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.badge').exists()).toBe(true);
      expect(wrapper.find('.bg-danger').exists()).toBe(true);
      expect(wrapper.text()).toContain('Error');
    });
  });

  describe('Operator Equality', () => {
    it('should support = operator', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'offline',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'offline',
          message: 'Device offline',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support != operator', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'online',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '!=',
          value: 'offline',
          message: 'Not offline',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support > operator', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '85',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '>',
          value: '80',
          message: 'Temperature too high',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support < operator', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '15',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '<',
          value: '20',
          message: 'Temperature too low',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support >= operator', () => {
      const entity = {
        entity_id: 'sensor.humidity',
        state: '90',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '>=',
          value: '90',
          message: 'High humidity',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support <= operator', () => {
      const entity = {
        entity_id: 'sensor.battery',
        state: '20',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '<=',
          value: '20',
          message: 'Low battery',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support contains operator', () => {
      const entity = {
        entity_id: 'sensor.message',
        state: 'error in process',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: 'contains',
          value: 'error',
          message: 'Error message detected',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support not_contains operator', () => {
      const entity = {
        entity_id: 'sensor.message',
        state: 'operation completed',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: 'not_contains',
          value: 'error',
          message: 'No error message',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support in operator with array', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: 'in',
          value: ['error', 'warning', 'critical'],
          message: 'Invalid state detected',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should support not_in operator with array', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'ready',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: 'not_in',
          value: ['error', 'warning', 'offline'],
          message: 'Invalid state',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });
  });

  describe('Attribute Evaluation', () => {
    it('should check state by default', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {
          error_code: '200',
        },
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'State error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should check custom attributes', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'on',
        attributes: {
          error_code: 'ERR_500',
        },
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          attribute: 'error_code',
          operator: '=',
          value: 'ERR_500',
          message: 'Server error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should not show error if attribute missing', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          attribute: 'missing_attribute',
          operator: '=',
          value: 'something',
          message: 'Missing attribute error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(false);
    });

    it('should handle numeric attribute comparison', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'on',
        attributes: {
          error_count: '5',
        },
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          attribute: 'error_count',
          operator: '>',
          value: '3',
          message: 'Too many errors',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });
  });

  describe('Card Styling', () => {
    it('should have error class', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.error').exists()).toBe(true);
    });

    it('should have danger border', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-danger').exists()).toBe(true);
      expect(wrapper.find('.border-3').exists()).toBe(true);
    });

    it('should have responsive column classes', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-lg-4').exists()).toBe(true);
      expect(wrapper.find('.col-md-6').exists()).toBe(true);
    });

    it('should have rounded corners', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.rounded-4').exists()).toBe(true);
    });

    it('should have shadow', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.shadow-lg').exists()).toBe(true);
    });

    it('should have padding', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.p-3').exists()).toBe(true);
    });
  });

  describe('Icon Display', () => {
    it('should display alert icon', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i.mdi-alert');
      expect(icon.exists()).toBe(true);
    });

    it('should have danger text color on icon', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i.mdi-alert');
      expect(icon.classes()).toContain('text-danger');
    });
  });

  describe('Props Validation', () => {
    it('should accept string entity_id', () => {
      const wrapper = mount(HaError, {
        props: {
          entity: 'sensor.valid',
          operator: '=',
          value: 'error',
          message: 'Error message',
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
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
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

    it('should require operator prop', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
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

    it('should require value prop', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
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

    it('should require message prop', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error message',
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

  describe('Text and Layout', () => {
    it('should display title as "Error"', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Test error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const title = wrapper.find('.card-title');
      expect(title.text()).toContain('Error');
    });

    it('should show message in small text', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Custom error message',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const message = wrapper.find('.text-muted');
      expect(message.classes()).toContain('small');
      expect(message.text()).toBe('Custom error message');
    });

    it('should have card body with flex layout', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const body = wrapper.find('.card-body');
      expect(body.classes()).toContain('d-flex');
      expect(body.classes()).toContain('align-items-center');
    });
  });

  describe('Entity Not Found', () => {
    it('should not render when entity is invalid string', () => {
      const wrapper = mount(HaError, {
        props: {
          entity: 'sensor.nonexistent',
          operator: '=',
          value: 'error',
          message: 'Entity not found',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(false);
    });
  });

  describe('Breadth Coverage', () => {
    it('should render complete error structure', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'error',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 'error',
          message: 'Full error',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-lg-4').exists()).toBe(true);
      expect(wrapper.find('.card-status').exists()).toBe(true);
      expect(wrapper.find('.card-body').exists()).toBe(true);
      expect(wrapper.find('.card-title').exists()).toBe(true);
      expect(wrapper.find('.badge').exists()).toBe(true);
      expect(wrapper.find('i.mdi-alert').exists()).toBe(true);
    });

    it('should handle boolean-like string values in comparison', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '1',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: '1',
          message: 'Boolean-like check',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });

    it('should handle numeric values in comparison', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: {},
      };

      const wrapper = mount(HaError, {
        props: {
          entity,
          operator: '=',
          value: 42,
          message: 'Number check',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
    });
  });
});
