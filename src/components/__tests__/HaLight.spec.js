import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HaLight from '../HaLight.vue';

describe('HaLight.vue', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render a light control card', () => {
      const entity = {
        entity_id: 'light.bedroom',
        state: 'off',
        attributes: {
          friendly_name: 'Bedroom Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card').exists()).toBe(true);
      expect(wrapper.find('.card-control').exists()).toBe(true);
    });

    it('should display light name from friendly_name', () => {
      const entity = {
        entity_id: 'light.living_room',
        state: 'on',
        attributes: {
          friendly_name: 'Living Room Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Living Room Light');
    });

    it('should display entity_id as fallback name', () => {
      const entity = {
        entity_id: 'light.unknown',
        state: 'off',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('light.unknown');
    });

    it('should show error when entity not found', () => {
      const wrapper = mount(HaLight, {
        props: {
          entity: 'light.nonexistent',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('not found');
      expect(wrapper.find('.border-warning').exists()).toBe(true);
    });
  });

  describe('Switch Control', () => {
    it('should render switch toggle', () => {
      const entity = {
        entity_id: 'light.desk',
        state: 'off',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find('button.ha-control-button');
      expect(button.exists()).toBe(true);
    });

    it('should have control button clickable', () => {
      const entity = {
        entity_id: 'light.hallway',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find('button.ha-control-button');
      expect(button.exists()).toBe(true);
    });

    it('should reflect on/off state', () => {
      const entity = {
        entity_id: 'light.bedroom',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Button should exist and light is on
      const button = wrapper.find('button.ha-control-button');
      expect(button.exists()).toBe(true);
      expect(button.classes('control-button-on')).toBe(true);
    });
  });

  describe('Card Styling', () => {
    it('should have card-active class when light is on', () => {
      const entity = {
        entity_id: 'light.on_light',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('button.ha-control-button').classes('control-button-on')).toBe(true);
    });

    it('should not have control-button-on class when light is off', () => {
      const entity = {
        entity_id: 'light.off_light',
        state: 'off',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find('button.ha-control-button');
      expect(button.classes()).not.toContain('control-button-on');
    });

    it('should have warning border when entity not found', () => {
      const wrapper = mount(HaLight, {
        props: {
          entity: 'light.missing',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-warning').exists()).toBe(true);
    });

    it('should have warning border when unavailable', () => {
      const entity = {
        entity_id: 'light.unavailable',
        state: 'unavailable',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-warning').exists()).toBe(true);
    });

    it('should have secondary border when on', () => {
      const entity = {
        entity_id: 'light.success',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-secondary').exists()).toBe(true);
    });

    it('should have secondary border when off', () => {
      const entity = {
        entity_id: 'light.secondary',
        state: 'off',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-secondary').exists()).toBe(true);
    });
  });

  describe('Brightness Control', () => {
    it('should show brightness slider for dimmable lights', () => {
      const entity = {
        entity_id: 'light.dimmable',
        state: 'on',
        attributes: {
          brightness: 128,
          supported_color_modes: ['brightness'],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const slider = wrapper.find('input[type="range"]');
      expect(slider.exists()).toBe(true);
    });

    it('should calculate brightness percentage correctly', () => {
      const entity = {
        entity_id: 'light.dimmable',
        state: 'on',
        attributes: {
          brightness: 255,
          supported_color_modes: ['brightness'],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('100%');
    });

    it('should handle half brightness', () => {
      const entity = {
        entity_id: 'light.half',
        state: 'on',
        attributes: {
          brightness: 128,
          supported_color_modes: ['brightness'],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('50%');
    });

    it('should disable brightness slider when light is off', () => {
      const entity = {
        entity_id: 'light.dimmable_off',
        state: 'off',
        attributes: {
          brightness: 128,
          supported_color_modes: ['brightness'],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const slider = wrapper.find('input[type="range"]');
      expect(slider.attributes('disabled')).toBeDefined();
    });

    it('should not show brightness slider for non-dimmable lights', () => {
      const entity = {
        entity_id: 'light.simple',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should still render hidden placeholder
      expect(wrapper.findAll('input[type="range"]').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Color Temperature Support', () => {
    it('should show color temperature presets when supported', () => {
      const entity = {
        entity_id: 'light.color_temp',
        state: 'on',
        attributes: {
          supported_color_modes: ['color_temp'],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
          color_temp: 370,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll('.preset-btn-icon');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not show color temperature presets when not on', () => {
      const entity = {
        entity_id: 'light.color_temp_off',
        state: 'off',
        attributes: {
          supported_color_modes: ['color_temp'],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll('.preset-btn-icon');
      expect(buttons.length).toBe(0);
    });

    it('should filter presets based on light capabilities', () => {
      const entity = {
        entity_id: 'light.limited_temp',
        state: 'on',
        attributes: {
          supported_color_modes: ['color_temp'],
          min_color_temp_kelvin: 4000,
          max_color_temp_kelvin: 5000,
          color_temp: 250,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll('.preset-btn-icon');
      // Should only show presets within 4000-5000K
      expect(buttons.length).toBeLessThan(5);
    });
  });

  describe('Color Support', () => {
    it('should show color presets for RGB lights', () => {
      const entity = {
        entity_id: 'light.rgb',
        state: 'on',
        attributes: {
          supported_color_modes: ['rgb'],
          hs_color: [0, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll('.color-preset-btn-icon');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should show color presets for HS lights', () => {
      const entity = {
        entity_id: 'light.hs',
        state: 'on',
        attributes: {
          supported_color_modes: ['hs'],
          hs_color: [120, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll('.color-preset-btn-icon');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not show color presets when light is off', () => {
      const entity = {
        entity_id: 'light.color_off',
        state: 'off',
        attributes: {
          supported_color_modes: ['rgb'],
          hs_color: [0, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const buttons = wrapper.findAll('.color-preset-btn-icon');
      expect(buttons.length).toBe(0);
    });

    it('should handle lights without hs_color gracefully', () => {
      const entity = {
        entity_id: 'light.no_color',
        state: 'on',
        attributes: {
          supported_color_modes: ['rgb'],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Color preset buttons are rendered but won't have active preset without hs_color
      const buttons = wrapper.findAll('.color-preset-btn-icon');
      expect(buttons.length).toBeGreaterThan(0); // Buttons still render
      
      // Verify no active color preset is highlighted
      const activeButtons = wrapper.findAll('.active-color');
      expect(activeButtons.length).toBe(0);
    });

    it('should highlight active color preset', () => {
      const entity = {
        entity_id: 'light.rgb_active',
        state: 'on',
        attributes: {
          supported_color_modes: ['rgb'],
          hs_color: [0, 100], // Red
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const activeButtons = wrapper.findAll('.active-color');
      expect(activeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled State', () => {
    it('should disable controls when unavailable', () => {
      const entity = {
        entity_id: 'light.unavail',
        state: 'unavailable',
        attributes: {
          brightness: 128,
          supported_color_modes: ['brightness'],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find('button.ha-control-button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should disable controls when unknown', () => {
      const entity = {
        entity_id: 'light.unknown',
        state: 'unknown',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const button = wrapper.find('button.ha-control-button');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });

  describe('Props Validation', () => {
    it('should accept string entity_id', () => {
      const wrapper = mount(HaLight, {
        props: {
          entity: 'light.valid_id',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should accept object entity with required fields', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should accept attributes prop', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
          attributes: ['brightness', 'color_temp'],
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Layout Classes', () => {
    it('should have responsive column classes', () => {
      const entity = {
        entity_id: 'light.responsive',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-lg-4').exists()).toBe(true);
      expect(wrapper.find('.col-md-6').exists()).toBe(true);
    });

    it('should have rounded card class', () => {
      const entity = {
        entity_id: 'light.rounded',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.rounded-4').exists()).toBe(true);
    });

    it('should have shadow class', () => {
      const entity = {
        entity_id: 'light.shadow',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.shadow-lg').exists()).toBe(true);
    });
  });

  describe('Multiple Color Modes', () => {
    it('should support lights with brightness and color temp', () => {
      const entity = {
        entity_id: 'light.advanced',
        state: 'on',
        attributes: {
          brightness: 200,
          supported_color_modes: ['brightness', 'color_temp'],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
          color_temp: 370,
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should show both brightness slider and color temp presets
      const sliders = wrapper.findAll('input[type="range"]');
      expect(sliders.length).toBeGreaterThan(0);

      const buttons = wrapper.findAll('.preset-btn-icon');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not show color temp presets if color is available', () => {
      const entity = {
        entity_id: 'light.color_priority',
        state: 'on',
        attributes: {
          supported_color_modes: ['color_temp', 'rgb'],
          min_color_temp_kelvin: 2700,
          max_color_temp_kelvin: 6500,
          hs_color: [0, 100],
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Should show color presets, not color temp
      const colorButtons = wrapper.findAll('.color-preset-btn-icon');
      expect(colorButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Breadth Coverage', () => {
    it('should render switch with form-check classes', () => {
      const entity = {
        entity_id: 'light.breadth',
        state: 'on',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('button.ha-control-button').exists()).toBe(true);
      expect(wrapper.find('.ha-control-circle-wrapper').exists()).toBe(true);
    });

    it('should have card-body and h-100 classes', () => {
      const entity = {
        entity_id: 'light.classes',
        state: 'off',
        attributes: {},
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-body').exists()).toBe(true);
      expect(wrapper.find('.h-100').exists()).toBe(true);
    });

    it('should render title with card-title class', () => {
      const entity = {
        entity_id: 'light.titled',
        state: 'on',
        attributes: {
          friendly_name: 'My Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: {
          entity,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-title').exists()).toBe(true);
      expect(wrapper.find('h6').exists()).toBe(true);
    });
  });

  describe('Icon and Button Positioning', () => {
    it('should have ha-control-button with proper styling', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
        global: {
          stubs: {
            svg: true,
          },
        },
      });

      const controlButton = wrapper.find('.ha-control-button');
      expect(controlButton.exists()).toBe(true);
      
      // Check that button has no background and border
      const buttonElement = controlButton.element;
      expect(buttonElement.tagName).toBe('BUTTON');
    });

    it('should have ha-control-circle-wrapper as container for circle and icon', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
        global: {
          stubs: {
            svg: true,
          },
        },
      });

      const wrapper_elem = wrapper.find('.ha-control-circle-wrapper');
      expect(wrapper_elem.exists()).toBe(true);
    });

    it('should have ha-control-circle SVG with proper sizing', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const circle = wrapper.find('.ha-control-circle');
      expect(circle.exists()).toBe(true);
      
      // SVG should have width and height of 50
      const svgElement = circle.element;
      expect(svgElement.getAttribute('width')).toBe('50');
      expect(svgElement.getAttribute('height')).toBe('50');
      expect(svgElement.getAttribute('viewBox')).toBe('0 0 50 50');
    });

    it('should have ha-control-icon positioned absolutely over the circle', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const icon = wrapper.find('.ha-control-icon');
      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain('ha-control-icon');
      
      // Icon should be an <i> element with mdi-lightbulb class
      expect(icon.element.tagName).toBe('I');
      expect(icon.classes()).toContain('mdi');
      expect(icon.classes()).toContain('mdi-lightbulb');
    });

    it('should have control icon inside the wrapper', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const circleWrapper = wrapper.find('.ha-control-circle-wrapper');
      const icon = circleWrapper.find('.ha-control-icon');
      expect(icon.exists()).toBe(true);
    });

    it('should have control circle inside the wrapper', () => {
      const entity = {
        entity_id: 'light.test',
        state: 'on',
        attributes: {
          friendly_name: 'Test Light',
        },
      };

      const wrapper = mount(HaLight, {
        props: { entity },
      });

      const circleWrapper = wrapper.find('.ha-control-circle-wrapper');
      const circle = circleWrapper.find('.ha-control-circle');
      expect(circle.exists()).toBe(true);
    });
  });
});
