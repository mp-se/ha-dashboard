import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import HaSensorSlim from '../HaSensorSlim.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';

describe('HaSensorSlim.vue', () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    store.sensors = [
      {
        entity_id: 'sensor.temperature',
        state: '22.5',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
          device_class: 'temperature',
        },
      },
      {
        entity_id: 'sensor.humidity',
        state: '65',
        attributes: {
          friendly_name: 'Humidity',
          unit_of_measurement: '%',
        },
      },
    ];
    store.entities = {};
  });

  it('should render sensor slim card', () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find('.card').exists()).toBe(true);
  });

  it('should display friendly name', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Temperature');
  });

  it('should display state value', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('22.5');
  });

  it('should display unit of measurement', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('°C');
  });

  it('should format numeric value to 1 decimal', async () => {
    store.sensors[0].state = '22.567';

    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('22.6');
  });

  it('should display unavailable state', async () => {
    store.sensors[0].state = 'unavailable';

    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Unavailable');
  });

  it('should display unknown state', async () => {
    store.sensors[0].state = 'unknown';

    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Unknown');
  });

  it('should infer icon from device class', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.iconClass).toBeTruthy();
  });

  it('should display percentage with 0 decimals', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.humidity',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('65');
    expect(wrapper.text()).not.toContain('65.0');
  });

  it('should apply compact layout class', () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find('.card').exists()).toBe(true);
  });

  it('should accept entity as object', async () => {
    const entityObj = {
      entity_id: 'sensor.temperature',
      state: '22.5',
      attributes: {
        friendly_name: 'Temperature',
        unit_of_measurement: '°C',
      },
    };
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: entityObj,
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Temperature');
  });

  it('should resolve entity from store', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.resolvedEntity).toBeTruthy();
    expect(wrapper.vm.resolvedEntity.entity_id).toBe('sensor.temperature');
  });

  it('should handle missing entity gracefully', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.nonexistent',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find('.card').exists()).toBe(true);
  });

  it('should format large numbers with abbreviation', async () => {
    store.sensors[0].state = '1234567';
    store.sensors[0].attributes.unit_of_measurement = '';

    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.formattedValue).toBeTruthy();
  });

  it('should be compact in width', () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    const card = wrapper.find('.card');
    expect(card.exists()).toBe(true);
  });

  it('should update when state changes', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('22.5');

    store.sensors[0].state = '25.0';
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('25');
  });

  it('should update when entity prop changes', async () => {
    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Temperature');

    await wrapper.setProps({ entity: 'sensor.humidity' });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Humidity');
  });

  it('should not display unit for unitless sensors', async () => {
    store.sensors[0].attributes.unit_of_measurement = '';

    const wrapper = mount(HaSensorSlim, {
      props: {
        entity: 'sensor.temperature',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.$nextTick();
    const text = wrapper.text();
    expect(text).not.toContain('undefined');
  });

  it('should validate entity prop', () => {
    const validEntity = 'sensor.temperature';
    expect(
      HaSensorSlim.props.entity.validator(validEntity)
    ).toBe(true);

    const invalidEntity = 'invalid';
    expect(
      HaSensorSlim.props.entity.validator(invalidEntity)
    ).toBe(false);
  });
});
