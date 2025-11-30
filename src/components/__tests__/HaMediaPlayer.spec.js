import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HaMediaPlayer from '../HaMediaPlayer.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useHaStore } from '@/stores/haStore';

describe('HaMediaPlayer.vue', () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.devices = [];
    store.sensors = [
      {
        entity_id: 'media_player.bedroom',
        state: 'playing',
        attributes: {
          friendly_name: 'Bedroom Player',
          media_title: 'Song Name',
          media_artist: 'Artist Name',
          volume_level: 0.75,
          source: 'Spotify',
        },
      },
    ];
  });

  describe('Component Rendering', () => {
    it('should mount successfully', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('should accept entity prop', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props('entity')).toBe('media_player.bedroom');
    });

    it('should render card element', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.card').exists()).toBe(true);
    });

    it('should handle missing entity gracefully', () => {
      store.sensors = [];
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.nonexistent' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.mdi-alert-circle').exists()).toBe(true);
    });

    it('should update when entity prop changes', async () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      
      store.sensors.push({
        entity_id: 'media_player.living_room',
        state: 'paused',
        attributes: {
          friendly_name: 'Living Room Player',
        },
      });
      
      await wrapper.setProps({ entity: 'media_player.living_room' });
      expect(wrapper.props('entity')).toBe('media_player.living_room');
    });
  });

  describe('Media State Display', () => {
    it('should display friendly name', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('Bedroom Player');
    });

    it('should display current state', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('playing');
    });

    it('should display media title', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('Song Name');
    });

    it('should display media artist', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('Artist Name');
    });

    it('should display volume level', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('75%');
    });

    it('should display source', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain('Spotify');
    });
  });

  describe('Media Icons', () => {
    it('should show play icon when playing', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.mdi-play-circle').exists()).toBe(true);
    });

    it('should show pause icon when paused', () => {
      store.sensors[0].state = 'paused';
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.mdi-pause-circle').exists()).toBe(true);
    });

    it('should show stop icon when idle', () => {
      store.sensors[0].state = 'idle';
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.mdi-stop-circle').exists()).toBe(true);
    });

    it('should show stop icon when off', () => {
      store.sensors[0].state = 'off';
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.mdi-stop-circle').exists()).toBe(true);
    });
  });

  describe('Media Controls', () => {
    it('should display media control buttons', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.findAll('button').length).toBeGreaterThan(0);
    });

    it('should show pause icon when playing', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.mdi-pause').exists()).toBe(true);
    });

    it('should show play icon when paused', () => {
      store.sensors[0].state = 'paused';
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find('.mdi-play').exists()).toBe(true);
    });

    it('should disable track controls when off', () => {
      store.sensors[0].state = 'off';
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const buttons = wrapper.findAll('button');
      // Skip previous button should be disabled
      expect(buttons[1].attributes('disabled')).toBeDefined();
    });

    it('should display volume control when on and has volume_level', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const volumeInput = wrapper.find('.form-range');
      expect(volumeInput.exists()).toBe(true);
      expect(volumeInput.element.value).toBe('0.75');
    });

    it('should call turn_off service on power button click', async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const powerButton = wrapper.findAll('button')[0];
      await powerButton.trigger('click');
      expect(store.callService).toHaveBeenCalledWith('media_player', 'turn_off', expect.any(Object));
    });

    it('should call media_play_pause service on play button click', async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const playButton = wrapper.findAll('button')[2];
      await playButton.trigger('click');
      expect(store.callService).toHaveBeenCalledWith('media_player', 'media_play_pause', expect.any(Object));
    });

    it('should call volume_set service on volume change', async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const volumeInput = wrapper.find('.form-range');
      await volumeInput.setValue(0.5);
      expect(store.callService).toHaveBeenCalledWith('media_player', 'volume_set', expect.any(Object));
    });
  });

  describe('Card Styling', () => {
    it('should have warning border when unavailable', () => {
      store.sensors[0].state = 'unavailable';
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find('.card');
      expect(card.classes()).toContain('border-warning');
    });

    it('should have info border when available', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find('.card');
      expect(card.classes()).toContain('border-info');
    });

    it('should have responsive column classes', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      const column = wrapper.find('.col-lg-4');
      expect(column.classes()).toContain('col-md-6');
    });
  });

  describe('Device Information', () => {
    it('should handle device information when available', () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: 'media_player.bedroom' },
        global: { plugins: [pinia] },
      });
      // Just verify it doesn't crash
      expect(wrapper.exists()).toBe(true);
    });
  });
});
