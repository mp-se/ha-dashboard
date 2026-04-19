import { ref, onMounted, onBeforeUnmount } from "vue";

const MOBILE_BREAKPOINT = 768;

/**
 * Reactive composable that tracks whether the current viewport is mobile-sized.
 * Returns a ref that updates automatically when the window is resized.
 *
 * @param breakpoint - Width in pixels below which the device is considered mobile (default: 768)
 */
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const isMobile = ref(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );

  const onResize = () => {
    isMobile.value = window.innerWidth < breakpoint;
  };

  onMounted(() => {
    window.addEventListener("resize", onResize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
  });

  return { isMobile };
}
