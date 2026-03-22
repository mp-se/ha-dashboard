import { ref } from "vue";

/**
 * Composable for managing drag-drop behavior in EditorCanvas
 * Handles dragging entities, dropping on the canvas, and reordering
 */
export function useEditorDragDrop(localEntities, emit) {
  // State
  const isDragging = ref(false);
  const isDragOver = ref(false);
  const isDropping = ref(false);
  const dragOverCounter = ref(0);
  const dragOverIndex = ref(null);

  /**
   * Handle drag over canvas background
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    // Ensure we allow the drop effect matching the palette (copy)
    event.dataTransfer.dropEffect = "copy";

    // If there are no entities, or if we're dragging over the background (not specific entities)
    // we set the drop index to the end.
    if (localEntities.value.length === 0) {
      dragOverIndex.value = 0;
    } else {
      // Only update to the end if we aren't already targeting a specific entity via handleEntityDragOver
      if (dragOverIndex.value === null) {
        dragOverIndex.value = localEntities.value.length;
      }
    }
    isDropping.value = true;
  };

  /**
   * Handle drag enter (increment counter to track nesting)
   */
  const handleDragEnter = () => {
    dragOverCounter.value++;
    isDragOver.value = true;
    isDropping.value = true;
  };

  /**
   * Handle drag leave (decrement counter)
   */
  const handleDragLeave = () => {
    dragOverCounter.value--;
    if (dragOverCounter.value <= 0) {
      isDragOver.value = false;
      dragOverCounter.value = 0;
      // Don't reset dragOverIndex immediately to avoid flickering,
      // handleEntityDragOver will take care of updating it.
      isDropping.value = false;
    }
  };

  /**
   * Handle drag over a specific entity (determine insertion point)
   */
  const handleEntityDragOver = (index, event) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent handleDragOver from overriding
    event.dataTransfer.dropEffect = "copy";

    // Track the horizontal/vertical position to determine if dropping before or after
    const rect = event.currentTarget.getBoundingClientRect();

    // For grid layouts (Bootstrap rows), we should ideally check both X and Y
    // but most users expect "before" or "after" based on visual sequence.
    const midpointX = rect.left + rect.width / 2;

    // Use midpointX for horizontal flow, midpointY for vertical stack
    if (event.clientX < midpointX) {
      dragOverIndex.value = index;
    } else {
      dragOverIndex.value = index + 1;
    }
  };

  /**
   * Handle drag start on an entity
   */
  const handleEntityDragStart = (index, event) => {
    isDragging.value = true;
    // Store the dragged entity info for reordering
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "entity-reorder",
        draggedIndex: index,
        entity: localEntities.value[index],
      }),
    );
  };

  /**
   * Handle drag end
   */
  const handleEntityDragEnd = () => {
    isDragging.value = false;
    dragOverIndex.value = null;
    isDropping.value = false;
  };

  /**
   * Handle drag leave on a specific entity
   */
  const handleEntityDragLeave = (index) => {
    // Only reset if we're leaving this specific entity without entering another
    if (dragOverIndex.value === index || dragOverIndex.value === index + 1) {
      dragOverIndex.value = null;
    }
  };

  /**
   * Handle drop on a specific entity
   */
  const handleEntityDrop = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    isDropping.value = false;

    try {
      let data = event.dataTransfer.getData("application/json");

      // Fallback: If application/json is empty, try text/plain
      if (!data) {
        const textData = event.dataTransfer.getData("text/plain");
        if (textData && textData.includes(".")) {
          data = JSON.stringify({ entity: textData });
        }
      }

      if (data) {
        const parsedData = JSON.parse(data);

        // Handle entity reordering (from another entity in the same canvas)
        if (parsedData.type === "entity-reorder") {
          const draggedIndex = parsedData.draggedIndex;
          const draggedEntity = parsedData.entity;

          // Determine the actual insertion index based on mouse position
          const rect = event.currentTarget.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          let insertIndex = event.clientY < midpoint ? index : index + 1;

          // If dragging from above, adjust the insert index
          if (draggedIndex < insertIndex) {
            insertIndex--;
          }

          // Move the entity in the local array
          localEntities.value.splice(draggedIndex, 1);
          localEntities.value.splice(insertIndex, 0, draggedEntity);
          emit("reorder-entities", localEntities.value);
          return;
        }

        // Handle static component (from palette)
        if (parsedData.isStatic && parsedData.type) {
          const rect = event.currentTarget.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const insertIndex = event.clientY < midpoint ? index : index + 1;

          emit("add-entity-at-index", {
            entity: { type: parsedData.type },
            index: insertIndex,
          });
          return;
        }

        // Handle entity from palette
        if (parsedData.entity) {
          const rect = event.currentTarget.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const insertIndex = event.clientY < midpoint ? index : index + 1;

          emit("add-entity-at-index", {
            entity: parsedData.entity,
            index: insertIndex,
          });
        }
      }
    } catch (error) {
      console.error("[useEditorDragDrop] Error handling entity drop:", error);
    } finally {
      dragOverIndex.value = null;
    }
  };

  /**
   * Handle drop on canvas background
   */
  const handleDrop = (event) => {
    console.log("[useEditorDragDrop] DROP event fired!", event);
    event.preventDefault();
    isDragOver.value = false;
    isDropping.value = false;
    dragOverCounter.value = 0;
    dragOverIndex.value = null;

    try {
      // Check for data in application/json (handles both entities and static components)
      let data = event.dataTransfer.getData("application/json");

      // Fallback: If application/json is empty, try text/plain (some browsers or drag sources)
      if (!data) {
        const textData = event.dataTransfer.getData("text/plain");
        if (textData) {
          // If it looks like an entity ID (contains a dot), wrap it in the expected JSON format
          if (textData.includes(".")) {
            data = JSON.stringify({ entity: textData });
          }
        }
      }

      if (data) {
        const parsedData = JSON.parse(data);

        // Handle static component
        if (parsedData.isStatic && parsedData.type) {
          emit("add-entity", {
            type: parsedData.type,
          });
          return;
        }

        // Handle entity (original behavior)
        if (parsedData.entity) {
          emit("add-entity", parsedData.entity);
          return;
        }
      }
    } catch (error) {
      console.error("[useEditorDragDrop] Error parsing dropped data:", error);
    }
  };

  return {
    // State
    isDragging,
    isDragOver,
    isDropping,
    dragOverCounter,
    dragOverIndex,
    // Handlers
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleEntityDragStart,
    handleEntityDragOver,
    handleEntityDragLeave,
    handleEntityDrop,
    handleEntityDragEnd,
    handleDrop,
  };
}
