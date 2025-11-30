import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaWarning from '../HaWarning.vue';

describe('HaWarning.vue', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render warning card when condition matches', () => {
      const entity = {
        entity_id: 'sensor.battery',
        state: 'low',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'low',
          message: 'Battery low',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-status').exists()).toBe(true);
      expect(wrapper.text()).toContain('Warning');
    });

    it('should not render when condition does not match', () => {
      const entity = {
        entity_id: 'sensor.battery',
        state: 'high',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'low',
          message: 'Battery low',
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

    it('should display warning message', () => {
      const entity = {
        entity_id: 'sensor.humidity',
        state: 'high',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'high',
          message: 'Humidity is too high',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Humidity is too high');
    });

    it('should display Warning badge', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: 'warm',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warm',
          message: 'Temperature warning',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.badge').exists()).toBe(true);
      expect(wrapper.find('.bg-warning').exists()).toBe(true);
      expect(wrapper.text()).toContain('Warning');
    });
  });

  describe('Operators', () => {
    it('should support = operator', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning state',
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

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '>',
          value: '80',
          message: 'High temperature',
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

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '<',
          value: '20',
          message: 'Low temperature',
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
        entity_id: 'sensor.log',
        state: 'warning: low memory',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: 'contains',
          value: 'memory',
          message: 'Memory warning',
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

    it('should support in operator', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: 'in',
          value: ['warning', 'caution'],
          message: 'Alert state',
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

  describe('Attributes', () => {
    it('should check state by default', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {
          level: '5',
        },
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'State warning',
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
        state: 'ok',
        attributes: {
          level: '8',
        },
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          attribute: 'level',
          operator: '>=',
          value: '5',
          message: 'Level warning',
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

    it('should not show warning if attribute missing', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'ok',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          attribute: 'missing',
          operator: '=',
          value: 'something',
          message: 'Missing attribute',
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

  describe('Card Styling', () => {
    it('should have warning border', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-warning').exists()).toBe(true);
      expect(wrapper.find('.border-3').exists()).toBe(true);
    });

    it('should have responsive column classes', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
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
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
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
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
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
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
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
    it('should display alert-outline icon', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i.mdi-alert-outline');
      expect(icon.exists()).toBe(true);
    });

    it('should have warning text color on icon', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i.mdi-alert-outline');
      expect(icon.classes()).toContain('text-warning');
    });
  });

  describe('Badge Styling', () => {
    it('should have bg-warning on badge', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const badge = wrapper.find('.badge');
      expect(badge.classes()).toContain('bg-warning');
    });

    it('should have text-dark on badge', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const badge = wrapper.find('.badge');
      expect(badge.classes()).toContain('text-dark');
    });
  });

  describe('Props Validation', () => {
    it('should accept string entity_id', () => {
      const wrapper = mount(HaWarning, {
        props: {
          entity: 'sensor.valid',
          operator: '=',
          value: 'warning',
          message: 'Warning message',
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
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
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

  describe('Multiple Conditions', () => {
    it('should show warning when >= condition met', () => {
      const entity = {
        entity_id: 'sensor.level',
        state: '75',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '>=',
          value: '70',
          message: 'Level reaching limit',
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

    it('should show warning for not_contains operator', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'Device is running',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: 'not_contains',
          value: 'Error',
          message: 'No error detected',
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

    it('should show warning for not_in operator', () => {
      const entity = {
        entity_id: 'sensor.status',
        state: 'ok',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: 'not_in',
          value: ['error', 'critical', 'failed'],
          message: 'System healthy',
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

  describe('Text and Layout', () => {
    it('should display title as "Warning"', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Test warning',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const title = wrapper.find('.card-title');
      expect(title.text()).toContain('Warning');
    });

    it('should show message in small text', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Custom warning message',
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
      expect(message.text()).toBe('Custom warning message');
    });

    it('should have card body with flex layout', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Warning',
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
      const wrapper = mount(HaWarning, {
        props: {
          entity: 'sensor.nonexistent',
          operator: '=',
          value: 'warning',
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
    it('should render complete warning structure', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'warning',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '=',
          value: 'warning',
          message: 'Full warning',
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
      expect(wrapper.find('i.mdi-alert-outline').exists()).toBe(true);
    });

    it('should handle numeric string values', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '99',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '<=',
          value: '100',
          message: 'Near limit',
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

    it('should handle != operator', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'ok',
        attributes: {},
      };

      const wrapper = mount(HaWarning, {
        props: {
          entity,
          operator: '!=',
          value: 'error',
          message: 'Not error',
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
