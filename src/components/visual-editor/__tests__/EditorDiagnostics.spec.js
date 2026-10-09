import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import EditorDiagnostics from "../EditorDiagnostics.vue";

const validConfig = {
  app: { title: "Dashboard" },
  views: [
    {
      name: "home",
      label: "Home",
      icon: "mdi:home",
      entities: [{ type: "HaLight", entity: "light.kitchen" }],
    },
  ],
};

describe("EditorDiagnostics", () => {
  it("reports valid configuration and known Home Assistant entities", () => {
    const wrapper = mount(EditorDiagnostics, {
      props: {
        config: validConfig,
        entityMap: { "light.kitchen": {} },
        isConnected: true,
      },
    });

    expect(wrapper.text()).toContain("No configuration issues found");
    expect(wrapper.text()).toContain("all referenced entities exist");
  });

  it("reports invalid component configuration", () => {
    const wrapper = mount(EditorDiagnostics, {
      props: {
        config: {
          ...validConfig,
          views: [
            {
              ...validConfig.views[0],
              entities: [{ type: "NotARealCard", entity: "light.kitchen" }],
            },
          ],
        },
      },
    });

    expect(wrapper.text()).toContain("Unknown component type");
    expect(wrapper.find("li .text-danger").exists()).toBe(true);
  });

  it("warns about entity references missing from Home Assistant", () => {
    const wrapper = mount(EditorDiagnostics, {
      props: {
        config: validConfig,
        entityMap: { "light.other": {} },
        isConnected: true,
      },
    });

    expect(wrapper.text()).toContain("light.kitchen was not found");
    expect(wrapper.find("li .text-warning-emphasis").exists()).toBe(true);
  });

  it("does not report entity references as missing while disconnected", () => {
    const wrapper = mount(EditorDiagnostics, {
      props: { config: validConfig },
    });

    expect(wrapper.text()).toContain(
      "Entity availability is checked when connected to Home Assistant.",
    );
    expect(wrapper.text()).not.toContain("was not found");
  });
});
