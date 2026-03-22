/**
 * Composable for managing entity selection in EditorCanvas
 * Handles selection state and toggle behavior
 */
export function useEditorSelection(emit) {
  /**
   * Check if an entity is selected
   * Note: Must pass selectedEntityId as parameter since it's defined at component level
   */
  const isEntitySelected = (selectedEntityId, index) => {
    return selectedEntityId === index;
  };

  /**
   * Toggle selection of an entity
   * If already selected, deselect; otherwise select
   * Note: Must pass selectedEntityId as parameter since it's defined at component level
   */
  const handleSelectClick = (selectedEntityId, index) => {
    if (isEntitySelected(selectedEntityId, index)) {
      // Deselect if clicking the same entity
      emit("select-entity", null);
    } else {
      // Select the clicked entity
      emit("select-entity", index);
    }
  };

  /**
   * Alias for handleSelectClick (used in template)
   */
  const onCardClick = (selectedEntityId, index) => {
    handleSelectClick(selectedEntityId, index);
  };

  return {
    isEntitySelected,
    handleSelectClick,
    onCardClick,
  };
}
