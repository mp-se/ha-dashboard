import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import HaHeader from '../HaHeader.vue';

describe('HaHeader.vue', () => {
  describe('Rendering', () => {
    it('should render a header with title', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Dashboard',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('h1').exists()).toBe(true);
      expect(wrapper.text()).toContain('Dashboard');
    });

    it('should render heading with h3 class', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'My Dashboard',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.h3').exists()).toBe(true);
    });

    it('should display the provided name', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Living Room',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Living Room');
    });

    it('should handle names with special characters', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: "John's House & Garden",
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain("John's House & Garden");
    });

    it('should handle long names', () => {
      const longName = 'This is a very long dashboard name that might wrap';
      const wrapper = mount(HaHeader, {
        props: {
          name: longName,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain(longName);
    });
  });

  describe('Icon Display', () => {
    it('should not display icon when not provided', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'No Icon',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icons = wrapper.findAll('i');
      expect(icons.length).toBe(0);
    });

    it('should display icon when provided', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'With Icon',
          icon: 'mdi mdi-home',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icons = wrapper.findAll('i');
      expect(icons.length).toBe(1);
    });

    it('should apply correct icon class', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Icon Test',
          icon: 'mdi mdi-home-heart',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i');
      expect(icon.classes()).toContain('mdi');
      expect(icon.classes()).toContain('mdi-home-heart');
    });

    it('should have margin-end on icon', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Icon Spacing',
          icon: 'mdi mdi-alert',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i');
      expect(icon.classes()).toContain('me-2');
    });

    it('should handle various icon classes', () => {
      const icons = [
        'mdi mdi-weather-sunny',
        'mdi mdi-lightbulb',
        'mdi mdi-door',
        'fas fa-star',
      ];

      icons.forEach((iconClass) => {
        const wrapper = mount(HaHeader, {
          props: {
            name: 'Test',
            icon: iconClass,
          },
          global: {
            stubs: {
              i: true,
              svg: true,
            },
          },
        });

        const icon = wrapper.find('i');
        expect(icon.exists()).toBe(true);
        // Check that some part of the icon class is applied
        expect(icon.attributes('class')).toContain(iconClass.split(' ')[0]);
      });
    });
  });

  describe('Layout and Styling', () => {
    it('should have responsive row and column classes', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Responsive',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.row').exists()).toBe(true);
      expect(wrapper.find('.col-md-12').exists()).toBe(true);
    });

    it('should center text', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Centered',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const heading = wrapper.find('h1');
      expect(heading.classes()).toContain('text-center');
    });

    it('should have bottom margin on heading', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Margin Test',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const heading = wrapper.find('h1');
      expect(heading.classes()).toContain('mb-4');
    });

    it('should use h3 heading level semantics', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Semantic',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('h1.h3').exists()).toBe(true);
    });
  });

  describe('Props Validation', () => {
    it('should accept name as required prop', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Required Name',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Required Name');
    });

    it('should accept icon as optional prop', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Optional Icon',
          icon: 'mdi mdi-account',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('i').exists()).toBe(true);
    });

    it('should default icon to null', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Default Icon',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icons = wrapper.findAll('i');
      expect(icons.length).toBe(0);
    });
  });

  describe('Text Content', () => {
    it('should not trim or modify the name text', () => {
      const names = [
        'Simple Name',
        'Name  with  spaces',
        '123 Numbers 456',
        'Café with Ümläüts',
      ];

      names.forEach((name) => {
        const wrapper = mount(HaHeader, {
          props: {
            name,
          },
          global: {
            stubs: {
              i: true,
              svg: true,
            },
          },
        });

        expect(wrapper.find('h1').text()).toContain(name);
      });
    });

    it('should preserve icon text positioning', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Icon Spacing Test',
          icon: 'mdi mdi-test-icon',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Icon should be before the text
      const icon = wrapper.find('i');
      const heading = wrapper.find('h1');

      const iconIndex = heading.html().indexOf('<i');
      const textIndex = heading.html().indexOf('Icon Spacing Test');

      expect(iconIndex).toBeLessThan(textIndex);
    });
  });

  describe('Breadth Coverage', () => {
    it('should render complete structure', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Complete',
          icon: 'mdi mdi-home',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.row').exists()).toBe(true);
      expect(wrapper.find('.col-md-12').exists()).toBe(true);
      expect(wrapper.find('h1').exists()).toBe(true);
      expect(wrapper.find('i').exists()).toBe(true);
    });

    it('should handle empty string name', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: '',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('h1').exists()).toBe(true);
    });

    it('should handle null icon prop explicitly', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Test',
          icon: null,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icons = wrapper.findAll('i');
      expect(icons.length).toBe(0);
    });

    it('should be rendered as single root element', () => {
      const wrapper = mount(HaHeader, {
        props: {
          name: 'Root Test',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.element.tagName).toBe('DIV');
      expect(wrapper.findAll('.row').length).toBe(1);
    });
  });
});
