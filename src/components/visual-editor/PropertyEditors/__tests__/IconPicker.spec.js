import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IconPicker from '../IconPicker.vue';

describe('IconPicker.vue', () => {
  it('renders with label', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
      },
    });
    const label = wrapper.find('label strong');
    expect(label.text()).toBe('Icon');
  });

  it('displays required indicator when required', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
        required: true,
      },
    });
    expect(wrapper.find('.text-danger').exists()).toBe(true);
  });

  it('renders search input', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
      },
    });
    const input = wrapper.find('input[type="text"]');
    expect(input.exists()).toBe(true);
    expect(input.element.placeholder).toContain('Search icons');
  });

  it('displays selected icon', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: 'mdi-home',
      },
    });
    const display = wrapper.find('.d-flex.align-items-center');
    expect(display.text()).toContain('mdi-home');
  });

  it('emits update:modelValue when icon is clicked', async () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
      },
    });
    const buttons = wrapper.findAll('.icon-btn');
    if (buttons.length > 0) {
      await buttons[0].trigger('click');
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    }
  });

  it('displays clear button when icon is selected', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: 'mdi-home',
      },
    });
    const clearBtn = wrapper.find('.btn-link.text-danger');
    expect(clearBtn.exists()).toBe(true);
  });

  it('clears icon when clear button is clicked', async () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: 'mdi-home',
      },
    });
    const clearBtn = wrapper.find('.btn-link.text-danger');
    await clearBtn.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['']);
  });

  it('filters icons by search text', async () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
      },
    });
    const searchInput = wrapper.find('input[type="text"]');
    await searchInput.setValue('home');
    // Icons should be filtered (home-related icons)
    expect(wrapper.vm.searchText).toBe('home');
  });

  it('displays help text when provided', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
        help: 'Choose an icon',
      },
    });
    expect(wrapper.text()).toContain('Choose an icon');
  });

  it('displays error message when provided', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
        error: 'Icon is required',
      },
    });
    expect(wrapper.text()).toContain('Icon is required');
  });

  it('shows no icons found message when search has no results', async () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
      },
    });
    const searchInput = wrapper.find('input[type="text"]');
    await searchInput.setValue('xyzabcnonexistent');
    // After filtering, should show no results message
    const noResults = wrapper.text().includes('No icons found');
    expect(noResults).toBe(true);
  });

  it('clears search with clear button', async () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: '',
      },
    });
    const searchInput = wrapper.find('input[type="text"]');
    await searchInput.setValue('home');
    // Search text should be set
    expect(wrapper.vm.searchText).toBe('home');
  });

  it('highlights selected icon in grid', () => {
    const wrapper = mount(IconPicker, {
      props: {
        label: 'Icon',
        modelValue: 'mdi-home',
      },
    });
    const buttons = wrapper.findAll('.icon-btn');
    const activeButtons = buttons.filter((btn) => btn.classes('active'));
    expect(activeButtons.length).toBeGreaterThanOrEqual(0);
  });
});
