# Release Notes

## December 2025 - v0.2.0

- Views can now be hidden using `hidden: true` attribute - hidden views don't appear in navigation but can be accessed programmatically
- HaSensor device name display removed when `attributes` prop is not defined - now only shows entity friendly name
- JSON error parser integration with `json-parse-even-better-errors` library providing line/column context for malformed JSON
- Fan support in HaRoom cards with blue color (#007bff) and fan icon
- HaRoom cards limited to 3 control entities maximum for better layout
- HaRoom now accepts both string and array formats for entity prop (strings automatically converted to arrays)
- device_tracker entities now map to HaSensor instead of HaPerson for proper type handling
- JSON syntax errors now display helpful error messages with line numbers
- Credentials dialog only appears when config is valid and credentials are needed
- Fixed error handling in App.vue to check config validity before prompting for credentials
- Icon format simplification composable (`useNormalizeIcon.js`) - supports 4 icon formats
- MDI icon validation with 150+ icons and intelligent suggestions
- Complete configuration documentation for all 21 card components
- Config generator in Raw Entity View automatically creates configuration with proper entity and component type mappings
- Updated HaHeader.vue, HaRoom.vue, and App.vue for icon normalization
- Enhanced configValidator with icon validation and error suggestions
- ESLint fixes: Removed 40+ unused variables and imports across component files
- Fixed duplicate conditional branches in haStore.js entity registry logic
- Removed unreachable helper function `fetchEntitiesWithDeviceId` from haStore
- Updated HaSun tests to verify available properties instead of removed computed properties
- Added new test in HaSun for sunrise/sunset time display
- 23 tests for icon normalization
- 32 tests for icon validation
- 34 tests for config validation with icon support
- 1240 tests passing across 44 test files

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

