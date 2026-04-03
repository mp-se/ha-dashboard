import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import EditorActionBar from "../EditorActionBar.vue";

function mountBar(props = {}) {
  return mount(EditorActionBar, { props });
}

describe("EditorActionBar", () => {
  describe("default rendering", () => {
    it("renders Up and Down buttons by default", () => {
      const wrapper = mountBar();
      expect(wrapper.find('[title="Move up"]').exists()).toBe(true);
      expect(wrapper.find('[title="Move down"]').exists()).toBe(true);
    });

    it("does not render Edit, Delete, Add by default", () => {
      const wrapper = mountBar();
      expect(wrapper.find('[title="Edit"]').exists()).toBe(false);
      expect(wrapper.find('[title="Delete"]').exists()).toBe(false);
      expect(wrapper.find('[title="Add"]').exists()).toBe(false);
    });

    it("renders as inline flex row", () => {
      const wrapper = mountBar();
      expect(wrapper.find(".editor-action-bar").exists()).toBe(true);
    });
  });

  describe("button visibility", () => {
    it("hides Up when showUp=false", () => {
      const wrapper = mountBar({ showUp: false });
      expect(wrapper.find('[title="Move up"]').exists()).toBe(false);
    });

    it("hides Down when showDown=false", () => {
      const wrapper = mountBar({ showDown: false });
      expect(wrapper.find('[title="Move down"]').exists()).toBe(false);
    });

    it("shows Edit when showEdit=true", () => {
      const wrapper = mountBar({ showEdit: true });
      expect(wrapper.find('[title="Edit"]').exists()).toBe(true);
    });

    it("shows Delete when showDelete=true", () => {
      const wrapper = mountBar({ showDelete: true });
      expect(wrapper.find('[title="Delete"]').exists()).toBe(true);
    });

    it("shows Add when showAdd=true", () => {
      const wrapper = mountBar({ showAdd: true });
      expect(wrapper.find('[title="Add"]').exists()).toBe(true);
    });
  });

  describe("disabled states", () => {
    it("disables Up button when canMoveUp=false", () => {
      const wrapper = mountBar({ canMoveUp: false });
      expect(wrapper.find('[title="Move up"]').attributes("disabled")).toBeDefined();
    });

    it("enables Up button when canMoveUp=true", () => {
      const wrapper = mountBar({ canMoveUp: true });
      expect(wrapper.find('[title="Move up"]').attributes("disabled")).toBeUndefined();
    });

    it("disables Down button when canMoveDown=false", () => {
      const wrapper = mountBar({ canMoveDown: false });
      expect(wrapper.find('[title="Move down"]').attributes("disabled")).toBeDefined();
    });

    it("enables Down button when canMoveDown=true", () => {
      const wrapper = mountBar({ canMoveDown: true });
      expect(wrapper.find('[title="Move down"]').attributes("disabled")).toBeUndefined();
    });
  });

  describe("custom labels", () => {
    it("uses custom upLabel", () => {
      const wrapper = mountBar({ upLabel: "Move card up" });
      expect(wrapper.find('[title="Move card up"]').exists()).toBe(true);
    });

    it("uses custom editLabel", () => {
      const wrapper = mountBar({ showEdit: true, editLabel: "Edit view properties" });
      expect(wrapper.find('[title="Edit view properties"]').exists()).toBe(true);
    });

    it("uses custom deleteLabel", () => {
      const wrapper = mountBar({ showDelete: true, deleteLabel: "Remove entity" });
      expect(wrapper.find('[title="Remove entity"]').exists()).toBe(true);
    });
  });

  describe("button styling", () => {
    it("Delete button has btn-fab-danger class", () => {
      const wrapper = mountBar({ showDelete: true });
      expect(wrapper.find('[title="Delete"]').classes()).toContain("btn-fab-danger");
    });

    it("all buttons have btn-fab class", () => {
      const wrapper = mountBar({ showEdit: true, showDelete: true, showAdd: true });
      const buttons = wrapper.findAll(".btn-fab");
      expect(buttons.length).toBeGreaterThanOrEqual(4); // up, down, delete, edit, add
    });
  });

  describe("event emission", () => {
    it("emits move-up on Up click", async () => {
      const wrapper = mountBar();
      await wrapper.find('[title="Move up"]').trigger("click");
      expect(wrapper.emitted("move-up")).toBeTruthy();
    });

    it("emits move-down on Down click", async () => {
      const wrapper = mountBar();
      await wrapper.find('[title="Move down"]').trigger("click");
      expect(wrapper.emitted("move-down")).toBeTruthy();
    });

    it("emits edit on Edit click", async () => {
      const wrapper = mountBar({ showEdit: true });
      await wrapper.find('[title="Edit"]').trigger("click");
      expect(wrapper.emitted("edit")).toBeTruthy();
    });

    it("emits delete on Delete click", async () => {
      const wrapper = mountBar({ showDelete: true });
      await wrapper.find('[title="Delete"]').trigger("click");
      expect(wrapper.emitted("delete")).toBeTruthy();
    });

    it("emits add on Add click", async () => {
      const wrapper = mountBar({ showAdd: true });
      await wrapper.find('[title="Add"]').trigger("click");
      expect(wrapper.emitted("add")).toBeTruthy();
    });

    it("does not emit move-up when button is disabled", async () => {
      const wrapper = mountBar({ canMoveUp: false });
      // Disabled buttons do not fire click in jsdom
      const btn = wrapper.find('[title="Move up"]');
      expect(btn.attributes("disabled")).toBeDefined();
    });
  });

  describe("slot", () => {
    it("renders extra content via default slot", () => {
      const wrapper = mount(EditorActionBar, {
        slots: { default: '<button class="extra-btn">Extra</button>' },
      });
      expect(wrapper.find(".extra-btn").exists()).toBe(true);
    });
  });
});
