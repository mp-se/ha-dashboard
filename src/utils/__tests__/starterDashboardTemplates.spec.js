import { describe, expect, it } from "vitest";
import { validateConfig } from "../configValidator";
import {
  createStarterViews,
  STARTER_DASHBOARD_TEMPLATES,
} from "../starterDashboardTemplates";

describe("starter dashboard templates", () => {
  it("provides valid dashboard view scaffolds for every template", () => {
    for (const template of STARTER_DASHBOARD_TEMPLATES) {
      const result = validateConfig({
        app: { title: "Home" },
        views: createStarterViews(template.id),
      });
      expect(result.errors, template.name).toEqual([]);
    }
  });

  it("returns an independent copy and rejects unknown templates", () => {
    const first = createStarterViews("rooms");
    first[0].entities[0].name = "Changed";

    expect(createStarterViews("rooms")[0].entities[0].name).toBe("Home");
    expect(createStarterViews("missing")).toBeNull();
  });
});
