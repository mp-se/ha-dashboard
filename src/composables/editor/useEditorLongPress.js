/**
 * Composable for handling long-press detection on editor cards
 * Emits an event after 500ms of uninterrupted touch, and prevents context menu
 */
export function useEditorLongPress() {
  let touchData = null;
  let longPressTimer = null;
  const LONG_PRESS_DURATION = 500;
  const MOVE_THRESHOLD = 8; // px

  const startLongPress = (e, cardIndex, onLongPress) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchData = {
      startX: touch.clientX,
      startY: touch.clientY,
      cardIndex,
    };

    longPressTimer = setTimeout(() => {
      if (touchData) {
        onLongPress(cardIndex);
        touchData = null;
      }
    }, LONG_PRESS_DURATION);
  };

  const moveLongPress = (e) => {
    if (!touchData || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchData.startX);
    const deltaY = Math.abs(touch.clientY - touchData.startY);

    // Cancel long-press if finger moved too far (indicates scroll or drag intent)
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      clearTimeout(longPressTimer);
      touchData = null;
      longPressTimer = null;
    }
  };

  const endLongPress = () => {
    clearTimeout(longPressTimer);
    touchData = null;
    longPressTimer = null;
  };

  return {
    startLongPress,
    moveLongPress,
    endLongPress,
  };
}
