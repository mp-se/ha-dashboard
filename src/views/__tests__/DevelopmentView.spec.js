import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DevelopmentView from '../DevelopmentView.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '../../stores/haStore';

// Mock HaEntityList component
const mockHaEntityList = {
  name: 'HaEntityList',
  template: '<div class="ha-entity-list"><slot /></div>',
  props: ['entities'],
};

describe('DevelopmentView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the view title', () => {
    const wrapper = mount(DevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });
    expect(wrapper.text()).toContain('Component Development View');
  });

  it('renders HaEntityList component', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
    ];

    const wrapper = mount(DevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.exists()).toBe(true);
  });

  it('passes entities to HaEntityList', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'sensor.humidity', state: '60', attributes: {} },
    ];

    const wrapper = mount(DevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toHaveLength(2);
    expect(entityList.props('entities')[0].entityId).toBe('sensor.temp');
    expect(entityList.props('entities')[1].entityId).toBe('sensor.humidity');
  });

  it('includes all entity types without filtering', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'button.restart', state: 'unknown', attributes: {} },
      { entity_id: 'sensor.visonic_device', state: 'on', attributes: {} },
      { entity_id: 'light.lamp', state: 'on', attributes: {} },
      { entity_id: 'event.motion', state: 'unavailable', attributes: {} },
      { entity_id: 'conversation.home', state: 'idle', attributes: {} },
      { entity_id: 'scene.movie', state: 'unavailable', attributes: {} },
      { entity_id: 'input_number.threshold', state: '50', attributes: {} },
      { entity_id: 'input_boolean.vacation_mode', state: 'off', attributes: {} },
      { entity_id: 'input_select.mode', state: 'auto', attributes: {} },
      { entity_id: 'zone.home', state: 'zoning', attributes: {} },
      { entity_id: 'person.john', state: 'home', attributes: {} },
      { entity_id: 'script.cleanup', state: 'unavailable', attributes: {} },
      { entity_id: 'todo.shopping', state: 'unavailable', attributes: {} },
      { entity_id: 'notify.email', state: 'unavailable', attributes: {} },
      { entity_id: 'automation.test', state: 'off', attributes: {} },
      { entity_id: 'tts.google_translate_en', state: 'unavailable', attributes: {} },
      { entity_id: 'number.speed', state: '100', attributes: {} },
      { entity_id: 'remote.tv', state: 'on', attributes: {} },
      { entity_id: 'camera.front_door', state: 'idle', attributes: {} },
    ];

    const wrapper = mount(DevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    const entityIds = entityList.props('entities').map((e) => e.entityId);
    
    expect(entityIds).toContain('sensor.temp');
    expect(entityIds).toContain('button.restart');
    expect(entityIds).toContain('sensor.visonic_device');
    expect(entityIds).toContain('light.lamp');
    expect(entityIds).toContain('event.motion');
    expect(entityIds).toContain('conversation.home');
    expect(entityIds).toContain('scene.movie');
    expect(entityIds).toContain('input_number.threshold');
    expect(entityIds).toContain('input_boolean.vacation_mode');
    expect(entityIds).toContain('input_select.mode');
    expect(entityIds).toContain('zone.home');
    expect(entityIds).toContain('person.john');
    expect(entityIds).toContain('script.cleanup');
    expect(entityIds).toContain('todo.shopping');
    expect(entityIds).toContain('notify.email');
    expect(entityIds).toContain('automation.test');
    expect(entityIds).toContain('tts.google_translate_en');
    expect(entityIds).toContain('number.speed');
    expect(entityIds).toContain('remote.tv');
    expect(entityIds).toContain('camera.front_door');
  });

  it('preserves entity order from store', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.first', state: '1', attributes: {} },
      { entity_id: 'sensor.second', state: '2', attributes: {} },
      { entity_id: 'sensor.third', state: '3', attributes: {} },
    ];

    const wrapper = mount(DevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    const entityIds = entityList.props('entities').map((e) => e.entityId);
    
    expect(entityIds).toEqual(['sensor.first', 'sensor.second', 'sensor.third']);
  });

  it('reacts to store changes', async () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
    ];

    const wrapper = mount(DevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    let entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toHaveLength(1);

    // Add a new sensor
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'sensor.humidity', state: '60', attributes: {} },
    ];

    await wrapper.vm.$nextTick();

    entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toHaveLength(2);
  });

  it('handles empty entity list', () => {
    const store = useHaStore();
    store.sensors = [];

    const wrapper = mount(DevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toHaveLength(0);
  });
});
