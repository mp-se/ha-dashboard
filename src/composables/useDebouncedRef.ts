import { ref, watch, onBeforeUnmount, Ref } from "vue";

interface DebouncedRefReturn<T> {
  input: Ref<T>;
  debounced: Ref<T>;
}

/**
 * Composable for debouncing a ref value with a specified delay
 * @param initial - Initial value (default: empty string)
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns Object with input and debounced refs
 */
export default function useDebouncedRef<T>(
  initial: T = "" as T,
  delay: number = 300,
): DebouncedRefReturn<T> {
  const input = ref<T>(initial);
  const debounced = ref<T>(initial);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = watch(
    input,
    (val: T) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        debounced.value = val;
      }, delay);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
    stop();
  });

  return { input, debounced };
}
