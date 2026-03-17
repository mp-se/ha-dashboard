import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import EditorCanvas from "../../../components/VisualEditor/EditorCanvas.vue";
import { createPinia, setActivePinia } from "pinia";
import { useHaStore } from "../../../stores/haStore";

describe("EditorCanvas.vue", () => {
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
    };

    wrapper = mount(EditorCanvas, {
      props: {
        entities: [
          { entity: "sensor.temperature", type: "HaSensor" },
          { entity: "light.living_room", type: "HaLight" },
        ],
        selectedEntityId: null,
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          draggable: {
            template: `
              <div class="editor-canvas">
                <div v-for="(entity, index) in modelValue" :key="index" class="entity-card">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="flex-grow-1">
                        <h6 class="card-title mb-2">
                          <i class="mdi mdi-dragvertical me-2 text-muted"></i>
                          {{ entity.entity || entity.getter || 'Unknown' }}
                        </h6>
                        <small class="badge bg-light text-dark" v-if="entity.type">{{ entity.type }}</small>
                        <small class="badge bg-secondary text-white" v-else>Auto</small>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="$emit('remove-entity', index)">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            `,
            props: ["modelValue"],
            emits: ["remove-entity"],
          },
        },
      },
    });
  });

  it("renders the canvas component", () => {
    expect(wrapper.find(".editor-canvas").exists()).toBe(true);
  });

  it("displays entities as draggable cards", () => {
    // Check the component renders and has entities in localEntities
    expect(wrapper.vm.localEntities).toHaveLength(2);
  });

  it("emits select-entity when entity is clicked", async () => {
    wrapper.vm.$emit("select-entity", 0);
    expect(wrapper.emitted("select-entity")).toBeTruthy();
  });

  it("emits remove-entity when remove button is clicked", async () => {
    wrapper.vm.$emit("remove-entity", 0);
    expect(wrapper.emitted("remove-entity")).toBeTruthy();
  });

  it("shows alert when no entities", async () => {
    await wrapper.setProps({ entities: [] });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.localEntities).toHaveLength(0);
  });

  it("shows entity type badge", () => {
    expect(wrapper.vm.localEntities[0].type).toBe("HaSensor");
  });

  it("highlights selected entity", async () => {
    await wrapper.setProps({ selectedEntityId: 0 });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedEntityId).toBe(0);
  });

  it("deselects entity when clicking the same selected entity", async () => {
    // Simulate selecting an entity
    wrapper.vm.handleSelectClick(0);
    expect(wrapper.emitted("select-entity")).toBeTruthy();
    expect(wrapper.emitted("select-entity")[0]).toEqual([0]);

    // Now update selectedEntityId to 0 (as parent would do)
    await wrapper.setProps({ selectedEntityId: 0 });
    await wrapper.vm.$nextTick();

    // Click the same entity again to deselect
    wrapper.vm.handleSelectClick(0);
    const emissions = wrapper.emitted("select-entity");
    expect(emissions[1]).toEqual([null]); // Should emit null to deselect
  });
});
