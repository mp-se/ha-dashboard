import { describe, it, expect, beforeEach } from "vitest";
import { useHaStore } from "../../stores/haStore";
import { mount } from "@vue/test-utils";
import VisualEditorView from "../VisualEditorView.vue";
import { createPinia, setActivePinia } from "pinia";
import {
  resetVisualEditorToolbar,
  useVisualEditorToolbar,
} from "../../composables/useVisualEditorToolbar";

// Mock child components
const mockViewManager = {
  name: "ViewManager",
  template: '<div class="view-manager"><slot /></div>',
  props: ["selectedViewName"],
  emits: ["view-created", "view-deleted", "view-updated", "view-selected"],
};

const mockEntityPalette = {
  name: "EntityPalette",
  template: '<div class="entity-palette"><slot /></div>',
  props: ["entitiesInView"],
  emits: ["add-entity", "remove-entity"],
};

const mockStaticComponentPalette = {
  name: "StaticComponentPalette",
  template: '<div class="static-component-palette"><slot /></div>',
};

const mockEditorCanvas = {
  name: "EditorCanvas",
  template: '<div class="editor-canvas"><slot /></div>',
  props: ["entities", "selectedEntityId"],
  emits: [
    "select-entity",
    "reorder-entities",
    "remove-entity",
    "add-entity",
    "add-entity-at-index",
  ],
};

const mockEntityInspector = {
  name: "EntityInspector",
  template: '<div class="entity-inspector"><slot /></div>',
  props: ["entity", "entityId"],
  emits: [
    "update-type",
    "update-attributes",
    "update-properties",
    "remove-entity",
    "deselect",
  ],
};

describe("VisualEditorView.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetVisualEditorToolbar();
  });

  it("renders the restored ViewManager component", () => {
    const wrapper = mount(VisualEditorView, {
      global: {
        components: {
          ViewManager: mockViewManager,
          EntityPalette: mockEntityPalette,
          StaticComponentPalette: mockStaticComponentPalette,
          EditorCanvas: mockEditorCanvas,
          EntityInspector: mockEntityInspector,
        },
      },
    });
    const viewManager = wrapper.findComponent(mockViewManager);
    expect(viewManager.exists()).toBe(true);
  });

  it("renders EntityPalette component", () => {
    const wrapper = mount(VisualEditorView, {
      global: {
        components: {
          ViewManager: mockViewManager,
          EntityPalette: mockEntityPalette,
          StaticComponentPalette: mockStaticComponentPalette,
          EditorCanvas: mockEditorCanvas,
          EntityInspector: mockEntityInspector,
        },
      },
    });
    const entityPalette = wrapper.findComponent(mockEntityPalette);
    expect(entityPalette.exists()).toBe(true);
  });

  it("renders EditorCanvas component", () => {
    const wrapper = mount(VisualEditorView, {
      global: {
        components: {
          ViewManager: mockViewManager,
          EntityPalette: mockEntityPalette,
          StaticComponentPalette: mockStaticComponentPalette,
          EditorCanvas: mockEditorCanvas,
          EntityInspector: mockEntityInspector,
        },
      },
    });
    const editorCanvas = wrapper.findComponent(mockEditorCanvas);
    expect(editorCanvas.exists()).toBe(true);
  });

  it("renders StaticComponentPalette component", () => {
    const wrapper = mount(VisualEditorView, {
      global: {
        components: {
          ViewManager: mockViewManager,
          EntityPalette: mockEntityPalette,
          StaticComponentPalette: mockStaticComponentPalette,
          EditorCanvas: mockEditorCanvas,
          EntityInspector: mockEntityInspector,
        },
      },
    });
    const paletteComponent = wrapper.findComponent(mockStaticComponentPalette);
    expect(paletteComponent.exists()).toBe(true);
  });

  describe("viewName prop", () => {
    it("accepts viewName prop", () => {
      const wrapper = mount(VisualEditorView, {
        props: { viewName: "visual-editor-test" },
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });
      expect(wrapper.props("viewName")).toBe("visual-editor-test");
    });

    it("viewName prop defaults to 'editor'", () => {
      const wrapper = mount(VisualEditorView, {
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });
      expect(wrapper.props("viewName")).toBe("editor");
    });

    it("viewName prop is accessible via vm", () => {
      const wrapper = mount(VisualEditorView, {
        props: { viewName: "custom-editor-view" },
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });
      expect(wrapper.vm.viewName).toBe("custom-editor-view");
    });

    it("viewName prop can be updated reactively", async () => {
      const wrapper = mount(VisualEditorView, {
        props: { viewName: "initial-editor" },
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });

      expect(wrapper.props("viewName")).toBe("initial-editor");

      await wrapper.setProps({ viewName: "updated-editor" });

      expect(wrapper.props("viewName")).toBe("updated-editor");
    });
  });

  describe("save status", () => {
    it("initially has empty save status", () => {
      const toolbar = useVisualEditorToolbar();
      const wrapper = mount(VisualEditorView, {
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });
      expect(wrapper.exists()).toBe(true);
      expect(toolbar.saveStatus.value).toBe("");
    });
  });

  describe("selected entity", () => {
    it("initially has no selected entity ID", () => {
      const wrapper = mount(VisualEditorView, {
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });
      expect(wrapper.vm.selectedEntityId).toBe(null);
    });

    it("displays placeholder when no entity is selected", () => {
      const wrapper = mount(VisualEditorView, {
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });
      expect(wrapper.text()).toContain("Select an entity to edit");
    });
  });

  describe("view selection", () => {
    it("updates selectedViewName when view-selected event is emitted", async () => {
      const wrapper = mount(VisualEditorView, {
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });

      const viewManager = wrapper.findComponent(mockViewManager);
      expect(wrapper.vm.selectedViewName).toBe("");

      // Emit view-selected from ViewManager
      await viewManager.vm.$emit("view-selected", "new-view");
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedViewName).toBe("new-view");
    });

    it("passes selectedViewName to ViewManager", () => {
      const wrapper = mount(VisualEditorView, {
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });

      const viewManager = wrapper.findComponent(mockViewManager);
      expect(viewManager.props("selectedViewName")).toBe(
        wrapper.vm.selectedViewName,
      );
    });

    it("maintains selectedViewName when switching views", async () => {
      const wrapper = mount(VisualEditorView, {
        global: {
          components: {
            ViewManager: mockViewManager,
            EntityPalette: mockEntityPalette,
            StaticComponentPalette: mockStaticComponentPalette,
            EditorCanvas: mockEditorCanvas,
            EntityInspector: mockEntityInspector,
          },
        },
      });

      const viewManager = wrapper.findComponent(mockViewManager);

      // Select first view
      await viewManager.vm.$emit("view-selected", "view-1");
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.selectedViewName).toBe("view-1");

      // Select second view
      await viewManager.vm.$emit("view-selected", "view-2");
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.selectedViewName).toBe("view-2");

      // Select back to first view
      await viewManager.vm.$emit("view-selected", "view-1");
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.selectedViewName).toBe("view-1");
    });
  });

  it("hides floating toolbar when a dialog is open", async () => {
    // Simulate mobile viewport
    global.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));

    const toolbar = useVisualEditorToolbar();

    const wrapper = mount(VisualEditorView, {
      global: {
        components: {
          ViewManager: mockViewManager,
          EntityPalette: mockEntityPalette,
          StaticComponentPalette: mockStaticComponentPalette,
          EditorCanvas: mockEditorCanvas,
          EntityInspector: mockEntityInspector,
        },
      },
    });

    // Initially toolbar should be visible on mobile when no dialog
    expect(wrapper.find('.floating-toolbar').exists()).toBe(true);

    // Open dialog
    toolbar.setDialogOpen(true);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.floating-toolbar').exists()).toBe(false);

    // Close dialog
    toolbar.setDialogOpen(false);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.floating-toolbar').exists()).toBe(true);
  });

  it("does not show delete when only one view exists", async () => {
    // Simulate mobile viewport
    global.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));

    const ha = useHaStore();
    // Set single view
    ha.dashboardConfig = { views: [ { name: 'overview', label: 'Overview', icon: 'mdi-home-outline', hidden: false, entities: [] } ] };

    const wrapper = mount(VisualEditorView, {
      global: {
        components: {
          ViewManager: mockViewManager,
          EntityPalette: mockEntityPalette,
          StaticComponentPalette: mockStaticComponentPalette,
          EditorCanvas: mockEditorCanvas,
          EntityInspector: mockEntityInspector,
        },
      },
    });

    // Select the only view
    wrapper.vm.selectedViewName = 'overview';
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.floating-toolbar').exists()).toBe(true);
    // Delete button (mdi-delete) should not be present when only one view
    expect(wrapper.find('i.mdi-delete').exists()).toBe(false);
  });
});
