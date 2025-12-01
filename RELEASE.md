# Release Notes

## December 2025 - v0.2.0

- Icon format simplification composable (`useNormalizeIcon.js`) - supports 4 icon formats
- MDI icon validation with 150+ icons and intelligent suggestions
- Complete configuration documentation for all 21 card components
- Updated HaHeader.vue, HaRoom.vue, and App.vue for icon normalization
- Enhanced configValidator with icon validation and error suggestions
- 23 tests for icon normalization
- 32 tests for icon validation
- 34 tests for config validation with icon support
- 1235 total tests passing across 44 test files

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

