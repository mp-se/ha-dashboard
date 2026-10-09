const createView = (name, label, icon, sectionTitle) => ({
  name,
  label,
  icon: `mdi:${icon}`,
  entities: [{ type: "HaHeader", name: sectionTitle }],
});

export const STARTER_DASHBOARD_TEMPLATES = [
  {
    id: "essentials",
    name: "Home essentials",
    description: "One overview to start adding your favorite entities.",
    views: [
      createView("overview", "Overview", "view-dashboard", "At a glance"),
    ],
  },
  {
    id: "rooms",
    name: "Rooms",
    description: "An overview plus separate living room and bedroom views.",
    views: [
      createView("overview", "Overview", "home", "Home"),
      createView("living-room", "Living Room", "sofa", "Living Room"),
      createView("bedroom", "Bedroom", "bed", "Bedroom"),
    ],
  },
  {
    id: "household",
    name: "Home systems",
    description: "Separate spaces for lighting, climate, and devices.",
    views: [
      createView("overview", "Overview", "home", "Home"),
      createView("lighting", "Lighting", "lightbulb", "Lighting"),
      createView("climate", "Climate", "thermometer", "Climate"),
      createView("devices", "Devices", "devices", "Devices"),
    ],
  },
];

/** Return a deep copy so editing a created dashboard never mutates the templates. */
export const createStarterViews = (templateId) => {
  const template = STARTER_DASHBOARD_TEMPLATES.find(
    (item) => item.id === templateId,
  );
  return template ? JSON.parse(JSON.stringify(template.views)) : null;
};
