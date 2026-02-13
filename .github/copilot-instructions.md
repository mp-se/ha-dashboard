# GitHub Copilot Instructions

You are an expert Vue 3 and Home Assistant dashboard developer. Follow these core requirements for every code change or feature implementation.

## 1. Quality Standards & Verification
- **Unit Tests**: All changes must have unit tests covering the functionality. Aim for **minimum 80% coverage** for files under `src/`. Check the `__tests__` directory relative to the file being edited. Use Vitest and `@vue/test-utils`.
  - *Exceptions*: Currently, the following files are permitted to be below 80% but should not decrease in coverage: `haStore.js`, `PwaInstallModal.vue`, and `RawEntityView.vue`.
- **Linting**: All code must pass `npm run lint` without errors.
- **Code Formatting**: All code must comply with formatting standards (`npm run format`).
- **Build**: All changes must build successfully (`npm run build`) without errors or warnings.

## 2. UI Development Workflow (CRITICAL)
For any change that impacts UI appearance or interaction:
1. **Update card-showcase.html first**: Demonstrate the intended design in `card-showcase.html` before making code changes.
2. **Verify Appearance**: Ensure the design works across devices and themes (light/dark).
3. **Regenerate Images**: After updating the showcase, run `node capture-card-variations.js` to update documentation screenshots in the `/images` directory.

## 3. Project Architecture & Patterns
- **Directory Structure**:
  - `src/components/`: Vue card components (prefix `Ha`, e.g., `HaSensor.vue`).
  - `src/composables/`: Shared logic (e.g., `useEntityResolver.js`).
  - `src/stores/`: Pinia state management (`haStore.js`).
  - `src/utils/`: Pure utility functions.
- **Component Patterns**:
  - Use `<script setup>` with Vue 3 Composition API.
  - Components must accept an `entity` prop (String, Object, or Array) with validation.
  - Use `useEntityResolver()`, `useIconClass()`, `useIconCircleColor()`, and `useAttributeResolver()` composables.
- **Icons**: Use Material Design Icons (MDI). Home Assistant formats like `mdi:power` should be normalized using project utilities.

## 4. Coding Conventions
- **Naming**:
  - Components: `HaPascalCase.vue`
  - Composables: `usePascalCase.js`
  - Constants: `UPPER_SNAKE_CASE`
  - Functions/Properties: `camelCase`
- **Styling**: Use scoped styles (`<style scoped>`), Bootstrap classes, and shared classes from `public/styles/shared-styles.css`.

## 5. Documentation & Metadata
- **Release Notes**: Update `RELEASE.md` with a concise summary of changes.
- **Configuration**: If the change impacts user configuration, update `CONFIGURATION.md` with examples.
- **JSDoc**: Include JSDoc comments for complex logic, parameters, and return types.

## 6. Verification Steps (Instructions for AI)
Before finalizing any change, you must:
1. Ensure the code is free of syntax errors.
2. Verify that appropriate tests have been added or updated in the corresponding `__tests__` folder.
3. If tool access is available, run:
   - `npm test`
   - `npm run lint`
   - `npm run build`
