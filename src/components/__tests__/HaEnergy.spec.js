import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import HaEnergy from '../HaEnergy.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';

describe('HaEnergy.vue', () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    store.sensors = [
      {
        entity_id: 'sensor.power_usage',
        state: '1250.5',
        attributes: {
          friendly_name: 'Power Usage',
          device_class: 'power',
          unit_of_measurement: 'W',
          device_id: 'device_1',
          icon: 'mdi:flash',
        },
      },
      {
        entity_id: 'sensor.energy_total',
        state: '2450.75',
        attributes: {
          friendly_name: 'Total Energy',
          device_class: 'energy',
          unit_of_measurement: 'kWh',
          device_id: 'device_2',
          icon: 'mdi:lightning-bolt',
        },
      },
      {
        entity_id: 'sensor.unavailable',
        state: 'unavailable',
        attributes: {
          friendly_name: 'Unavailable Sensor',
          unit_of_measurement: 'W',
        },
      },
    ];

    store.devices = [
      { id: 'device_1', name: 'Home' },
      { id: 'device_2', name: 'Office' },
    ];
  });

  it('should render entity not found message when entity does not exist', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.nonexistent',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('not found');
  });

  it('should render energy sensor with string entity reference', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Power Usage');
    expect(wrapper.text()).toContain('1250.5');
    expect(wrapper.text()).toContain('W');
  });

  it('should render energy sensor with object entity', () => {
    const entity = {
      entity_id: 'sensor.test',
      state: '500',
      attributes: {
        friendly_name: 'Test Energy',
        device_class: 'power',
        unit_of_measurement: 'W',
      },
    };

    const wrapper = mount(HaEnergy, {
      props: {
        entity,
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Test Energy');
    expect(wrapper.text()).toContain('500');
  });

  it('should display Current Power label for power device class', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Current Power');
  });

  it('should display Energy Used label for energy device class', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.energy_total',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Energy Used');
  });

  it('should format power values with 1 decimal place', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.formattedValue).toBe('1250.5');
  });

  it('should format energy values with 2 decimal places for kWh', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.energy_total',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.formattedValue).toBe('2450.75');
  });

  it('should display unavailable state', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.unavailable',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('unavailable');
  });

  it('should apply border-success color for low power usage', () => {
    store.sensors[0].state = '50';

    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.cardBorderClass).toBe('border-success');
  });

  it('should apply border-warning color for medium power usage', () => {
    store.sensors[0].state = '500';

    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.cardBorderClass).toBe('border-warning');
  });

  it('should apply border-danger color for high power usage', () => {
    store.sensors[0].state = '2000';

    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.cardBorderClass).toBe('border-danger');
  });

  it('should apply border-warning for unavailable state', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.unavailable',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.cardBorderClass).toBe('border-warning');
  });

  it('should display device name when available', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Device name display was removed from all cards per contribution guidelines
    // Only entity friendly_name is displayed
    expect(wrapper.text()).toContain('Power Usage');
  });

  it('should display entity name from friendly_name attribute', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Power Usage');
  });

  it('should render flash icon for power sensor', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.iconClass).toBe('mdi mdi-flash');
  });

  it('should render lightning-bolt icon for energy sensor', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.energy_total',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.vm.iconClass).toBe('mdi mdi-lightning-bolt');
  });

  it('should display extra attributes when provided', () => {
    store.sensors[0].attributes = {
      friendly_name: 'Power Usage',
      device_class: 'power',
      unit_of_measurement: 'W',
      device_id: 'device_1',
      icon: 'mdi:flash',
      last_reset: '2024-01-01T00:00:00',
      state_class: 'measurement',
    };

    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
        attributes: ['last_reset', 'state_class'],
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Last reset');
    expect(wrapper.text()).toContain('State class');
  });

  it('should render with col-lg-4 col-md-6 classes', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.find('.col-lg-4').exists()).toBe(true);
    expect(wrapper.find('.col-md-6').exists()).toBe(true);
  });

  it('should render card with display class', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    const card = wrapper.find('.card');
    expect(card.classes()).toContain('card-display');
    expect(card.classes()).toContain('h-100');
    expect(card.classes()).toContain('rounded-4');
    expect(card.classes()).toContain('shadow-lg');
  });

  it('should render graph placeholder when showGraph is true', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
        showGraph: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Energy usage graph');
  });

  it('should not render graph placeholder when showGraph is false', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
        showGraph: false,
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).not.toContain('Energy usage graph');
  });

  it('should validate entity prop with string format', () => {
    const validEntity = 'sensor.power_usage';
    expect(
      HaEnergy.props.entity.validator(validEntity)
    ).toBe(true);

    const invalidEntity = 'invalid.format';
    expect(
      HaEnergy.props.entity.validator(invalidEntity)
    ).toBe(false);
  });

  it('should validate entity prop with object format', () => {
    const validEntity = {
      entity_id: 'sensor.power_usage',
      state: '100',
      attributes: { friendly_name: 'Test' },
    };
    expect(
      HaEnergy.props.entity.validator(validEntity)
    ).toBeTruthy();

    const invalidEntity = { entity_id: 'sensor.power_usage' };
    expect(
      HaEnergy.props.entity.validator(invalidEntity)
    ).toBeFalsy();
  });

  it('should default attributes prop to empty array', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.props('attributes')).toEqual([]);
  });

  it('should default showGraph to false', () => {
    const wrapper = mount(HaEnergy, {
      props: {
        entity: 'sensor.power_usage',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.props('showGraph')).toBe(false);
  });
});
