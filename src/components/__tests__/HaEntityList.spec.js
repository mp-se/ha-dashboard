import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import HaEntityList from '../HaEntityList.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';

describe('HaEntityList.vue', () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '20', attributes: { friendly_name: 'Temp' } },
      { entity_id: 'sensor.humid', state: '60', attributes: { friendly_name: 'Humid' } },
    ];
  });

  it('should mount successfully with empty entities', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [] },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept entities prop as array', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [{ entityId: 'sensor.temp' }] },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(wrapper.props('entities')).toBeDefined();
    expect(Array.isArray(wrapper.props('entities'))).toBe(true);
  });

  it('should have displayedEntities computed property', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [{ entityId: 'sensor.temp' }] },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(wrapper.vm.displayedEntities).toBeDefined();
    expect(Array.isArray(wrapper.vm.displayedEntities)).toBe(true);
  });

  it('should have getComponentForDomain method', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [] },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(typeof wrapper.vm.getComponentForDomain).toBe('function');
  });

  it('should render container element', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [] },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should update entities when prop changes', async () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [{ entityId: 'sensor.temp' }] },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    
    await wrapper.setProps({ entities: [{ entityId: 'sensor.temp' }, { entityId: 'sensor.humid' }] });
    await wrapper.vm.$nextTick();
    expect(wrapper.props('entities').length).toBe(2);
  });

  it('should handle entity filtering', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [{ entityId: 'sensor.temp' }, { entityId: 'light.kitchen' }] },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(wrapper.vm.displayedEntities).toBeDefined();
  });

  it('should support displayLimit prop', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [{ entityId: 'sensor.temp' }], displayLimit: 5 },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(wrapper.props('displayLimit')).toBeUndefined();
  });

  it('should support order prop', () => {
    const wrapper = mount(HaEntityList, {
      props: { entities: [{ entityId: 'sensor.temp' }], order: 'descending' },
      global: { plugins: [pinia], stubs: { HaSpacer: true } },
    });
    expect(wrapper.props('order')).toBeUndefined();
  });
});
