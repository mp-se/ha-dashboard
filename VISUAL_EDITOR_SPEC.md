# Visual Editor Specification

## Overview

The Visual Editor is an interactive component within the Home Assistant Dashboard that allows users to configure, edit, and manage dashboard views by selecting entities and configurable components. It provides a drag-and-drop interface with real-time inspection and editing capabilities.

## Purpose

- Enable non-technical users to build custom dashboard layouts
- Provide intuitive entity selection and component configuration
- Support drag-and-drop reordering of dashboard cards
- Manage entity-to-component mappings with attribute overrides
- Auto-detect recommended component types based on entity class

## Current Implementation Status

### ✅ Completed Features (Phases 1-3)

#### Phase 1: Core Editor UI
- **Three-panel layout**:
  - Left Panel: Entity Palette (available &discoverable entities)
  - Middle Panel: Canvas (selected view with draggable cards)
  - Right Panel: Inspector (entity configuration)
- **View Selector**: Dropdown to switch between configured views
- **Tab Navigation**: Editor vs Preview modes

#### Phase 2: Entity Management
- **Entity Palette** (Left):
  - Search and filter entities by type
  - Add/remove entities from current view
  - Visual toggle: Blue (+) for "Add to view", Green (✓) for "Remove from view"
  - Disabled state when entity already in view (old UI)
  
- **Editor Canvas** (Middle):
  - Display all entities in selected view as cards
  - Drag-and-drop reordering (via vue-draggable-next)
  - Visual selection indicator (blue border on selected)
  - Click to select, click again to deselect
  - Component type badge (Auto or explicit type)
  - Entity friendly name and ID display

- **Entity Inspector** (Right):
  - Shows when entity is selected
  - Displays entity ID read-only
  - Component type selector with recommendations
  - Entity attributes dropdown for configuration
  - Edit attribute values directly
  - Remove entity button
  - Deselect button

#### Phase 3: Component & Attribute Configuration
- **Component Type Selector**:
  - Auto-detect based on entity class
  - Recommended type highlighted
  - Full list of 27 available Ha* components
  - Updates component rendering dynamically

- **Attributes Management**:
  - Dropdown shows only unused attributes from entity
  - Auto-populate attribute values from Home Assistant state
  - Edit values as text (smart parsing for numbers, booleans, JSON)
  - Remove individual attributes
  - Type badges (str, num, bool, obj, arr) for clarity

### 🔄 Data Flow

```
Dashboard Config (JSON)
    ↓
haStore.dashboardConfig
    ↓
VisualEditorView (selectedViewName, selectedEntityId)
    ↓
    ├─ currentView (computed from store)
    ├─ currentViewEntities (view.entities array)
    ├─ availableAttributes (from entityMap in store)
    └─ selectedEntity (entity at selectedEntityId index)
    
    ├─→ EntityPalette
    │    ├─ allEntities (from store.entityMap)
    │    ├─ filteredEntities (search + type filter)
    │    └─ entitiesInView (current view entity IDs)
    │
    ├─→ EditorCanvas  
    │    ├─ localEntities (v-for, draggable)
    │    ├─ isEntitySelected(index)
    │    └─ getEntityName(entity) - friendly name resolution
    │
    └─→ EntityInspector
         ├─ entity (selected entity object)
         ├─ availableAttributes (unused attrs from store)
         └─ localAttributes (configured attrs from entity.attributes)
```

### 📋 Entity Object Structure

```javascript
{
  entity: "light.living_room",           // Entity ID (or undefined for spacers/headers)
  getter: undefined,                      // Optional: for HaEntityList
  type: "HaLight",                        // Component type (undefined = auto-detect)
  attributes: {                           // Optional: component-specific config
    brightness: 200,
    operator: ">",
    value: 15,
    message: "Too bright"
  },
  label: "Custom Label",                  // For HaHeader, HaLink, etc.
  // Any other component-specific properties...
}
```

## Architecture

### Components

1. **VisualEditorView.vue** (Main Container)
   - Manages active tab (editor vs preview)
   - Handles view selection
   - Coordinates three-panel communication
   - Debounced auto-save on config changes
   - Handles add/remove entity from palette events

2. **EditorCanvas.vue** (Middle Panel)
   - Renders entities as draggable cards
   - Handles selection/deselection via click
   - Emits selection changes to parent
   - Supports drag-and-drop reordering
   - Resolves entity friendly names from store

3. **EntityPalette.vue** (Left Panel)
   - Shows all available entities from store
   - Filters by search text and entity type
   - Toggle add/remove based on view membership
   - Emits add-entity and remove-entity events

4. **EntityInspector.vue** (Right Panel)
   - Shows selected entity details
   - Component type selector
   - Attributes dropdown with auto-population
   - Attribute value editing
   - Remove and deselect actions

### State Management

- **haStore.dashboardConfig**: Main config object from dashboard-config.json
- **VisualEditorView reactive state**:
  - `selectedViewName`: Currently selected view
  - `selectedEntityId`: Index of selected entity in current view
  - `activeTab`: 'editor' or 'preview'

### Data Persistence

- **Current**: Debounced auto-save updates store in memory (500ms delay)
- **Planned (Phase 5)**: HTTP endpoint to persist changes back to server

## Workflow

### Adding an Entity
1. User scrolls Entity Palette (left)
2. Finds entity with blue (+) button
3. Clicks to add to current view
4. Entity appears in middle panel
5. User can immediately configure in inspector (right)

### Removing an Entity
1. **Via Palette**: Click green (✓) button on entity in left panel
2. **Via Inspector**: Select entity, click Remove button on right
3. Entity removed from view instantly

### Reordering Entities
1. Click and drag entity card in middle panel
2. Visual feedback shows drag position
3. Release to drop
4. Order updates in store (saved with debounce)

### Configuring Entity
1. Click entity card in middle panel
2. Inspector appears on right
3. Change component type if needed
4. Add attributes via dropdown
5. Edit attribute values as needed
6. Changes auto-save to store

## Planned Phases

### Phase 4: Preview Tab Real-Time Sync
- **Goal**: Show live preview of dashboard while editing
- **Features**:
  - Side-by-side editor/preview
  - Real-time sync of changes
  - Responsive layout testing

### Phase 5: Persistence & Auto-Save
- **Goal**: Save configuration changes back to system
- **Features**:
  - HTTP endpoint integration
  - Save status indicator
  - Error handling and retry
  - Optional undo/redo

### Phase 6: View Management (CRUD)
- **Goal**: Create, rename, delete, reorder views
- **Features**:
  - New view dialog
  - Rename view modal
  - Delete with confirmation
  - Drag-reorder views

### Phase 7: Edge Cases & Polish
- **Goal**: Improve robustness and UX
- **Features**:
  - Bulk operations (select multiple)
  - Copy/paste entities between views
  - Entity templates/presets
  - Keyboard shortcuts
  - Undo/redo support
  - Custom CSS per entity

## Technical Details

### Key Composables Used
- `useEntityResolver()`: Resolve entity IDs to friendly names
- `useDefaultComponentType()`: Auto-detect component type
- `useHaStore()`: Access Home Assistant store

### Vue 3 Patterns
- `<script setup>` with Composition API
- Computed properties for derived state
- Watchers for side effects
- `.stop` event modifier to prevent draggable conflicts

### Known Issues & Workarounds

1. **Draggable Slot Rendering**:
   - Issue: `v-else` on custom components with slots unreliable
   - Solution: Use `v-if` instead for explicit condition checking
   
2. **Entity Selection at Index 0**:
   - Issue: Falsy check `if (!value)` fails for index 0
   - Solution: Use `if (value == null)` for null-safe comparison
   
3. **Race Condition on Mount**:
   - Issue: `onMounted` fires before config loads from store
   - Solution: Use `watch` with `immediate: true` on data dependency

4. **Map vs Object Iteration**:
   - Issue: `Object.entries()` doesn't work on Map objects
   - Solution: Use `Array.from(map.entries())`

## Testing Strategy

### Test Coverage
- **Current**: 1,922 tests across 69 test files (~98% coverage)
- **Components**:
  - EntityPalette.spec.ts: 8 tests (entity list, filtering)
  - EditorCanvas.spec.ts: 8 tests (selection, drag, removal)
  - EntityInspector.spec.ts: 12 tests (type, attributes, deselect)
  - VisualEditorView integration tests: 16 tests

### Testing Libraries
- Vitest
- @vue/test-utils
- Pinia (store mocking)

## Browser Compatibility

- Modern browsers with ES2020+ support
- Vue 3.4+
- Bootstrap 5.3.8+

## Performance Considerations

- **Deployment**: LAN-only (not exposed to internet)
- **Network**: High-speed local network expected
- **Client Processing**: Can afford to fetch more data and process client-side
- **Optimization**: Currently efficient for typical dashboard sizes (50-500 entities)

## Configuration Example

```json
{
  "app": {
    "title": "Home Assistant Dashboard",
    "developerMode": true,
    "localMode": false
  },
  "haConfig": {
    "haUrl": "https://ha.home.arpa:8123",
    "accessToken": "..."
  },
  "views": [
    {
      "name": "overview",
      "label": "Overview",
      "icon": "mdi-home-outline",
      "entities": [
        {
          "entity": "sensor.temperature",
          "type": "HaSensor"
        },
        {
          "entity": "light.living_room",
          "type": "HaLight",
          "attributes": {
            "brightness": 200
          }
        },
        {
          "type": "HaRowSpacer"
        }
      ]
    }
  ]
}
```

## Future Enhancements

1. **Batch Operations**: Select multiple entities, bulk edit/delete
2. **Templates**: Save/load entity configurations as templates
3. **Themes**: Per-entity styling options
4. **Animations**: Smooth transitions and visual feedback
5. **Keyboard Shortcuts**: Arrow keys, delete, enter to confirm
6. **Mobile Support**: Touch-friendly dragging
7. **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Known Limitations

1. **Entity Filtering**: Filter is text-based, not category-based
2. **Attribute Validation**: No schema validation, user can enter invalid values
3. **Component Discovery**: Doesn't auto-suggest components based on entity attributes
4. **View Cloning**: Can't duplicate views with existing configurations
5. **Search**: Search is case-insensitive but doesn't support regex
6. **Drag Constraints**: Can't drag between views (by design, for safety)

## Success Criteria

- ✅ Users can add/remove entities from views
- ✅ Users can reorder entities via drag-and-drop
- ✅ Users can select component types with recommendations
- ✅ Users can configure entity attributes via dropdown
- ✅ All changes auto-save to store
- ✅ No manual value entry required for attributes
- ✅ Intuitive three-panel layout
- ✅ Zero console errors
- ⏳ Persistence to server (Phase 5)
- ⏳ Real-time preview (Phase 4)
