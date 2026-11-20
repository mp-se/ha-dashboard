/**
 * Sample data for the public demo build (`VITE_DEMO=true`), which has no server.
 *
 * It is imported dynamically behind `import.meta.env.VITE_DEMO === "true"`, so
 * normal builds do not contain it. The dashboard configuration and the local
 * (sample entity) data come from the same example files users start from.
 */
import exampleConfig from "../../data/dashboard-config.example.json";
import exampleLocalData from "../../data/local-data.example.json";

// The demo always runs on the sample entities instead of a Home Assistant.
export const demoConfig = {
  ...exampleConfig,
  app: { ...exampleConfig.app, localMode: true },
};

export const demoLocalData = exampleLocalData;
