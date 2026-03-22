import { ref, computed } from "vue";

/**
 * Composable for managing local entity state in EditorCanvas
 * Handles synchronization with props and provides entity count
 * 
 * Note: This composable only manages the local state refs.
 * The component is responsible for initializing and watching props.
 */
export function useEditorState(initialEntities = []) {  // Local copy of entities to allow reordering without parent sync
  const localEntities = ref(
    Array.isArray(initialEntities) ? [...initialEntities] : [],
  );

  // Safe entity count
  const entityCount = computed(() => {
    return Array.isArray(localEntities.value) ? localEntities.value.length : 0;
  });

  return {
    localEntities,
    entityCount,
  };
}
