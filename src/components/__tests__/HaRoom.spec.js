import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HaRoom from '../HaRoom.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';
import * as useServiceCallModule from '@/composables/useServiceCall';

describe('HaRoom.vue', () => {
  let wrapper;
  let store;
  let pinia;
  let mockCallService;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.sensors = [];
    
    // Mock useServiceCall composable
    mockCallService = vi.fn().mockResolvedValue(true);
    vi.spyOn(useServiceCallModule, 'useServiceCall').mockReturnValue({
      callService: mockCallService,
      isLoading: false,
    });
  });

  it('renders the component with area entity', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find('.card').exists()).toBe(true);
    expect(wrapper.find('.card-title').text()).toBe('Bedroom');
  });

  it('finds area entity by checking for area. prefix', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['light.bedroom', 'area.bedroom', 'switch.fan'],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find('.card-title').text()).toBe('Bedroom');
  });

  it('displays temperature when available in area entities', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: ['sensor.bedroom_temp'],
      },
      {
        entity_id: 'sensor.bedroom_temp',
        state: '22.5',
        attributes: {
          device_class: 'temperature',
          unit_of_measurement: '°C',
          friendly_name: 'Bedroom Temperature',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain('22.5');
    expect(wrapper.text()).toContain('°C');
  });

  it('displays humidity when available in area entities', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: ['sensor.bedroom_humidity'],
      },
      {
        entity_id: 'sensor.bedroom_humidity',
        state: '65',
        attributes: {
          device_class: 'humidity',
          unit_of_measurement: '%',
          friendly_name: 'Bedroom Humidity',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain('65');
    expect(wrapper.text()).toContain('%');
  });

  it('displays temperature and humidity on same row', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: ['sensor.bedroom_temp', 'sensor.bedroom_humidity'],
      },
      {
        entity_id: 'sensor.bedroom_temp',
        state: '22.5',
        attributes: {
          device_class: 'temperature',
          unit_of_measurement: '°C',
        },
      },
      {
        entity_id: 'sensor.bedroom_humidity',
        state: '65',
        attributes: {
          device_class: 'humidity',
          unit_of_measurement: '%',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    const tempHumidityDiv = wrapper.find('.d-flex.gap-3');
    expect(tempHumidityDiv.exists()).toBe(true);
    expect(tempHumidityDiv.text()).toContain('22.5');
    expect(tempHumidityDiv.text()).toContain('65');
  });

  it('filters control objects to exclude area entities', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
      {
        entity_id: 'light.bedroom',
        state: 'on',
        attributes: {
          friendly_name: 'Bedroom Light',
          icon: 'mdi:lightbulb',
        },
      },
      {
        entity_id: 'switch.fan',
        state: 'off',
        attributes: {
          friendly_name: 'Fan',
          icon: 'mdi:fan',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom', 'light.bedroom', 'switch.fan'],
      },
      global: { plugins: [pinia] },
    });

    const controlObjects = wrapper.findAll('.control-object');
    expect(controlObjects).toHaveLength(2);
  });

  it('displays control objects with correct icons and colors', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
      {
        entity_id: 'light.bedroom',
        state: 'on',
        attributes: {
          friendly_name: 'Bedroom Light',
          icon: 'mdi:lightbulb',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom', 'light.bedroom'],
        color: 'red',
      },
      global: { plugins: [pinia] },
    });

    const controlObject = wrapper.find('.control-object');
    expect(controlObject.exists()).toBe(true);
  });

  it('uses custom color prop for main circle', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
        color: 'green',
      },
      global: { plugins: [pinia] },
    });

    const circle = wrapper.find('.icon-circle circle');
    expect(circle.attributes('fill')).toBe('green');
  });

  it('defaults to blue color when not specified', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    const circle = wrapper.find('.icon-circle circle');
    expect(circle.attributes('fill')).toBe('blue');
  });

  it('handles unavailable temperature state', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: ['sensor.bedroom_temp'],
      },
      {
        entity_id: 'sensor.bedroom_temp',
        state: 'unavailable',
        attributes: {
          device_class: 'temperature',
          unit_of_measurement: '°C',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain('unavailable');
  });

  it('rounds temperature to 1 decimal place', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: ['sensor.bedroom_temp'],
      },
      {
        entity_id: 'sensor.bedroom_temp',
        state: '22.456789',
        attributes: {
          device_class: 'temperature',
          unit_of_measurement: '°C',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain('22.5');
  });

  it('rounds humidity to 0 decimal places', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: ['sensor.bedroom_humidity'],
      },
      {
        entity_id: 'sensor.bedroom_humidity',
        state: '65.789',
        attributes: {
          device_class: 'humidity',
          unit_of_measurement: '%',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain('66');
  });

  it('calls toggleEntity on control object click', async () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
      {
        entity_id: 'light.bedroom',
        state: 'on',
        attributes: {
          friendly_name: 'Bedroom Light',
          icon: 'mdi:lightbulb',
        },
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom', 'light.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    const controlObject = wrapper.find('.control-object');
    await controlObject.trigger('click');

    expect(mockCallService).toHaveBeenCalledWith('light', 'turn_off', {
      entity_id: 'light.bedroom',
    });
  });

  it('uses area icon when available', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
          icon: 'mdi:bed',
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    const icon = wrapper.find('.icon-overlay');
    expect(icon.classes()).toContain('mdi-bed');
  });

  it('uses default door icon when area icon not available', () => {
    store.sensors = [
      {
        entity_id: 'area.bedroom',
        state: 'Bedroom',
        attributes: {
          friendly_name: 'Bedroom',
        },
        entities: [],
      },
    ];

    wrapper = mount(HaRoom, {
      props: {
        entity: ['area.bedroom'],
      },
      global: { plugins: [pinia] },
    });

    const icon = wrapper.find('.icon-overlay');
    expect(icon.classes()).toContain('mdi-door');
  });
});
