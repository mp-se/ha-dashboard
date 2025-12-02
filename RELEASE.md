# Release Notes

## December 2025 - v0.2.0

- **WebSocket API Refactor**: Migrated from manual WebSocket implementation to official `home-assistant-js-websocket` library
  - Replaced manual WebSocket with library's `createConnection()` and `createLongLivedTokenAuth()` for authentication
  - Replaced REST `/api/states` endpoint with `subscribeEntities()` for real-time entity updates
  - Replaced manual registry queries with direct WebSocket commands via `connection.sendMessagePromise()`
  - Removed ~300 lines of manual WebSocket infrastructure and custom reconnection logic
  - Fixed entity loading timing to prevent "entity not found" errors at startup
  - All registry fetches verified working: areas, devices, and entities confirmed functional in production
- Icon format simplification composable (`useNormalizeIcon.js`) - supports 4 icon formats
- MDI icon validation with 150+ icons and intelligent suggestions
- Config generator in Raw Entity View automatically creates configuration with proper entity and component type mappings
- Updated HaHeader.vue, HaRoom.vue, and App.vue for icon normalization
- Enhanced configValidator with icon validation and error suggestions
- Views can now be hidden using `hidden: true` attribute - hidden views don't appear in navigation but can be accessed programmatically
- Credentials dialog only appears when config is valid and credentials are needed
- Fixed error handling in App.vue to check config validity before prompting for credentials
- HaSelect redesigned with Bootstrap button group instead of dropdown for better mobile UX
  - Button group uses primary/outline-primary styling for selected/unselected states
  - Button group wraps automatically on small screens for responsive display
- HaButton layout updated - name on left, button on right (matching HaSensor layout)
  - HaButton now has wider button (2x width) for better interaction area
- HaMediaPlayer reorganized layout to match consistent card design - name on left, icon on right in first row
  - HaMediaPlayer now displays media info (title/artist) compactly below header instead of centered
  - HaMediaPlayer reorganized controls into horizontal flexbox with volume slider below
- HaWarning and HaError cards now use icon circles instead of badges for consistent styling with other cards
- HaRoom cards limited to 3 control entities maximum for better layout
- HaRoom now accepts both string and array formats for entity prop (strings automatically converted to arrays)
- Fan support in HaRoom cards with blue color (#007bff) and fan icon
- device_tracker entities now map to HaSensor instead of HaPerson for proper type handling
- HaSensor device name display removed when `attributes` prop is not defined - now only shows entity friendly name
- Removed HaSensorSlim component (served no distinct purpose, use HaSensor instead)
- JSON error parser integration with `json-parse-even-better-errors` library providing line/column context for malformed JSON
- HaRowSpacer component now recognized by the parser and configuration validator
- HaRowSpacer component registered globally for use in dashboard views
- HaRowSpacer component uses col-12 class to properly span full row width
- Added special handling for components without entities (HaRowSpacer, HaSpacer, HaLink) in JsonConfigView
- ESLint fixes: Removed 40+ unused variables and imports across component files
- Fixed duplicate conditional branches in haStore.js entity registry logic
- Removed unreachable helper function `fetchEntitiesWithDeviceId` from haStore
- Updated HaSun tests to verify available properties instead of removed computed properties
- Updated HaWarning and HaError tests to verify icon circles instead of badges
- Updated HaSelect tests to verify button group instead of select element
- Added new test in HaSun for sunrise/sunset time display
- Updated haStore tests to mock `home-assistant-js-websocket` library methods instead of manual WebSocket
- 23 tests for icon normalization
- 32 tests for icon validation
- 34 tests for config validation with icon support
- 1217 tests passing across 43 test files

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

