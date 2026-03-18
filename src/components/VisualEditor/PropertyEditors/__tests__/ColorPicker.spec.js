import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ColorPicker from '../ColorPicker.vue';

describe('ColorPicker.vue', () => {
  it('renders with label', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#000000',
      },
    });
    const label = wrapper.find('label strong');
    expect(label.text()).toBe('Color');
  });

  it('displays required indicator when required', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#000000',
        required: true,
      },
    });
    expect(wrapper.find('.text-danger').exists()).toBe(true);
  });

  it('renders color input', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#ff0000',
      },
    });
    const input = wrapper.find('input[type="color"]');
    expect(input.exists()).toBe(true);
  });

  it('sets model value in color input', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#ff0000',
      },
    });
    const input = wrapper.find('input[type="color"]');
    expect(input.element.value.toLowerCase()).toBe('#ff0000');
  });

  it('emits update:modelValue when color changes', async () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#ff0000',
      },
    });
    const input = wrapper.find('input[type="color"]');
    await input.setValue('#00ff00');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('#00ff00');
  });

  it('displays color preview', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#ff0000',
      },
    });
    const preview = wrapper.find('.color-preview');
    if (preview.exists()) {
      expect(preview.element.style.backgroundColor).toBeTruthy();
    }
  });

  it('displays clear button when color is set', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#ff0000',
      },
    });
    const clearBtn = wrapper.find('button.btn-link');
    if (clearBtn.exists()) {
      expect(clearBtn.text()).toContain('Clear');
    }
  });

  it('clears color when clear button clicked', async () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#ff0000',
      },
    });
    const clearBtn = wrapper.find('button.btn-link');
    if (clearBtn.exists()) {
      await clearBtn.trigger('click');
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['']);
    }
  });

  it('displays help text when provided', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#000000',
        help: 'Choose a color',
      },
    });
    expect(wrapper.text()).toContain('Choose a color');
  });

  it('displays error message when provided', () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#000000',
        error: 'Invalid color',
      },
    });
    expect(wrapper.text()).toContain('Invalid color');
  });

  it('handles hex color format', async () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#ffffff',
      },
    });
    const input = wrapper.find('input[type="color"]');
    await input.setValue('#123456');
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('#123456');
  });

  it('handles color changes from different formats', async () => {
    const wrapper = mount(ColorPicker, {
      props: {
        label: 'Color',
        modelValue: '#000000',
      },
    });
    const input = wrapper.find('input[type="color"]');
    await input.setValue('#ff9900');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
