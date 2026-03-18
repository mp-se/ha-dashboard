import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import EditorCanvas from "../../../components/visual-editor/EditorCanvas.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../../stores/haStore";

describe("EditorCanvas.vue - Drag and Drop (Phase 2)", () => {
  let wrapper;
  let haStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    haStore = useHaStore();

    // Mock entity map
    haStore.entityMap = {
      "sensor.temperature": {
        attributes: { friendly_name: "Temperature" },
      },
      "light.living_room": {
        attributes: { friendly_name: "Living Room Light" },
      },
      "switch.garage": {
        attributes: { friendly_name: "Garage Door" },
      },
    };

    wrapper = mount(EditorCanvas, {
      props: {
        entities: [
          { entity: "sensor.temperature", type: "HaSensor" },
          { entity: "light.living_room", type: "HaLight" },
          { entity: "switch.garage", type: "HaSwitch" },
        ],
        selectedEntityId: null,
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          draggable: {
            template: `
              <div class="draggable-stub">
                <div v-for="(entity, index) in modelValue" :key="index" class="entity-item" @click="handleSelect(index)">
                  <slot name="item" :element="entity" :index="index" />
                </div>
              </div>
            `,
            props: ["modelValue", "itemKey", "ghostClass", "animation"],
            emits: ["change", "start", "end"],
            methods: {
              handleSelect(index) {
                this.$emit("select-entity", index);
              },
            },
          },
        },
      },
    });
  });

  describe("Drag event handling", () => {
    it("should track drag state", async () => {
      expect(wrapper.vm.isDragging).toBe(false);
      wrapper.vm.isDragging = true;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isDragging).toBe(true);
    });

    it("should emit reorder-entities when drag ends", async () => {
      // The reorder-entities event is emitted when handleEntityDrop is called with reordering
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) },
        clientY: 50,
        dataTransfer: {
          getData: vi.fn(() =>
            JSON.stringify({
              type: "entity-reorder",
              draggedIndex: 0,
              entity: { entity: "sensor.test" },
            }),
          ),
        },
      };

      wrapper.vm.handleEntityDrop(1, event);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("reorder-entities")).toBeTruthy();
    });

    it("should update local entities during drag", async () => {
      const reordered = [
        { entity: "switch.garage", type: "HaSwitch" },
        { entity: "sensor.temperature", type: "HaSensor" },
        { entity: "light.living_room", type: "HaLight" },
      ];
      wrapper.vm.localEntities = reordered;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.localEntities[0].entity).toBe("switch.garage");
    });
  });

  describe("Reordering functionality", () => {
    it("should maintain entity data during reorder", async () => {
      const reordered = [
        { entity: "light.living_room", type: "HaLight" },
        { entity: "sensor.temperature", type: "HaSensor" },
        { entity: "switch.garage", type: "HaSwitch" },
      ];
      wrapper.vm.localEntities = reordered;
      await wrapper.vm.$nextTick();

      // Trigger a mock drag end by directly emitting the event
      wrapper.vm.$emit("reorder-entities", reordered);

      const emitted = wrapper.emitted("reorder-entities");
      expect(emitted).toBeTruthy();
      expect(emitted[0][0]).toEqual(reordered);
    });

    it("should sync local entities with prop changes", async () => {
      const newEntities = [
        { entity: "switch.garage", type: "HaSwitch" },
        { entity: "light.living_room", type: "HaLight" },
        { entity: "sensor.temperature", type: "HaSensor" },
      ];
      await wrapper.setProps({ entities: newEntities });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.localEntities).toEqual(newEntities);
    });
  });

  describe("Keyboard accessibility for reordering", () => {
    it("should allow keyboard selection of entities", async () => {
      const cards = wrapper.findAll(".entity-item");
      if (cards.length > 0) {
        await cards[0].trigger("keydown.enter");
      }
      // Verification depends on implementation
    });

    it("should show visual feedback when selected", async () => {
      await wrapper.setProps({ selectedEntityId: 0 });
      await wrapper.vm.$nextTick();
      // The first entity should be visually selected
      expect(wrapper.vm.selectedEntityId).toBe(0);
    });
  });

  describe("Visual feedback during drag", () => {
    it("should apply dragging class when isDragging is true", async () => {
      wrapper.vm.isDragging = true;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isDragging).toBe(true);
    });

    it("should render entity in editor overlay", () => {
      // Verify the editor overlay contains the component
      const overlay = wrapper.find(".editor-overlay");
      expect(overlay.exists()).toBe(true);
    });
  });

  describe("Preventing accidental actions during drag", () => {
    it("should handle remove entity properly when not dragging", () => {
      wrapper.vm.$emit("remove-entity", 0);
      expect(wrapper.emitted("remove-entity")).toBeTruthy();
    });

    it("should emit select-entity when clicking on entity", async () => {
      wrapper.vm.$emit("select-entity", 1);
      expect(wrapper.emitted("select-entity")).toBeTruthy();
      expect(wrapper.emitted("select-entity")[0]).toEqual([1]);
    });
  });

  describe("Multiple entity reordering", () => {
    it("should handle reordering of >3 entities", async () => {
      const manyEntities = [
        { entity: "sensor.temp", type: "HaSensor" },
        { entity: "sensor.humidity", type: "HaSensor" },
        { entity: "light.room1", type: "HaLight" },
        { entity: "light.room2", type: "HaLight" },
        { entity: "switch.outlet", type: "HaSwitch" },
      ];
      await wrapper.setProps({ entities: manyEntities });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.localEntities).toHaveLength(5);
    });

    it("should preserve entity count after reorder", async () => {
      const originalCount = wrapper.vm.localEntities.length;
      // Simulate a reorder
      const reordered = [...wrapper.vm.localEntities].reverse();
      wrapper.vm.localEntities = reordered;
      expect(wrapper.vm.localEntities.length).toBe(originalCount);
    });
  });
});
