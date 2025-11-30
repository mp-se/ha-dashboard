import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HaLink from '../HaLink.vue';

describe('HaLink.vue', () => {
  describe('Rendering', () => {
    it('should render a link card', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Example Link',
          header: 'External Link',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card').exists()).toBe(true);
      expect(wrapper.find('.card-display').exists()).toBe(true);
    });

    it('should display header text', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Example Link',
          header: 'My Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('My Header');
    });

    it('should display link name', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Click Here',
          header: 'Link',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Click Here');
    });

    it('should render an anchor element', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('a').exists()).toBe(true);
    });
  });

  describe('Link Attributes', () => {
    it('should set correct href', () => {
      const url = 'https://example.com/page';
      const wrapper = mount(HaLink, {
        props: {
          url,
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const link = wrapper.find('a');
      expect(link.attributes('href')).toBe(url);
    });

    it('should open link in new tab', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const link = wrapper.find('a');
      expect(link.attributes('target')).toBe('_blank');
    });

    it('should have security attributes', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const link = wrapper.find('a');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });

    it('should handle various URL formats', () => {
      const urls = [
        'https://example.com',
        'http://localhost:8123',
        'https://example.com/path/to/page',
        'https://example.com?param=value',
      ];

      urls.forEach((url) => {
        const wrapper = mount(HaLink, {
          props: {
            url,
            name: 'Link',
            header: 'Header',
          },
          global: {
            stubs: {
              i: true,
              svg: true,
            },
          },
        });

        const link = wrapper.find('a');
        expect(link.attributes('href')).toBe(url);
      });
    });
  });

  describe('Styling', () => {
    it('should have responsive column classes', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
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

    it('should have card styling classes', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const card = wrapper.find('.card');
      expect(card.classes()).toContain('card-display');
      expect(card.classes()).toContain('h-100');
      expect(card.classes()).toContain('rounded-4');
      expect(card.classes()).toContain('shadow-lg');
    });

    it('should have card body with flex layout', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const body = wrapper.find('.card-body');
      expect(body.classes()).toContain('d-flex');
      expect(body.classes()).toContain('align-items-center');
    });

    it('should have link text without underline decoration', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const link = wrapper.find('a');
      expect(link.classes()).toContain('text-decoration-none');
    });
  });

  describe('Icon', () => {
    it('should display open-in-new icon', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i.mdi-open-in-new');
      expect(icon.exists()).toBe(true);
    });

    it('should have icon with proper styling', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const icon = wrapper.find('i');
      expect(icon.attributes('style')).toContain('font-size: 1.5rem');
      expect(icon.attributes('style')).toContain('color: #6c757d');
    });
  });

  describe('Props Validation', () => {
    it('should require url prop', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
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

    it('should require name prop', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link Name',
          header: 'Header',
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

    it('should require header prop', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header Text',
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

    it('should accept optional entity prop', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
          entity: 'sensor.test',
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

    it('should accept optional attributes prop', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
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
  });

  describe('Layout', () => {
    it('should have title on left, icon on right', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const leftDiv = wrapper.find('.text-start');
      const rightDiv = wrapper.findAll('.d-flex')[1]; // Second flex (icon container)

      expect(leftDiv.exists()).toBe(true);
      expect(rightDiv.exists()).toBe(true);
    });

    it('should have full structure', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.col-lg-4').exists()).toBe(true);
      expect(wrapper.find('.card').exists()).toBe(true);
      expect(wrapper.find('.card-body').exists()).toBe(true);
      expect(wrapper.find('.card-title').exists()).toBe(true);
      expect(wrapper.find('a').exists()).toBe(true);
      expect(wrapper.find('i').exists()).toBe(true);
    });

    it('should have flex-grow-1 on left section', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Link',
          header: 'Header',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const leftDiv = wrapper.find('.flex-grow-1');
      expect(leftDiv.exists()).toBe(true);
    });
  });

  describe('Text Content', () => {
    it('should display header with proper structure', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Click Me',
          header: 'Visit Website',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const title = wrapper.find('.card-title');
      expect(title.text()).toBe('Visit Website');
    });

    it('should display link name correctly', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'Go to Example',
          header: 'External',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const link = wrapper.find('a');
      expect(link.text()).toBe('Go to Example');
    });

    it('should handle special characters in text', () => {
      const wrapper = mount(HaLink, {
        props: {
          url: 'https://example.com',
          name: 'John\'s Dashboard & Settings',
          header: 'Home Assistant',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.text()).toContain("John's Dashboard & Settings");
      expect(wrapper.text()).toContain('Home Assistant');
    });
  });
});
