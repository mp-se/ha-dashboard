import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HaImage from '../HaImage.vue';

describe('HaImage.vue', () => {
  describe('Rendering', () => {
    it('should render an image card', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
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

    it('should render an image element', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/photo.png',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').exists()).toBe(true);
    });

    it('should display the image from external URL', () => {
      const url = 'https://example.com/image.jpg';
      const wrapper = mount(HaImage, {
        props: {
          url,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toBe(url);
    });

    it('should display data URL images', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const wrapper = mount(HaImage, {
        props: {
          url: dataUrl,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toBe(dataUrl);
    });
  });

  describe('URL Resolution', () => {
    it('should preserve absolute HTTP URLs', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'http://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toBe('http://example.com/image.jpg');
    });

    it('should preserve absolute HTTPS URLs', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://secure.example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toBe('https://secure.example.com/image.jpg');
    });

    it('should convert relative paths to data directory paths', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('data/image.jpg');
    });

    it('should handle absolute paths by prepending data/', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: '/subfolder/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('data/subfolder/image.jpg');
    });

    it('should handle nested relative paths', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'subfolder/nested/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('data/subfolder/nested/image.jpg');
    });

    it('should not modify data URLs', () => {
      const dataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
      const wrapper = mount(HaImage, {
        props: {
          url: dataUrl,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toBe(dataUrl);
    });
  });

  describe('Alt Text', () => {
    it('should use default title as alt text', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('alt')).toBe('Image');
    });

    it('should use provided title as alt text', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
          title: 'Living Room Camera',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('alt')).toBe('Living Room Camera');
    });

    it('should handle special characters in title', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
          title: "John's House & Garden - Image #1",
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.attributes('alt')).toBe("John's House & Garden - Image #1");
    });
  });

  describe('Card Styling', () => {
    it('should have card classes', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
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
    });

    it('should have responsive column classes', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
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

    it('should have rounded corners', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
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
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
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

    it('should have info border', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.border-info').exists()).toBe(true);
    });
  });

  describe('Card Body Layout', () => {
    it('should have card-body', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.card-body').exists()).toBe(true);
    });

    it('should have flex layout for card body', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
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
      expect(body.classes()).toContain('justify-content-center');
    });

    it('should have no padding on card body', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const body = wrapper.find('.card-body');
      expect(body.classes()).toContain('p-0');
    });
  });

  describe('Image Styling', () => {
    it('should have ha-image-img class', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      const img = wrapper.find('img');
      expect(img.classes()).toContain('ha-image-img');
    });
  });

  describe('Props Validation', () => {
    it('should require url prop', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
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

    it('should accept optional title prop', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
          title: 'Custom Title',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('img').attributes('alt')).toBe('Custom Title');
    });

    it('should default title to "Image"', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('alt')).toBe('Image');
    });
  });

  describe('Different Image Formats', () => {
    it('should handle JPG images', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/photo.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('src')).toContain('.jpg');
    });

    it('should handle PNG images', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/photo.png',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('src')).toContain('.png');
    });

    it('should handle GIF images', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/animation.gif',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('src')).toContain('.gif');
    });

    it('should handle WebP images', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/photo.webp',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('src')).toContain('.webp');
    });
  });

  describe('Breadth Coverage', () => {
    it('should render complete image structure', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
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
      expect(wrapper.find('img').exists()).toBe(true);
    });

    it('should handle multiple images with different URLs', () => {
      const urls = [
        'https://example.com/img1.jpg',
        'https://example2.com/photo.png',
        'relative/path/image.jpg',
      ];

      urls.forEach((url) => {
        const wrapper = mount(HaImage, {
          props: {
            url,
          },
          global: {
            stubs: {
              i: true,
              svg: true,
            },
          },
        });

        expect(wrapper.find('img').exists()).toBe(true);
      });
    });

    it('should handle long URLs', () => {
      const longUrl = 'https://example.com/very/long/path/to/image/with/many/segments/photo.jpg?param1=value1&param2=value2&param3=value3';
      const wrapper = mount(HaImage, {
        props: {
          url: longUrl,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('src')).toBe(longUrl);
    });

    it('should handle URLs with query parameters', () => {
      const urlWithParams = 'https://example.com/image.jpg?width=800&height=600&quality=95';
      const wrapper = mount(HaImage, {
        props: {
          url: urlWithParams,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('src')).toBe(urlWithParams);
    });

    it('should handle URLs with hash fragments', () => {
      const urlWithHash = 'https://example.com/image.jpg#section';
      const wrapper = mount(HaImage, {
        props: {
          url: urlWithHash,
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('img').attributes('src')).toBe(urlWithHash);
    });

    it('should be responsive with h-100 height', () => {
      const wrapper = mount(HaImage, {
        props: {
          url: 'https://example.com/image.jpg',
        },
        global: {
          stubs: {
            i: true,
            svg: true,
          },
        },
      });

      expect(wrapper.find('.h-100').exists()).toBe(true);
    });
  });
});
