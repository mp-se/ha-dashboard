import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import GettingStartedPanel from "../GettingStartedPanel.vue";

describe("GettingStartedPanel.vue", () => {
  it("shows the first-run steps and routes the user to the existing setup flows", async () => {
    const wrapper = mount(GettingStartedPanel, {
      props: { isConnected: false, hasCredentials: false, hasViews: true },
    });

    expect(wrapper.text()).toContain("Connect to Home Assistant");
    expect(wrapper.text()).toContain("Create a view");
    expect(wrapper.text()).toContain("Add your first card");

    await wrapper.find("button.btn-outline-primary").trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Browse entities")!
      .trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Built-in cards")!
      .trigger("click");

    expect(wrapper.emitted("connect")).toHaveLength(1);
    expect(wrapper.emitted("browse-entities")).toHaveLength(1);
    expect(wrapper.emitted("browse-components")).toHaveLength(1);
  });

  it("requires a view before offering entity or component browsing", () => {
    const wrapper = mount(GettingStartedPanel, {
      props: { hasViews: false },
    });
    const actionButtons = wrapper
      .findAll("button")
      .filter((button) =>
        ["Browse entities", "Built-in cards"].includes(button.text()),
      );

    expect(actionButtons).toHaveLength(2);
    expect(
      actionButtons.every(
        (button) => button.attributes("disabled") !== undefined,
      ),
    ).toBe(true);
  });

  it("emits dismiss when the guide is closed", async () => {
    const wrapper = mount(GettingStartedPanel);
    await wrapper
      .find('[aria-label="Dismiss getting started guide"]')
      .trigger("click");
    expect(wrapper.emitted("dismiss")).toHaveLength(1);
  });

  it("offers built-in starter layouts without assuming entity IDs", async () => {
    const wrapper = mount(GettingStartedPanel);
    const roomsTemplate = wrapper
      .findAll("button")
      .find((button) => button.text() === "Rooms");

    expect(wrapper.text()).toContain("Home essentials");
    expect(wrapper.text()).toContain("Home systems");
    await roomsTemplate.trigger("click");
    expect(wrapper.emitted("use-template")).toEqual([["rooms"]]);
  });
});
