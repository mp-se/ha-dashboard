import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaChip from '../HaChip.vue';

describe('HaChip.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Component Rendering', () => {
    it('should render chip with valid entity', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.find('.card-display').exists()).toBe(true);
    });

    it('should render alert when entity not found', () => {
      const wrapper = mount(HaChip, {
        props: {
          entity: 'sensor.nonexistent',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Entity not found');
    });

    it('should display entity value', () => {
      const entity = {
        entity_id: 'sensor.humidity',
        state: '65',
        attributes: {
          unit_of_measurement: '%',
          icon: 'mdi:water',
        },
      };

      const wrapper = mount(HaChip, {
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

      // The value should be formatted
      expect(wrapper.text()).toContain('65');
    });

    it('should display unit of measurement', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.text()).toContain('°C');
    });
  });

  describe('Value Formatting', () => {
    it('should format numeric values with one decimal for temperature', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23.456',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.text()).toContain('23.5');
    });

    it('should format numeric values with one decimal for percentage', () => {
      const entity = {
        entity_id: 'sensor.battery',
        state: '87.456',
        attributes: {
          unit_of_measurement: '%',
          icon: 'mdi:battery',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.text()).toContain('87.5');
    });

    it('should format large numbers with no decimals', () => {
      const entity = {
        entity_id: 'sensor.power',
        state: '1234.567',
        attributes: {
          unit_of_measurement: 'W',
          icon: 'mdi:lightning-bolt',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.text()).toContain('1235');
    });

    it('should display unknown state', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'unknown',
        attributes: {
          icon: 'mdi:help',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.text()).toContain('unknown');
    });

    it('should display unavailable state', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'unavailable',
        attributes: {
          icon: 'mdi:help',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.text()).toContain('unavailable');
    });

    it('should display string values as-is', () => {
      const entity = {
        entity_id: 'sensor.mode',
        state: 'heat',
        attributes: {
          icon: 'mdi:heat-wave',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.text()).toContain('heat');
    });
  });

  describe('Icon Handling', () => {
    it('should display icon from entity attributes', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23',
        attributes: {
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.html()).toContain('mdi-thermometer');
    });

    it('should not display icon when not present', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '23',
        attributes: {},
      };

      const wrapper = mount(HaChip, {
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

      // Should render but without icon overlay
      expect(wrapper.find('.card-display').exists()).toBe(true);
    });

    it('should handle non-mdi icons', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '23',
        attributes: {
          icon: 'hass:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      // Non-mdi icons should not be displayed
      expect(wrapper.html()).not.toContain('icon-overlay');
    });
  });

  describe('Card Styling', () => {
    it('should have warning border when entity not found', () => {
      const wrapper = mount(HaChip, {
        props: {
          entity: 'sensor.nonexistent',
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

    it('should have info border when entity found', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '23',
        attributes: {
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.find('.border-info').exists()).toBe(true);
    });

    it('should have responsive column classes', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '23',
        attributes: {
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.find('.col-6').exists()).toBe(true);
      expect(wrapper.find('.col-sm-4').exists()).toBe(true);
      expect(wrapper.find('.col-md-2').exists()).toBe(true);
    });
  });

  describe('Icon Circle Color', () => {
    it('should render svg circle for icon background', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23',
        attributes: {
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
        props: {
          entity,
        },
        global: {
          stubs: {
            svg: true,
          },
        },
      });

      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('should have icon circle wrapper', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23',
        attributes: {
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      expect(wrapper.find('.ha-icon-circle-wrapper').exists()).toBe(true);
    });
  });

  describe('Entity with Object Prop', () => {
    it('should accept entity as object', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: {
          unit_of_measurement: 'W',
          icon: 'mdi:lightning-bolt',
        },
      };

      const wrapper = mount(HaChip, {
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
      expect(wrapper.text()).toContain('42');
    });

    it('should accept entity as string', () => {
      const wrapper = mount(HaChip, {
        props: {
          entity: 'sensor.temperature',
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

  describe('Responsive Layout', () => {
    it('should have proper mobile layout', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '23',
        attributes: {
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      const container = wrapper.find('[class*="col"]');
      expect(container.classes()).toContain('col-6');
    });

    it('should have proper tablet layout', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '23',
        attributes: {
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaChip, {
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

      const container = wrapper.find('[class*="col"]');
      expect(container.classes()).toContain('col-sm-4');
    });
  });
});
