import { describe, it, expect, beforeEach, vi } from 'vitest';
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
      { entity_id: 'switch.outlet', state: 'on', attributes: { friendly_name: 'Outlet' } },
      { entity_id: 'light.kitchen', state: 'on', attributes: { friendly_name: 'Kitchen Light' } },
      { entity_id: 'binary_sensor.motion', state: 'on', attributes: { friendly_name: 'Motion' } },
      { entity_id: 'media_player.tv', state: 'idle', attributes: { friendly_name: 'TV' } },
      { entity_id: 'weather.home', state: 'clear', attributes: { friendly_name: 'Weather' } },
      { entity_id: 'fan.ceiling', state: 'off', attributes: { friendly_name: 'Ceiling Fan' } },
    ];
  });

  describe('Basic rendering', () => {
    it('should mount successfully with empty entities', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { 
          plugins: [pinia], 
          stubs: { HaSpacer: true, HaSensor: true, HaSwitch: true, HaLight: true, HaBinarySensor: true, HaWeather: true, HaMediaPlayer: true },
        },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('should render container element', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { 
          plugins: [pinia], 
          stubs: { HaSpacer: true, HaSensor: true },
        },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Props', () => {
    it('should accept entities prop as array', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.temp' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.props('entities')).toBeDefined();
      expect(Array.isArray(wrapper.props('entities'))).toBe(true);
    });

    it('should accept componentMap prop', () => {
      const componentMap = { sensor: 'CustomComponent' };
      const wrapper = mount(HaEntityList, {
        props: { entities: [], componentMap },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.props('componentMap')).toEqual(componentMap);
    });

    it('should have default empty componentMap', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.props('componentMap')).toEqual({});
    });

    it('should accept attributes prop', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [], attributes: ['temp', 'humidity'] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.props('attributes')).toEqual(['temp', 'humidity']);
    });
  });

  describe('Domain mapping', () => {
    it('should map switch domain to HaSwitch', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'switch.outlet' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true, HaSwitch: true } },
      });
      expect(wrapper.vm.getComponentForDomain('switch.outlet')).toBe('HaSwitch');
    });

    it('should map binary_sensor domain to HaBinarySensor', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('binary_sensor.motion')).toBe('HaBinarySensor');
    });

    it('should map sensor domain to HaSensor', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('sensor.temp')).toBe('HaSensor');
    });

    it('should map light domain to HaLight', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('light.kitchen')).toBe('HaLight');
    });

    it('should map alarm_control_panel domain to HaAlarmPanel', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('alarm_control_panel.home')).toBe('HaAlarmPanel');
    });

    it('should map weather domain to HaWeather', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('weather.home')).toBe('HaWeather');
    });

    it('should map update domain to HaBinarySensor', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('update.device')).toBe('HaBinarySensor');
    });

    it('should map sun domain to HaSun', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('sun.sun')).toBe('HaSun');
    });

    it('should map device_tracker domain to HaSensor', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('device_tracker.phone')).toBe('HaSensor');
    });

    it('should map fan domain to HaLight', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('fan.ceiling')).toBe('HaLight');
    });

    it('should map media_player domain to HaMediaPlayer', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('media_player.tv')).toBe('HaMediaPlayer');
    });

    it('should map select domain to HaSelect', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('select.mode')).toBe('HaSelect');
    });

    it('should map button domain to HaButton', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('button.restart')).toBe('HaButton');
    });

    it('should return HaSensor for unknown domain', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('unknown.entity')).toBe('HaSensor');
    });

    it('should use custom componentMap to override default domain mapping', () => {
      const wrapper = mount(HaEntityList, {
        props: { 
          entities: [],
          componentMap: { switch: 'CustomSwitch' }
        },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      expect(wrapper.vm.getComponentForDomain('switch.outlet')).toBe('CustomSwitch');
    });
  });

  describe('Entity processing - direct entityId', () => {
    it('should render entity with directentityId from store', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.temp' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(1);
      expect(wrapper.vm.displayedEntities[0].entity.entity_id).toBe('sensor.temp');
    });

    it('should create fallback entity if not found in store', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.nonexistent' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(1);
      expect(wrapper.vm.displayedEntities[0].entity.entity_id).toBe('sensor.nonexistent');
      expect(wrapper.vm.displayedEntities[0].entity.state).toBe('unknown');
    });

    it('should skip invalid entities without entityId or getter', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ invalid: 'data' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      // Invalid entities with no entityId or getter are skipped
      expect(wrapper.vm.displayedEntities).toHaveLength(0);
    });

    it('should render spacer for explicitly whitespace-only entityId', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: '   ' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      // Whitespace-only entityId becomes spacer (trim() === '')
      expect(wrapper.vm.displayedEntities).toHaveLength(1);
      expect(wrapper.vm.displayedEntities[0].isSpacer).toBe(true);
    });

    it('should support custom component override for entityId', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.temp', component: 'CustomComponent' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities[0].component).toBe('CustomComponent');
    });

    it('should process multiple entities with mixed custom components', () => {
      const wrapper = mount(HaEntityList, {
        props: { 
          entities: [
            { entityId: 'sensor.temp' },
            { entityId: 'switch.outlet', component: 'CustomSwitch' },
            { entityId: 'light.kitchen' }
          ] 
        },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(3);
      expect(wrapper.vm.displayedEntities[1].component).toBe('CustomSwitch');
    });
  });

  describe('Entity processing - getter functions', () => {
    beforeEach(() => {
      store.getBatterySensors = vi.fn().mockReturnValue([
        { entity_id: 'sensor.battery1', state: '80', attributes: { friendly_name: 'Battery 1' } },
        { entity_id: 'sensor.battery2', state: '60', attributes: { friendly_name: 'Battery 2' } },
      ]);
    });

    it('should call getter function and render returned entities', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ getter: 'getBatterySensors' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(store.getBatterySensors).toHaveBeenCalled();
      expect(wrapper.vm.displayedEntities).toHaveLength(2);
      expect(wrapper.vm.displayedEntities[0].entity.entity_id).toBe('sensor.battery1');
    });

    it('should support custom component override for getter results', () => {
      store.getBatterySensors = vi.fn().mockReturnValue([
        { entity_id: 'sensor.battery1', state: '80', attributes: { friendly_name: 'Battery 1' } },
        { entity_id: 'sensor.battery2', state: '60', attributes: { friendly_name: 'Battery 2' } },
      ]);
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ getter: 'getBatterySensors', component: 'BatteryComponent' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(2);
      expect(wrapper.vm.displayedEntities[0].component).toBe('BatteryComponent');
      expect(wrapper.vm.displayedEntities[1].component).toBe('BatteryComponent');
    });

    it('should skip invalid getter (not a function)', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ getter: 'nonexistentGetter' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(0);
    });

    it('should skip getter that is not a function', () => {
      store.notAFunction = 'string';
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ getter: 'notAFunction' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(0);
    });
  });

  describe('Spacer handling', () => {
    it('should skip entities with empty entityId (falsy)', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: '' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true } },
      });
      // Empty entityId is falsy, so it doesn't match the "else if (item.entityId)" condition
      expect(wrapper.vm.displayedEntities).toHaveLength(0);
    });

    it('should keep spacers in filtered output', () => {
      const wrapper = mount(HaEntityList, {
        props: { 
          entities: [
            { entityId: 'sensor.temp' },
            { entityId: '   ' },  // Whitespace becomes spacer (trim() === '')
            { entityId: 'sensor.humid' }
          ]
        },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(3);
      expect(wrapper.vm.displayedEntities[1].isSpacer).toBe(true);
      expect(wrapper.vm.displayedEntities[0].entity.entity_id).toBe('sensor.temp');
      expect(wrapper.vm.displayedEntities[2].entity.entity_id).toBe('sensor.humid');
    });
  });

  describe('Error handling and filtering', () => {
    it('should handle error in displayedEntities and return empty array', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ invalid: 'data' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      // Should not throw and should return valid array
      expect(Array.isArray(wrapper.vm.displayedEntities)).toBe(true);
    });

    it('should filter out null entities', () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.temp' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      const hasNullEntity = wrapper.vm.displayedEntities.some(item => !item.isSpacer && !item.entity);
      expect(hasNullEntity).toBe(false);
    });

    it('should filter out entities without entity_id', () => {
      // This is an edge case - entities should always have entity_id
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.temp' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      const hasMissingId = wrapper.vm.displayedEntities.some(
        item => !item.isSpacer && !item.entity.entity_id
      );
      expect(hasMissingId).toBe(false);
    });

    it('should filter out entities with null or undefined attributes', () => {
      store.sensors.push({
        entity_id: 'sensor.broken',
        state: 'on',
        attributes: null,
      });
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.broken' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      // Entities with null attributes should be filtered out
      expect(wrapper.vm.displayedEntities).toHaveLength(0);
    });
  });

  describe('Mixed entity types', () => {
    it('should handle mix of entityId and getter', () => {
      store.getBatterySensors = vi.fn().mockReturnValue([
        { entity_id: 'sensor.battery', state: '80', attributes: { friendly_name: 'Battery' } },
      ]);
      const wrapper = mount(HaEntityList, {
        props: { 
          entities: [
            { entityId: 'sensor.temp' },
            { getter: 'getBatterySensors' },
            { entityId: 'sensor.humid' }
          ]
        },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      // All three entities should be rendered
      expect(wrapper.vm.displayedEntities).toHaveLength(3);
      expect(wrapper.vm.displayedEntities[0].entity.entity_id).toBe('sensor.temp');
      expect(wrapper.vm.displayedEntities[1].entity.entity_id).toBe('sensor.battery');
      expect(wrapper.vm.displayedEntities[2].entity.entity_id).toBe('sensor.humid');
    });

    it('should handle mix of entities with and without spacers', () => {
      const wrapper = mount(HaEntityList, {
        props: { 
          entities: [
            { entityId: 'sensor.temp' },
            { entityId: '   ' },  // Whitespace becomes spacer
            { entityId: 'sensor.humid' }
          ]
        },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      expect(wrapper.vm.displayedEntities).toHaveLength(3);
      const spacers = wrapper.vm.displayedEntities.filter(item => item.isSpacer);
      expect(spacers).toHaveLength(1);
      expect(wrapper.vm.displayedEntities[1].isSpacer).toBe(true);
      expect(wrapper.vm.displayedEntities[0].entity.entity_id).toBe('sensor.temp');
      expect(wrapper.vm.displayedEntities[2].entity.entity_id).toBe('sensor.humid');
    });
  });

  describe('Update prop reactivity', () => {
    it('should update displayed entities when prop changes', async () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.temp' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      
      expect(wrapper.vm.displayedEntities).toHaveLength(1);
      
      await wrapper.setProps({ entities: [{ entityId: 'sensor.temp' }, { entityId: 'sensor.humid' }] });
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.displayedEntities).toHaveLength(2);
    });

    it('should reactively update when store.sensors changes', async () => {
      const wrapper = mount(HaEntityList, {
        props: { entities: [{ entityId: 'sensor.newentity' }] },
        global: { plugins: [pinia], stubs: { HaSpacer: true, HaSensor: true } },
      });
      
      // Initially should have fallback entity
      expect(wrapper.vm.displayedEntities[0].entity.state).toBe('unknown');
      
      // Add to store
      store.sensors.push({
        entity_id: 'sensor.newentity',
        state: 'active',
        attributes: { friendly_name: 'New Entity' },
      });
      
      await wrapper.vm.$nextTick();
      
      // Should now find it in store
      const displayedEntity = wrapper.vm.displayedEntities.find(
        item => item.entity.entity_id === 'sensor.newentity'
      );
      expect(displayedEntity.entity.state).toBe('active');
    });
  });
});
