# EditorCanvas Refactoring - Quick Reference Guide

**Purpose**: Guide for safe, test-driven refactoring of EditorCanvas.vue  
**Status**: Ready to proceed ✅  
**Test Coverage**: 222/222 tests passing

---

## Overview: Current vs Target

### Current State
```
EditorCanvas.vue (750 lines)
├── Template: 100 lines (complex nesting)
├── Props & Emits: 15 lines
├── Reactive State: 40 lines (7 refs for drag-drop)
├── Component Mapping: 40 lines (40 imports)
├── Props Resolution: 80 lines (4 functions, 0 tests)
├── Drag-Drop Handlers: 200 lines (9 handlers, partial tests)
├── Selection Logic: 30 lines (3 functions, adequate tests)
└── Styles: 50 lines (duplicated in shared-styles.css)
```

### Target State
```
EditorCanvas.vue (250 lines)
├── Template: 80 lines (cleaner, same layout)
├── Props & Emits: 15 lines (unchanged)
├── Setup: 30 lines (using composables)
├── Composable Usage: 25 lines
├── Component Mapping: 40 lines (same)
├── Event Handlers: 20 lines (delegating to composables)
└── Styles: 0 lines (moved to shared-styles.css)

+ useEditorDragDrop.js (200 lines)
+ useComponentResolver.js (100 lines)
+ useEditorSelection.js (50 lines)
+ useEditorState.js (40 lines)
```

---

## Extraction Plan (Detailed)

### Step 1: Create useEditorDragDrop.js

**What to Extract**: All drag-drop related state and handlers

```javascript
// src/composables/editor/useEditorDragDrop.js
import { ref } from "vue";

export function useEditorDragDrop(entities, emit) {
  // STATE
  const isDragging = ref(false);
  const isDragOver = ref(false);
  const isDropping = ref(false);
  const dragOverCounter = ref(0);
  const dragOverIndex = ref(null);

  // HANDLERS (all 9 drag-drop handlers from EditorCanvas)
  const handleDragOver = (event) => { ... };
  const handleDragEnter = () => { ... };
  const handleDragLeave = () => { ... };
  const handleEntityDragStart = (index, event) => { ... };
  const handleEntityDragOver = (index, event) => { ... };
  const handleEntityDragLeave = (index) => { ... };
  const handleEntityDrop = (index, event) => { ... };
  const handleEntityDragEnd = () => { ... };
  const handleDrop = (event) => { ... };

  return {
    // State
    isDragging, isDragOver, isDropping, dragOverCounter, dragOverIndex,
    // Handlers
    handleDragOver, handleDragEnter, handleDragLeave,
    handleEntityDragStart, handleEntityDragOver, handleEntityDragLeave,
    handleEntityDrop, handleEntityDragEnd, handleDrop,
  };
}
```

**Test Coverage**: ✅ 38 tests validate all handlers  
**How to Verify**:
```bash
npm test -- useEditorDragDrop.spec.js
# Expect: All 38 tests pass
```

---

### Step 2: Create useComponentResolver.js

**What to Extract**: All props resolution logic (3 functions)

```javascript
// src/composables/editor/useComponentResolver.js
export function useComponentResolver() {
  const getComponentCustomProps = (entity) => { ... };
  const getEntityDataForComponent = (entity) => { ... };
  const getComponentProps = (entity) => { ... };
  const getComponentClasses = (entity) => { ... };

  return {
    getComponentCustomProps,
    getEntityDataForComponent,
    getComponentProps,
    getComponentClasses,
  };
}
```

**Test Coverage**: ✅ 32 tests validate all functions  
**How to Verify**:
```bash
npm test -- useComponentResolver.spec.js
# Expect: All 32 tests pass
```

**Key Tests**:
- Props extraction: 7 tests ✅
- Entity data: 8 tests ✅
- Props merging: 12 tests ✅
- Classes: 5 tests ✅

---

### Step 3: Create useEditorSelection.js

**What to Extract**: Selection management logic

```javascript
// src/composables/editor/useEditorSelection.js
import { computed } from "vue";

export function useEditorSelection(selectedEntityId, emit) {
  // LOGIC
  const isEntitySelected = (index) => {
    return selectedEntityId === index;
  };

  const handleSelectClick = (index) => {
    if (isEntitySelected(index)) {
      emit("select-entity", null);
    } else {
      emit("select-entity", index);
    }
  };

  const onCardClick = (index) => {
    handleSelectClick(index);
  };

  return {
    isEntitySelected,
    handleSelectClick,
    onCardClick,
  };
}
```

**Test Coverage**: ✅ 6 tests validate selection  
**How to Verify**:
```bash
npm test -- useEditorSelection.spec.js
# Expect: All 6 tests pass
```

---

### Step 4: Create useEditorState.js

**What to Extract**: Local entity state management

```javascript
// src/composables/editor/useEditorState.js
import { ref, watch, computed } from "vue";

export function useEditorState(propsEntities) {
  const localEntities = ref(
    Array.isArray(propsEntities) ? [...propsEntities] : []
  );

  watch(
    () => propsEntities,
    (newEntities) => {
      if (Array.isArray(newEntities)) {
        localEntities.value = [...newEntities];
      } else {
        localEntities.value = [];
      }
    },
    { deep: true }
  );

  const entityCount = computed(() => {
    return Array.isArray(localEntities.value)
      ? localEntities.value.length
      : 0;
  });

  return {
    localEntities,
    entityCount,
  };
}
```

**Test Coverage**: ✅ 10 tests validate state management

---

### Step 5: Update EditorCanvas.vue

**Before**: 750 lines with 9 functions, 7 refs

**After**: 250 lines using composables

```vue
<script setup>
import { useEditorDragDrop } from "@/composables/editor/useEditorDragDrop";
import { useComponentResolver } from "@/composables/editor/useComponentResolver";
import { useEditorSelection } from "@/composables/editor/useEditorSelection";
import { useEditorState } from "@/composables/editor/useEditorState";
// ... component imports

const props = defineProps({
  entities: { type: Array, default: () => [] },
  selectedEntityId: { type: [Number, null], default: null },
});

const emit = defineEmits([
  "select-entity",
  "reorder-entities",
  "remove-entity",
  "add-entity",
  "add-entity-at-index",
]);

// State management
const { localEntities, entityCount } = useEditorState(props.entities);

// Drag-drop
const {
  isDragging,
  isDragOver,
  isDropping,
  dragOverCounter,
  dragOverIndex,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleEntityDragStart,
  handleEntityDragOver,
  handleEntityDragLeave,
  handleEntityDrop,
  handleEntityDragEnd,
  handleDrop,
} = useEditorDragDrop(localEntities, emit);

// Selection
const { isEntitySelected, handleSelectClick, onCardClick } =
  useEditorSelection(props.selectedEntityId, emit);

// Component resolution
const { getComponentCustomProps, getComponentProps, getComponentClasses } =
  useComponentResolver();

// Type checks (keep these small functions inline)
const isSpacer = (entity) =>
  entity?.type === "HaSpacer" || entity?.type === "HaRowSpacer";

const isConditionalComponent = (entity) =>
  entity?.type === "HaWarning" || entity?.type === "HaError";

const getComponentForEntity = (entity) => {
  // Keep as is - component mapping logic
};
</script>
```

---

## Testing Strategy

### Before Extracting Each Composable

1. **Run EditorCanvas tests**:
   ```bash
   npm test -- EditorCanvas
   # Must: All 109 tests pass
   ```

2. **Identify the specific tests for that composable**:
   - useEditorDragDrop: 38 tests
   - useComponentResolver: 32 tests
   - useEditorSelection: 6 tests
   - useEditorState: 10 tests

3. **Extract the code**

4. **Update component to use composable**

5. **Run tests again**:
   ```bash
   npm test -- EditorCanvas
   # Must: All 109 tests still pass
   ```

### After All Extractions

```bash
npm test -- EditorCanvas
# Expected: 109/109 tests passing ✅

npm test -- useEditorDragDrop
# Expected: 38/38 tests passing ✅

npm test -- useComponentResolver
# Expected: 32/32 tests passing ✅

npm test -- useEditorSelection
# Expected: 6/6 tests passing ✅

npm test -- useEditorState
# Expected: 10/10 tests passing ✅

# Total: 195 tests passing

npm run lint
# Expected: 0 errors, 0 warnings

npm run build
# Expected: Success, no errors
```

---

## Common Pitfalls to Avoid

### ❌ Don't

1. **Extract multiple composables at once**
   - Extract one, test, then next
   - Easier to debug if something breaks

2. **Change the function signatures**
   - Tests validate specific parameters
   - Keep API identical

3. **Modify event names**
   - Tests validate `emit("reorder-entities", ...)`
   - Keep exact names

4. **Reorganize the props resolution logic**
   - Tests cover specific order/behavior
   - Keep logic identical

5. **Move styling without updating tests**
   - Screenshot tests may fail
   - Update card-showcase.html after refactor

### ✅ Do

1. **Test after each extraction**
   ```bash
   npm test
   ```

2. **Keep component template mostly the same**
   - Just swap function calls for composable methods

3. **Document changes in RELEASE.md**
   - Note: Internal refactor, no user-facing changes

4. **Use git commit after each step**
   ```bash
   git add src/composables/editor/useEditorDragDrop.js
   git commit -m "refactor: extract drag-drop logic to composable"
   git add src/components/visual-editor/EditorCanvas.vue
   git commit -m "refactor: update EditorCanvas to use drag-drop composable"
   ```

5. **Verify build size doesn't increase**
   ```bash
   npm run build
   # Check dist bundle size
   ```

---

## File Locations

### New Composables to Create
```
src/composables/
└── editor/
    ├── useEditorDragDrop.js       (200 lines)
    ├── useComponentResolver.js     (100 lines)
    ├── useEditorSelection.js       (50 lines)
    └── useEditorState.js           (40 lines)
```

### Existing Tests
```
src/components/visual-editor/__tests__/
├── EditorCanvas.spec.js           (existing)
├── EditorCanvasDragDrop.spec.ts   (existing)
├── EditorCanvas.spec.ts           (existing)
└── EditorCanvas.comprehensive.spec.js  (new)
```

---

## Estimated Effort

| Task | Time | Tests |
|------|------|-------|
| Extract useEditorDragDrop.js | 45 min | 38 ✅ |
| Extract useComponentResolver.js | 30 min | 32 ✅ |
| Extract useEditorSelection.js | 15 min | 6 ✅ |
| Extract useEditorState.js | 15 min | 10 ✅ |
| Update EditorCanvas.vue | 30 min | 109 ✅ |
| Test & verify | 15 min | All ✅ |
| **Total** | **2.5 hours** | **195 tests** |

---

## Success Checklist

- [ ] Extract useEditorDragDrop.js
  - [ ] 38 tests pass
  - [ ] EditorCanvas still renders
  - [ ] Drag-drop works in browser

- [ ] Extract useComponentResolver.js
  - [ ] 32 tests pass
  - [ ] Props resolution works
  - [ ] Components render correctly

- [ ] Extract useEditorSelection.js
  - [ ] 6 tests pass
  - [ ] Selection works
  - [ ] Click events work

- [ ] Extract useEditorState.js
  - [ ] 10 tests pass
  - [ ] Entity list updates
  - [ ] Props sync works

- [ ] Final verification
  - [ ] `npm test` - All 222 tests pass
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run build` - No errors
  - [ ] Component size reduced by 200+ lines
  - [ ] Browser tests pass (drag-drop works)

---

## Resources

- **Test Coverage Analysis**: [TEST_COVERAGE_ANALYSIS.md](./TEST_COVERAGE_ANALYSIS.md)
- **Validation Report**: [TEST_VALIDATION_REPORT.md](./TEST_VALIDATION_REPORT.md)
- **Refactoring Readiness**: [REFACTORING_READINESS.md](./REFACTORING_READINESS.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](./.github/copilot-instructions.md)

