import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EntityDashboardView from '../EntityDashboardView.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '../../stores/haStore';

describe('EntityDashboardView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the view title', () => {
    const wrapper = mount(EntityDashboardView);
    expect(wrapper.text()).toContain('Entity Dashboard');
  });

  it('renders the filter controls', () => {
    const wrapper = mount(EntityDashboardView);
    expect(wrapper.find('select').exists()).toBe(true);
    expect(wrapper.find('input[placeholder*="Filter by name"]').exists()).toBe(true);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
  });

  it('displays all entity types in the type selector', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: 'on', attributes: {} },
      { entity_id: 'sensor.humidity', state: '65', attributes: {} },
      { entity_id: 'light.living_room', state: 'on', attributes: {} },
      { entity_id: 'switch.pump', state: 'off', attributes: {} },
    ];

    const wrapper = mount(EntityDashboardView);
    const options = wrapper.findAll('select option');
    
    // Should have "All Types" + 3 unique types (sensor, light, switch)
    expect(options.length).toBe(4);
    expect(options[0].text()).toBe('All Types');
  });

  it('filters entities by type selection', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: 'on', attributes: { friendly_name: 'Temperature' } },
      { entity_id: 'light.living_room', state: 'on', attributes: { friendly_name: 'Living Room Light' } },
      { entity_id: 'switch.pump', state: 'off', attributes: { friendly_name: 'Pump' } },
    ];

    const wrapper = mount(EntityDashboardView);
    const select = wrapper.find('select');
    
    await select.setValue('sensor');
    
    // Should only display sensor entity
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(1);
    expect(cards[0].text()).toContain('Temperature');
  });

  it('filters entities by search text', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: '25', attributes: { friendly_name: 'Temperature' } },
      { entity_id: 'sensor.humidity', state: '60', attributes: { friendly_name: 'Humidity' } },
      { entity_id: 'sensor.pressure', state: '1013', attributes: { friendly_name: 'Pressure' } },
    ];

    const wrapper = mount(EntityDashboardView);
    const input = wrapper.find('input[placeholder*="Filter by name"]');
    
    await input.setValue('humidity');
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();
    
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(1);
    expect(cards[0].text()).toContain('Humidity');
  });

  it('filters entities by search on entity_id', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: '25', attributes: { friendly_name: 'Temp' } },
      { entity_id: 'sensor.humidity', state: '60', attributes: { friendly_name: 'Hum' } },
      { entity_id: 'sensor.pressure', state: '1013', attributes: { friendly_name: 'Press' } },
    ];

    const wrapper = mount(EntityDashboardView);
    const input = wrapper.find('input[placeholder*="Filter by name"]');
    
    await input.setValue('pressure');
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();
    
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(1);
    expect(cards[0].text()).toContain('sensor.pressure');
  });

  it('hides unavailable entities when checkbox is checked', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.available', state: 'on', attributes: { friendly_name: 'Available' } },
      { entity_id: 'sensor.unavailable', state: 'unavailable', attributes: { friendly_name: 'Unavailable' } },
      { entity_id: 'sensor.unknown', state: 'unknown', attributes: { friendly_name: 'Unknown' } },
    ];

    const wrapper = mount(EntityDashboardView);
    let cards = wrapper.findAll('.card');
    expect(cards.length).toBe(3); // All shown initially

    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    await wrapper.vm.$nextTick();

    cards = wrapper.findAll('.card');
    expect(cards.length).toBe(1); // Only available entity
    expect(cards[0].text()).toContain('Available');
  });

  it('displays entity friendly name with fallback to entity_id', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.with_name', state: 'on', attributes: { friendly_name: 'Named Sensor' } },
      { entity_id: 'sensor.no_name', state: 'on', attributes: {} },
    ];

    const wrapper = mount(EntityDashboardView);
    const titles = wrapper.findAll('.card-title');
    
    expect(titles[0].text()).toBe('Named Sensor');
    expect(titles[1].text()).toBe('sensor.no_name');
  });

  it('displays entity state', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.test', state: '25.5', attributes: { friendly_name: 'Test' } },
    ];

    const wrapper = mount(EntityDashboardView);
    expect(wrapper.text()).toContain('25.5');
  });

  it('displays entity attributes excluding blacklisted ones', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.test',
        state: '25',
        attributes: {
          friendly_name: 'Test',
          icon: 'mdi:test',
          device_class: 'temperature',
          unit_of_measurement: '°C',
          custom_attribute: 'custom_value',
          another_attribute: 'another_value',
        },
      },
    ];

    const wrapper = mount(EntityDashboardView);
    const text = wrapper.text();
    
    // Should contain custom attributes
    expect(text).toContain('custom_attribute');
    expect(text).toContain('custom_value');
    
    // Should not contain blacklisted attributes
    expect(text).not.toContain('icon:');
  });

  it('formats array attributes as comma-separated values', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test',
          colors: ['red', 'green', 'blue'],
        },
      },
    ];

    const wrapper = mount(EntityDashboardView);
    expect(wrapper.text()).toContain('red, green, blue');
  });

  it('formats object attributes as JSON', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test',
          config: { nested: 'value' },
        },
      },
    ];

    const wrapper = mount(EntityDashboardView);
    expect(wrapper.text()).toContain('{"nested":"value"}');
  });

  it('clears search text when clear button is clicked', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: '25', attributes: { friendly_name: 'Temperature' } },
    ];

    const wrapper = mount(EntityDashboardView);
    const input = wrapper.find('input[placeholder*="Filter by name"]');
    
    await input.setValue('test');
    await wrapper.vm.$nextTick();
    
    // Clear button should be visible when there's text
    let clearBtn = wrapper.find('button[aria-label="Clear search"]');
    expect(clearBtn.exists()).toBe(true);
    
    await clearBtn.trigger('click');
    await wrapper.vm.$nextTick();
    
    expect(input.element.value).toBe('');
  });

  it('applies correct styling to unavailable entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.available', state: 'on', attributes: {} },
      { entity_id: 'sensor.unavailable', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(EntityDashboardView);
    const cards = wrapper.findAll('.card');
    
    expect(cards[0].classes()).toContain('border-info');
    expect(cards[1].classes()).toContain('border-warning');
  });

  it('handles empty sensor list', () => {
    const store = useHaStore();
    store.sensors = [];

    const wrapper = mount(EntityDashboardView);
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(0);
  });

  it('limits attribute display to 12 items', () => {
    const store = useHaStore();
    const attributes = {
      friendly_name: 'Test',
      attr1: 'val1',
      attr2: 'val2',
      attr3: 'val3',
      attr4: 'val4',
      attr5: 'val5',
      attr6: 'val6',
      attr7: 'val7',
      attr8: 'val8',
      attr9: 'val9',
      attr10: 'val10',
      attr11: 'val11',
      attr12: 'val12',
      attr13: 'val13', // Should be excluded
      attr14: 'val14', // Should be excluded
    };

    store.sensors = [
      { entity_id: 'sensor.test', state: 'on', attributes },
    ];

    const wrapper = mount(EntityDashboardView);
    const attributeElements = wrapper.findAll('li');
    
    // Should show 12 attributes (after blacklist filtering)
    expect(attributeElements.length).toBeLessThanOrEqual(12);
  });

  it('handles null/undefined attribute values', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test',
          null_attr: null,
          undefined_attr: undefined,
        },
      },
    ];

    const wrapper = mount(EntityDashboardView);
    
    // Should render without errors
    expect(wrapper.find('.card-body').exists()).toBe(true);
  });

  it('handles entities without attributes', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.test', state: 'on' },
    ];

    const wrapper = mount(EntityDashboardView);
    expect(wrapper.find('.card-body').exists()).toBe(true);
  });

  it('combines multiple filters correctly', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: '25', attributes: { friendly_name: 'Temperature' } },
      { entity_id: 'sensor.humidity', state: '60', attributes: { friendly_name: 'Humidity' } },
      { entity_id: 'light.lamp', state: 'on', attributes: { friendly_name: 'Lamp' } },
      { entity_id: 'sensor.pressure', state: 'unavailable', attributes: { friendly_name: 'Pressure' } },
    ];

    const wrapper = mount(EntityDashboardView);
    const select = wrapper.find('select');
    const input = wrapper.find('input[placeholder*="Filter by name"]');
    const checkbox = wrapper.find('input[type="checkbox"]');

    // Filter by type: sensor
    await select.setValue('sensor');
    // Filter by search: temperature
    await input.setValue('temperature');
    // Hide unavailable
    await checkbox.setValue(true);
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(1);
    expect(cards[0].text()).toContain('Temperature');
  });
});
