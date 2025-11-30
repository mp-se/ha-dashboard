import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import HaAlarmPanel from '../HaAlarmPanel.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';

describe('HaAlarmPanel.vue', () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();

    // Mock data
    store.sensors = [
      {
        entity_id: 'alarm_control_panel.home',
        state: 'disarmed',
        attributes: {
          friendly_name: 'Home Alarm',
          code_arm_required: true,
        },
      },
      {
        entity_id: 'alarm_control_panel.office',
        state: 'armed_away',
        attributes: {
          friendly_name: 'Office Alarm',
          code_arm_required: true,
        },
      },
    ];

    // Mock callService method
    store.callService = vi.fn().mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render entity not found message when entity does not exist', () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.nonexistent',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    expect(wrapper.text()).toContain('not found');
    expect(wrapper.html()).toContain('mdi-alert-circle');
  });

  it('should render alarm panel with string entity reference', () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Home Alarm');
    expect(wrapper.text()).toContain('Disarmed');
  });

  it('should render alarm panel with object entity', () => {
    const entity = {
      entity_id: 'alarm_control_panel.test',
      state: 'armed_home',
      attributes: {
        friendly_name: 'Test Alarm',
        code_arm_required: true,
      },
    };

    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity,
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Test Alarm');
    expect(wrapper.text()).toContain('Armed Home');
  });

  it('should display correct state badges for different alarm states', () => {
    const states = [
      { state: 'disarmed', expectedText: 'Disarmed' },
      { state: 'armed_home', expectedText: 'Armed Home' },
      { state: 'armed_away', expectedText: 'Armed Away' },
      { state: 'triggered', expectedText: 'Triggered' },
    ];

    states.forEach(({ state, expectedText }) => {
      store.sensors[0].state = state;

      const wrapper = mount(HaAlarmPanel, {
        props: {
          entity: 'alarm_control_panel.home',
        },
        global: {
          plugins: [pinia],
          stubs: {
            i: true,
          },
        },
      });

      expect(wrapper.text()).toContain(expectedText);
    });
  });

  it('should have correct border color based on alarm state', () => {
    const entity = {
      entity_id: 'alarm_control_panel.test',
      state: 'armed_away',
      attributes: { friendly_name: 'Test Alarm' },
    };

    const wrapper = mount(HaAlarmPanel, {
      props: { entity },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const card = wrapper.find('.card');
    expect(card.classes()).toContain('border-danger');
  });

  it('should update code input when user types', async () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('1234');

    expect(wrapper.vm.code).toBe('1234');
  });

  it('should toggle password visibility', async () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    expect(input.attributes('type')).toBe('password');

    await wrapper.vm.togglePasswordVisibility();
    expect(wrapper.vm.passwordVisible).toBe(true);
  });

  it('should disable arm buttons when no code is entered', async () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const armButtons = wrapper.findAll('.btn-success, .btn-primary');
    for (const btn of armButtons) {
      expect(btn.element.hasAttribute('disabled')).toBe(true);
    }
  });

  it('should enable arm buttons when code is entered and state is disarmed', async () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('1234');

    const armButtons = wrapper.findAll('.btn-success, .btn-primary');
    for (const btn of armButtons) {
      expect(btn.attributes('disabled')).toBeUndefined();
    }
  });

  it('should disable arm buttons when already armed', async () => {
    store.sensors[0].state = 'armed_away';

    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('1234');

    const armButtons = wrapper.findAll('.btn-success, .btn-primary');
    for (const btn of armButtons) {
      expect(btn.element.hasAttribute('disabled')).toBe(true);
    }
  });

  it('should enable disarm button when armed and code is entered', async () => {
    store.sensors[0].state = 'armed_away';

    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('1234');

    const disarmBtn = wrapper.find('.btn-secondary');
    expect(disarmBtn.attributes('disabled')).toBeUndefined();
  });

  it('should call armHome service when Arm Home button is clicked', async () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('1234');

    const armHomeBtn = wrapper.find('.btn-success');
    await armHomeBtn.trigger('click');

    expect(store.callService).toHaveBeenCalledWith('alarm_control_panel', 'alarm_arm_home', {
      entity_id: 'alarm_control_panel.home',
      code: '1234',
    });
  });

  it('should call armAway service when Arm Away button is clicked', async () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('5678');

    const armAwayBtn = wrapper.findAll('.btn-primary')[0];
    await armAwayBtn.trigger('click');

    expect(store.callService).toHaveBeenCalledWith('alarm_control_panel', 'alarm_arm_away', {
      entity_id: 'alarm_control_panel.home',
      code: '5678',
    });
  });

  it('should call disarm service when Disarm button is clicked', async () => {
    store.sensors[0].state = 'armed_away';

    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('9999');

    const disarmBtn = wrapper.find('.btn-secondary');
    await disarmBtn.trigger('click');

    expect(store.callService).toHaveBeenCalledWith('alarm_control_panel', 'alarm_disarm', {
      entity_id: 'alarm_control_panel.home',
      code: '9999',
    });
  });

  it('should set isLoading to true while service call is pending', async () => {
    store.callService = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        })
    );

    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('1234');

    const armHomeBtn = wrapper.find('.btn-success');
    await armHomeBtn.trigger('click');

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('should handle service errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    store.callService = vi.fn().mockRejectedValue(new Error('Service error'));

    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const input = wrapper.find('#alarm-code');
    await input.setValue('1234');

    const armHomeBtn = wrapper.find('.btn-success');
    await armHomeBtn.trigger('click');

    await wrapper.vm.$nextTick();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(wrapper.vm.isLoading).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should render card with appropriate CSS classes', () => {
    const wrapper = mount(HaAlarmPanel, {
      props: {
        entity: 'alarm_control_panel.home',
      },
      global: {
        plugins: [pinia],
        stubs: {
          i: true,
        },
      },
    });

    const card = wrapper.find('.card');
    expect(card.classes()).toContain('card-control');
    expect(card.classes()).toContain('h-100');
    expect(card.classes()).toContain('rounded-4');
    expect(card.classes()).toContain('shadow-lg');
  });

  it('should validate entity prop with string format', () => {
    const validEntity = 'alarm_control_panel.home';
    expect(
      HaAlarmPanel.props.entity.validator(validEntity)
    ).toBe(true);

    const invalidEntity = 'invalid-format';
    expect(
      HaAlarmPanel.props.entity.validator(invalidEntity)
    ).toBe(false);
  });

  it('should validate entity prop with object format', () => {
    const validEntity = {
      entity_id: 'alarm_control_panel.home',
      state: 'disarmed',
      attributes: { friendly_name: 'Test' },
    };
    expect(
      HaAlarmPanel.props.entity.validator(validEntity)
    ).toBeTruthy();

    const invalidEntity = { entity_id: 'alarm_control_panel.home' };
    expect(
      HaAlarmPanel.props.entity.validator(invalidEntity)
    ).toBeFalsy();
  });
});
