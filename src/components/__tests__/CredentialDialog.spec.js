import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CredentialDialog from '../CredentialDialog.vue';
import { createPinia, setActivePinia } from 'pinia';

describe('CredentialDialog.vue', () => {
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('should mount successfully', () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [pinia] },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should have form element', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [pinia] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('should have URL input field', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#ha-url-input').exists()).toBe(true);
  });

  it('should have token input field', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#ha-token-input').exists()).toBe(true);
  });

  it('should have connect button', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('should display title', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Home Assistant Credentials');
  });

  it('should update formData on URL input', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    const input = wrapper.find('#ha-url-input');
    await input.setValue('https://test.local:8123');
    expect(wrapper.vm.formData.haUrl).toBe('https://test.local:8123');
  });

  it('should update formData on token input', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    const input = wrapper.find('#ha-token-input');
    await input.setValue('token123');
    expect(wrapper.vm.formData.accessToken).toBe('token123');
  });

  it('should have showModal method', () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    expect(typeof wrapper.vm.showModal).toBe('function');
  });

  it('should toggle show with showModal', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.vm.show).toBe(false);
    await wrapper.vm.showModal();
    expect(wrapper.vm.show).toBe(true);
  });

  it('should emit credentials event on submit', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [pinia] },
    });
    wrapper.vm.show = true;
    wrapper.vm.formData.haUrl = 'https://test.local:8123';
    wrapper.vm.formData.accessToken = 'token123';
    await wrapper.vm.$nextTick();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('credentials')).toBeTruthy();
  });

  it('should display help text', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toMatch(/Long-Lived Access Token|Profile/);
  });

  it('should have modal structure', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.modal-header').exists()).toBe(true);
    expect(wrapper.find('.modal-body').exists()).toBe(true);
    expect(wrapper.find('.modal-footer').exists()).toBe(true);
  });

  it('should close modal after successful credentials', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [pinia] },
    });
    wrapper.vm.show = true;
    wrapper.vm.formData.haUrl = 'https://test.local:8123';
    wrapper.vm.formData.accessToken = 'token123';
    await wrapper.vm.$nextTick();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.vm.show).toBe(false);
  });

  it('should track submitted state', () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.vm.submitted).toBe(false);
  });

  it('should have form inputs with required attributes', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#ha-url-input').attributes('required')).toBeDefined();
    expect(wrapper.find('#ha-token-input').attributes('required')).toBeDefined();
  });

  it('should show validation feedback on failed submit', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    wrapper.vm.submitted = true;
    await wrapper.vm.$nextTick();
    const feedback = wrapper.findAll('.invalid-feedback');
    expect(feedback.length).toBeGreaterThan(0);
  });

  it('should have correct input types', async () => {
    const wrapper = mount(CredentialDialog, {
      global: { plugins: [createPinia()] },
    });
    wrapper.vm.show = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#ha-url-input').attributes('type')).toBe('url');
    expect(wrapper.find('#ha-token-input').attributes('type')).toBe('password');
  });
});
