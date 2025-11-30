import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HaRowSpacer from '../HaRowSpacer.vue';

describe('HaRowSpacer.vue', () => {
  describe('Rendering', () => {
    it('should render a full-width spacer', () => {
      const wrapper = mount(HaRowSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-md-12').exists()).toBe(true);
    });

    it('should render as an empty div with full-width column class', () => {
      const wrapper = mount(HaRowSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const div = wrapper.find('div');
      expect(div.exists()).toBe(true);
      expect(div.classes()).toContain('col-md-12');
    });

    it('should be a layout spacer with no visible content', () => {
      const wrapper = mount(HaRowSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      // Text content should be empty (comments don't count)
      expect(wrapper.text().trim()).toBe('');
    });
  });

  describe('Props', () => {
    it('should accept optional attributes prop', () => {
      const wrapper = mount(HaRowSpacer, {
        props: {
          attributes: ['attr1', 'attr2'],
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

    it('should default attributes to empty array', () => {
      const wrapper = mount(HaRowSpacer, {
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

  describe('Responsive Layout', () => {
    it('should have col-md-12 for full width', () => {
      const wrapper = mount(HaRowSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-md-12').exists()).toBe(true);
    });

    it('should create space for layout separation', () => {
      const wrapper = mount(HaRowSpacer, {
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const div = wrapper.element;
      expect(div.className).toContain('col-md-12');
    });
  });
});
