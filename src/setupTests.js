import { config } from "@vue/test-utils";
import HaIconCircle from "./components/HaIconCircle.vue";
import HaEntityAttributeList from "./components/HaEntityAttributeList.vue";

// Register global components for all tests
config.global.components = {
  HaIconCircle,
  HaEntityAttributeList,
};
