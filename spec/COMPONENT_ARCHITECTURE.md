# Design System Specification

**Last Updated:** April 6, 2026  
**Scope:** Component architecture and Bootstrap integration strategy

---

## Overview

The ha-dashboard component architecture uses **dual-layer design**:

- **Bootstrap Infrastructure Layer** — Grid system, utilities, form controls, modal system
- **Custom Component Layer** — Entity-specific cards, visual editors, dashboard layout

This specification documents the architectural patterns and decision framework for when to use Bootstrap vs. creating custom components.

---

## Component Taxonomy

The dashboard contains **55 total Vue components** organized into 5 categories:

### 1. Entity Cards (26 components)

**Location:** `src/components/cards/`  
**Purpose:** Render individual Home Assistant entities with type-specific UI

**Bootstrap Usage:**

- Card container system (`.card`, `.card-body`, `.card-control`, `.card-display`, `.card-status`)
- Layout utilities (`.d-flex`, `.align-items-center`, `.justify-content-center`, `.gap-3`)
- Typography (`.card-title`, `.text-start`, `.text-center`, `.text-muted`)
- Button styling (`.btn`, `.btn-outline-primary`, `.btn-wide`)
- Form controls (`.form-range`, `.form-label`)

**Custom Styling:**

- `.color-preset-btn-icon` — Light color preset buttons
- `.gauge-display` — Gauges and meter displays
- `.chart-container` — Energy/history charts
- `.room-grid` — Multi-entity display
- Entity-specific height/width constraints

**Card Components:**

```
HaAlarmPanel       — Home security system control
HaBeerTap          — Fermentation monitoring (gravity, temperature)
HaBinarySensor     — On/off binary entity display
HaButton           — Actionable button card
HaChip             — Compact boolean entity with icon/label
HaEnergy           — Energy consumption chart
HaError            — Error state display card
HaGauge            — Circular gauge display (thermometer style)
HaGlance           — Multi-entity grid summary
HaHeader           — Section header/divider
HaImage            — Full-card image display
HaLight            — Light control (color, brightness, presets)
HaLink             — External link card
HaMediaPlayer      — Media playback controls
HaPerson           — Person presence/location card
HaPrinter          — Device status indicator
HaRoom             — Multi-entity room summary (climate, lights, etc.)
HaSensor           — Single value display (temperature, humidity, etc.)
HaSensorGraph      — Multi-sensor history chart
HaSelect           — Dropdown control for select entity
HaSpacer           — Vertical spacer/gap
HaRowSpacer        — Horizontal spacer/gap
HaSwitch           — Toggle switch control
HaSun              — Astronomy data (sunrise, sunset, UV)
HaWarning          — Warning alert display
```

**Architecture Pattern:** All cards follow the same pattern:

```vue
<div class="card card-control h-100 rounded-4 shadow-lg">
  <div class="card-body d-flex align-items-center justify-content-between">
    <!-- Entity name and value -->
    <!-- Control/status indicator -->
  </div>
</div>
```

---

### 2. Visual Editor Components (18 components)

**Location:** `src/components/visual-editor/`  
**Purpose:** Implement the drag-drop UI editor and dashboard configuration

**Key Components:**

| Component                  | Bootstrap Usage                    | Custom Classes                    | Purpose                      |
| -------------------------- | ---------------------------------- | --------------------------------- | ---------------------------- |
| **EditorCanvas**           | `.container-fluid`                 | `.editor-canvas`, `.card-outline` | Card drag-drop surface       |
| **ViewManager**            | `.list-group`, `.list-group-item`  | `.view-tabs`                      | View reordering UI           |
| **EntityInspector**        | `.form-control`, `.form-select`    | `.inspector-panel`                | Property editor for entities |
| **PropertyEditorFactory**  | `.form-label`, `.form-group`       | `.editor-field`                   | Form field wrapper           |
| **SliderInput**            | `.form-range`, `.badge`            | `.property-editor`                | Numeric slider input         |
| **TextInput**              | `.form-control`                    | `.property-editor`                | Text input field             |
| **TextAreaInput**          | `.form-control`                    | `.property-editor`                | Multiline text               |
| **SelectInput**            | `.form-select`                     | `.property-editor`                | Dropdown select              |
| **BooleanToggle**          | `.form-check`, `.form-check-input` | `.toggle-switch`                  | Boolean toggle               |
| **NumberInput**            | `.form-control`                    | `.property-editor`                | Numeric input                |
| **ColorPicker**            | `.form-control`, `.input-group`    | `.color-picker-palette`           | Color selection              |
| **IconPicker**             | Modal system                       | `.icon-search`, `.icon-grid`      | Icon browser                 |
| **ImagePicker**            | Modal system                       | `.image-preview`                  | Image uploader               |
| **EntityListEditor**       | `.list-group`, `.btn-group`        | `.entity-list-editor`             | Multi-entity management      |
| **EditorActionBar**        | `.btn-group`                       | `.floating-toolbar`               | Mobile touch toolbar         |
| **StaticComponentPalette** | `.card`, `.btn`                    | `.palette-grid`                   | Component library            |
| **EntityPalette**          | `.card`, `.list-group`             | `.entity-search`                  | Entity search/select         |
| **LeftPanelTabs**          | `.nav-tabs`, `.tab-pane`           | `.editor-panel`                   | Editor sidebar tabs          |

**Bootstrap Usage Pattern:** Property editors leverage Bootstrap forms heavily:

```html
<label class="form-label small mb-1">Entity Name</label>
<input class="form-control" type="text" />
<small class="text-muted">Help text</small>
```

---

### 3. Sub-Components (2 components)

**Location:** `src/components/sub-components/`  
**Purpose:** Reusable UI elements embedded in cards

| Component               | Purpose                                 | Bootstrap         | Custom                                     |
| ----------------------- | --------------------------------------- | ----------------- | ------------------------------------------ |
| **IconCircle**          | Circular icon container with background | `.rounded-circle` | `.ha-icon-circle`, `.ha-icon-circle-large` |
| **EntityAttributeList** | Key-value attribute display             | `.list-unstyled`  | `.attribute-item`                          |

---

### 4. Page Components (8 components)

**Location:** `src/components/page-components/`  
**Purpose:** Top-level layout and page-level UI

| Component              | Purpose                         | Bootstrap                          | Custom                     |
| ---------------------- | ------------------------------- | ---------------------------------- | -------------------------- |
| **AppNavbar**          | Dashboard navigation header     | `.navbar`, `.nav`, `.nav-item`     | `.app-logo`, `.breadcrumb` |
| **EditorNavbar**       | Visual editor navigation        | `.navbar`, `.btn-group`            | `.editor-breadcrumb`       |
| **PwaInstallModal**    | PWA installation prompt         | `.modal`, `.modal-dialog`          | `.pwa-prompt-card`         |
| **RawEntityView**      | Entity raw JSON display         | `.container`, `.pre`               | `.json-viewer`             |
| **CredentialDialog**   | Auth credential input           | `.modal`, `.form-control`          | `.credential-form`         |
| **ErrorBanner**        | Network/error alerts            | `.alert`, `.alert-warning`         | `.error-banner-container`  |
| **EditorToggleButton** | Dev mode toggle & editor access | `.btn`, `.btn-outline-secondary`   | `.editor-toggle`           |
| **ViewLayout**         | Dashboard view layout           | `.container-fluid`, `.row`, `.col` | `.view-container`          |

**Architecture Pattern:** Page components wrap Bootstrap containers and custom layouts:

```vue
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <!-- Standard navbar structure -->
</nav>
```

---

### 5. Containers (1 component)

**Location:** `src/components/containers/`  
**Purpose:** Layout and content organization

| Component      | Purpose                | Bootstrap                                        |
| -------------- | ---------------------- | ------------------------------------------------ |
| **EntityList** | Scrollable entity list | `.list-group`, `.list-group-item`, `.scrollable` |

---

## Decision Framework: Bootstrap vs. Custom

### When to Use Bootstrap Components

**Use Bootstrap Classes for:**

1. **Layout & Grid** — Always
   - Grid system: `.row`, `.col-*`, `.col-lg-*`, `.col-md-*`
   - When: Responsive layouts, card grids, viewports
   - Alternative: Never (Bootstrap grid is standard)

   ```html
   <div class="row">
     <div class="col-lg-4 col-md-6">Card 1</div>
     <div class="col-lg-4 col-md-6">Card 2</div>
   </div>
   ```

2. **Flexbox/Spacing Utilities** — Always
   - Utilities: `.d-flex`, `.gap-3`, `.align-items-center`, `.justify-content-between`
   - Padding: `.p-3`, `.pt-2`, `.px-4`
   - Margin: `.mb-3`, `.mt-2`, `.m-0`
   - When: Quick layout fixes, spacing adjustments
   - Alternative: Never use custom CSS for basic spacing

   ```html
   <div class="d-flex gap-2 align-items-center justify-content-between">
     <span>Label</span>
     <button>Action</button>
   </div>
   ```

3. **Form Controls** — Always (for standard forms)
   - Classes: `.form-control`, `.form-select`, `.form-range`, `.form-check`, `.form-label`
   - When: Editor property panels, credential dialogs
   - Alternative: Create custom only for complex inputs (ColorPicker, ImagePicker)

   ```html
   <label class="form-label small mb-1">Entity</label>
   <select class="form-select">
     <option>Home Assistant entities</option>
   </select>
   ```

4. **Modal Dialogs** — Always
   - Classes: `.modal`, `.modal-dialog`, `.modal-content`, `.modal-body`, `.modal-header`
   - When: Confirmation dialogs, settings, image picker
   - Alternative: Never create custom modals

   ```html
   <div class="modal fade show d-block">
     <div class="modal-dialog modal-dialog-centered">
       <!-- Content -->
     </div>
   </div>
   ```

5. **Typography** — Always (for standard text)
   - Classes: `.h1`-`.h6` (headings), `.card-title`, `.text-muted`, `.text-start`
   - When: Labels, value displays, help text
   - Alternative: Custom classes for special styling needs

   ```html
   <h6 class="card-title mb-0">{{ entityName }}</h6>
   <small class="text-muted">Optional helper text</small>
   ```

6. **Button Styling** — Usually
   - Classes: `.btn`, `.btn-outline-primary`, `.btn-sm`, `.btn-wide`
   - When: Standard actionable buttons, icon buttons
   - Alternative: Custom styling for gradient buttons or special effects

   ```html
   <button class="btn btn-outline-primary btn-sm">
     <i class="mdi mdi-play"></i> Start
   </button>
   ```

7. **Color & Background Utilities** — Usually
   - Classes: `.bg-primary`, `.text-danger`, `.border-warning`
   - When: Status indicators, alert backgrounds
   - Alternative: Custom when entity-specific colors are needed (e.g., light colors)

   ```html
   <div class="alert alert-warning">Warning message</div>
   ```

### When to Create Custom Components

**Create Custom Styling/Components for:**

1. **Entity-Specific Visualizations**
   - **Cards:** `.card-control`, `.card-display`, `.card-status` variants
   - **Purpose:** Different card types have different interaction patterns
   - **Example:** HaLight needs color preview, HaGauge needs arc visualization
   - **File:** In component's `<style scoped>`, or in `shared-styles.css`

   ```vue
   <style scoped>
   .light-color-preview {
     width: 40px;
     height: 40px;
     border-radius: 50%;
     background: linear-gradient(/* entity color */);
   }
   </style>
   ```

2. **Complex Data Visualizations**
   - **Components:** Energy charts, graphs, gauges
   - **Purpose:** Canvas/SVG rendering not provided by Bootstrap
   - **Example:** HaSensorGraph uses Chart.js, HaGauge draws SVG arcs
   - **File:** Component-specific or chart library integration

   ```vue
   <!-- Use external charting library -->
   <vue-chartjs ref="chart" :chart-data="chartData" />
   ```

3. **Custom Interactive Patterns**
   - **Components:** Color picker, icon search, image preview
   - **Purpose:** Multi-step workflows Bootstrap forms can't express
   - **Example:** Drag-drop palette, multi-entity list reordering
   - **File:** Named component in `visual-editor/PropertyEditors/`

   ```vue
   <!-- Custom color palette with entity-specific colors -->
   <div class="color-picker-palette">
     <button
       v-for="preset in lightPresets"
       class="preset-btn-icon"
       @click="selectColor(preset)"
     />
   </div>
   ```

4. **Dark Mode Customization**
   - **When:** Bootstrap's default dark mode colors don't fit entity styling
   - **Method:** Use `[data-bs-theme="dark"]` selector wrapping
   - **File:** `shared-styles.css` with theme-specific rules

   ```css
   [data-bs-theme="dark"] .card-control {
     border-color: rgba(0, 123, 255, 0.5); /* Brighter for dark mode */
   }
   ```

5. **Non-Standard Animations/Effects**
   - **When:** Bootstrap transitions (0.15s ease-in-out) don't match design
   - **Method:** Custom `@keyframes` in component scope or shared-styles.css
   - **Example:** Hover lift effects, color fade transitions

   ```css
   @keyframes card-lift {
     from {
       transform: translateY(0);
       box-shadow: var(--ha-shadow-sm);
     }
     to {
       transform: translateY(-2px);
       box-shadow: var(--ha-shadow);
     }
   }
   ```

6. **Responsive Breakpoint Handling**
   - **When:** Standard Bootstrap breakpoints need component-specific logic
   - **Method:** Use `useIsMobile()` composable for mobile-specific UX
   - **File:** Component `<script setup>` with conditional rendering

   ```vue
   <script setup>
   import { useIsMobile } from "@/composables/useIsMobile";

   const isMobile = useIsMobile();

   // Render different UI on mobile vs desktop
   </script>

   <template>
     <div v-if="!isMobile" class="desktop-layout">
       <!-- Desktop 3-column editor -->
     </div>
     <div v-else class="mobile-layout">
       <!-- Mobile full-screen canvas -->
     </div>
   </template>
   ```

---

## Architecture Patterns

### Pattern 1: Card Wrapper with Bootstrap Layout

**Used by:** All 26 entity cards  
**Structure:**

```vue
<template>
  <div
    :class="[
      'card' /* Bootstrap card container */,
      'card-control' /* Custom variant */,
      'h-100' /* Bootstrap utility */,
      'rounded-4' /* Border radius utility */,
      'shadow-lg' /* Bootstrap shadow */,
    ]"
  >
    <div class="card-body d-flex align-items-center">
      <!-- Content: name, value, controls -->
    </div>
  </div>
</template>

<style scoped>
/* Custom styling only if entity-specific */
</style>
```

**Decision Points:**

- Use `.card-control` for interactive elements (buttons, toggles)
- Use `.card-display` for read-only info (sensors, gauges)
- Use `.card-status` for alerts/warnings
- Use custom nested `<style scoped>` for entity-specific visualizations

---

### Pattern 2: Form Editor with Bootstrap Forms

**Used by:** 15+ property editors  
**Structure:**

```vue
<template>
  <div class="property-editor">
    <label class="form-label small mb-1">{{ label }}</label>
    <input
      class="form-control"
      type="text"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <small v-if="error" class="text-danger d-block mt-1">{{ error }}</small>
  </div>
</template>

<style scoped>
.property-editor {
  /* Only if custom validation/state UI needed */
}
</style>
```

**Decision Points:**

- Always use Bootstrap `.form-*` classes for inputs
- Use custom class for grouping if editor needs special layout
- Custom styling only for error states, validation UI

---

### Pattern 3: Modal Dialog with Bootstrap Modal System

**Used by:** ImagePicker, IconPicker, PwaInstallModal  
**Structure:**

```vue
<template>
  <div v-if="isVisible" class="modal fade show d-block">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Dialog Title</h5>
          <button class="btn-close" @click="closeModal" />
        </div>
        <div class="modal-body">
          <!-- Content with custom styling as needed -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="confirm">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styling for modal content only */
</style>
```

**Decision Points:**

- Always use Bootstrap `.modal-*` structure
- Use custom classes for content inside modal body
- No custom modal logic (use Bootstrap's fade/show classes)

---

### Pattern 4: Responsive Layout with `useIsMobile` Composable

**Used by:** EditorCanvas, ViewManager, mobile-aware components  
**Structure:**

```vue
<script setup>
import { useIsMobile } from "@/composables/useIsMobile";

const isMobile = useIsMobile(); // Reactively tracks window < 768px
</script>

<template>
  <!-- Desktop layout (default) -->
  <div v-if="!isMobile" class="d-flex gap-3">
    <div class="col-3">Sidebar</div>
    <div class="col-9">Canvas</div>
  </div>

  <!-- Mobile layout -->
  <div v-else class="fullscreen-mobile">
    <div class="canvas-main">Canvas</div>
    <div class="bottom-sheet">Controls</div>
  </div>
</template>

<style scoped>
.fullscreen-mobile {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  width: 100%;
  max-height: 50vh;
}
</style>
```

**Decision Points:**

- Use `useIsMobile()` for all responsive branching logic
- Don't use Bootstrap's `.d-none .d-md-block` pattern (less readable)
- Custom styling for mobile-specific layouts (full-screen canvas, bottom sheets)

---

## Implementation Guidelines

### CSS Organization

**Levels (from general to specific):**

1. **Bootstrap Utilities** (always applied first)
   - `.d-flex`, `.gap-3`, `.p-3`, `.rounded-4`
   - No custom CSS needed

2. **Component-Scoped Styles** (component-specific customization)

   ```vue
   <style scoped>
   .my-component {
     /* Overrides if needed */
   }
   </style>
   ```

3. **Shared Custom Classes** (reused across multiple components)
   - Stored in `shared-styles.css` (colors, shadows, card variants)
   - Examples: `.card-control`, `.ha-icon-circle`, `.ha-shadow`

4. **Design Tokens** (theme-level variables)
   - See `spec/VISUAL_DESIGN_TOKENS.md`
   - CSS variables: `--bs-primary`, `--ha-shadow`, etc.

### File Organization

**Component Location Rules:**

| Type             | Location                                             | Pattern                                          |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Entity Card      | `src/components/cards/Ha*.vue`                       | Prefix `Ha` (HaSensor, HaLight)                  |
| Editor Component | `src/components/visual-editor/*.vue`                 | Full word names (EditorCanvas, ViewManager)      |
| Property Editor  | `src/components/visual-editor/PropertyEditors/*.vue` | Suffix `Input` (SliderInput, ColorPicker)        |
| Sub-Component    | `src/components/sub-components/*.vue`                | Reusable units (IconCircle, EntityAttributeList) |
| Page Component   | `src/components/page-components/*.vue`               | Full-page layouts (AppNavbar, ViewLayout)        |
| Container        | `src/components/containers/*.vue`                    | Rarely used (EntityList for list layout)         |

### Naming Conventions

**CSS Classes:**

- Bootstrap utilities: Compound format (`.d-flex`, `.align-items-center`)
- Custom classes: Kebab-case with component prefix (`.card-control`, `.ha-icon-circle`)
- Scoped styles: Simple names (`.property-editor`, `.color-palette`)

**Vue Components:**

- Cards: `Ha<EntityType>.vue` (HaSensor, HaLight, HaButton)
- Editors: `<Noun><Verb>.vue` (EditorCanvas, PropertyEditorFactory)
- Inputs: `<Type>Input.vue` (SliderInput, TextInput, ColorPicker)

### Accessibility Compliance

**All Components Must:**

- Use semantic HTML (`.btn`, `.form-control`, `<label for="">`)
- Provide ARIA labels for icon-only buttons (`aria-label="..."`)
- Use `:focus-visible` for keyboard navigation (Bootstrap applies automatically)
- Support dark mode via `[data-bs-theme="dark"]` CSS rules
- Maintain contrast ratios (4.5:1 for normal text)

**Bootstrap Ensures:**

- Focus states via `.btn:focus-visible` outline
- Form validation via `.form-control:invalid` styling
- Keyboard navigation through standard HTML elements

---

## Migration Path: Custom → Bootstrap

If a complex custom component is needed but Bootstrap can partially meet the requirement:

1. **Start with Bootstrap structure** — Use `.modal`, `.form-control`, `.btn` as base
2. **Identify gaps** — What Bootstrap doesn't provide (e.g., custom color presets)
3. **Add custom layer** — Wrap Bootstrap in a custom component with specific styling
4. **Document divergence** — Add CSS comments explaining why Bootstrap wasn't sufficient

**Example: ColorPicker**

```vue
<!-- Starts with Bootstrap form structure -->
<div class="property-editor form-group">
  <label class="form-label">Color</label>
  
  <!-- Adds custom preset buttons on top -->
  <div class="color-picker-palette">
    <button
      v-for="color in presets"
      :style="{ backgroundColor: color }"
      class="preset-btn-icon"
      @click="selectColor(color)"
    />
  </div>

<!-- Falls back to Bootstrap form control for input -->
<input type="text" class="form-control" :value="modelValue" />
```

---

## Current Component Statistics

**As of April 6, 2026:**

| Category          | Count  | Bootstrap?     | Custom?                   |
| ----------------- | ------ | -------------- | ------------------------- |
| Entity Cards      | 26     | ✅ Yes (heavy) | ✅ Yes (card variants)    |
| Editor Components | 18     | ✅ Yes (heavy) | ✅ Yes (editor UI)        |
| Sub-Components    | 2      | ✅ Minor       | ✅ Yes (icon, attributes) |
| Page Components   | 8      | ✅ Yes (heavy) | ✅ Yes (nav, layout)      |
| Containers        | 1      | ✅ Yes         | ❌ No                     |
| **TOTAL**         | **55** | **100%**       | **~70%**                  |

**Bootstrap Penetration:** 100% — All components use Bootstrap as infrastructure  
**Custom Styling Penetration:** ~70% — Custom styling used for 1-2 classes per component on average

---

## Common Pitfalls & Solutions

### Pitfall 1: Creating Custom Button When `.btn` Exists

```vue
<!-- ❌ WRONG: Custom button styling -->
<button class="custom-button">Submit</button>

<style scoped>
.custom-button {
  padding: 8px 16px;
  background: blue;
  color: white;
  border: none;
  border-radius: 4px;
}
</style>

<!-- ✅ RIGHT: Use Bootstrap -->
<button class="btn btn-primary">Submit</button>
```

### Pitfall 2: Grid Layout Without Bootstrap `.row/.col`

```vue
<!-- ❌ WRONG: Custom grid -->
<div class="custom-grid">
  <div class="card-item">Card 1</div>
  <div class="card-item">Card 2</div>
</div>

<style scoped>
.custom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
</style>

<!-- ✅ RIGHT: Use Bootstrap grid -->
<div class="row g-3">
  <div class="col-lg-4">Card 1</div>
  <div class="col-lg-4">Card 2</div>
</div>
```

### Pitfall 3: Spacing Utilities Instead of Custom CSS

```vue
<!-- ❌ WRONG: Custom spacing -->
<div class="custom-container">
  <h5>Title</h5>
  <p>Content</p>
</div>

<style scoped>
.custom-container {
  margin-bottom: 1rem;
}
</style>

<!-- ✅ RIGHT: Use Bootstrap utilities -->
<div class="mb-4">
  <h5>Title</h5>
  <p>Content</p>
</div>
```

### Pitfall 4: Dark Mode Without Theme Variables

```vue
<!-- ❌ WRONG: Hardcoded dark mode colors -->
<div class="status-card">
  Active
</div>

<style scoped>
.status-card {
  background: #f0f0f0;
}

@media (prefers-color-scheme: dark) {
  .status-card {
    background: #1a1a1a;
  }
}
</style>

<!-- ✅ RIGHT: Use Bootstrap theme system -->
<div class="card bg-light">
  Active
</div>

<!-- or for custom colors -->
<style scoped>
.status-card {
  background: var(--bs-light);
}

[data-bs-theme="dark"] .status-card {
  background: var(--bs-dark);
}
</style>
```

---

## Decision Tree: Should I Use Bootstrap?

```
Start with component requirement
│
├─ Is it a button, form field, modal, or standard element?
│  ├─ YES → Use Bootstrap (.btn, .form-control, .modal)
│  │        No custom CSS needed
│  │
│  └─ NO → Continue
│
├─ Is it layout/grid/spacing?
│  ├─ YES → Use Bootstrap (.row, .col, .d-flex, .gap-3, .p-3)
│  │        No custom CSS needed
│  │
│  └─ NO → Continue
│
├─ Is it a chart, gauge, or data visualization?
│  ├─ YES → Create custom component
│  │        Use external library (Chart.js, custom SVG)
│  │        Place in appropriate category (card or editor)
│  │
│  └─ NO → Continue
│
├─ Is it an entity-specific styling override?
│  ├─ YES → Create custom class in shared-styles.css
│  │        or component <style scoped>
│  │        Document why Bootstrap wasn't sufficient
│  │
│  └─ NO → Continue
│
└─ Is it complex interactive behavior?
   ├─ YES → Create custom component in appropriate category
   │        (visual-editor/ for editor tools)
   │        Use Bootstrap layout as foundation
   │
   └─ NO → Use Bootstrap utilities
```

---

## Future Improvements

### Potential Documentation Enhancements

- Per-component migration guide (HaSensor → Bootstrap compliance)
- Interactive component gallery (`component-showcase.html`)
- Visual coverage matrix (which Bootstrap classes used in which components)

### Potential Code Improvements

- Audit custom CSS classes for consolidation
- Reduce `.card-*` variants to Bootstrap standards (if feasible)
- Document why `.card-display` exists (vs Bootstrap default)

---

## Related Documentation

- **Design Tokens:** `spec/VISUAL_DESIGN_TOKENS.md` — CSS variables and elevation system
- **Dashboard Schema:** `spec/DASHBOARD_SCHEMA.md` — Data structure and storage
- **Visual Editor Logic:** `spec/VISUAL_EDITOR_LOGIC.md` — Editor component behavior
- **Copilot Instructions:** `.github/copilot-instructions.md` — Component patterns and requirements
