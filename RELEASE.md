# Release Notes

## Unreleased

- Fixed visual editor buttons missing in browser (desktop) view after mobile floating toolbar was introduced:
  - Restored inline "Deselect" and "Remove" buttons in `EntityInspector` for desktop; hidden on mobile where the floating toolbar handles them.
  - Restored per-entity trash button in `EntityListEditor` for multi-entity cards on desktop; hidden on mobile.

- Improved error handling when Home Assistant server is not reachable:
  - Fixed configuration dialog appearing incorrectly when config is loaded but server is unavailable.
  - Only show credential dialog when credentials are actually missing; show error banner with retry option when server connection fails.
  - Added "Retry Connection" button to error banner for server-not-found, certificate validation, and CORS errors.
  - Updated `haStore.ts` to only set `needsCredentials` flag when credentials are actually missing, not on every connection error.
  - **Fixed ErrorBanner not displaying errors set before component mount**: Added immediate watcher to catch errors that occur during initialization.

## April 2026 - v0.8.0

- Bug fixes & editor improvements:
  - `src/stores/authStore.ts`: Normalize Home Assistant URL at point-of-use (remove trailing slashes/whitespace) to prevent malformed WebSocket paths.
  - Floating toolbar: mobile-only and dialog-aware (added `isDialogOpen` in `useVisualEditorToolbar`, `ViewManager` updates it to hide toolbar when modals open).
  - Editor mobile-aware: responsive reflow and mobile interactions (reflow <768px, bottom-sheet panels, long-press to inspect, tap-to-add entities).
  - Entity palette: session-only runtime persistence via `useEntityPaletteState` (no reload/localStorage persistence).
  - Visual editor: hide `Delete` action when only one view remains to avoid deleting the last view.
- Tests & QA:
  - Added unit tests for URL normalization and visual editor behaviors; updated tests to reset runtime palette state during test runs.
  - Lint, unit tests, and production build passing.

## March 2026 - v0.7.0

- Added tests for `useConditionEvaluator` (33 tests, 0→100% coverage)
- Added tests for `SliderInput` (17 tests, ~25→100% coverage)
- Added tests for `DeveloperModeToggle` (19 tests, ~52→100% coverage)
- **Fixed Entity Attribute Rendering & Live Preview**: Resolved a critical issue where Home Assistant sensor attributes were not rendering on dashboard cards and the visual editor failed to update in real-time.
  - Corrected missing `EntityAttributeList` component imports in `HaSensor.vue`, `HaBinarySensor.vue`, and `HaSwitch.vue`.
  - Standardized attribute selection format as `string[]` in `EntityInspector.vue` to ensure data consistency.
  - Enabled recursive reactivity in `EditorCanvas.vue` by adding a serialized JSON key to the entity grid, forcing instant canvas refreshes on configuration changes.
  - Implemented validation in `useAttributeResolver.ts` to prevent "attrs is not iterable" crashes when processing malformed attribute data.
- **HaImage Gallery and Advanced Scaling**: Restored full image management capabilities.
  - Fixed `HaImage` container height issue where cards remained at fixed height or scaled incorrectly based on CSS transforms.
  - Removed `h-100` from `HaImage` card container to allow the card to correctly shrink-to-fit the visible image.
  - Updated `HaImage` to use width scaling instead of CSS `scale()` transform for better document flow and layout consistency.
  - Re-introduced `ImagePicker.vue` with a grid-based gallery, search functionality, and delete support.
  - Updated backend `app-server.js` with production-grade endpoints for listing (`GET /api/images`), uploading (`POST /api/images/upload` via `multer`), and deleting (`DELETE /api/images/:id`) images.
  - Added real-time image resizing support via the `sharp` library on the backend.
  - Moved `HaImage` from the Entity Inspector dropdown to the Static Component Palette for cleaner drag-and-drop organization.
  - Enabled property persistence for scale and URL within the Entity Inspector.
- **Improved Entity Inspector**: Enhanced support for static components without associated Home Assistant entities.
- **Fixed Visual Editor Drag and Drop**: Resolved issue where dragging entities or static components to the center canvas would fail in certain browsers or configurations.
  - Added fallback logic to handle entity IDs as plain text if `application/json` data is unavailable.
  - Increased `EditorCanvas` minimum height to match viewport for better drop target accessibility.
  - Improved diagnostic logging for drop events.
- **Phase 7: Comprehensive E2E Test Suite** (162 tests across 9 Playwright test files)
  - **visual-editor.spec.js** (14 tests): Editor navigation, mode switching, entity palette, view properties, save/exit functionality, responsive editing
  - **developer-mode.spec.js** (12 tests): Password protection, modal interactions, password validation, accessibility, developer tools access
  - **configuration-persistence.spec.js** (11 tests): Config loading/persistence, dark mode preservation, draft auto-save, page reload state, localStorage error handling
  - **pwa.spec.js** (18 tests): Service worker registration, offline capability, web app manifest, install prompt, offline content serving, cache management
  - **api-integration.spec.js** (23 tests): Config loading, data persistence, authentication, error handling, backup management, sync status, save queue overflow
  - **accessibility.spec.js** (27 tests): Keyboard navigation, ARIA semantics, color contrast, touch targets, responsive layout (mobile/tablet/desktop), text sizing
  - **component-rendering.spec.js** (36 tests): Component visibility, sensor/switch/button/light/media cards, weather/energy display, color schemes, interactions, error states, performance
  - Plus 2 existing E2E test files (dashboard.spec.js, components.spec.js) with 21 tests
  - **All E2E tests pass with Playwright** across 3 browsers (Chromium, Firefox, WebKit)
- **Deployment & Server Configuration**: Comprehensive documentation for backend server setup, Docker deployment, environment variables, API endpoints, password management, backup retention, and production deployment patterns
- **Backend Server API Documentation**: Complete REST API reference including `/api/health`, `/api/config` (with auth), `/api/data/local`, backup management, concurrent save queue, and error handling
- **Backend Server API**: Complete server-side config persistence with Express.js API, Bearer token authentication, timestamped backups with automatic cleanup, CORS support, and Save Queue to prevent race conditions. Includes Docker multi-stage build, Nginx reverse proxy with SSL/TLS, and `/api/health`, `/api/config`, `/api/data/local` endpoints
- **Developer Mode Protection**: Password-protected dashboard editor with DeveloperModeToggle component modal, persistent secure password storage in app config, and authentication middleware on all config modification endpoints
- **Backend Unit Tests**: 17 comprehensive test cases for app-server.js covering: configuration loading, authentication, API endpoints, file operations, backup management, CORS headers, error handling, and concurrent save operations. All tests passing with 100% success rate
- **Visual Editor**: Complete drag-and-drop dashboard editor with three-panel layout (entity palette, canvas, inspector), view management (create/edit/delete), drag-reorder entities, component type selection, and attribute configuration. Features icon picker in modals, HaGlance/HaRoom entity rules, comprehensive property editor system, and **resizable panels with draggable dividers** (widths persisted in localStorage for user preference)
- Test Coverage: 2347 tests passing
- **Code quality improvements**:
  - Added `concurrently` dev dependency; fixed broken `dev:full` npm script
  - Removed stale duplicate `vite.config.js`
  - Replaced raw `console.log/warn` calls in `HaRoom`, `EntityPalette`, `useEditorDragDrop`, and `ImagePicker` with project logger
  - Re-enabled `vue/no-mutating-props` ESLint rule
  - Added TypeScript linting via `@typescript-eslint/parser`; fixed all resulting unused import warnings
  - Added `lang="ts"` to `App.vue` for correct `vue-tsc` type-checking
  - Moved `vite-plugin-pwa` from `dependencies` to `devDependencies`
  - Extracted `findSensorByDeviceClass` helper in `HaRoom.vue` to remove duplicated sensor search logic
  - Corrected missing `EntityAttributeList` component imports in `HaSensor.vue`, `HaBinarySensor.vue`, and `HaSwitch.vue`.
  - Standardized attribute selection format as `string[]` in `EntityInspector.vue` to ensure data consistency.
  - Enabled recursive reactivity in `EditorCanvas.vue` by adding a serialized JSON key to the entity grid, forcing instant canvas refreshes on configuration changes.
  - Implemented validation in `useAttributeResolver.ts` to prevent "attrs is not iterable" crashes when processing malformed attribute data.
- **HaImage Gallery and Advanced Scaling**: Restored full image management capabilities.
  - Fixed `HaImage` container height issue where cards remained at fixed height or scaled incorrectly based on CSS transforms.
  - Removed `h-100` from `HaImage` card container to allow the card to correctly shrink-to-fit the visible image.
  - Updated `HaImage` to use width scaling instead of CSS `scale()` transform for better document flow and layout consistency.
  - Re-introduced `ImagePicker.vue` with a grid-based gallery, search functionality, and delete support.
  - Updated backend `app-server.js` with production-grade endpoints for listing (`GET /api/images`), uploading (`POST /api/images/upload` via `multer`), and deleting (`DELETE /api/images/:id`) images.
  - Added real-time image resizing support via the `sharp` library on the backend.
  - Moved `HaImage` from the Entity Inspector dropdown to the Static Component Palette for cleaner drag-and-drop organization.
  - Enabled property persistence for scale and URL within the Entity Inspector.
- **Improved Entity Inspector**: Enhanced support for static components without associated Home Assistant entities.
- **Fixed Visual Editor Drag and Drop**: Resolved issue where dragging entities or static components to the center canvas would fail in certain browsers or configurations.
  - Added fallback logic to handle entity IDs as plain text if `application/json` data is unavailable.
  - Increased `EditorCanvas` minimum height to match viewport for better drop target accessibility.
  - Improved diagnostic logging for drop events.
- **Phase 7: Comprehensive E2E Test Suite** (162 tests across 9 Playwright test files)
  - **visual-editor.spec.js** (14 tests): Editor navigation, mode switching, entity palette, view properties, save/exit functionality, responsive editing
  - **developer-mode.spec.js** (12 tests): Password protection, modal interactions, password validation, accessibility, developer tools access
  - **configuration-persistence.spec.js** (11 tests): Config loading/persistence, dark mode preservation, draft auto-save, page reload state, localStorage error handling
  - **pwa.spec.js** (18 tests): Service worker registration, offline capability, web app manifest, install prompt, offline content serving, cache management
  - **api-integration.spec.js** (23 tests): Config loading, data persistence, authentication, error handling, backup management, sync status, save queue overflow
  - **accessibility.spec.js** (27 tests): Keyboard navigation, ARIA semantics, color contrast, touch targets, responsive layout (mobile/tablet/desktop), text sizing
  - **component-rendering.spec.js** (36 tests): Component visibility, sensor/switch/button/light/media cards, weather/energy display, color schemes, interactions, error states, performance
  - Plus 2 existing E2E test files (dashboard.spec.js, components.spec.js) with 21 tests
  - **All E2E tests pass with Playwright** across 3 browsers (Chromium, Firefox, WebKit)
- **Deployment & Server Configuration**: Comprehensive documentation for backend server setup, Docker deployment, environment variables, API endpoints, password management, backup retention, and production deployment patterns
- **Backend Server API Documentation**: Complete REST API reference including `/api/health`, `/api/config` (with auth), `/api/data/local`, backup management, concurrent save queue, and error handling
- **Backend Server API**: Complete server-side config persistence with Express.js API, Bearer token authentication, timestamped backups with automatic cleanup, CORS support, and Save Queue to prevent race conditions. Includes Docker multi-stage build, Nginx reverse proxy with SSL/TLS, and `/api/health`, `/api/config`, `/api/data/local` endpoints
- **Developer Mode Protection**: Password-protected dashboard editor with DeveloperModeToggle component modal, persistent secure password storage in app config, and authentication middleware on all config modification endpoints
- **Backend Unit Tests**: 17 comprehensive test cases for app-server.js covering: configuration loading, authentication, API endpoints, file operations, backup management, CORS headers, error handling, and concurrent save operations. All tests passing with 100% success rate
- **Visual Editor**: Complete drag-and-drop dashboard editor with three-panel layout (entity palette, canvas, inspector), view management (create/edit/delete), drag-reorder entities, component type selection, and attribute configuration. Features icon picker in modals, HaGlance/HaRoom entity rules, comprehensive property editor system, and **resizable panels with draggable dividers** (widths persisted in localStorage for user preference)
- Test Coverage: 88.97% line coverage (2,231 tests) - exceeds 85% target

## February 2026 - v0.6.0

- Updated vite-plugin-pwa 0.19.8→1.2.0 (Vite 7 support) and added npm override for serialize-javascript ^7.0.3 to fix RCE vulnerability (GHSA-5c6j-r48x-rmvq)
- Updated to Vue 3.5.29, Vite 7.3.1, Vitest 4.0.18, Playwright 1.58.2, Prettier 3.8.1, @vue/test-utils 2.4.6
- Centralized error handling with global error/warning handlers and ErrorBoundary component
- Network timeout handling via fetchWithTimeout utility with AbortController
- Lazy-loaded dev views using defineAsyncComponent to reduce bundle size
- Store refactoring: split haStore into authStore, entitiesStore, configStore, and forecastStore
- Created constants.js with 70+ named constants; eliminated magic numbers
- Optimized entity lookups to O(1) using entityMap
- Component auto-registration via import.meta.glob
- Test coverage: 1847 tests passing at 93.42% (thresholds 92/86/93/93%)
- Added Playwright E2E infrastructure (5 browsers, 20+ tests)
- Standardized test imports to @/ alias
- Enhanced accessibility with aria-labels on icon-only buttons
- Migrated to ESLint v9 flat config; zero linting errors
- All CSS consolidated to shared-styles.css
- Enhanced nginx.conf: strict CSP (no 'unsafe-eval'), HSTS (1-year max-age), Permissions-Policy
- AES-GCM-256 encrypted credential storage via Web Crypto API
- Split AppNavbar into separate component
- Added HaIconCircle, HaEntityAttributeList, useClipboard composable
- HaEnergy shows period comparisons with trending indicators
- Fixed v-for key patterns, weather forecast compatibility, dark mode issues

## February 2026 - v0.5.0

- Updated the dashboard layout to keep the navigation menubar and status banners always visible at the top of the screen using sticky positioning
- Updated code coverage requirement to 80% with explicit exceptions for specific files
- Added automated instructions for GitHub Copilot in `.github/copilot-instructions.md` to ensure project standards are followed
- Improved test coverage for `DevicesView.vue`, `HaMediaPlayer.vue`, `HaBeerTap.vue`, and `useDefaultComponentType.js`, bringing them all above the 80% threshold
- Substantially increased coverage for `PwaInstallModal.vue` to 72%
- Fixed a bug in `useDefaultComponentType.js` regarding case-sensitive getter matching for alarm panels
- Aligned `CONTRIBUTION.md` with new automated development standards
- Consolidated attribute formatting logic into shared utilities and composables to eliminate code duplication across components
- Created `useAttributeResolver` composable to centralize attribute and sensor reference resolution
- Attribute system now supports sensor references in addition to direct entity attributes (e.g., `"attributes": ["brightness", "sensor.power"]`)
- Sensor references automatically display the sensor's friendly_name as label and include unit_of_measurement when available
- Updated HaSensor, HaBinarySensor, and HaSwitch components to use the new attribute resolver composable
- Removed duplicate `formatAttributeValue` implementations from RawEntityView and individual components
- Removed green background gradient from active switch card for consistent border-only state feedback across all cards
- Enhanced CONTRIBUTION.md with comprehensive architecture guide and AI-friendly patterns for assisted development
- Enhanced CONFIGURATION.md with detailed Attribute System Configuration documentation including sensor reference support and unit handling
- Updated contribution requirements to mandate CONFIGURATION.md updates when changes impact user setup or configuration
- Added comprehensive test suite for useAttributeResolver composable (22 tests covering direct attributes, sensor references, mixed attributes, reactivity, and edge cases)
- Updated card-showcase.html to demonstrate new HaSwitch active state styling (green border only, no background gradient) and sensor reference usage patterns
- Regenerated all 30 PNG card images from updated showcase for visual documentation consistency
- Added image generation instructions to CONTRIBUTION.md with commands for full and selective regeneration using capture-card-variations.js script
- Added code formatting requirement to contribution guidelines: `npm run format` must pass for all PRs

## December 2025 - v0.4.0

- Updated dependecies and fixed security issues
- HaMediaPlayer redesigned with compact three-row layout and Bootstrap buttons
- Media progress tracking now uses timestamp-based estimation for devices with incomplete position attributes (e.g., Sonos)
- Updated card-showcase.html to reflect new design
- HaWeather forecast section now displays for all forecast types (was hiding hourly forecasts)
- HaGlance item backdrop now transparent with subtle hover effect (removed grey background)
- HaRoom card expanded to support up to 6 control entities (previously limited to 3) with 2-column grid layout that fills right column first
- HaRoom temperature and humidity sensor detection now includes fallback search from provided entity list (not just area.entities)
- HaRoom temperature/humidity sensors automatically excluded from control objects when included in entity list
- Updated HaRoom documentation with new sensor detection behavior and examples
- HaSensorGraph visual enhancement: thicker lines with filled area below in semi-transparent colors for better data visualization
- HaSensorGraph curves now smoothed using quadratic Bézier curves for more polished appearance
- HaBinarySensor now supports optional 'attributes' prop to display custom entity attributes (matching HaSensor functionality)
- HaBinarySensor now handles multiple state types with appropriate icons and labels: open/closed, locked/unlocked, detected, armed/disarmed, triggered
- Fixed iOS dark mode button focus issue - buttons no longer display as white rectangles when tapped in dark mode
- Dark mode preference now persists across page reloads and browser sessions using localStorage
- App now respects system dark mode preference (prefers-color-scheme) on first visit if no saved preference exists

## December 2025 - v0.3.0

- Consolidated duplicate CSS styles into shared classes (`.ha-entity-name`, `.ha-entity-value`, `.ha-entity-unit`, `.ha-attribute-key`, `.ha-attribute-value`) in App.vue, unified icon circle styling across components, removed redundant rules, and ensured consistent light/dark theme support for improved maintainability.
- Linked card-showcase.html to shared-styles.css so the showcase now uses the same styles as the Vue project
- Update style on a few sensors for consistent design
- Updated generated images to match the current desing as good as possible.
- HaGlance card now uses responsive grid layout - automatically adjusts columns based on entity count (1 entity = 1 column, 2-3 entities = equal width fill, 4+ entities = 4 columns)
- Added per-entity config JSON generation buttons in RawEntityView for supported entity types (copy entity JSON and generate dashboard config JSON)
- Removed 'attributes' prop from HaMediaPlayer, HaSun, HaAlarmPanel, HaButton, HaSelect, HaSwitch, HaSpacer, and HaBeerTap components to ensure generated configs only include valid props
- Updated configValidator.js to include 'attributes' as optional prop for HaGauge
- Removed tests related to the 'attributes' prop in component test files for components that don't support it
- Updated CONFIGURATION.md documentation to remove 'attributes' property descriptions for affected components
- Modified RawEntityView to hide config JSON generation button for unsupported entity types

## December 2025 - v0.2.0

- New energy consumption analytics card with interactive bar chart. Auto-detects energy/power sensors (zero-config)
- Migrated from manual WebSocket implementation to official `home-assistant-js-websocket` library
- Icon format simplification composable (`useNormalizeIcon.js`) - supports 4 icon formats
- MDI icon validation with 150+ icons and intelligent suggestions
- Config generator in Raw Entity View automatically creates configuration with proper entity and component type mappings
- Updated HaHeader.vue, HaRoom.vue, and App.vue for icon normalization
- Enhanced configValidator with icon validation and error suggestions
- Views can now be hidden using `hidden: true` attribute - hidden views don't appear in navigation but can be accessed programmatically
- Credentials dialog only appears when config is valid and credentials are needed
- Fixed error handling in App.vue to check config validity before prompting for credentials
- HaSelect redesigned with Bootstrap button group instead of dropdown for better mobile UX
- HaButton layout updated - name on left, button on right (matching HaSensor layout)
- HaMediaPlayer reorganized layout to match consistent card design - name on left, icon on right in first row
- HaMediaPlayer now displays media info (title/artist) compactly below header instead of centered
- HaWarning and HaError cards now use icon circles instead of badges for consistent styling with other cards
- HaRoom cards limited to 3 control entities maximum for better layout
- HaRoom now accepts both string and array formats for entity prop (strings automatically converted to arrays)
- Fan support in HaRoom cards with blue color (#007bff) and fan icon
- device_tracker entities now map to HaSensor instead of HaPerson for proper type handling
- HaSensor device name display removed when `attributes` prop is not defined - now only shows entity friendly name
- Removed HaSensorSlim component (served no distinct purpose, use HaSensor instead)
- JSON error parser integration with `json-parse-even-better-errors` library providing line/column context for malformed JSON
- HaRowSpacer component now recognized by the parser and configuration validator
- Added special handling for components without entities (HaRowSpacer, HaSpacer, HaLink) in JsonConfigView
- ESLint fixes: Removed 40+ unused variables and imports across component files
- Fixed duplicate conditional branches in haStore.js entity registry logic
- Removed unreachable helper function `fetchEntitiesWithDeviceId` from haStore
- Updated HaSun tests to verify available properties instead of removed computed properties
- Added new test in HaSun for sunrise/sunset time display
- Updated haStore tests to mock `home-assistant-js-websocket` library methods instead of manual WebSocket
- HaLight component refactored with interactive circular control button (dynamic color: yellow for simple, color-temp adjusted for warm/cool, actual color for RGB)
- HaSwitch component refactored with interactive circular control button (blue on-state, light gray off-state)
- Improved entity state management in haStore with in-place array updates preserving Vue reactivity
- 23 tests for icon normalization
- 32 tests for icon validation
- 34 tests for config validation with icon support
- Significantly improved test coverage for view components:
  - HaEntityList.vue: 72.07% → 90.91% statements (41 new tests)
  - DevicesView.vue: 72.07% → 83.76% statements, 50% → 100% functions (22 new tests)
  - RawEntityView.vue: 59.06% → 84.89% statements (33 new tests)
  - Views directory overall: 87.12% statements, 89.87% branches
- 96 new tests added across view components for improved reliability
- 1301 tests passing across 43 test files

## November 2025 - v0.1.0

- Initial project setup and Vue 3 dashboard foundation
- Created all 21 dashboard card components:
  - HaSensor, HaBinarySensor, HaLight, HaSwitch, HaWeather, HaSun, HaMediaPlayer
  - HaAlarmPanel, HaPrinter, HaPerson, HaChip, HaWarning, HaError, HaImage
  - HaHeader, HaGauge, HaRoom, HaEntityList, HaSelect, HaButton, HaSensorGraph
- Implemented icon class utilities for Material Design Icons support
- Created entity resolver composable for Home Assistant entity lookup
- Created service call composable for executing Home Assistant services
- Implemented configuration validator for dashboard config validation
- Added credential dialog for Home Assistant connection
- Added PWA installation support
- Created mock server for local testing
- Dashboard config examples and documentation
- 1200+ initial tests for core components
