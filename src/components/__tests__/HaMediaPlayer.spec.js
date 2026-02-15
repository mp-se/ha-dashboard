import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import HaMediaPlayer from "../HaMediaPlayer.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "@/stores/haStore";

describe("HaMediaPlayer.vue", () => {
  let store;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useHaStore();
    store.devices = [];
    store.sensors = [
      {
        entity_id: "media_player.bedroom",
        state: "playing",
        attributes: {
          friendly_name: "Bedroom Player",
          media_title: "Song Name",
          media_artist: "Artist Name",
          volume_level: 0.75,
          source: "Spotify",
        },
      },
    ];
  });

  describe("Component Rendering", () => {
    it("should mount successfully", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("should accept entity prop", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.props("entity")).toBe("media_player.bedroom");
    });

    it("should render card element", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".card").exists()).toBe(true);
    });

    it("should handle missing entity gracefully", () => {
      store.sensors = [];
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.nonexistent" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".mdi-alert-circle").exists()).toBe(true);
    });

    it("should update when entity prop changes", async () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });

      store.sensors.push({
        entity_id: "media_player.living_room",
        state: "paused",
        attributes: {
          friendly_name: "Living Room Player",
        },
      });

      await wrapper.setProps({ entity: "media_player.living_room" });
      expect(wrapper.props("entity")).toBe("media_player.living_room");
    });
  });

  describe("Media State Display", () => {
    it("should display friendly name", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Bedroom Player");
    });

    it("should display current state", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      // State is now displayed as an icon, verify the pause icon is shown for playing state
      const icon = wrapper.find("i.mdi-pause");
      expect(icon.exists()).toBe(true);
    });

    it("should display media title", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Song Name");
    });

    it("should display media artist", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Artist Name");
    });
  });

  describe("Media Icons", () => {
    it("should show play icon when playing", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-pause").exists()).toBe(true);
    });

    it("should show pause icon when paused", () => {
      store.sensors[0].state = "paused";
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-play").exists()).toBe(true);
    });
  });

  describe("Media Controls", () => {
    it("should display media control buttons", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.findAll("button").length).toBeGreaterThan(0);
    });

    it("should show pause icon when playing", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-pause").exists()).toBe(true);
    });

    it("should show play icon when paused", () => {
      store.sensors[0].state = "paused";
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".mdi-play").exists()).toBe(true);
    });

    it("should disable track controls when off", () => {
      store.sensors[0].state = "off";
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const buttons = wrapper.findAll("button");
      // Skip previous button should be disabled
      expect(buttons[1].attributes("disabled")).toBeDefined();
    });

    it("should display volume control when on and has volume_level", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const volumeInput = wrapper.find(".form-range");
      expect(volumeInput.exists()).toBe(true);
      expect(volumeInput.element.value).toBe("0.75");
    });

    it("should call turn_off service on power button click", async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const powerButton = wrapper.findAll("button")[3];
      await powerButton.trigger("click");
      expect(store.callService).toHaveBeenCalledWith(
        "media_player",
        "turn_off",
        expect.any(Object),
      );
    });

    it("should call media_play_pause service on play button click", async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const playButton = wrapper.findAll("button")[1];
      await playButton.trigger("click");
      expect(store.callService).toHaveBeenCalledWith(
        "media_player",
        "media_play_pause",
        expect.any(Object),
      );
    });

    it("should call volume_set service on volume change", async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const volumeInput = wrapper.find(".form-range");
      await volumeInput.setValue(0.5);
      expect(store.callService).toHaveBeenCalledWith(
        "media_player",
        "volume_set",
        expect.any(Object),
      );
    });
  });

  describe("Card Styling", () => {
    it("should have warning border when unavailable", () => {
      store.sensors[0].state = "unavailable";
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-warning");
    });

    it("should have info border when available", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const card = wrapper.find(".card");
      expect(card.classes()).toContain("border-info");
    });

    it("should have responsive column classes", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const column = wrapper.find(".col-lg-4");
      expect(column.classes()).toContain("col-md-6");
    });
  });

  describe("Device Information", () => {
    it("should handle device information when available", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      // Just verify it doesn't crash
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Media Progress and Logic", () => {
    it("should calculate mediaSubtitle correctly when both title and artist exist", () => {
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.text()).toContain("Song Name - Artist Name");
    });

    it("should calculate mediaSubtitle correctly when only title exists", () => {
      store.sensors[0].attributes.media_artist = null;
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const p = wrapper.find("p.text-muted");
      expect(p.text()).toBe("Song Name");
    });

    it("should calculate mediaSubtitle correctly when only artist exists", () => {
      store.sensors[0].attributes.media_title = null;
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const p = wrapper.find("p.text-muted");
      expect(p.text()).toBe("Artist Name");
    });

    it("should display progress bar when media_position and media_duration exist", () => {
      store.sensors[0].attributes.media_position = 10;
      store.sensors[0].attributes.media_duration = 100;
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      expect(wrapper.find(".progress-container").exists()).toBe(true);
      // 10%
      expect(
        wrapper.find(".progress-container > div > div").element.style.width,
      ).toBe("10%");
    });

    it("should call volume_set when slider is changed", async () => {
      store.callService = vi.fn();
      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });
      const input = wrapper.find('input[type="range"]');
      await input.setValue("0.5");
      expect(store.callService).toHaveBeenCalledWith(
        "media_player",
        "volume_set",
        expect.objectContaining({ volume_level: 0.5 }),
      );
    });

    it("should show indeterminate progress pulse when position is 0 but playing and has duration", () => {
      store.sensors[0].state = "playing";
      store.sensors[0].attributes.media_position = 0;
      store.sensors[0].attributes.media_duration = 100;
      store.sensors[0].attributes.media_position_updated_at = null;

      const wrapper = mount(HaMediaPlayer, {
        props: { entity: "media_player.bedroom" },
        global: { plugins: [pinia] },
      });

      expect(wrapper.find(".progress-indeterminate").exists()).toBe(true);
      // indeterminate logic sets it to 50%
      expect(
        wrapper.find(".progress-container > div > div").element.style.width,
      ).toBe("50%");
    });
  });
});
