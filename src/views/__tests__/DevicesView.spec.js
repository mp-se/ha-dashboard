import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DevicesView from '../DevicesView.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '../../stores/haStore';

describe('DevicesView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the view title', () => {
    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('Devices');
  });

  it('renders the search input', () => {
    const wrapper = mount(DevicesView);
    expect(wrapper.find('input[placeholder*="Filter devices"]').exists()).toBe(true);
  });

  it('displays all devices initially', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: [] },
      { id: 'device2', name: 'Device 2', entities: [] },
      { id: 'device3', name: 'Device 3', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(3);
  });

  it('displays device name', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'My Device', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('My Device');
  });

  it('displays device ID', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device123', name: 'My Device', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('device123');
  });

  it('displays "Unnamed Device" when device has no name', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: null, entities: [] },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('Unnamed Device');
  });

  it('displays entity count', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: ['sensor.temp', 'sensor.humidity'] },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('Entities: 2');
  });

  it('displays entity IDs when present', () => {
    const store = useHaStore();
    store.devices = [
      {
        id: 'device1',
        name: 'Device 1',
        entities: ['sensor.temperature', 'sensor.humidity'],
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('sensor.temperature');
    expect(wrapper.text()).toContain('sensor.humidity');
  });

  it('displays manufacturer information', () => {
    const store = useHaStore();
    store.devices = [
      {
        id: 'device1',
        name: 'Device 1',
        entities: [],
        manufacturer: 'Philips',
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('Philips');
  });

  it('displays model information', () => {
    const store = useHaStore();
    store.devices = [
      {
        id: 'device1',
        name: 'Device 1',
        entities: [],
        model: 'Hue Bridge',
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('Hue Bridge');
  });

  it('displays software version', () => {
    const store = useHaStore();
    store.devices = [
      {
        id: 'device1',
        name: 'Device 1',
        entities: [],
        sw_version: '1.2.3',
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('1.2.3');
  });

  it('displays hardware version', () => {
    const store = useHaStore();
    store.devices = [
      {
        id: 'device1',
        name: 'Device 1',
        entities: [],
        hw_version: 'V2.1',
      },
    ];

    const wrapper = mount(DevicesView);
    expect(wrapper.text()).toContain('V2.1');
  });

  it('filters devices by name', async () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Philips Hue Bridge', entities: [] },
      { id: 'device2', name: 'Sonos Speaker', entities: [] },
      { id: 'device3', name: 'Philips Lamp', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue('Philips');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(2);
  });

  it('performs case-insensitive device search', async () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Philips Hue', entities: [] },
      { id: 'device2', name: 'SONOS Speaker', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue('philips');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(1);
    expect(cards[0].text()).toContain('Philips Hue');
  });

  it('shows clear button when search text is present', async () => {
    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue('test');
    await wrapper.vm.$nextTick();

    const clearBtn = wrapper.find('button[aria-label="Clear device search"]');
    expect(clearBtn.exists()).toBe(true);
  });

  it('clears search text when clear button is clicked', async () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: [] },
      { id: 'device2', name: 'Device 2', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue('Device 1');
    await wrapper.vm.$nextTick();

    const clearBtn = wrapper.find('button[aria-label="Clear device search"]');
    await clearBtn.trigger('click');
    await wrapper.vm.$nextTick();

    expect(input.element.value).toBe('');
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(2); // All devices shown again
  });

  it('returns empty list when no devices match search', async () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: [] },
      { id: 'device2', name: 'Device 2', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const input = wrapper.find('input[placeholder*="Filter devices"]');

    await input.setValue('Nonexistent Device');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(0);
  });

  it('handles devices without entities array', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1' },
    ];

    const wrapper = mount(DevicesView);
    const text = wrapper.text();
    
    // Should show 0 entities
    expect(text).toContain('Entities: 0');
  });

  it('hides entity list when no entities exist', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const lis = wrapper.findAll('ul.list-unstyled li');
    
    expect(lis.length).toBe(0);
  });

  it('displays all device information when present', () => {
    const store = useHaStore();
    store.devices = [
      {
        id: 'device1',
        name: 'Complete Device',
        entities: ['sensor.temp', 'sensor.humidity'],
        manufacturer: 'Acme',
        model: 'Model X',
        sw_version: '2.0.0',
        hw_version: 'V3',
      },
    ];

    const wrapper = mount(DevicesView);
    const text = wrapper.text();
    
    expect(text).toContain('Complete Device');
    expect(text).toContain('sensor.temp');
    expect(text).toContain('sensor.humidity');
    expect(text).toContain('Acme');
    expect(text).toContain('Model X');
    expect(text).toContain('2.0.0');
    expect(text).toContain('V3');
  });

  it('handles empty devices list', () => {
    const store = useHaStore();
    store.devices = [];

    const wrapper = mount(DevicesView);
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBe(0);
  });

  it('displays cards with proper styling', () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    const card = wrapper.find('.card');
    
    expect(card.classes()).toContain('h-100');
    expect(card.classes()).toContain('rounded-4');
  });

  it('updates device list when store devices change', async () => {
    const store = useHaStore();
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: [] },
    ];

    const wrapper = mount(DevicesView);
    let cards = wrapper.findAll('.card');
    expect(cards.length).toBe(1);

    // Update store
    store.devices = [
      { id: 'device1', name: 'Device 1', entities: [] },
      { id: 'device2', name: 'Device 2', entities: [] },
    ];

    await wrapper.vm.$nextTick();
    cards = wrapper.findAll('.card');
    expect(cards.length).toBe(2);
  });

  it('preserves entity order from device data', () => {
    const store = useHaStore();
    store.devices = [
      {
        id: 'device1',
        name: 'Device 1',
        entities: ['sensor.first', 'sensor.second', 'sensor.third'],
      },
    ];

    const wrapper = mount(DevicesView);
    const lis = wrapper.findAll('ul.list-unstyled li');
    
    expect(lis[0].text()).toContain('sensor.first');
    expect(lis[1].text()).toContain('sensor.second');
    expect(lis[2].text()).toContain('sensor.third');
  });
});
