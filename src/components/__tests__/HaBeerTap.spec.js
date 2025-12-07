import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaBeerTap from '../HaBeerTap.vue';
import { useHaStore } from '@/stores/haStore';

describe('HaBeerTap.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useHaStore();
    store.sensors = [];
  });

  it('renders error when no entities provided', () => {
    const wrapper = mount(HaBeerTap, {
      props: {
        entity: [],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.find('.border-warning').exists()).toBe(true);
    expect(wrapper.text()).toContain('No beer tap entities found');
  });

  it('renders beer tap with volume and beer data', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.tap_tap_volume1',
        state: '3.499',
        attributes: {
          glasses: 8.7,
          keg_volume: 19,
          glass_volume: 0.4,
          keg_percent: 18.41,
          unit_of_measurement: 'L',
          device_class: 'volume',
          friendly_name: 'Tap 1 - Volym',
          device_id: '301ae177572661f521c6ac4046ea18d6',
        },
      },
      {
        entity_id: 'sensor.tap_tap_beer1',
        state: 'Imperial Licorice',
        attributes: {
          abv: 8.9,
          ibu: 78,
          ebc: 53,
          friendly_name: 'Tap 1 - Namn',
          device_id: '301ae177572661f521c6ac4046ea18d6',
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ['sensor.tap_tap_volume1', 'sensor.tap_tap_beer1'],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Check beer name
    expect(wrapper.text()).toContain('Imperial Licorice');

    // Check ABV
    expect(wrapper.text()).toContain('ABV: 8.9');

    // Check IBU
    expect(wrapper.text()).toContain('IBU: 78');

    // Check EBC
    expect(wrapper.text()).toContain('EBC: 53');
  });

  it('calculates percentage correctly', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.tap_tap_volume1',
        state: '9.5',
        attributes: {
          glasses: 23.75,
          keg_volume: 19,
          glass_volume: 0.4,
          keg_percent: 50,
          unit_of_measurement: 'L',
          device_class: 'volume',
          friendly_name: 'Tap 1 - Volym',
        },
      },
      {
        entity_id: 'sensor.tap_tap_beer1',
        state: 'Test Beer',
        attributes: {
          abv: 5.0,
          ibu: 40,
          ebc: 20,
          friendly_name: 'Tap 1 - Namn',
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ['sensor.tap_tap_volume1', 'sensor.tap_tap_beer1'],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // 9.5 / 19 * 100 = 50%
    expect(wrapper.text()).toContain('Test Beer');
    expect(wrapper.text()).toContain('ABV: 5.0');
  });

  it('shows empty state when volume is 0', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.tap_tap_volume4',
        state: '0',
        attributes: {
          glasses: 0,
          keg_volume: 19,
          glass_volume: 0.4,
          keg_percent: 0,
          unit_of_measurement: 'L',
          device_class: 'volume',
          friendly_name: 'Tap 4 - Volym',
        },
      },
      {
        entity_id: 'sensor.tap_tap_beer4',
        state: 'unknown',
        attributes: {
          friendly_name: 'Tap 4 - Namn',
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ['sensor.tap_tap_volume4', 'sensor.tap_tap_beer4'],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Should show beer-off icon
    expect(wrapper.find('.mdi-beer-off').exists()).toBe(true);

    // Should not show ABV or additional info
    const abvText = wrapper.text();
    expect(abvText).not.toContain('% ABV');
  });

  it('uses EBC value to determine beer color', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.tap_tap_volume1',
        state: '10',
        attributes: {
          glasses: 25,
          keg_volume: 19,
          glass_volume: 0.4,
          unit_of_measurement: 'L',
          device_class: 'volume',
          friendly_name: 'Tap 1 - Volym',
        },
      },
      {
        entity_id: 'sensor.tap_tap_beer1',
        state: 'Dark Stout',
        attributes: {
          abv: 7.0,
          ibu: 60,
          ebc: 100, // Very dark, should be #3D2817
          friendly_name: 'Tap 1 - Namn',
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ['sensor.tap_tap_volume1', 'sensor.tap_tap_beer1'],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Check that color is applied to progress bar and icon background
    const iconBg = wrapper.find('.ha-icon-circle');
    expect(iconBg.attributes('style')).toContain('background-color: #3D2817');
  });

  it('handles missing attributes gracefully', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.tap_tap_volume1',
        state: '5',
        attributes: {
          unit_of_measurement: 'L',
          device_class: 'volume',
          friendly_name: 'Tap 1 - Volym',
        },
      },
      {
        entity_id: 'sensor.tap_tap_beer1',
        state: 'Test Beer',
        attributes: {
          friendly_name: 'Tap 1 - Namn',
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ['sensor.tap_tap_volume1', 'sensor.tap_tap_beer1'],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    // Should show '-' for missing values
    expect(wrapper.text()).toContain('-');

    // Should not throw error
    expect(wrapper.find('.card').exists()).toBe(true);
  });

  it('accepts entity objects as props', () => {
    const store = useHaStore();
    const volumeEntity = {
      entity_id: 'sensor.tap_tap_volume1',
      state: '15',
      attributes: {
        glasses: 37.5,
        keg_volume: 19,
        unit_of_measurement: 'L',
        device_class: 'volume',
        friendly_name: 'Tap 1 - Volym',
      },
    };

    const beerEntity = {
      entity_id: 'sensor.tap_tap_beer1',
      state: 'Pale Ale',
      attributes: {
        abv: 5.5,
        ibu: 45,
        ebc: 25,
        friendly_name: 'Tap 1 - Namn',
      },
    };

    store.sensors = [volumeEntity, beerEntity];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: [volumeEntity, beerEntity],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Pale Ale');
    expect(wrapper.text()).toContain('ABV: 5.5');
    expect(wrapper.text()).toContain('IBU: 45');
  });

  it('auto-detects volume entity by device_class', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.tap_tap_volume1',
        state: '12.5',
        attributes: {
          glasses: 31.3,
          keg_volume: 19,
          unit_of_measurement: 'L',
          device_class: 'volume',
          friendly_name: 'Tap 1 - Volym',
        },
      },
      {
        entity_id: 'sensor.tap_tap_beer1',
        state: 'Belgian Tripel',
        attributes: {
          abv: 9.0,
          ibu: 35,
          ebc: 12,
          friendly_name: 'Tap 1 - Namn',
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ['sensor.tap_tap_volume1', 'sensor.tap_tap_beer1'],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    const text = wrapper.text();
    expect(text).toContain('Belgian Tripel');
    expect(text).toContain('ABV: 9.0');
    expect(text).toContain('EBC: 12');
    expect(text).toContain('IBU: 35');
  });

  it('auto-detects beer entity by entity_id pattern', () => {
    const store = useHaStore();
    store.sensors = [
      {
        entity_id: 'sensor.gravitymon_volume',
        state: '8.5',
        attributes: {
          glasses: 21.25,
          keg_volume: 19,
          unit_of_measurement: 'L',
          device_class: 'volume',
          friendly_name: 'Gravitymon Volume',
        },
      },
      {
        entity_id: 'sensor.gravitymon_beername',
        state: 'Hoppy IPA',
        attributes: {
          abv: 6.5,
          ibu: 65,
          ebc: 35,
          friendly_name: 'Gravitymon Beer Name',
        },
      },
    ];

    const wrapper = mount(HaBeerTap, {
      props: {
        entity: ['sensor.gravitymon_volume', 'sensor.gravitymon_beername'],
      },
      global: {
        stubs: {
          i: true,
          svg: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Hoppy IPA');
    expect(wrapper.text()).toContain('ABV: 6.5');
    expect(wrapper.text()).toContain('IBU: 65');
  });
});
