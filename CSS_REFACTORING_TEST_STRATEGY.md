# CSS Refactoring Test Coverage Analysis

**Generated**: March 22, 2026  
**Status**: ⚠️ Partial Coverage - CSS Class Existence Tests Only

---

## Current Test Coverage

### CSS Classes Being Tested

✅ **Classes with existing tests**:

- `.editor-canvas` (EditorCanvas.spec.ts)
- `.entity-palette` (EntityPalette.spec.ts)
- `.entity-inspector` (EntityInspector.spec.ts)
- `.property-editor` (EntityListEditor.spec.ts)
- `.drop-zone-empty` (EntityListEditor.spec.ts)
- `.list-group`, `.list-group-item` (Bootstrap, EntityListEditor.spec.ts)
- `.text-danger` (EntityListEditor.spec.ts)

### Gap Analysis

❌ **What tests DON'T currently cover**:

- **Actual CSS property values** (colors, spacing, shadows, borders)
- **Responsive behavior** (media queries)
- **Dark mode styling** (Bootstrap theme variant)
- **Hover/focus states** (transitions, shadows)
- **Computed styles** (whether CSS is actually applied)

**Test Type**: Existence checks only (`.find()` assertions)  
**Coverage Gap**: No validation of actual visual rendering or CSS properties

---

## Strategy for CSS Refactoring Without Breaking Tests

### Phase 1: Add Computed Style Tests (BEFORE Refactoring)

Before moving CSS to global styles, add tests that verify the actual computed styles:

```javascript
// Example: EditorCanvas.spec.ts enhancement
it("should have correct background color for editor-canvas", () => {
  const element = wrapper.find(".editor-canvas").element;
  const styles = window.getComputedStyle(element);
  expect(styles.backgroundColor).toBe("rgb(248, 249, 250)"); // #f8f9fa
});

it("should have correct padding for editor-canvas", () => {
  const element = wrapper.find(".editor-canvas").element;
  const styles = window.getComputedStyle(element);
  expect(styles.padding).toContain("16px"); // 1rem
});

it("should apply drop-zone-active styles on drag over", async () => {
  const element = wrapper.find(".editor-canvas").element;
  element.classList.add("drop-zone-active");
  await wrapper.vm.$nextTick();
  const styles = window.getComputedStyle(element);
  expect(styles.backgroundColor).toBe("rgb(232, 244, 248)"); // #e8f4f8
  expect(styles.borderColor).toContain("rgb(13, 110, 253)"); // #0d6efd
});
```

### Phase 2: Create CSS Test Suite

Add a dedicated test file for shared-styles.css validation:

**File**: `src/__tests__/shared-styles.spec.js`

```javascript
import { describe, it, expect, beforeEach } from "vitest";

describe("shared-styles.css - Editor Classes", () => {
  let testElement;

  beforeEach(() => {
    testElement = document.createElement("div");
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    document.body.removeChild(testElement);
  });

  // Editor Panel Styles
  describe(".editor-panel", () => {
    it("should apply editor panel background color", () => {
      testElement.className = "editor-panel";
      const styles = window.getComputedStyle(testElement);
      expect(styles.backgroundColor).toBe("rgb(248, 249, 250)");
    });

    it("should have light border", () => {
      testElement.className = "editor-panel";
      const styles = window.getComputedStyle(testElement);
      expect(styles.borderStyle).toBe("solid");
      expect(styles.borderColor).toContain("rgb(222, 226, 230)");
    });
  });

  // Editor Overlay Styles
  describe(".editor-overlay", () => {
    it("should have correct border and transition", () => {
      testElement.className = "editor-overlay";
      const styles = window.getComputedStyle(testElement);
      expect(styles.transition).toContain("all");
      expect(styles.cursor).toBe("move");
    });

    it("should apply hover shadow", async () => {
      testElement.className = "editor-overlay";
      testElement.dispatchEvent(new Event("mouseenter"));
      // Note: CSS hover states may not apply in JSDOM - requires snapshot testing
    });
  });

  // Drop Zone Styles
  describe(".drop-zone-active", () => {
    it("should apply activation styles", () => {
      testElement.className = "drop-zone-active";
      const styles = window.getComputedStyle(testElement);
      expect(styles.backgroundColor).toBe("rgb(232, 244, 248)");
      expect(styles.borderStyle).toBe("dashed");
    });
  });

  // Property Editor Styles
  describe(".property-editor", () => {
    it("should have correct bottom margin", () => {
      testElement.className = "property-editor";
      const styles = window.getComputedStyle(testElement);
      expect(styles.marginBottom).toBe("12px"); // 0.75rem
    });
  });
});
```

### Phase 3: Snapshot Testing for Complex Styles

Add visual snapshot tests for components with complex CSS:

```javascript
// Example: EditorCanvas.spec.ts enhancement
it("should match snapshot for selected entity styling", () => {
  wrapper.vm.selectedEntityIndex = 0;
  expect(wrapper.html()).toMatchSnapshot();
});

it("should match snapshot for drop-zone-active state", async () => {
  await wrapper.find(".editor-canvas").classes("drop-zone-active");
  expect(wrapper.html()).toMatchSnapshot();
});
```

---

## Step-by-Step Refactoring Process

### Step 1: Add CSS Test Suite

```bash
npm test -- src/__tests__/shared-styles.spec.js
# All tests should PASS before refactoring
```

### Step 2: Document Baseline

```bash
npm test -- --reporter=verbose > test-baseline.txt
```

### Step 3: Move CSS to Global Styles

1. Add `.editor-panel`, `.property-editor`, `.editor-overlay`, `.drop-zone-active` to `shared-styles.css`
2. Remove duplicate styles from component scoped blocks
3. Update component templates if needed (add/remove class bindings)

### Step 4: Run Tests

```bash
npm test
# All tests should PASS
npm run lint
# No lint errors
npm run build
# No build errors
```

### Step 5: Visual Validation

1. Run the app: `npm run dev`
2. Visually inspect each editor UI
3. Test dark mode toggle
4. Test responsive behavior

### Step 6: Commit with Safety

```bash
git add -A
git commit -m "refactor(css): move editor styles to global shared-styles.css

- Extract .editor-panel, .property-editor, .editor-overlay classes
- Remove duplicate scoped styles from EditorCanvas, EntityInspector, etc.
- Add computed style tests to prevent regressions
- All existing tests pass
"
```

---

## CSS Classes to Refactor (With Test Coverage)

| Class                | Component              | Current Location | Test File                | Test Added?        |
| -------------------- | ---------------------- | ---------------- | ------------------------ | ------------------ |
| `.editor-canvas`     | EditorCanvas.vue       | Scoped           | EditorCanvas.spec.ts     | ✅ Existence       |
| `.editor-overlay`    | EditorCanvas.vue       | Scoped           | EditorCanvas.spec.ts     | ❌ Computed styles |
| `.drop-zone-active`  | EditorCanvas.vue       | Scoped           | EditorCanvas.spec.ts     | ❌ Computed styles |
| `.entity-inspector`  | EntityInspector.vue    | Scoped           | EntityInspector.spec.ts  | ✅ Existence       |
| `.inspector-section` | EntityInspector.vue    | Scoped           | EntityInspector.spec.ts  | ❌ Computed styles |
| `.property-editor`   | PropertyEditors/\*.vue | Scoped           | EntityListEditor.spec.ts | ✅ Existence       |
| `.entity-palette`    | EntityPalette.vue      | Scoped           | EntityPalette.spec.ts    | ✅ Existence       |
| `.drop-zone-empty`   | EntityListEditor.vue   | Scoped           | EntityListEditor.spec.ts | ✅ Existence       |

---

## Recommendations

### ✅ Safe to Refactor Now

- `.editor-canvas` - has existence test
- `.entity-inspector` - has existence test
- `.property-editor` - has existence test
- `.entity-palette` - has existence test
- `.drop-zone-empty` - has existence test

### ⚠️ Requires New Tests Before Refactoring

- `.editor-overlay` - needs computed style tests (hover states, shadows)
- `.drop-zone-active` - needs computed style tests (background, border)
- `.inspector-section` - needs computed style tests (padding, borders)
- `.form-control-static` - needs computed style tests

### 🔍 Testing Approach

1. **Existence Tests** (already have): Verify element exists with class
2. **Computed Style Tests** (need to add): Verify CSS properties are applied
3. **Snapshot Tests** (recommended): Capture visual state for regression detection
4. **Visual Tests** (manual): Browser inspection for colors, spacing, animations

---

## Risk Assessment

**Without Enhanced Tests**:

- 🔴 **Risk**: Scoped styles accidentally removed, breaking visual layout
- 🔴 **Detection**: Only visible during manual testing
- 🔴 **Impact**: CSS regressions might go unnoticed

**With Enhanced Tests**:

- 🟢 **Risk**: Reduced - computed style tests catch property changes
- 🟢 **Detection**: Automatic via test suite
- 🟢 **Impact**: Confident refactoring with safety net

---

## Implementation Plan

### Before Refactoring:

1. ✅ Create `/src/__tests__/shared-styles.spec.js`
2. ✅ Add 15-20 computed style tests
3. ✅ Verify all tests pass
4. ✅ Document baseline metrics

### During Refactoring:

1. Move CSS classes one component at a time
2. Run tests after each component
3. No CSS changes to component logic - only style movement

### After Refactoring:

1. All tests must pass
2. Visual inspection of all editor views
3. Dark mode validation
4. Responsive design validation

---

## Files to Create/Modify

**New Files**:

- `src/__tests__/shared-styles.spec.js` - CSS validation tests

**Modified Files**:

- `public/styles/shared-styles.css` - add editor classes
- `src/components/visual-editor/EditorCanvas.vue` - remove duplicate styles
- `src/components/visual-editor/EntityInspector.vue` - remove duplicate styles
- `src/components/visual-editor/EntityPalette.vue` - remove duplicate styles
- `src/components/visual-editor/PropertyEditors/*.vue` - remove duplicate styles

**No Changes Needed**:

- Test files (existing tests are sufficient)
- Component logic (only CSS changes)

---

## Summary

✅ **Existing Tests**: Check CSS class existence (good baseline)
❌ **Missing Tests**: Computed style validation (needed for safe refactoring)
🟡 **Recommendation**: Add computed style tests BEFORE refactoring CSS

The current test suite can detect if classes disappear, but won't catch if styles become incorrect. Adding computed style tests provides a safety net for confident CSS refactoring.
