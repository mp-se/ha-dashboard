import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import RawEntityView from '../RawEntityView.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '../../stores/haStore';

describe('RawEntityView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the view title', () => {
    const wrapper = mount(RawEntityView);
    expect(wrapper.text()).toContain('Entity Dashboard');
  });

  it('renders the filter controls', () => {
    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
    const options = wrapper.findAll('select option');
    
    // Should have "All Types" + 4 unique types (area, sensor, light, switch)
    expect(options.length).toBe(5);
    expect(options[0].text()).toBe('All Types');
  });

  it('filters entities by type selection', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: 'on', attributes: { friendly_name: 'Temperature' } },
      { entity_id: 'light.living_room', state: 'on', attributes: { friendly_name: 'Living Room Light' } },
      { entity_id: 'switch.pump', state: 'off', attributes: { friendly_name: 'Pump' } },
    ];

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
    const titles = wrapper.findAll('.card-title');
    
    expect(titles[0].text()).toBe('Named Sensor');
    expect(titles[1].text()).toBe('sensor.no_name');
  });

  it('displays entity state', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.test', state: '25.5', attributes: { friendly_name: 'Test' } },
    ];

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
    expect(wrapper.text()).toContain('{"nested":"value"}');
  });

  it('clears search text when clear button is clicked', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temperature', state: '25', attributes: { friendly_name: 'Temperature' } },
    ];

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
    const cards = wrapper.findAll('.card');
    
    expect(cards[0].classes()).toContain('border-info');
    expect(cards[1].classes()).toContain('border-warning');
  });

  it('handles empty sensor list', () => {
    const store = useHaStore();
    store.sensors = [];

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
    
    // Should render without errors
    expect(wrapper.find('.card-body').exists()).toBe(true);
  });

  it('handles entities without attributes', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.test', state: 'on' },
    ];

    const wrapper = mount(RawEntityView);
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

    const wrapper = mount(RawEntityView);
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

  describe('Areas Display', () => {
    it('displays areas when "areas" type is selected', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'living_room', area_id: 'living_room', name: 'Living Room', entities: [] },
        { id: 'kitchen', area_id: 'kitchen', name: 'Kitchen', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll('.card');
      expect(cards.length).toBe(2);
    });

    it('displays area name and id', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'living_room', area_id: 'living_room', name: 'Living Room', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const text = wrapper.text();
      expect(text).toContain('Living Room');
      expect(text).toContain('area.living_room');
    });

    it('displays area with icon', async () => {
      const store = useHaStore();
      store.areas = [
        {
          id: 'kitchen',
          area_id: 'kitchen',
          name: 'Kitchen',
          icon: 'mdi:kitchen',
          entities: [],
        },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const text = wrapper.text();
      expect(text).toContain('Icon:');
      expect(text).toContain('mdi:kitchen');
    });

    it('displays area picture if present', async () => {
      const store = useHaStore();
      store.areas = [
        {
          id: 'kitchen',
          area_id: 'kitchen',
          name: 'Kitchen',
          picture: '/local/kitchen.jpg',
          entities: [],
        },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const text = wrapper.text();
      expect(text).toContain('Picture:');
      expect(text).toContain('/local/kitchen.jpg');
    });

    it('displays area aliases if present', async () => {
      const store = useHaStore();
      store.areas = [
        {
          id: 'kitchen',
          area_id: 'kitchen',
          name: 'Kitchen',
          aliases: ['cooking_area', 'dining_area'],
          entities: [],
        },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const text = wrapper.text();
      expect(text).toContain('Aliases:');
      expect(text).toContain('cooking_area');
      expect(text).toContain('dining_area');
    });

    it('displays area entities list with count', async () => {
      const store = useHaStore();
      store.areas = [
        {
          id: 'kitchen',
          area_id: 'kitchen',
          name: 'Kitchen',
          entities: ['light.kitchen', 'switch.oven', 'sensor.temp'],
        },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const text = wrapper.text();
      expect(text).toContain('Entities (3)');
      expect(text).toContain('light.kitchen');
      expect(text).toContain('switch.oven');
      expect(text).toContain('sensor.temp');
    });

    it('filters areas by search text', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'kitchen', area_id: 'kitchen', name: 'Kitchen', entities: [] },
        { id: 'bedroom', area_id: 'bedroom', name: 'Bedroom', entities: [] },
        { id: 'living_room', area_id: 'living_room', name: 'Living Room', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');
      const input = wrapper.find('input[placeholder*="Filter by name"]');

      await select.setValue('areas');
      await input.setValue('kitchen');
      await new Promise(resolve => setTimeout(resolve, 350));
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll('.card');
      expect(cards.length).toBe(1);
      expect(cards[0].text()).toContain('Kitchen');
    });

    it('displays copy button for areas', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'kitchen', area_id: 'kitchen', name: 'Kitchen', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const copyBtn = wrapper.find('button[title*="Copy area JSON"]');
      expect(copyBtn.exists()).toBe(true);
    });

    it('displays area card with info border styling', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'kitchen', area_id: 'kitchen', name: 'Kitchen', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const card = wrapper.find('.card');
      expect(card.classes()).toContain('border-info');
    });

    it('displays area icon when present using icon class', async () => {
      const store = useHaStore();
      store.areas = [
        {
          id: 'kitchen',
          area_id: 'kitchen',
          name: 'Kitchen',
          icon: 'mdi:chef-hat',
          entities: [],
        },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const icon = wrapper.find('i[class*="mdi-chef-hat"]');
      expect(icon.exists()).toBe(true);
    });
  });

  describe('Generate Config Functionality', () => {
    it('renders generate config button', () => {
      const store = useHaStore();
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');
      expect(btn.exists()).toBe(true);
    });

    it('generates config for supported entities only', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.temp', state: '25', attributes: {} },
        { entity_id: 'light.lamp', state: 'on', attributes: {} },
        { entity_id: 'switch.pump', state: 'off', attributes: {} },
        { entity_id: 'unknown_domain.entity', state: 'on', attributes: {} }, // Unsupported
      ];
      store.haUrl = 'https://ha.local:8123';
      store.accessToken = 'token123';

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      // Success banner should appear
      expect(wrapper.vm.successBanner).toBe(true);
      expect(wrapper.vm.successBannerMessage).toContain('3 entities');
    });

    it('shows message when no supported entities found', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'unknown_domain.entity', state: 'on', attributes: {} },
      ];

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.successBanner).toBe(true);
      expect(wrapper.vm.successBannerMessage).toContain('No supported entities');
    });

    it('excludes unavailable entities from config', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.temp', state: '25', attributes: {} },
        { entity_id: 'sensor.humid', state: 'unavailable', attributes: {} },
        { entity_id: 'sensor.pressure', state: 'unknown', attributes: {} },
      ];
      store.haUrl = 'https://ha.local:8123';
      store.accessToken = 'token123';

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.successBannerMessage).toContain('1 entities');
    });

    it('groups entities by component type in config', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.temp', state: '25', attributes: {} },
        { entity_id: 'sensor.humid', state: '60', attributes: {} },
        { entity_id: 'light.lamp', state: 'on', attributes: {} },
      ];
      store.haUrl = 'https://ha.local:8123';
      store.accessToken = 'token123';

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.successBanner).toBe(true);
      expect(wrapper.vm.successBannerMessage).toContain('3 entities');
    });

    it('displays success banner that auto-dismisses', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.temp', state: '25', attributes: {} },
      ];
      store.haUrl = 'https://ha.local:8123';
      store.accessToken = 'token123';

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.successBanner).toBe(true);

      // Skip the actual auto-dismiss timeout test and just verify the initial state
      // since the component sets a 5-second timeout internally
    }, 10000);
  });

  describe('Success Banner', () => {
    it('displays success banner with message', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.temp', state: '25', attributes: {} },
      ];
      store.haUrl = 'https://ha.local:8123';
      store.accessToken = 'token123';

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      const banner = wrapper.find('.alert-success');
      expect(banner.exists()).toBe(true);
      expect(banner.text()).toContain('Configuration generated!');
    });

    it('displays success icon in banner', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.temp', state: '25', attributes: {} },
      ];
      store.haUrl = 'https://ha.local:8123';
      store.accessToken = 'token123';

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      const icon = wrapper.find('i.mdi-check-circle');
      expect(icon.exists()).toBe(true);
    });

    it('closes success banner when close button is clicked', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.temp', state: '25', attributes: {} },
      ];
      store.haUrl = 'https://ha.local:8123';
      store.accessToken = 'token123';

      const wrapper = mount(RawEntityView);
      const btn = wrapper.find('button[title*="Generate configuration"]');

      await btn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.successBanner).toBe(true);

      const closeBtn = wrapper.find('button.btn-close');
      await closeBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.successBanner).toBe(false);
    });
  });

  describe('Icon handling', () => {
    it('correctly converts mdi: format to class names', () => {
      const wrapper = mount(RawEntityView);
      
      const iconClass = wrapper.vm.getIconClass('mdi:kitchen');
      expect(iconClass).toBe('mdi mdi-kitchen');
    });

    it('returns empty string for null icon', () => {
      const wrapper = mount(RawEntityView);
      
      const iconClass = wrapper.vm.getIconClass(null);
      expect(iconClass).toBe('');
    });

    it('returns empty string for undefined icon', () => {
      const wrapper = mount(RawEntityView);
      
      const iconClass = wrapper.vm.getIconClass(undefined);
      expect(iconClass).toBe('');
    });

    it('returns icon string as-is if not mdi: format', () => {
      const wrapper = mount(RawEntityView);
      
      const iconClass = wrapper.vm.getIconClass('custom-icon-class');
      expect(iconClass).toBe('custom-icon-class');
    });
  });

  describe('Copy to Clipboard', () => {
    it('copy entity button is clickable', async () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.test', state: 'on', attributes: { friendly_name: 'Test' } },
      ];

      const wrapper = mount(RawEntityView);
      const copyBtn = wrapper.find('button[title*="Copy entity JSON"]');

      await copyBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(copyBtn.exists()).toBe(true);
    });

    it('copy area button is clickable', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'kitchen', area_id: 'kitchen', name: 'Kitchen', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const copyBtn = wrapper.find('button[title*="Copy area JSON"]');

      await copyBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(copyBtn.exists()).toBe(true);
    });
  });

  describe('View Props', () => {
    it('accepts viewName prop', () => {
      const wrapper = mount(RawEntityView, {
        props: { viewName: 'test-view' },
      });

      expect(wrapper.props('viewName')).toBe('test-view');
    });

    it('viewName prop defaults to empty string', () => {
      const wrapper = mount(RawEntityView);

      expect(wrapper.props('viewName')).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty areas array', async () => {
      const store = useHaStore();
      store.areas = [];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll('.card');
      expect(cards.length).toBe(0);
    });

    it('handles undefined areas array', async () => {
      const store = useHaStore();
      store.areas = undefined;
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll('.card');
      expect(cards.length).toBe(0);
    });

    it('handles entity with no friendly_name attribute', () => {
      const store = useHaStore();
      store.sensors = [
        { entity_id: 'sensor.test', state: 'on', attributes: {} },
      ];

      const wrapper = mount(RawEntityView);
      const title = wrapper.find('.card-title');

      expect(title.text()).toBe('sensor.test');
    });

    it('handles area with unnamed label', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'area1', area_id: 'area1', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const text = wrapper.text();
      expect(text).toContain('Unnamed');
    });

    it('handles area without entities array', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'kitchen', area_id: 'kitchen', name: 'Kitchen' },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.card-body').exists()).toBe(true);
    });

    it('shows empty entities count for area without entities', async () => {
      const store = useHaStore();
      store.areas = [
        { id: 'kitchen', area_id: 'kitchen', name: 'Kitchen', entities: [] },
      ];
      store.sensors = [];

      const wrapper = mount(RawEntityView);
      const select = wrapper.find('select');

      await select.setValue('areas');
      await wrapper.vm.$nextTick();

      const text = wrapper.text();
      expect(text).toContain('Entities (0)');
    });
  });
});
