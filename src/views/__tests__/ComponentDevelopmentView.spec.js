import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ComponentDevelopmentView from '../ComponentDevelopmentView.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '../../stores/haStore';

// Mock HaEntityList component
const mockHaEntityList = {
  name: 'HaEntityList',
  template: '<div class="ha-entity-list"><slot /></div>',
  props: ['entities'],
};

describe('ComponentDevelopmentView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the view title', () => {
    const wrapper = mount(ComponentDevelopmentView, {
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

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    expect(wrapper.findComponent(mockHaEntityList).exists()).toBe(true);
  });

  it('filters out button entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'button.restart', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out visonic entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'sensor.visonic_device', state: 'on', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out light entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'light.lamp', state: 'on', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out event entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'event.button_press', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out conversation entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'conversation.home_assistant', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out scene entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'scene.movie', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out input_number entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'input_number.threshold', state: '10', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out input_boolean entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'input_boolean.debug', state: 'off', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out input_select entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'input_select.mode', state: 'auto', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out zone entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'zone.home', state: 'zoning', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out person entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'person.john', state: 'home', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out script entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'script.cleanup', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out todo entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'todo.shopping', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out notify entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'notify.email', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out automation entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'automation.test', state: 'off', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out tts entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'tts.google_translate_en', state: 'unavailable', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out number entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'number.speed', state: '100', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out remote entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'remote.tv', state: 'on', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('filters out camera entities', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'camera.front_door', state: 'idle', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([
      { entityId: 'sensor.temp' },
    ]);
  });

  it('limits entities to 50', () => {
    const store = useHaStore();
    store.sensors = Array.from({ length: 100 }, (_, i) => ({
      entity_id: `sensor.entity${i}`,
      state: '0',
      attributes: {},
    }));

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities').length).toBe(50);
  });

  it('handles empty sensor list', () => {
    const store = useHaStore();
    store.sensors = [];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities')).toEqual([]);
  });

  it('applies all filters correctly on mixed entity types', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'sensor.humidity', state: '60', attributes: {} },
      { entity_id: 'button.restart', state: 'unavailable', attributes: {} },
      { entity_id: 'light.lamp', state: 'on', attributes: {} },
      { entity_id: 'switch.pump', state: 'off', attributes: {} },
      { entity_id: 'automation.test', state: 'on', attributes: {} },
      { entity_id: 'person.john', state: 'home', attributes: {} },
      { entity_id: 'zone.home', state: 'zoning', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    const entityIds = entityList.props('entities').map((e) => e.entityId);
    
    // Should include sensors and switches, exclude everything else
    expect(entityIds).toContain('sensor.temp');
    expect(entityIds).toContain('sensor.humidity');
    expect(entityIds).toContain('switch.pump');
    expect(entityIds).not.toContain('button.restart');
    expect(entityIds).not.toContain('light.lamp');
    expect(entityIds).not.toContain('automation.test');
    expect(entityIds).not.toContain('person.john');
    expect(entityIds).not.toContain('zone.home');
  });

  it('preserves entity order from store', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.first', state: '1', attributes: {} },
      { entity_id: 'sensor.second', state: '2', attributes: {} },
      { entity_id: 'sensor.third', state: '3', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
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

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    let entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities').length).toBe(1);

    // Add a new sensor
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'sensor.humidity', state: '60', attributes: {} },
    ];

    await wrapper.vm.$nextTick();
    entityList = wrapper.findComponent(mockHaEntityList);
    expect(entityList.props('entities').length).toBe(2);
  });

  it('formats entities with entityId property', () => {
    const store = useHaStore();
    store.sensors = [
      { entity_id: 'sensor.temp', state: '25', attributes: {} },
      { entity_id: 'sensor.humidity', state: '60', attributes: {} },
    ];

    const wrapper = mount(ComponentDevelopmentView, {
      global: {
        components: { HaEntityList: mockHaEntityList },
      },
    });

    const entityList = wrapper.findComponent(mockHaEntityList);
    const entities = entityList.props('entities');
    
    expect(entities).toEqual([
      { entityId: 'sensor.temp' },
      { entityId: 'sensor.humidity' },
    ]);
  });
});
