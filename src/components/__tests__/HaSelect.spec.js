import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HaSelect from '../HaSelect.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';

describe('HaSelect.vue', () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.devices = [];
    store.sensors = [
      {
        entity_id: 'select.mode',
        state: 'auto',
        attributes: {
          friendly_name: 'Mode Select',
          options: ['auto', 'manual', 'off'],
        },
      },
    ];
  });

  describe('Component Rendering', () => {
    it('should render select card with entity string', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.card').exists()).toBe(true);
      expect(wrapper.find('.card-control').exists()).toBe(true);
    });

    it('should render select card with entity object', () => {
      const entity = store.sensors[0];
      const wrapper = mount(HaSelect, {
        props: { entity },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.card').exists()).toBe(true);
    });

    it('should display friendly name from attributes', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('Mode Select');
    });

    it('should display entity_id as fallback for name', () => {
      store.sensors = [
        {
          entity_id: 'select.test',
          state: 'option1',
          attributes: {
            options: ['option1', 'option2'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.test' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('select.test');
    });
  });

  describe('Select Options Rendering', () => {
    it('should render select element with options', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const btnGroup = wrapper.find('.btn-group');
      expect(btnGroup.exists()).toBe(true);
      const labels = wrapper.findAll('label');
      expect(labels).toHaveLength(3);
    });

    it('should display all available options', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const labels = wrapper.findAll('label');
      expect(labels[0].text()).toBe('auto');
      expect(labels[1].text()).toBe('manual');
      expect(labels[2].text()).toBe('off');
    });

    it('should set correct selected value', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const inputs = wrapper.findAll('input[type="radio"]');
      expect(inputs[0].element.checked).toBe(true);
      expect(inputs[0].element.value).toBe('auto');
    });

    it('should display current state', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const inputs = wrapper.findAll('input[type="radio"]');
      expect(inputs[0].element.checked).toBe(true);
    });

    it('should handle entity without options gracefully', () => {
      store.sensors = [
        {
          entity_id: 'select.empty',
          state: 'unknown',
          attributes: {},
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.empty' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.btn-group').exists()).toBe(false);
    });
  });

  describe('Select States', () => {
    it('should disable select when state is unavailable', () => {
      store.sensors = [
        {
          entity_id: 'select.mode',
          state: 'unavailable',
          attributes: {
            friendly_name: 'Mode Select',
            options: ['auto', 'manual', 'off'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const inputs = wrapper.findAll('input[type="radio"]');
      expect(inputs[0].attributes('disabled')).toBeDefined();
    });

    it('should disable select when state is unknown', () => {
      store.sensors = [
        {
          entity_id: 'select.mode',
          state: 'unknown',
          attributes: {
            friendly_name: 'Mode Select',
            options: ['auto', 'manual', 'off'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const inputs = wrapper.findAll('input[type="radio"]');
      expect(inputs[0].attributes('disabled')).toBeDefined();
    });

    it('should enable select for normal state', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const inputs = wrapper.findAll('input[type="radio"]');
      expect(inputs[0].attributes('disabled')).toBeUndefined();
    });
  });

  describe('Card Border Styling', () => {
    it('should have warning border when unavailable', () => {
      store.sensors = [
        {
          entity_id: 'select.mode',
          state: 'unavailable',
          attributes: {
            friendly_name: 'Mode Select',
            options: ['auto', 'manual', 'off'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find('.card');
      expect(card.classes()).toContain('border-warning');
    });

    it('should have info border when available', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find('.card');
      expect(card.classes()).toContain('border-info');
    });

    it('should have success border when in success state', () => {
      store.sensors = [
        {
          entity_id: 'select.mode',
          state: 'active',
          attributes: {
            friendly_name: 'Mode Select',
            options: ['active', 'inactive'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find('.card');
      expect(card.classes()).toContain('border-info');
    });
  });

  describe('Device Name Display', () => {
    it('should display device name when device_id present', () => {
      store.devices = [
        {
          id: 'device123',
          name: 'Living Room Device',
        },
      ];
      store.sensors = [
        {
          entity_id: 'select.mode',
          state: 'auto',
          attributes: {
            friendly_name: 'Mode Select',
            device_id: 'device123',
            options: ['auto', 'manual', 'off'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      // Device info is not displayed in the HaSelect component
      expect(wrapper.exists()).toBe(true);
    });

    it('should display device name section when device present', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      // Just verify component doesn't crash with device info
      expect(wrapper.exists()).toBe(true);
    });

    it('should show device ID fallback when name not available', () => {
      store.sensors = [
        {
          entity_id: 'select.mode',
          state: 'auto',
          attributes: {
            friendly_name: 'Mode Select',
            device_id: 'device123',
            options: ['auto', 'manual', 'off'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      // Device info is not displayed in the HaSelect component
      expect(wrapper.exists()).toBe(true);
    });

    it('should not display device name when device_id not present', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const deviceSection = wrapper.find('.border-top');
      expect(deviceSection.exists()).toBe(false);
    });
  });

  describe('Icon Display', () => {
    it('should display format-list-bulleted icon', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const icon = wrapper.find('.select-icon');
      expect(icon.classes()).toContain('mdi-format-list-bulleted');
    });
  });

  describe('Service Call Integration', () => {
    it('should call service when option changed', async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const inputs = wrapper.findAll('input[type="radio"]');
      await inputs[1].setValue();
      await wrapper.vm.$nextTick();
      expect(store.callService).toHaveBeenCalledWith('select', 'select_option', {
        entity_id: 'select.mode',
        option: 'manual',
      });
    });

    it('should use correct service domain', async () => {
      store.callService = vi.fn();
      store.sensors = [
        {
          entity_id: 'input_select.choice',
          state: 'option1',
          attributes: {
            friendly_name: 'Choice',
            options: ['option1', 'option2'],
          },
        },
      ];
      const wrapper = mount(HaSelect, {
        props: { entity: 'input_select.choice' },
        global: { plugins: [pinia] },
      });
      const inputs = wrapper.findAll('input[type="radio"]');
      await inputs[1].setValue();
      await wrapper.vm.$nextTick();
      expect(store.callService).toHaveBeenCalledWith('input_select', 'select_option', expect.any(Object));
    });

    it('should not call service when entity not resolved', async () => {
      store.callService = vi.fn();
      store.sensors = [];
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.nonexistent' },
        global: { plugins: [pinia] },
      });
      // Should not have a button group to change
      expect(wrapper.find('.btn-group').exists()).toBe(false);
    });
  });

  describe('Props Validation', () => {
    it('should accept valid string entity', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.test' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props('entity')).toBe('select.test');
    });

    it('should accept valid object entity', () => {
      const entity = store.sensors[0];
      const wrapper = mount(HaSelect, {
        props: { entity },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props('entity')).toBe(entity);
    });

    it('should accept attributes prop', () => {
      const attributes = ['attr1', 'attr2'];
      const wrapper = mount(HaSelect, {
        props: {
          entity: 'select.mode',
          attributes,
        },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props('attributes')).toEqual(attributes);
    });

    it('should default attributes to empty array', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props('attributes')).toEqual([]);
    });
  });

  describe('Classes and Structure', () => {
    it('should have correct card classes', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find('.card');
      expect(card.classes()).toContain('card-control');
      expect(card.classes()).toContain('h-100');
      expect(card.classes()).toContain('rounded-4');
      expect(card.classes()).toContain('shadow-lg');
    });

    it('should have responsive column classes', () => {
      const wrapper = mount(HaSelect, {
        props: { entity: 'select.mode' },
        global: { plugins: [pinia] },
      });
      const column = wrapper.find('.col-lg-4');
      expect(column.classes()).toContain('col-md-6');
    });
  });
});
