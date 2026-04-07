import { ref } from "vue";

// Module-level refs act as a runtime singleton that survives
// component unmount/mount cycles for the duration of the page.
const selectedType = ref("");
const searchText = ref("");

export function useEntityPaletteState() {
  return {
    selectedType,
    searchText,
  };
}

export default useEntityPaletteState;
