import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BooleanToggle from '../BooleanToggle.vue';

describe('BooleanToggle.vue', () => {
  it('renders checkbox with label', () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
      },
    });
    const label = wrapper.find('label');
    expect(label.text()).toContain('Enabled');
  });

  it('displays required indicator when required', () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
        required: true,
      },
    });
    expect(wrapper.find('.text-danger').text()).toBe('*');
  });

  it('sets checkbox to checked when modelValue is true', () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: true,
      },
    });
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(true);
  });

  it('sets checkbox to unchecked when modelValue is false', () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
      },
    });
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(false);
  });

  it('emits update:modelValue on checkbox change', async () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
      },
    });
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true]);
  });

  it('emits false when unchecking', async () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: true,
      },
    });
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(false);
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
  });

  it('displays help text when provided', () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
        help: 'Toggle this to enable',
      },
    });
    expect(wrapper.find('.text-muted').text()).toBe('Toggle this to enable');
  });

  it('displays error message when provided', () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
        error: 'This is required',
      },
    });
    const error = wrapper.findAll('.text-danger').find((el) => el.text() === 'This is required');
    expect(error).toBeTruthy();
  });

  it('uses form-check-input class', () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
      },
    });
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.classes()).toContain('form-check-input');
  });

  it('handles multiple toggles', async () => {
    const wrapper = mount(BooleanToggle, {
      props: {
        label: 'Enabled',
        modelValue: false,
      },
    });
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    await checkbox.setValue(false);
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2);
  });
});
