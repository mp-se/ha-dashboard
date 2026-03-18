import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SelectInput from '../SelectInput.vue';

describe('SelectInput.vue', () => {
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('renders select with label', () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option1',
        options: defaultOptions,
      },
    });
    const label = wrapper.find('label');
    expect(label.text()).toContain('Choose');
  });

  it('displays required indicator when required', () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option1',
        options: defaultOptions,
        required: true,
      },
    });
    expect(wrapper.find('.text-danger').text()).toBe('*');
  });

  it('renders all options', () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option1',
        options: defaultOptions,
      },
    });
    const options = wrapper.findAll('option:not([value=""])');
    expect(options).toHaveLength(3);
    expect(options[0].text()).toBe('Option 1');
    expect(options[1].text()).toBe('Option 2');
    expect(options[2].text()).toBe('Option 3');
  });

  it('sets model value in select', () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option2',
        options: defaultOptions,
      },
    });
    const select = wrapper.find('select');
    expect(select.element.value).toBe('option2');
  });

  it('emits update:modelValue on select change', async () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option1',
        options: defaultOptions,
      },
    });
    const select = wrapper.find('select');
    await select.setValue('option3');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['option3']);
  });

  it('displays help text when provided', () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option1',
        options: defaultOptions,
        help: 'Select an option',
      },
    });
    expect(wrapper.find('.text-muted').text()).toBe('Select an option');
  });

  it('displays error message when provided', () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option1',
        options: defaultOptions,
        error: 'Invalid selection',
      },
    });
    const error = wrapper.findAll('.text-danger').find((el) => el.text() === 'Invalid selection');
    expect(error).toBeTruthy();
  });

  it('handles options with special characters', () => {
    const specialOptions = [
      { value: 'opt-1', label: 'Option-1' },
      { value: 'opt_2', label: 'Option_2' },
    ];
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'opt-1',
        options: specialOptions,
      },
    });
    const options = wrapper.findAll('option:not([value=""])');
    expect(options[0].element.value).toBe('opt-1');
  });

  it('handles empty options array', () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: '',
        options: [],
      },
    });
    const options = wrapper.findAll('option:not([value=""])');
    expect(options).toHaveLength(0);
  });

  it('handles multiple updates', async () => {
    const wrapper = mount(SelectInput, {
      props: {
        label: 'Choose',
        modelValue: 'option1',
        options: defaultOptions,
      },
    });
    const select = wrapper.find('select');
    await select.setValue('option2');
    await select.setValue('option3');
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2);
  });
});
