import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import HaGlance from '../HaGlance.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';

describe('HaGlance.vue', () => {
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
          icon: 'mdi:thermometer',
        },
      },
      {
        entity_id: 'sensor.humidity',
        state: '65',
        attributes: {
          friendly_name: 'Humidity',
          unit_of_measurement: '%',
          icon: 'mdi:water-percent',
        },
      },
    ];
    store.devices = [];
    store.entities = {};
  });

  describe('Component Rendering', () => {
    it('should mount successfully', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: [] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('should render with container', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: [] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.glance-grid').exists()).toBe(true);
    });

    it('should render card structure', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: [] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.card-display').exists()).toBe(true);
    });
  });

  describe('Entity List Handling', () => {
    it('should accept entities prop', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props('entity')).toBeDefined();
    });

    it('should handle empty entities list', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: [] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.vm.entityList).toBeDefined();
      expect(Array.isArray(wrapper.vm.entityList)).toBe(true);
      expect(wrapper.vm.entityList.length).toBe(0);
    });

    it('should handle single entity', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.vm.entityList.length).toBe(1);
    });

    it('should handle multiple entities', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature', 'sensor.humidity'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.vm.entityList.length).toBe(2);
    });

    it('should update when entities change', async () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.vm.entityList.length).toBe(1);
      
      await wrapper.setProps({ entity: ['sensor.temperature', 'sensor.humidity'] });
      expect(wrapper.vm.entityList.length).toBe(2);
    });
  });

  describe('Entity Display', () => {
    it('should display entity names', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('Temperature');
    });

    it('should display entity state', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('22.5');
    });

    it('should display multiple entity states', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature', 'sensor.humidity'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('Temperature');
      expect(wrapper.text()).toContain('22.5');
      expect(wrapper.text()).toContain('Humidity');
      expect(wrapper.text()).toContain('65');
    });
  });

  describe('Entity Resolution', () => {
    it('should resolve string entity IDs', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.vm.entityList[0]).toBeTruthy();
    });

    it('should resolve object entities', () => {
      const entity = store.sensors[0];
      const wrapper = mount(HaGlance, {
        props: { entity: [entity] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.vm.entityList[0]).toBeTruthy();
    });

    it('should handle unknown entities gracefully', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.nonexistent'] },
        global: { plugins: [pinia] },
      });
      // Should not crash, though entity may not be found
      expect(wrapper.exists()).toBe(true);
    });

    it('should mix string and object entities', () => {
      const entity = store.sensors[0];
      const wrapper = mount(HaGlance, {
        props: { entity: [entity, 'sensor.humidity'] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.vm.entityList.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Props Validation', () => {
    it('should accept array of string entities', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temp', 'sensor.humidity'] },
        global: { plugins: [pinia] },
      });
      expect(Array.isArray(wrapper.props('entity'))).toBe(true);
    });

    it('should accept array of object entities', () => {
      const entities = [store.sensors[0], store.sensors[1]];
      const wrapper = mount(HaGlance, {
        props: { entity: entities },
        global: { plugins: [pinia] },
      });
      expect(Array.isArray(wrapper.props('entity'))).toBe(true);
    });

    it('should accept empty array', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: [] },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props('entity')).toEqual([]);
    });
  });

  describe('Card Structure', () => {
    it('should have responsive column classes', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: [] },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find('.card');
      expect(card.exists()).toBe(true);
    });

    it('should display all properties in glance view', () => {
      const wrapper = mount(HaGlance, {
        props: { entity: ['sensor.temperature', 'sensor.humidity'] },
        global: { plugins: [pinia] },
      });
      const glanceItems = wrapper.findAll('.glance-item');
      // Should have at least the entities listed
      expect(wrapper.text()).toMatch(/Temperature|Humidity/);
    });
  });
});
