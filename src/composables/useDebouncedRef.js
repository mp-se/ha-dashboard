import { ref, watch, onBeforeUnmount } from "vue";

export default function useDebouncedRef(initial = "", delay = 300) {
  const input = ref(initial);
  const debounced = ref(initial);
  let timer = null;

  const stop = watch(
    input,
    (val) => {
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
