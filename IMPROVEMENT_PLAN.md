# Improvement Plan — ha-dashboard

Based on codebase analysis performed on 22 March 2026 (v0.6.0).
Work through tasks in priority order. Mark each item `[x]` when done.

---

## Phase 1 — Critical Fixes (do these first)

- [ ] **Fix broken `dev:full` script** — `concurrently` is used in the script but not in `devDependencies`. Running `npm run dev:full` fails.
  - Run: `npm install --save-dev concurrently`

- [ ] **Remove stale duplicate `vite.config.js`** — Both `vite.config.js` and `vite.config.ts` exist. The `.js` file is a stale copy; the `.ts` file is the active one.
  - Delete: `vite.config.js`

---

## Phase 2 — Code Quality

- [ ] **Replace raw `console.log` calls with the project logger** — The project has `createLogger` in `src/utils/logger.ts` that gates `log`/`warn` to dev-only but these files bypass it:
  - `src/components/cards/HaRoom.vue` lines 111, 260 — debug logs in setup and computed
  - `src/composables/editor/useEditorDragDrop.js` line 198 — dumps full DOM event on every drop
  - `src/components/visual-editor/EntityPalette.vue` lines 135, 142 — inside a computed (fires on every reactivity update)
  - `src/components/visual-editor/PropertyEditors/ImagePicker.vue` — `console.error` in catch blocks (replace with logger for consistency)

- [ ] **Re-enable `vue/no-mutating-props` ESLint rule** — Currently disabled globally in `eslint.config.js` with no explanation. Audit any actual prop mutations and convert them to use `emit`.

- [ ] **Add TypeScript files to ESLint coverage** — The ESLint `files` glob only covers `*.{js,vue}`, not `*.ts`. TypeScript source files aren't getting Vue plugin rules applied.
  - Add `src/**/*.ts` to the ESLint files pattern.
  - Consider adding `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`.

- [ ] **Add `lang="ts"` to `App.vue`** — `src/App.vue` uses `<script setup>` without `lang="ts"`, so `vue-tsc` doesn't type-check it.

---

## Phase 3 — Test Coverage Gaps

Files with zero or near-zero coverage that need dedicated spec files:

- [ ] **`src/composables/useConditionEvaluator.js`** — 0% coverage. Used by `HaError`, `HaWarning`, and `JsonConfigView`. No spec file at all.

- [ ] **`src/components/visual-editor/PropertyEditors/ImagePicker.vue`** — 6% coverage. 490-line component handling file upload, delete, gallery, and search. Highest risk in the codebase.

- [ ] **`src/components/visual-editor/PropertyEditors/SliderInput.vue`** — 25% coverage. No spec file.

- [ ] **`src/composables/editor/useEditorDragDrop.js`** — 35% coverage. Core drag-and-drop logic. No dedicated spec.

Files with existing tests but low coverage needing improvement:

- [ ] `src/views/VisualEditorView.vue` — 45%
- [ ] `src/components/visual-editor/EditorCanvas.vue` — 49%
- [ ] `src/utils/cardPropertyMetadata.ts` — 55%
- [ ] `src/components/visual-editor/EntityInspector.vue` — 66%
- [ ] `src/components/visual-editor/EntityPalette.vue` — 68%

---

## Phase 4 — Code Duplication

- [ ] **Consolidate `formatValue` implementations** — Three separate copies exist:
  - `src/composables/useEnergyChart.ts` — exported `formatValue()`
  - `src/components/cards/HaSensorGraph.vue` — local copy
  - `src/utils/attributeFormatters.ts` — `formatAttributeValue`
  - Fix: `HaSensorGraph.vue` should import from `attributeFormatters.ts` and remove its local copy.

- [ ] **Refactor duplicated sensor search in `HaRoom.vue`** — `temperatureEntity` and `humidityEntity` computed properties have nearly identical area-entity-search logic. Extract a `findSensorByDeviceClass(deviceClass)` helper function.

---

## Phase 5 — TypeScript Migration (editor subsystem)

Convert these `.js` files to `.ts`. They are the largest untyped surface area and correspond to the lowest-coverage subsystem:

- [ ] `src/composables/useConditionEvaluator.js` (69 lines)
- [ ] `src/utils/componentLayouts.js` (207 lines)
- [ ] `src/composables/editor/useEditorSelection.js` (~100 lines)
- [ ] `src/composables/editor/useEditorState.js` (~100 lines)
- [ ] `src/composables/editor/useComponentResolver.js` (175 lines)
- [ ] `src/composables/editor/useEditorDragDrop.js` (260 lines)

---

## Phase 6 — Dependency Hygiene

- [ ] **Move `vite-plugin-pwa` to `devDependencies`** — It's a build tool incorrectly listed in `dependencies`.

- [ ] **Remove unused dev dependencies** (verify before removing):
  - `@eslint/eslintrc` — not imported in the flat config
  - `baseline-browser-mapping` — purpose unclear, not referenced in visible source

- [ ] **Add clarifying comments to server-only `dependencies`** — `express`, `cors`, `body-parser`, `multer`, `sharp`, `dotenv` are server-only but listed alongside browser deps. Consider grouping with a comment or moving to a separate `server/package.json`.

---

## Phase 7 — Release & Documentation

- [ ] **Cut v0.7.0 release** — The "Unreleased" section in `RELEASE.md` is substantial: image gallery, attribute rendering, visual editor improvements, 162 E2E tests. This is ready to be versioned.

- [ ] **Resolve `TODO.md` items with concrete reproduction steps**:
  - HaEnergy red text — investigate edge-case state triggering danger styling
  - HaImage path support — document and test both `/data/images/...` relative and `https://...` absolute URL formats

---

## Tracking

| Phase | Items | Status |
|-------|-------|--------|
| 1 — Critical Fixes | 2 | Not started |
| 2 — Code Quality | 4 | Not started |
| 3 — Test Coverage | 10 | Not started |
| 4 — Duplication | 2 | Not started |
| 5 — TS Migration | 6 | Not started |
| 6 — Dependencies | 3 | Not started |
| 7 — Release/Docs | 2 | Not started |
