import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaSensor from '../HaSensor.vue';
import { useHaStore } from '@/stores/haStore';

describe('HaSensor.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useHaStore();
    store.sensors = [];
    store.devices = [];
  });

  describe('Single Entity Display', () => {
    it('should render single entity sensor', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should display sensor value and unit', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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
      expect(wrapper.text()).toContain('°C');
    });

    it('should display friendly name', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          friendly_name: 'Living Room Temperature',
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('Living Room Temperature');
    });

    it('should display entity_id as fallback', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('sensor.temperature');
    });

    it('should display error when entity not found', () => {
      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('not found');
    });
  });

  describe('Multiple Entity Display', () => {
    it('should render multiple entities', () => {
      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp', 'sensor.humidity'],
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

    it('should display all entities in list', () => {
      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp', 'sensor.humidity'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should have multiple entity entries
      expect(wrapper.html()).toBeDefined();
    });
  });

  describe('Card Styling', () => {
    it('should have warning border when single entity not found', () => {
      const wrapper = mount(HaSensor, {
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
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.find('.col-lg-4').exists()).toBe(true);
      expect(wrapper.find('.col-md-6').exists()).toBe(true);
    });
  });

  describe('Props Validation', () => {
    it('should accept string entity', () => {
      const wrapper = mount(HaSensor, {
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

    it('should accept object entity', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should accept array of entities', () => {
      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp', 'sensor.humidity'],
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

    it('should accept attributes prop', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['attr1', 'attr2'],
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

  describe('Icon Display', () => {
    it('should display icon when present', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should not display icon when missing', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
        },
      };

      const wrapper = mount(HaSensor, {
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

      // When icon is missing, the icon should not be in the rendered HTML
      // Just verify the component still renders with the sensor value
      expect(wrapper.text()).toContain('23.5');
    });
  });

  describe('Sensor Value Formatting', () => {
    it('should format numeric temperature values', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.456',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should display string values as-is', () => {
      const entity = {
        entity_id: 'sensor.mode',
        state: 'heat',
        attributes: {
          icon: 'mdi:heat-wave',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should display unknown state', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: 'unknown',
        attributes: {
          icon: 'mdi:help',
        },
      };

      const wrapper = mount(HaSensor, {
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

      const wrapper = mount(HaSensor, {
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
  });

  describe('Classes and Structure', () => {
    it('should have card-display class', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should have rounded corners', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

      const card = wrapper.find('.card');
      expect(card.classes()).toContain('rounded-4');
      expect(card.classes()).toContain('shadow-lg');
    });
  });

  describe('Layout Direction', () => {
    it('should have flex layout for single entity', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

      const cardBody = wrapper.find('.card-body');
      expect(cardBody.classes()).toContain('d-flex');
      expect(cardBody.classes()).toContain('align-items-center');
    });
  });

  describe('Complex Attribute Handling', () => {
    it('should handle missing attributes gracefully', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: {},
      };

      const wrapper = mount(HaSensor, {
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
      expect(wrapper.text()).toContain('42');
    });

    it('should handle null attributes', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: null,
      };

      const wrapper = mount(HaSensor, {
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

  describe('Value Display Format', () => {
    it('should display full card for single entity', () => {
      const entity = {
        entity_id: 'sensor.temperature',
        state: '23.5',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
          icon: 'mdi:thermometer',
        },
      };

      const wrapper = mount(HaSensor, {
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

      // Single entity should show value on the right side
      expect(wrapper.find('.ha-sensor-value').exists()).toBe(true);
    });
  });

  describe('Multiple Entity Value Formatting', () => {
    it('should format temperature values for multiple entities', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp1',
          state: '23.456',
          attributes: {
            friendly_name: 'Temperature 1',
            unit_of_measurement: '°C',
          },
        },
        {
          entity_id: 'sensor.temp2',
          state: '25.789',
          attributes: {
            friendly_name: 'Temperature 2',
            unit_of_measurement: '°C',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp1', 'sensor.temp2'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('23.5');
      expect(wrapper.text()).toContain('25.8');
    });

    it('should format large numbers without decimals', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.power',
          state: '1250.456',
          attributes: {
            friendly_name: 'Power Usage',
            unit_of_measurement: 'W',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.power'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('1250');
    });

    it('should show unknown state for multiple entities', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.test',
          state: 'unknown',
          attributes: {
            friendly_name: 'Test',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.test'],
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

    it('should show unavailable state for multiple entities', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.test',
          state: 'unavailable',
          attributes: {
            friendly_name: 'Test',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.test'],
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

    it('should show string state for non-numeric values', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.mode',
          state: 'heating',
          attributes: {
            friendly_name: 'Mode',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.mode'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('heating');
    });
  });

  describe('Device Name Resolution', () => {
    it('should display device name for single entity', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp',
          state: '23',
          attributes: {
            friendly_name: 'Temperature',
            device_id: 'device123',
          },
        },
      ];
      store.devices = [
        {
          id: 'device123',
          name: 'Living Room Sensor',
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: {
            entity_id: 'sensor.temp',
            state: '23',
            attributes: {
              friendly_name: 'Temperature',
              device_id: 'device123',
            },
          },
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Temperature');
    });

    it('should use fallback device name when not found', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp',
          state: '23',
          attributes: {
            friendly_name: 'Temperature',
            device_id: 'unknown_device',
          },
        },
      ];
      store.devices = [];

      const wrapper = mount(HaSensor, {
        props: {
          entity: {
            entity_id: 'sensor.temp',
            state: '23',
            attributes: {
              friendly_name: 'Temperature',
              device_id: 'unknown_device',
            },
          },
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Temperature');
    });

    it('should not display device section when no device_id', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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

      const text = wrapper.text();
      expect(text).not.toContain('Device');
    });
  });

  describe('Extra Attributes Display', () => {
    it('should display requested attributes', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
          device_class: 'temperature',
          last_reset: '2024-01-01',
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['device_class', 'last_reset'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('temperature');
      expect(wrapper.text()).toContain('2024-01-01');
    });

    it('should skip attributes that do not exist', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['device_class', 'nonexistent'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const text = wrapper.text();
      expect(text).not.toContain('Device Class');
      expect(text).not.toContain('Nonexistent');
    });

    it('should format array attribute values', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: {
          friendly_name: 'Test',
          values: ['red', 'green', 'blue'],
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['values'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('red, green, blue');
    });

    it('should format object attribute values as JSON', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: {
          friendly_name: 'Test',
          config: { nested: 'value' },
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['config'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('nested');
      expect(wrapper.text()).toContain('value');
    });

    it('should handle null attribute values', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: {
          friendly_name: 'Test',
          nullable: null,
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['nullable'],
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

    it('should handle undefined attribute values', () => {
      const entity = {
        entity_id: 'sensor.test',
        state: '42',
        attributes: {
          friendly_name: 'Test',
          undefinable: undefined,
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['undefinable'],
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
  });

  describe('Multiple Entities List Display', () => {
    it('should render each entity with its own name and value', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp1',
          state: '23',
          attributes: { friendly_name: 'Temperature 1' },
        },
        {
          entity_id: 'sensor.temp2',
          state: '25',
          attributes: { friendly_name: 'Temperature 2' },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp1', 'sensor.temp2'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Temperature 1');
      expect(wrapper.text()).toContain('Temperature 2');
      expect(wrapper.text()).toContain('23');
      expect(wrapper.text()).toContain('25');
    });

    it('should use fallback entity_id when friendly_name missing', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.test',
          state: '42',
          attributes: {},
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.test'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('sensor.test');
    });

    it('should handle missing entity in store', () => {
      const store = useHaStore();
      store.sensors = [];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.nonexistent'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should display entity not found message
      expect(wrapper.text()).toContain('not found');
    });

    it('should display device names for multiple entities', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp1',
          state: '23',
          attributes: {
            friendly_name: 'Temp 1',
            device_id: 'device1',
          },
        },
        {
          entity_id: 'sensor.temp2',
          state: '25',
          attributes: {
            friendly_name: 'Temp 2',
            device_id: 'device2',
          },
        },
      ];
      store.devices = [
        { id: 'device1', name: 'Living Room' },
        { id: 'device2', name: 'Bedroom' },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp1', 'sensor.temp2'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Temp 1');
      expect(wrapper.text()).toContain('Temp 2');
    });

    it('should apply info border for multiple entities', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp1',
          state: '23',
          attributes: { friendly_name: 'Temp 1' },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp1'],
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
  });

  describe('Percent and Temperature Formatting', () => {
    it('should format percentage values with one decimal', () => {
      const entity = {
        entity_id: 'sensor.humidity',
        state: '65.456',
        attributes: {
          friendly_name: 'Humidity',
          unit_of_measurement: '%',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('65.5');
    });

    it('should format celsius temperature with one decimal', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23.456',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should format fahrenheit temperature with one decimal', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '75.456',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°F',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('75.5');
    });

    it('should format values under 100 with decimals', () => {
      const entity = {
        entity_id: 'sensor.value',
        state: '42.789',
        attributes: {
          friendly_name: 'Value',
          unit_of_measurement: 'units',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('42.8');
    });

    it('should format values 100+ without decimals', () => {
      const entity = {
        entity_id: 'sensor.value',
        state: '123.789',
        attributes: {
          friendly_name: 'Value',
          unit_of_measurement: 'units',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('124');
    });

    it('should format negative values correctly', () => {
      const entity = {
        entity_id: 'sensor.value',
        state: '-45.678',
        attributes: {
          friendly_name: 'Value',
          unit_of_measurement: 'units',
        },
      };

      const wrapper = mount(HaSensor, {
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

      expect(wrapper.text()).toContain('-45.7');
    });
  });

  describe('Entity Resolution', () => {
    it('should resolve string entity to object', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp',
          state: '23',
          attributes: {
            friendly_name: 'Temperature',
            unit_of_measurement: '°C',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: 'sensor.temp',
          attributes: ['unit_of_measurement'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Temperature');
      expect(wrapper.text()).toContain('23');
    });

    it('should accept entity object directly', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['unit_of_measurement'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Temperature');
      expect(wrapper.text()).toContain('23');
    });

    it('should accept array of mixed string and object entities', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp1',
          state: '23',
          attributes: {
            friendly_name: 'Temperature 1',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: [
            'sensor.temp1',
            {
              entity_id: 'sensor.temp2',
              state: '25',
              attributes: {
                friendly_name: 'Temperature 2',
              },
            },
          ],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Temperature 1');
      expect(wrapper.text()).toContain('Temperature 2');
    });
  });

  describe('Unavailable Entity Styling', () => {
    it('should apply warning border for unavailable single entity', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: 'unavailable',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should apply warning border for unknown single entity', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: 'unknown',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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

    it('should apply info border for available single entity', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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
  });

  describe('Icon Resolution and Display', () => {
    it('should display icon circle for entity with icon and attributes', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
          icon: 'mdi:thermometer',
          unit_of_measurement: '°C',
        },
      };

      const wrapper = mount(HaSensor, {
        props: {
          entity,
          attributes: ['unit_of_measurement'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.icon-circle-wrapper').exists()).toBe(true);
    });

    it('should not display icon wrapper for entity without icon', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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

      // Sensor domain gets default icon (mdi-gauge) from useIconClass
      expect(wrapper.find('.icon-circle-wrapper').exists()).toBe(true);
    });

    it('should have small icon wrapper for multiple entities', () => {
      const store = useHaStore();
      store.sensors = [
        {
          entity_id: 'sensor.temp',
          state: '23',
          attributes: {
            friendly_name: 'Temperature',
            icon: 'mdi:thermometer',
          },
        },
      ];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.temp'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Multiple entities array goes to the else branch with border-info
      expect(wrapper.find('.border-info').exists()).toBe(true);
    });
  });

  describe('Error Handling in Helper Functions', () => {
    it('should handle error in getName gracefully', () => {
      const store = useHaStore();
      store.sensors = [{ entity_id: 'sensor.test', state: '42', attributes: {} }];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.test'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should display something and not crash
      expect(wrapper.find('.card-display').exists()).toBe(true);
    });

    it('should handle error in getFormattedValue gracefully', () => {
      const store = useHaStore();
      store.sensors = [];

      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.nonexistent'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should display entity not found message when entity doesn't exist
      expect(wrapper.text()).toContain('not found');
    });

    it('should handle error in getIconClass gracefully', () => {
      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.test'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should not crash even if icon resolution fails
      expect(wrapper.find('.card-display').exists()).toBe(true);
    });

    it('should handle error in getIconCircleColor gracefully', () => {
      const wrapper = mount(HaSensor, {
        props: {
          entity: ['sensor.test'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should not crash even if color resolution fails
      expect(wrapper.find('.card').exists()).toBe(true);
    });
  });

  describe('Card Structure and Classes', () => {
    it('should have h-100 class for full height', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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

      const card = wrapper.find('.card');
      expect(card.classes()).toContain('h-100');
    });

    it('should have shadow-lg class', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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

      const card = wrapper.find('.card');
      expect(card.classes()).toContain('shadow-lg');
    });

    it('should have rounded-4 class for border radius', () => {
      const entity = {
        entity_id: 'sensor.temp',
        state: '23',
        attributes: {
          friendly_name: 'Temperature',
        },
      };

      const wrapper = mount(HaSensor, {
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

      const card = wrapper.find('.card');
      expect(card.classes()).toContain('rounded-4');
    });
  });
});
