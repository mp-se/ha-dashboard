# Design Tokens Specification

**Last Updated:** April 6, 2026  
**Scope:** Home Assistant Dashboard visual design system

---

## Overview

The ha-dashboard design system extends Bootstrap 5.3 as the foundational infrastructure layer while introducing a custom overlay of design tokens optimized for Home Assistant entity visualization. This specification documents the rationale behind key design decisions and their implementation.

---

## Card Design System

### Rationale: Why Transparent Backgrounds?

**Historical Context:**
Home Assistant entities display diverse visual information—temperature gauges, light colors, humidity graphs, media controls. The card background must accommodate:

1. **Entity-specific color overlays** — Light entities render their current color as background
2. **Custom entity styling** — Some cards render custom gradients or patterns
3. **Adaptive theming** — Dark mode through Bootstrap's `data-bs-theme` system

**Design Decision:**

```css
.card {
  background-color: transparent !important; /* Enables entity-specific theming */
  border: 2px solid rgba(222, 226, 230, 0.6) !important;
}
```

**Implications:**

- **✅ Benefit:** Entity colors display clearly without white background interference
- **✅ Benefit:** Supports dark mode seamlessly (entity color + dark bg visible)
- **⚠️ Trade-off:** Requires explicit entity background styling to avoid text readability issues
- **⚠️ Trade-off:** Diverges from Bootstrap's white-background convention

**Comparison to Bootstrap Default:**

```css
/* Bootstrap default card */
.card {
  background-color: white; /* Opaque white */
  border: 1px solid #dee2e6; /* Subtle 1px border */
}

/* ha-dashboard custom */
.card {
  background-color: transparent; /* Allows color blending */
  border: 2px solid rgba(222, 226, 230, 0.6); /* More prominent 2px border */
}
```

### Border Weight: Why 2px?

**Rationale:**  
The 2px border provides visual **prominence and frame definition** for dense entity card layouts. Home Assistant dashboards often display 20+ cards on a single view; the heavier border helps separate card boundaries at a glance.

**Bootstrap Default:** 1px (subtle separation)  
**ha-dashboard:** 2px (hierarchical frame)

This is intentional UI depth, not Bootstrap compliance.

---

## Color Token System

### Legacy Code vs. Bootstrap Variables

**Migration Status (as of April 6, 2026):**

- ✅ **Completed:** 49 hardcoded hex colors → Bootstrap CSS variables
- ✅ **Examples:**
  - `#007bff` → `var(--bs-primary)`
  - `#28a745` → `var(--bs-success)`
  - `#dc3545` → `var(--bs-danger)`

**Benefits of CSS Variables:**

- 🎨 Automatic dark mode support via Bootstrap theme switching
- 🔄 Single-source-of-truth for theming (`.card { color: var(--bs-primary); }`)
- 📱 Supports future custom theme implementations
- ♿ Ensures WCAG contrast ratios across themes

**Card-Specific Colors:**

| Token                       | Usage                 | Bootstrap Equivalent | Value               |
| --------------------------- | --------------------- | -------------------- | ------------------- |
| `--bs-primary` (blue-500)   | Control card borders  | `#0d6efd`            | Primary interaction |
| `--bs-success` (green-500)  | Active/enabled states | `#198754`            | Positive feedback   |
| `--bs-warning` (yellow-500) | Alert/caution states  | `#ffc107`            | Non-critical alerts |
| `--bs-danger` (red-500)     | Error states          | `#dc3545`            | Critical issues     |

### Opacity and RGBA Usage

Card borders use **transparent rgba colors** to blend with underlying colors:

```css
.card {
  border: 2px solid rgba(222, 226, 230, 0.6); /* 60% opacity #dee2e6 */
}

.card-control {
  border: 2px solid rgba(0, 123, 255, 0.3); /* 30% opacity primary */
}
```

**Rationale:**

- Allows card borders to blend with dark/light themes without hard color shifts
- Reduces visual "harshness" when cards are stacked (soft separation)
- Supports dark mode: opacity makes borders visible on both light and dark backgrounds

---

## Shadow & Elevation System

### Bootstrap Box-Shadow Scale

**Implementation (as of April 6, 2026):**

```css
:root {
  --ha-shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); /* Subtle */
  --ha-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); /* Default */
  --ha-shadow-lg: 0 1rem 3rem rgba(0, 0, 0, 0.175); /* Elevated */
}
```

These values align with **Bootstrap 5.3's elevation system** to ensure consistency.

**Previous Approach (Deprecated):**

- Mixed `box-shadow` and `filter: drop-shadow()` rendering
- Caused double-shadow artifacts on some components
- Non-standard shadow values (e.g., `0 2px 4px`)

**Consolidated Approach:**

- ✅ Single `box-shadow` property (no filters)
- ✅ Three-tier elevation system (sm, default, lg)
- ✅ Aligns with Bootstrap conventions
- ✅ Prevents shadow rendering inconsistencies

---

## Focus & Keyboard Navigation

### WCAG 2.1 AA Compliance

**Standard Implementation:**

```css
button:focus-visible,
.btn:focus-visible {
  outline: 2px solid var(--bs-primary); /* Visible focus indicator */
  outline-offset: 2px; /* Space between border and outline */
}
```

**Key Decisions:**

- ✅ **2px outline width** — Meets WCAG minimum 3:1 contrast ratio
- ✅ **Outline offset** — Prevents confusion with border
- ✅ **`:focus-visible` selector** — Only shows for keyboard navigation (not mouse clicks)
- ❌ **No `-webkit-tap-highlight-color: transparent`** — Would bypass focus indicators on mobile keyboard

**Touch Device Handling:**

- `:focus-visible` suppresses focus outline for mouse/touch users
- Touch keyboard still receives focus indicator (accessibility requirement)
- No impact on gesture-based navigation

---

## Spacing Consistency

### Current State

The design system uses a **hybrid spacing scale**:

```css
Component Gap Patterns:
- Card padding: 1rem (16px) — Bootstrap standard
- Control button gap: 0.5rem (8px) — Bootstrap utility
- Icon spacing: 0.375rem (6px) — Custom for density
```

**Why Not Full Bootstrap Scale?**

- Home Assistant dashboards prioritize **information density** over Bootstrap's grid
- Mobile displays often show 4-6 cards per row; Bootstrap's spacing feels loose
- Current spacing evolved through UX testing with real entity layouts
- Changing this risks visual regression across 50+ component types

**Decision:** Keep current spacing, document as intentional deviation.

---

## Border Radius Standardization

### Bootstrap Alignment (Completed April 6, 2026)

**Standard Value:** `0.375rem` (6px)  
**Applied To:** 18+ component types

**Exceptions (Intentional):**

- Circular elements: `border-radius: 50%` (badges, avatars, icon circles)
- Fully rounded: `border-radius: 9999px` (chip-style components)

**Benefits:**

- ✅ Consistent visual "roundedness" across UI
- ✅ Aligns with Bootstrap's default border-radius
- ✅ Improves visual cohesion in dense card layouts

---

## Dark Mode Support

### Bootstrap Theme System

All design tokens automatically support dark mode through Bootstrap 5.3's CSS variable system:

```html
<!-- Light mode -->
<html data-bs-theme="light">
  <!-- Dark mode -->
  <html data-bs-theme="dark"></html>
</html>
```

**CSS Variables Affected by Theme:**

- `--bs-primary` — Adjusts for contrast in dark mode
- `--bs-secondary-color` — Switches between light/dark text
- Border colors (rgba) — Work on both light and dark backgrounds
- Shadow values — Remain consistent (opacity handles theme adaptation)

**Card Styling in Dark Mode:**

```css
[data-bs-theme="dark"] .card {
  background-color: transparent; /* Same as light mode */
  border: 2px solid rgba(222, 226, 230, 0.6); /* Adapts via opacity */
}
```

---

## Component-Specific Tokens

### Card Variants

| Class                | Usage                | Border                               | Shadow            | Background    |
| -------------------- | -------------------- | ------------------------------------ | ----------------- | ------------- |
| `.card`              | Default container    | `2px solid rgba(222, 226, 230, 0.6)` | None              | `transparent` |
| `.card-control`      | Interactive controls | `2px solid rgba(0, 123, 255, 0.3)`   | Hover elevation   | `transparent` |
| `.card-display`      | Read-only display    | `1px solid rgba(222, 226, 230, 0.4)` | Minimal           | `transparent` |
| `.card-status`       | Status alerts        | `2px solid rgba(255, 193, 7, 0.5)`   | Warning elevation | `transparent` |
| `.card-status.error` | Error states         | `2px solid rgba(220, 53, 69, 0.5)`   | Error elevation   | `transparent` |

---

## Accessibility Compliance

### Contrast Requirements

All color combinations meet **WCAG 2.1 AA** (4.5:1 ratio for normal text):

- ✅ Primary blue on white background
- ✅ Success green on white background
- ✅ Danger red on white background
- ✅ Primary blue on dark backgrounds (Bootstrap theme)

### Keyboard Navigation

- ✅ All interactive elements receive `:focus-visible` outlines
- ✅ Tab order follows DOM structure (no positive `tabindex` values)
- ✅ Focus indicators exceed 3:1 contrast requirement
- ✅ No keyboard traps; escape key closes overlays

### Screen Reader Support

- ✅ Semantic HTML: `<button>`, `<a>`, `<form>` elements
- ✅ aria-labels for icon buttons
- ✅ Proper heading hierarchy (h1 → h6, no skips)
- ✅ Hidden decorative elements marked with `aria-hidden="true"`

---

## Future Considerations

### Potential Enhancements (Not Priority)

1. **Consistent Spacing Scale** — Document all `gap`, `padding`, `margin` values in tokens
2. **Animation Tokens** — Standardize transition durations (currently 0.2-0.3s mix)
3. **Breakpoint Documentation** — Formally define responsive behavior thresholds
4. **Typography Scale** — Document font-size and line-height tokens

### Design System Maturation

This specification establishes baseline design tokens. Future iterations should:

- Monitor WCAG compliance quarterly
- Test card styling with new entity types
- Gather user feedback on visual hierarchy
- Consider third-party theme extensions

---

## Reference Implementation

### Using Design Tokens in Code

**CSS Example:**

```css
.my-component {
  color: var(--bs-primary); /* Use Bootstrap variables */
  background-color: transparent; /* Override Bootstrap default */
  border-radius: 0.375rem; /* Bootstrap standard */
  box-shadow: var(--ha-shadow); /* Bootstrap-aligned shadow */
  transition: all 0.2s ease; /* Consistent motion */
}

.my-component:hover {
  box-shadow: var(--ha-shadow-lg); /* Elevated shadow */
  border-color: var(--bs-primary); /* Darker interaction color */
}

.my-component:focus-visible {
  outline: 2px solid var(--bs-primary); /* WCAG keyboard navigation */
  outline-offset: 2px;
}
```

**Vue Component Example:**

```vue
<template>
  <div class="card card-control">
    <div class="card-body">
      <h5>Entity Name</h5>
      <p>{{ entityValue }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Card styling automatically uses design tokens from CSS variables */
</style>
```

---

## Document History

| Date       | Version | Changes                                                                                     |
| ---------- | ------- | ------------------------------------------------------------------------------------------- |
| 2026-04-06 | 1.0     | Initial specification capturing card design rationale, Bootstrap alignment, and token usage |
