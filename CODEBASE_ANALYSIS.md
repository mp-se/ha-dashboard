# Codebase Quality & Complexity Analysis

**Generated**: March 22, 2026  
**Scope**: Vue 3 components, styling, architecture, and code organization

---

## 1. CSS Organization Issues

### 1.1 Duplicated Styling Patterns

#### Problem Areas:

The following styles are repeated across multiple components and should be moved to `shared-styles.css`:

| Style Pattern                                   | Components                                                              | Recommendation                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| **Editor panel backgrounds** (`#f8f9fa`)        | EntityInspector, EditorCanvas, EntityPalette, ViewManager               | Extract to `.editor-panel` utility class              |
| **Border styling** (`1px solid #dee2e6`)        | EntityInspector, EditorCanvas, EntityPalette, multiple property editors | Create `.border-light` utility                        |
| **Box shadows** (various)                       | EditorCanvas, EntityInspector, multiple cards                           | Use root variables `--ha-shadow`, `--ha-shadow-hover` |
| **Padding/margin patterns** (`.75rem`, `.5rem`) | Property editors, EntityListEditor                                      | Create spacing utility classes                        |
| **Property editor margins** (`0.75rem`)         | TextInput, NumberInput, SelectInput, etc.                               | Extract to `.property-editor` base class              |
| **Input styling**                               | SliderInput, EntityListEditor, and custom inputs                        | Standardize with `.form-input-editor` class           |
| **Dark mode overlays** (`rgba(0,0,0,0.x)`)      | Multiple modal backgrounds                                              | Create `.modal-overlay` class with variants           |

#### Action Items:

1. **Create editor-specific utility classes** in `shared-styles.css`:

   ```css
   /* Editor Panels */
   .editor-panel {
     background-color: #f8f9fa;
     border: 1px solid #dee2e6;
   }

   .editor-overlay {
     border: 1px solid #dee2e6;
     border-radius: 4px;
     transition: var(--ha-transition);
     cursor: move;
   }

   .editor-overlay:hover {
     box-shadow: var(--ha-shadow-hover);
   }

   /* Property Editors */
   .property-editor {
     margin-bottom: 0.75rem;
   }

   /* Drop Zone */
   .drop-zone-active {
     background-color: #e8f4f8 !important;
     border: 2px dashed #0d6efd !important;
     border-radius: 4px;
   }
   ```

2. **Remove duplicate styles from components:**
   - EditorCanvas.vue
   - EntityInspector.vue
   - EntityPalette.vue
   - ViewManager.vue
   - All PropertyEditor components (TextInput, NumberInput, SliderInput, etc.)

---

### 1.2 Component-Specific Styling (Keep Scoped)

The following styles should **remain scoped** to their components:

- **EditorCanvas.vue**: Selection highlighting, drag indicators, resize handles
- **PropertyEditors**: Component-specific validation states, custom input behaviors
- **ImagePicker.vue**: Image grid layout, preview styling
- **EntityInspector.vue**: Inspector-specific layout and hierarchy styling
- **VisualEditor components**: Editor interaction states, tool-specific UI

---

## 2. Code Complexity Analysis

### 2.1 High-Complexity Components (Refactoring Candidates)

#### EditorCanvas.vue

- **Complexity**: Very High (700+ lines)
- **Issues**:
  - Multiple responsibilities: drag-drop, selection, rendering, events
  - Deep nesting of computed properties and watches
  - Tight coupling between canvas logic and component lifecycle
- **Recommendation**:
  ```
  Break into composables:
  - useEditorDragDrop.js (drag/drop logic)
  - useEditorSelection.js (selection management)
  - useEditorEvents.js (event handling)
  - useComponentCustomProps.js (property resolution)
  ```

#### EntityInspector.vue

- **Complexity**: High (550+ lines)
- **Issues**:
  - 13 computed properties managing different aspects of entity state
  - Multiple watchers for entity/component changes
  - Mixed concerns: entity resolution, UI state, property editing
- **Recommendation**:
  ```
  Extract into composables:
  - useEntityInspectorState.js (entity selection, type management)
  - useEntityAttributes.js (attribute filtering, availability)
  - useComponentProperties.js (component type and property management)
  ```

#### ViewManager.vue

- **Complexity**: High (400+ lines)
- **Issues**:
  - Modal management mixed with view management
  - Multiple overlapping responsibilities
- **Recommendation**: Separate modal logic into dedicated composable

---

### 2.2 Composable Organization

#### Current State:

- ✅ Good separation of concerns (useEntityResolver, useIconClass, etc.)
- ❌ Some composables could be more focused
- ❌ Missing composables for editor-specific logic

#### Recommendations:

1. **Editor-focused composables** (new):

   ```
   src/composables/
   ├── editor/
   │   ├── useEditorDragDrop.js
   │   ├── useEditorSelection.js
   │   ├── useEditorState.js
   │   └── useComponentCustomProps.js
   ```

2. **Consolidate utility functions**:
   - Move `getComponentCustomProps()` from EditorCanvas to composable
   - Create `usePropertyValidation.js` for input validation

---

### 2.3 Store State Management

#### configStore.ts

- ✅ Well-structured for dashboard configuration
- ⚠️ Growing complexity with image picker integration
- **Recommendation**: Monitor growth; consider splitting into feature-specific stores if >300 methods

#### haStore.ts

- ⚠️ Currently exception to coverage requirements (allowed to be <80%)
- **Recommendation**: Document why exception exists; consider refactoring in future

---

## 3. Architecture Improvements

### 3.1 Props Handling

Current: Components use mixed prop patterns (string, object, array validation)
**Recommended**: Standardize all card components to use consistent validation:

```typescript
const props = defineProps({
  entity: {
    type: [String, Object, Array],
    required: true,
    description: "Entity ID, config object, or list",
  },
  // ... other props
});
```

### 3.2 Component Organization

**Current Structure**:

```
src/components/
├── HaXxx.vue (card components) ✅ Good
├── cards/ (card variants) ✅ Good
├── containers/ (layout) ✅ Good
├── page-components/ (app-level) ✅ Good
├── visual-editor/ (editor UI) ⚠️ Mixed concerns
└── sub-components/ ✅ Good
```

**Issue**: `visual-editor/` mixes UI components with business logic
**Recommendation**:

```
src/components/visual-editor/
├── components/ (UI-only)
│   ├── Canvas.vue
│   ├── Palette.vue
│   ├── Inspector.vue
│   └── Toolbar.vue
├── PropertyEditors/ ✅ (already good)
├── composables/ (editor logic)
└── utils/ (editor utilities)
```

---

## 4. Testing Coverage & Quality

### 4.1 Current State

- ✅ Good test structure with `__tests__` directories
- ✅ Vitest integration working
- ⚠️ Some complex components (EditorCanvas, EntityInspector) need more edge case coverage

### 4.2 Recommended Test Priorities

1. **CSS Refactoring Tests** (before moving styles):
   - Verify class application works after moving to global styles
   - Test dark mode variants
2. **Editor Logic Tests** (new):
   - Drag-drop scenarios
   - Selection state management
   - Property resolution edge cases

3. **Component Props Tests**:
   - Validate all prop types (string, object, array)
   - Test fallback behaviors

---

## 5. Performance Considerations

### 5.1 Potential Issues

- **EditorCanvas**: Heavy DOM with many watchers/computed properties
  - **Mitigation**: Debounce selection updates, lazy-load component previews
- **EntityInspector**: Many computed properties re-evaluating
  - **Mitigation**: Memoize expensive computations, use `v-show` vs `v-if` strategically

- **Property Editors**: Re-rendered frequently
  - **Mitigation**: Consider memoization for static components

### 5.2 Recommendations

1. Profile with Vue DevTools
2. Add performance tests for drag-drop scenarios
3. Implement virtual scrolling for large entity lists

---

## 6. Code Quality Metrics

| Metric          | Status     | Target                           |
| --------------- | ---------- | -------------------------------- |
| Test Coverage   | ~75%       | 80%+ (current exceptions noted)  |
| Linting         | ✅ Passing | ✅ Continue                      |
| Build Size      | ?          | Monitor with each major refactor |
| Component Count | 40+        | Use as baseline                  |
| Composables     | 12+        | Keep focused                     |

---

## 7. Implementation Priorities

### Phase 1: CSS Organization (Low Risk, High Impact)

1. ✅ Add editor utility classes to `shared-styles.css`
2. ✅ Update `EditorCanvas.vue`, `EntityInspector.vue`, `EntityPalette.vue`
3. ✅ Update all PropertyEditor components
4. ✅ Run tests and linting

**Estimated Effort**: 2-3 hours  
**Risk**: Low (CSS-only, visual regression potential)

### Phase 2: Editor Composable Extraction (Medium Risk, High Benefit)

1. Extract `useEditorDragDrop.js`
2. Extract `useEditorSelection.js`
3. Refactor EditorCanvas.vue to use composables
4. Add tests for extracted composables

**Estimated Effort**: 4-6 hours  
**Risk**: Medium (behavioral changes possible)

### Phase 3: Component Architecture Refactor (Higher Risk)

1. Reorganize visual-editor components
2. Further decompose EntityInspector
3. Create editor-specific utilities

**Estimated Effort**: 6-8 hours  
**Risk**: Medium-High (requires careful testing)

---

## 8. Quick Wins

✅ **Easy to implement immediately**:

1. Extract 15+ hardcoded color values to CSS variables
2. Create `.editor-panel`, `.property-editor` utility classes
3. Consolidate modal overlay styling
4. Add JSDoc comments to complex computed properties
5. Document prop validation patterns in Architecture Guide

---

## Summary

The codebase is **well-structured overall** but has:

- ✅ Good component organization and composable usage
- ✅ Solid test foundation
- ❌ CSS duplication that should be consolidated
- ❌ Some components with mixed concerns that could benefit from composable extraction
- ⚠️ Editor components need refactoring as complexity grows

**Recommended Next Steps**:

1. **Immediate**: Phase 1 CSS refactoring (quick wins)
2. **Short-term**: Extract editor composables (Phase 2)
3. **Medium-term**: Reorganize editor component structure (Phase 3)
4. **Ongoing**: Monitor performance, maintain test coverage
