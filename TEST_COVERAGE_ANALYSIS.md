# EditorCanvas.vue - Test Coverage Analysis

**Last Updated**: March 22, 2026  
**Current Status**: ✅ All 149 tests passing

---

## 1. Existing Test Coverage (✅ Covered)

### A. Component Type Auto-Detection (EditorCanvas.spec.js)
- ✅ Empty state rendering
- ✅ Auto-detection for: Light, Switch, Sensor, Binary Sensor, Weather, Select, Button, Person, Camera
- ✅ Explicit type override
- ✅ Spacer & Header components without entities
- ✅ Multiple entities with mixed auto-detection
- ✅ Default fallback (HaSensor)

**Files**: 
- Test: `EditorCanvas.spec.js` (~250 lines)
- Coverage: Component mapping logic

### B. Basic Drag-Drop Functionality (EditorCanvasDragDrop.spec.ts)
- ✅ Drag state tracking (isDragging, isDragOver, isDropping)
- ✅ Entity reordering events
- ✅ Local entities synchronization with props
- ✅ Keyboard accessibility (basic)
- ✅ Visual feedback during drag
- ✅ Multiple entity reordering (5+ entities)
- ✅ Entity count preservation
- ✅ Remove entity functionality
- ✅ Selection events

**Files**:
- Test: `EditorCanvasDragDrop.spec.ts` (~180 lines)
- Coverage: Drag/drop state & reordering

### C. Basic Component Tests (EditorCanvas.spec.ts)
- ✅ Canvas rendering
- ✅ Entity card display
- ✅ Event emissions (select-entity, remove-entity)
- ✅ Entity selection highlighting

**Files**:
- Test: `EditorCanvas.spec.ts` (~100 lines)
- Coverage: Component basics

---

## 2. Test Coverage Gaps (❌ Not Covered)

### Critical Gaps (Used by refactoring)

#### A. Component Props Resolution Functions
These functions have **zero test coverage** but are central to rendering:

1. **`getComponentCustomProps(entity)`** - Extracts non-standard props
   - Not tested: Custom properties extraction
   - Not tested: HaEntityList special handling
   - Not tested: Property filtering logic
   - Not tested: Undefined/null filtering
   - Edge case: Empty objects
   - Edge case: Nested properties

2. **`getComponentProps(entity)`** - Combines entity data + custom props
   - Not tested: Property merging logic
   - Not tested: Special component handling (HaImage, HaLink, HaHeader, HaSpacer)
   - Not tested: Entity data vs custom props priority
   - Edge case: Mixed string/array entity data

3. **`getEntityDataForComponent(entity)`** - Extracts entity for component
   - Not tested: Array entity handling
   - Not tested: String entity handling  
   - Not tested: `getter` property handling
   - Not tested: Fallback for non-entity types
   - Edge case: Null/undefined entities

4. **`getComponentClasses(entity)`** - Bootstrap grid classes
   - Not tested: Class generation
   - Not tested: Layout type mapping
   - Edge case: Unknown entity types

#### B. Drag-Drop Event Handlers (Partial Coverage)

1. **`handleDragOver(event)`** - Base canvas drag
   - ⚠️ Partially tested - only state tracking
   - Not tested: Drop index calculation
   - Not tested: Empty entity list handling
   - Not tested: dataTransfer.dropEffect setting

2. **`handleEntityDragOver(index, event)`** - Entity-specific drag
   - Not tested: Midpoint calculation for insert position
   - Not tested: Before/after positioning logic
   - Edge case: First/last entities
   - Edge case: Very small entity containers

3. **`handleDragEnter()`** - Counter logic
   - Not tested: Nested drag enter behavior
   - Not tested: Counter edge cases (rapid enter/leave)

4. **`handleDragLeave()`** - Counter teardown
   - Not tested: Counter decrement logic
   - Not tested: State reset timing
   - Not tested: Edge case: counter goes negative

5. **`handleEntityDrop(index, event)`** - Main drop logic
   - ⚠️ Partially tested - basic reorder
   - Not tested: Entity from palette (add-entity-at-index)
   - Not tested: Static component drop (isStatic flag)
   - Not tested: text/plain fallback data
   - Not tested: JSON parsing error handling
   - Not tested: Invalid data formats

6. **`handleDrop(event)`** - Base canvas drop
   - Not tested: Palette entity drops
   - Not tested: text/plain fallback
   - Not tested: Error handling
   - Edge case: Empty dataTransfer

7. **`handleEntityDragStart(index, event)`** - Drag initiation
   - Not tested: dataTransfer setup
   - Not tested: JSON serialization
   - Edge case: Large entity objects

8. **`handleEntityDragEnd()`** - Drag cleanup
   - Not tested: State reset order
   - Not tested: Timing issues

9. **`handleEntityDragLeave(index)`** - Entity-specific cleanup
   - Not tested: Index boundary conditions
   - Not tested: Multiple drag leaves

#### C. Selection Logic
1. **`isEntitySelected(index)`** - Selection checking
   - Not tested: Negative indices
   - Not tested: Out of bounds indices

2. **`onCardClick(index)` / `handleSelectClick(index)`** - Selection toggling
   - Not tested: Toggle behavior (select/deselect)
   - Not tested: Event flow
   - Not tested: Null emission on deselect

3. **`isSpacer(entity)`** & **`isConditionalComponent(entity)`** - Type checks
   - Not tested: Type detection accuracy
   - Not tested: False positive cases

#### D. Props & Watchers
1. **`watch` on props.entities** - Deep sync
   - ⚠️ Partially tested
   - Not tested: Deep copy behavior
   - Not tested: Array mutations
   - Not tested: Non-array prop changes

#### E. Data Transfer & Parsing
1. **JSON parsing error cases**
   - Not tested: Malformed JSON in drop
   - Not tested: xss/injection in drop data
   - Not tested: Large payloads

2. **text/plain fallback**
   - Not tested: Actual text/plain data transfer
   - Not tested: Entity ID validation
   - Not tested: Non-entity text

#### F. Edge Cases & State Issues
- Not tested: Rapid drag/drop sequences
- Not tested: Memory leaks from event listeners
- Not tested: Component cleanup (unmount)
- Not tested: Port from template (global window listener registration)
- Not tested: dragOverCounter edge cases (negative values, stuck state)

---

## 3. Test Coverage Statistics

### Current Results
```
Test Files:    8 passed
Tests:         149 passing  
Coverage:      ~45-55% of EditorCanvas.vue logic
             (estimate based on covered vs non-covered functions)
```

### Function-by-Function Status

| Function | Coverage | Tests | Priority |
|----------|----------|-------|----------|
| getComponentForEntity | ✅ Excellent | 15+ | Core |
| getComponentCustomProps | ❌ None | 0 | **CRITICAL** |
| getComponentProps | ❌ None | 0 | **CRITICAL** |
| getEntityDataForComponent | ❌ None | 0 | **CRITICAL** |
| getComponentClasses | ❌ None | 0 | Medium |
| handleDragOver | ⚠️ Partial | 1 | **CRITICAL** |
| handleEntityDragOver | ❌ None | 0 | **CRITICAL** |
| handleDragEnter | ⚠️ Partial | 1 | High |
| handleDragLeave | ❌ None | 0 | High |
| handleEntityDrop | ⚠️ Partial | 2 | **CRITICAL** |
| handleDrop | ❌ None | 0 | **CRITICAL** |
| handleEntityDragStart | ❌ None | 0 | High |
| handleEntityDragEnd | ❌ None | 0 | High |
| handleEntityDragLeave | ❌ None | 0 | Medium |
| isEntitySelected | ❌ None | 0 | Low |
| handleSelectClick | ❌ None | 0 | Low |
| onCardClick | ❌ None | 0 | Low |
| isSpacer | ⚠️ Partial | 1 | Low |
| isConditionalComponent | ⚠️ Partial | 1 | Low |

---

## 4. Safe Refactoring Strategy

### Phase 1: Add Missing Tests (Current Phase)
**Goal**: Achieve 85%+ coverage before refactoring component structure.

#### Tests to Add (Priority Order):

1. **HIGH PRIORITY** - Props Resolution Tests
   - [ ] Test `getComponentCustomProps()` with various entity types
   - [ ] Test `getComponentProps()` merging logic
   - [ ] Test `getEntityDataForComponent()` data extraction
   - [ ] Test `getComponentClasses()` class generation

2. **HIGH PRIORITY** - Drag-Drop Event Tests
   - [ ] Test `handleDragEnter/Leave` counter logic
   - [ ] Test `handleEntityDragOver()` position calculation
   - [ ] Test `handleDrop()` from palette
   - [ ] Test `handleEntityDrop()` with static components
   - [ ] Test text/plain data fallback

3. **MEDIUM PRIORITY** - Selection & Type Tests
   - [ ] Test `handleSelectClick()` toggle behavior
   - [ ] Test `isEntitySelected()` boundary conditions
   - [ ] Test type detection functions comprehensively

4. **MEDIUM PRIORITY** - Edge Cases
   - [ ] Test rapid drag/drop sequences
   - [ ] Test error handling in JSON parsing
   - [ ] Test state reset after drag
   - [ ] Test with empty/null entities

### Phase 2: Extract Composables
Once tests reach 85%+ coverage, extract:
1. `useEditorDragDrop.js` - Full drag-drop logic
2. `useEditorSelection.js` - Selection management
3. `useComponentResolver.js` - Props resolution functions
4. `useEditorState.js` - Local entity state

### Phase 3: Refactor EditorCanvas
Use composables to reduce component from 750 → 250 lines.

### Phase 4: Verify Tests Still Pass
Re-run full test suite to ensure refactoring doesn't break behavior.

---

## 5. Testing Best Practices for Future Changes

### Before Refactoring an EditorCanvas Function
1. Write tests that cover:
   - Normal happy path
   - Edge cases (null, empty, boundary values)
   - Error conditions
   - Integration with dependent functions

### Test File Organization
- Unit tests for functions: `EditorCanvas.utils.spec.js` (functions)
- Integration tests: `EditorCanvas.spec.js` (component + functions)
- Drag-drop tests: `EditorCanvasDragDrop.spec.js` (complex scenarios)

### Mocking Strategy
- Mock `haStore` with test entity data
- Mock browser events (DragEvent) with realistic data
- Stub child components (Ha* cards)
- Use `vi.fn()` for spies on internal logic

---

## 6. Next Steps

1. ✅ Identify gaps (THIS DOCUMENT)
2. 📝 Write missing tests for critical functions
3. 🔄 Refactor & extract composables
4. ✅ Verify tests pass post-refactor
5. 📊 Measure new coverage (target: 85%+)

---

## Test Files Reference

```
src/components/visual-editor/__tests__/
├── EditorCanvas.spec.js          (~250 lines) - Component type detection
├── EditorCanvasDragDrop.spec.ts  (~180 lines) - Drag/drop + reorder
└── EditorCanvas.spec.ts          (~100 lines) - Basic rendering
```

Total test code: ~530 lines  
Total component code: ~750 lines  
Test-to-code ratio: ~0.7x (should be closer to 1.5x for complex logic)

