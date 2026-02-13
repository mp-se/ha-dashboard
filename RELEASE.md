# Release Notes

## Unreleased

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
