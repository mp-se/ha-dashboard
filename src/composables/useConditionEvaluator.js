import { unref, computed } from "vue";
import { useHaStore } from "@/stores/haStore";

/**
 * Composable for evaluating conditions in HaWarning and HaError components.
 * 
 * @param props - Component props containing entity, attribute, operator, and value.
 * @returns Object with evaluation results.
 */
export const useConditionEvaluator = (props) => {
  const store = useHaStore();

  const resolvedEntity = computed(() => {
    const entityProp = unref(props.entity);
    if (typeof entityProp === "string") {
      return store.entityMap.get(entityProp) || null;
    }
    return entityProp;
  });

  const currentValue = computed(() => {
    if (!resolvedEntity.value) return null;
    if (props.attribute === "state") {
      return resolvedEntity.value.state;
    }
    return resolvedEntity.value.attributes?.[props.attribute] ?? null;
  });

  const isConditionTrue = computed(() => {
    if (props.editorMode) return true;
    if (!resolvedEntity.value || currentValue.value === null) return false;

    const current = currentValue.value;
    const expected = props.value;

    switch (props.operator) {
      case "=":
        return current == expected;
      case "!=":
        return current != expected;
      case ">":
        return Number(current) > Number(expected);
      case "<":
        return Number(current) < Number(expected);
      case ">=":
        return Number(current) >= Number(expected);
      case "<=":
        return Number(current) <= Number(expected);
      case "contains":
        return String(current).includes(String(expected));
      case "not_contains":
        return !String(current).includes(String(expected));
      case "in":
        if (Array.isArray(expected)) return expected.includes(current);
        return String(expected).includes(String(current));
      case "not_in":
        if (Array.isArray(expected)) return !expected.includes(current);
        return !String(expected).includes(String(current));
      default:
        return false;
    }
  });

  return {
    resolvedEntity,
    currentValue,
    isConditionTrue,
  };
};
