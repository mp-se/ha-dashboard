# GitHub Copilot Instructions

You are an expert Vue 3 and Home Assistant dashboard developer. Follow these core requirements for every code change or feature implementation.

## 1. Workflow & Process

- Before writing any code, ensure you have a clear understanding of the requirements and design. If necessary, create a design mockup in `card-showcase.html` to visualize the intended UI changes.
- If the requirements are ambiguous, ask for clarification before proceeding.
- When completed the code change ensure that there are test cases that cover the new functionallity and also the edge cases
- If a change require changes to more than 3 files, consider breaking it down into smaller tasks first.
- When there is an issue start with creating the test that reproduces the issue, then implement the fix and verify that the test passes. This will ensure that the issue is properly addressed and prevent regressions in the future.

## 2. Quality Standards & Verification

- **Unit Tests**: All changes must have unit tests covering the functionality. Aim for **minimum 80% coverage** for files under `src/`. Check the `__tests__` directory relative to the file being edited. Use Vitest and `@vue/test-utils`.
  - _Exceptions_: Currently, the following files are permitted to be below 80% but should not decrease in coverage: `haStore.js`, `PwaInstallModal.vue`, and `RawEntityView.vue`.
- **Linting**: All code must pass `npm run lint` without errors.
- **Code Formatting**: All code must comply with formatting standards (`npm run format`).
- **Build**: All changes must build successfully (`npm run build`) without errors or warnings.

## 3. UI Development Workflow for UI changes (CRITICAL)

For any change that impacts UI appearance or interaction:

1. **Update card-showcase.html first**: Demonstrate the intended design in `card-showcase.html` before making code changes.
2. **Verify Appearance**: Ensure the design works across devices and themes (light/dark).
3. **Regenerate Images**: After updating the showcase, run `node capture-card-variations.js` to update documentation screenshots in the `/images` directory.

## 4. Project Architecture & Patterns

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

## 5. Coding Conventions

- **Naming**:
  - Components: `HaPascalCase.vue`
  - Composables: `usePascalCase.js`
  - Constants: `UPPER_SNAKE_CASE`
  - Functions/Properties: `camelCase`
- **Styling**: Use scoped styles (`<style scoped>`), Bootstrap classes, and shared classes from `public/styles/shared-styles.css`.

## 6. Documentation & Metadata

- **Release Notes**: Update `RELEASE.md` with a concise summary of changes and this should always be done under the "Unreleased" section at the top of the file.
- **Configuration**: If the change impacts user configuration, update `CONFIGURATION.md` with examples.
- **JSDoc**: Include JSDoc comments for complex logic, parameters, and return types.

## 7. Verification Steps (Instructions for AI)

Before finalizing any change, you must:

1. Ensure the code is free of syntax errors.
2. Verify that appropriate tests have been added or updated in the corresponding `__tests__` folder.
3. If tool access is available, run:
   - `npm test`
   - `npm run lint`
   - `npm run build`

## 8. Architecture and Coding Principles

- All CSS styles must be placed in the global shared-styles.css file.
- Each source file should have its dedicated test file in the `__tests__` directory, following the same structure as the source files.
- Deployment will be on LAN so there should not be exposure over internet. This will also mean that performance will be high when fetching data from Home Assistant, so we can afford to fetch more data and do more processing on the client side if needed. However, we should still strive for efficiency and avoid unnecessary computations or data fetching.
- The project should be designed with modularity in mind, allowing for easy maintenance and scalability.
- Follow best practices for Vue 3 development, including the use of the Composition API and `<script setup>` syntax.
- Ensure that all components are reusable and follow a consistent design pattern.
- Always update packages to avoid security vulnerabilities, but ensure that updates do not break existing functionality. Test thoroughly after any package updates.
- Use GitHub Copilot to assist with code generation, but always review and test the generated code to ensure it meets the project's standards and requirements.
