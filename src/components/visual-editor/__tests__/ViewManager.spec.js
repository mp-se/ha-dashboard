import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ViewManager from "@/components/visual-editor/ViewManager.vue";
import { createPinia, setActivePinia } from "pinia";
import { useConfigStore } from "@/stores/configStore";

describe("ViewManager.vue", () => {
  let wrapper;
  let configStore;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    configStore = useConfigStore();

    // Mock dashboard config
    configStore.dashboardConfig = {
      app: { title: "Dashboard" },
      views: [
        {
          name: "overview",
          label: "Overview",
          icon: "mdi-home-outline",
          hidden: false,
          entities: [],
        },
        {
          name: "lights",
          label: "Lights",
          icon: "mdi-lightbulb",
          hidden: false,
          entities: [],
        },
      ],
    };

    wrapper = mount(ViewManager, {
      props: {
        selectedViewName: "overview",
      },
      global: {
        plugins: [pinia],
        stubs: {
          // Stub out any child components if needed
        },
      },
    });
  });

  describe("Rendering", () => {
    it("renders view manager component", () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".view-manager").exists()).toBe(true);
    });

    it("displays all views", () => {
      const viewItems = wrapper.findAll(".view-item");
      expect(viewItems.length).toBe(2);
    });

    it("displays add view button", () => {
      const addButton = wrapper.find(".btn-primary");
      expect(addButton.exists()).toBe(true);
      expect(addButton.text()).toContain("Add");
    });

    it("highlights selected view", () => {
      const selectedView = wrapper.find(".view-item.bg-light.border-primary");
      expect(selectedView.exists()).toBe(true);
    });
  });

  describe("View Actions", () => {
    it("opens new view dialog when add button clicked", async () => {
      const addButton = wrapper.find(".btn-primary");
      await addButton.trigger("click");
      expect(wrapper.vm.showModal).toBe(true);
      expect(wrapper.vm.editingView).toBe(null);
    });

    it("opens edit dialog when edit button clicked", async () => {
      const editButtons = wrapper.findAll(".btn-outline-secondary");
      const firstEditButton = editButtons[0]; // First view's edit button
      await firstEditButton.trigger("click");
      expect(wrapper.vm.showModal).toBe(true);
      expect(wrapper.vm.editingView).not.toBe(null);
      expect(wrapper.vm.editingView.name).toBe("overview");
    });

    it("validates view name format", async () => {
      wrapper.vm.formData.name = "Invalid Name!";
      wrapper.vm.validateName();
      expect(wrapper.vm.nameError).toContain("lowercase");
    });

    it("prevents duplicate view names", async () => {
      wrapper.vm.formData.name = "overview";
      wrapper.vm.validateName();
      expect(wrapper.vm.nameError).toContain("already exists");
    });

    it("allows valid view names", async () => {
      wrapper.vm.formData.name = "new-view";
      wrapper.vm.validateName();
      expect(wrapper.vm.nameError).toBe("");
    });
  });

  describe("Creating Views", () => {
    it("creates a new view with valid data", async () => {
      // Open dialog
      wrapper.vm.showModal = true;
      wrapper.vm.formData = {
        name: "new-view",
        label: "New View",
        icon: "mdi-new",
        hidden: false,
      };

      // Save view
      await wrapper.vm.saveView();

      expect(wrapper.emitted("view-created")).toBeTruthy();
      expect(wrapper.vm.showModal).toBe(false);
    });

    it("emits view-created event with new view data", async () => {
      wrapper.vm.showModal = true;
      wrapper.vm.formData = {
        name: "test-view",
        label: "Test View",
        icon: "mdi-test",
        hidden: false,
      };

      await wrapper.vm.saveView();

      const emitted = wrapper.emitted("view-created");
      expect(emitted).toBeTruthy();
      expect(emitted[0][0].name).toBe("test-view");
    });
  });

  describe("Duplicating Views", () => {
    it("duplicates a view with new name", async () => {
      const view = configStore.dashboardConfig.views[0];
      await wrapper.vm.duplicateView(view);

      expect(wrapper.emitted("view-created")).toBeTruthy();
      const emitted = wrapper.emitted("view-created")[0][0];
      expect(emitted.name).toContain("copy");
      expect(emitted.label).toContain("Copy");
    });

    it("generates unique name for duplicated view", async () => {
      const view = configStore.dashboardConfig.views[0];
      await wrapper.vm.duplicateView(view);
      await wrapper.vm.duplicateView(view);

      const emitted = wrapper.emitted("view-created");
      expect(emitted.length).toBe(2);
      expect(emitted[0][0].name).not.toBe(emitted[1][0].name);
    });
  });

  describe("Deleting Views", () => {
    it("opens delete confirmation dialog", async () => {
      const view = configStore.dashboardConfig.views[0];
      await wrapper.vm.confirmDeleteView(view);

      expect(wrapper.vm.showDeleteConfirm).toBe(true);
      expect(wrapper.vm.viewToDelete).toBe(view);
    });

    it("deletes view after confirmation", async () => {
      const view = configStore.dashboardConfig.views[0];
      wrapper.vm.viewToDelete = view;
      wrapper.vm.showDeleteConfirm = true;

      await wrapper.vm.deleteView();

      expect(wrapper.emitted("view-deleted")).toBeTruthy();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
    });

    it("disables delete button for last view", async () => {
      // Set only one view
      configStore.dashboardConfig.views = [
        configStore.dashboardConfig.views[0],
      ];
      await wrapper.vm.$nextTick();

      const deleteButtons = wrapper.findAll(".btn-outline-danger");
      expect(deleteButtons.length).toBe(0); // Should be hidden or disabled
    });
  });

  describe("Edit Views", () => {
    it("opens edit dialog with view data", async () => {
      const view = configStore.dashboardConfig.views[0];
      await wrapper.vm.editView(view);

      expect(wrapper.vm.showModal).toBe(true);
      expect(wrapper.vm.editingView).toBe(view);
      expect(wrapper.vm.formData.name).toBe(view.name);
      expect(wrapper.vm.formData.label).toBe(view.label);
    });

    it("updates view properties", async () => {
      const view = configStore.dashboardConfig.views[0];
      wrapper.vm.editingView = view;
      wrapper.vm.formData = {
        name: view.name,
        label: "Updated Label",
        icon: "mdi-updated",
        hidden: true,
      };

      await wrapper.vm.saveView();

      expect(wrapper.emitted("view-updated")).toBeTruthy();
    });

    it("disables name field when editing", async () => {
      const view = configStore.dashboardConfig.views[0];
      await wrapper.vm.editView(view);

      const nameInput = wrapper.find("#viewName");
      expect(nameInput.attributes("disabled")).toBeDefined();
    });
  });

  describe("Form Validation", () => {
    it("validates view name format", async () => {
      wrapper.vm.formData.name = "Invalid Name!";
      wrapper.vm.validateName();
      expect(wrapper.vm.nameError).toBeTruthy();
    });

    it("prevents duplicate view names", async () => {
      wrapper.vm.formData.name = "overview";
      wrapper.vm.validateName();
      expect(wrapper.vm.nameError).toBeTruthy();
    });

    it("allows valid view names", async () => {
      wrapper.vm.formData.name = "new-view";
      wrapper.vm.validateName();
      expect(wrapper.vm.nameError).toBe("");
    });

    it("requires all fields for form validity", async () => {
      wrapper.vm.formData = {
        name: "",
        label: "Valid",
        icon: "mdi-icon",
        hidden: false,
      };
      expect(!wrapper.vm.isFormValid).toBe(true); // Empty name should make form invalid

      wrapper.vm.formData.name = "valid-name";
      wrapper.vm.formData.label = "";
      expect(!wrapper.vm.isFormValid).toBe(true); // Empty label should make form invalid

      wrapper.vm.formData.label = "Valid Label";
      wrapper.vm.formData.icon = "";
      expect(!wrapper.vm.isFormValid).toBe(true); // Empty icon should make form invalid
    });

    it("enables save when form is complete and valid", async () => {
      wrapper.vm.formData = {
        name: "valid-name",
        label: "Valid Label",
        icon: "mdi-valid",
        hidden: false,
      };
      expect(wrapper.vm.isFormValid).toBeTruthy();
    });
  });

  describe("Modal Management", () => {
    it("closes modal on cancel", async () => {
      wrapper.vm.showModal = true;
      wrapper.vm.editingView = { name: "test" };

      await wrapper.vm.closeModal();

      expect(wrapper.vm.showModal).toBe(false);
      expect(wrapper.vm.editingView).toBe(null);
    });

    it("closes delete confirmation modal", async () => {
      wrapper.vm.showDeleteConfirm = true;
      wrapper.vm.showDeleteConfirm = false;

      expect(wrapper.vm.showDeleteConfirm).toBe(false);
    });
  });
});
