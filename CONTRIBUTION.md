# Contribution Guidelines

You are welcome to make contributions to this project but for a change to be accepted it needs to follow these rules.

## Core Requirements

1. **Unit Tests**: All changes must have unit tests covering the functionality (minimum 70% coverage for files under `src/`)
2. **Linting**: All code must pass linter without errors (`npm run lint`)
3. **UI Changes**: Any change that impacts UI appearance or interaction must update [card-showcase.html](card-showcase.html) first to clearly demonstrate the intended design before code changes
4. **Design Principles**:
   - Minimalistic approach - don't ask for configuration that can be detected
   - Keep card usage as easy as possible - auto-detect whenever possible
   - Consistency across all components and cards
5. **Documentation**: Update [RELEASE.md](RELEASE.md) with a concise summary of changes
6. **Configuration Documentation**: If changes impact how users configure the dashboard, update [CONFIGURATION.md](CONFIGURATION.md) with clear examples and setup instructions
7. **Build**: All changes must build successfully without errors or warnings

## Project Architecture

### Directory Structure

```
src/
├── components/          # Vue card components (HaX.vue files)
│   └── __tests__/       # Component test files
├── composables/         # Vue 3 composables for shared logic
│   └── __tests__/       # Composable tests
├── stores/              # Pinia store for state management (haStore.js)
├── utils/               # Utility functions and helpers
│   └── __tests__/       # Utility tests
└── views/               # Dashboard view components
    └── __tests__/       # View tests

public/
├── data/                # Configuration JSON files
└── styles/              # Shared CSS styles (shared-styles.css)
```

### Component Patterns

**Card Components** (`src/components/HaX.vue`):
- Accept `entity` prop (string ID, object, or array)
- Optional `attributes` prop for displaying custom entity attributes
- Use `useEntityResolver` composable to get entity data
- Use `useIconClass` composable for icon resolution
- Use `useIconCircleColor` composable for icon background colors
- Export default Vue component with TypeScript prop validation

**Composables** (`src/composables/useX.js`):
- Pure functions that return computed properties and methods
- Use `computed()` for reactive values
- Accept entity or configuration as parameters
- Return object with reactive properties
- Include JSDoc comments with parameter and return types

**Utilities** (`src/utils/X.js`):
- Pure functions without side effects
- Export named functions (not default)
- Include comprehensive JSDoc documentation
- Include unit tests for all functions

### Component Props Pattern

```javascript
const props = defineProps({
  entity: {
    type: [Object, String, Array],
    required: true,
    validator: (value) => {
      // Validate entity format
    },
  },
  attributes: {
    type: Array,
    default: () => [],
  },
  // Custom props specific to component
});
```

### Attribute System

The new `useAttributeResolver` composable centralizes attribute resolution:
- Supports direct entity attributes (e.g., `"brightness"`)
- Supports sensor references (e.g., `"sensor.power"`)
- Automatically includes unit of measurement in displayed values
- Returns `[label, value]` tuples ready for display
- Full test coverage with 22 comprehensive tests covering all scenarios

Example usage:
```javascript
const { requestedAttributes } = useAttributeResolver(props.entity, props.attributes);
// requestedAttributes is a computed property returning [[label, value], ...]
```

### Formatting Functions

**`formatAttributeValue(value)`** - Located in `src/utils/attributeFormatters.js`
- Handles null, arrays, objects, primitives
- Returns "-" for null/undefined values
- Joins arrays with ", "
- Stringifies objects to JSON

**`formatKey(key)`** - Located in `src/utils/attributeFormatters.js`
- Converts snake_case to Title Case (e.g., "last_triggered" → "Last Triggered")
- Used for attribute label display

## Coding Conventions

### Naming Conventions

- **Components**: `Ha` prefix + PascalCase (e.g., `HaSensor.vue`, `HaSwitch.vue`)
- **Composables**: `use` prefix + PascalCase (e.g., `useEntityResolver.js`)
- **CSS Classes**: kebab-case, semantic naming (e.g., `ha-entity-name`, `card-active`)
- **Constants**: UPPER_SNAKE_CASE
- **Computed properties**: camelCase
- **Methods/Functions**: camelCase
- **Props**: camelCase

### Code Style

- Use Vue 3 Composition API with `<script setup>`
- Use `const` for variables (never `var`)
- Use template literals for strings with variables
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Keep functions small and focused
- Add JSDoc comments for complex logic

### Template Guidelines

- Use scoped styles (`<style scoped>`)
- Use Bootstrap classes for layout and styling
- Use Material Design Icons (MDI) via class names (e.g., `mdi mdi-power`)
- Use semantic HTML elements
- Add accessibility attributes (`aria-label`, `title`)
- Use v-if for conditional rendering (not v-show for one-time conditions)

### State Management

The `haStore` (Pinia store) manages:
- All entity data (`sensors` array)
- Home Assistant connection state
- Credentials and configuration
- Device and area information

**Access pattern**:
```javascript
const store = useHaStore();
const entity = store.sensors.find(s => s.entity_id === 'sensor.name');
```

**Entity object structure**:
```javascript
{
  entity_id: "sensor.temperature",
  state: "23.5",
  attributes: {
    friendly_name: "Temperature",
    unit_of_measurement: "°C",
    icon: "mdi:thermometer"
  }
}
```

### Icon Handling

Icons are handled consistently through utilities:
- **MDI Format**: `mdi:power` (from Home Assistant) → converted to `mdi mdi-power` (CSS class)
- **Use `useNormalizeIcon()`**: Standardizes icon formats
- **Use `useIconClass()`**: Gets appropriate icon for entity (domain-based fallbacks included)
- **Use `useIconCircleColor()`**: Get semantic color for icon background based on entity state

## Testing Guidelines

### Test File Structure

```javascript
describe('ComponentName.vue', () => {
  describe('Feature Area', () => {
    it('should do something specific', () => {
      const entity = { /* test data */ };
      const wrapper = mount(Component, { props: { entity }, ... });
      expect(wrapper.text()).toContain('expected text');
    });
  });
});
```

### Mocking Patterns

- Use `vi.mock()` for modules
- Stub Vue components with `stubs: { ComponentName: true }`
- Use `vitest` for setup and assertions
- Mock `home-assistant-js-websocket` library when needed
- Create realistic test entity objects matching Home Assistant structure

### Coverage Requirements

- **Target**: >70% for all files under `src/`
- **Coverage types**: Statements, lines, branches, functions
- **Check coverage**: `npm run test:coverage`
- **Focus on**: Critical paths, error handling, edge cases

## Configuration & Validation

### Dashboard Config Structure

Config files are JSON documents with structure:
```json
{
  "app": { "title": "...", "developerMode": false, "localMode": false },
  "haConfig": { "haUrl": "...", "accessToken": "..." },
  "views": [{ "name": "...", "label": "...", "entities": [...] }]
}
```

### Config Validation

Use `configValidator.js` utilities:
- `validateConfig(configObj)` - Returns validation result with errors
- Individual validators for components, properties, icon formats
- Always validate user-provided configuration before use

## Styling & Responsiveness

### CSS Classes (Shared in `shared-styles.css`)

- `.card` - Base card styling
- `.card-display` - Display-only cards (subtle)
- `.card-control` - Interactive control cards
- `.card-active` - Active state (green border, no background)
- `.ha-entity-name` - Entity name text
- `.ha-entity-value` - Entity value text
- `.ha-entity-unit` - Unit of measurement text
- `.ha-attribute-key` - Attribute label
- `.ha-attribute-value` - Attribute value
- `.icon-bg` - Icon circle background (colored based on state)

### Responsive Design

- Use Bootstrap grid system (`col-lg-4`, `col-md-6`, etc.)
- Test on mobile (375px), tablet (768px), desktop (1920px)
- Use flexbox for flexible layouts
- Ensure touch targets are at least 44px

### Dark Mode Support

All components must support dark mode via `[data-bs-theme="dark"]` selector:
```css
.my-class {
  color: #333; /* light mode */
}

[data-bs-theme="dark"] .my-class {
  color: #ddd; /* dark mode */
}
```

## Using the Showcase for UI Development

The [card-showcase.html](card-showcase.html) file is a static HTML reference that displays all card components with sample data. **Use this as the first step for any UI-impacting changes**:

### Workflow for UI Changes

1. **Update card-showcase.html first**: Add or modify the relevant component showcase to demonstrate the intended design
2. **Verify appearance**: Open in browser and test across devices/themes before writing any code
3. **Document design decisions**: Make it clear what the design shows (e.g., "New button styling", "Updated card border color")
4. **Then implement in Vue**: After design is approved via showcase, update the corresponding component code
5. **Ensure consistency**: Verify the CSS used in showcase matches the shared-styles.css classes
6. **Test dark mode**: Showcase should display correctly in both light and dark themes

### Showcase Best Practices

- Use realistic data that matches Home Assistant entity structure
- Include edge cases (empty states, long text, unavailable state)
- Test responsive sizing by resizing browser window
- Use shared CSS classes from `public/styles/shared-styles.css`
- Keep HTML clean and semantic
- Add comments above component examples explaining what they show

### Regenerating Card Documentation Images

After updating `card-showcase.html`, regenerate the PNG images used in `CONFIGURATION.md` documentation to keep them in sync:

**Full Image Regeneration**:
```bash
node capture-card-variations.js
```

**Regenerate Specific Cards** (comma-separated list):
```bash
CARDS=haswitch,hasensor,halight node capture-card-variations.js
```

**Important Notes**:
- The script uses Playwright to capture screenshots from the showcase
- It automatically starts a local HTTP server on port 8888
- PNG images are saved to the `/images` directory
- Regenerate images whenever you update card-showcase.html styling or add new card variations
- All 30+ card images should be regenerated if making UI-wide styling changes

**Output**:
```
✓ Saved: haswitch-on.png
✓ Saved: hasensor-single.png
...
✅ Done! Screenshots saved to /images directory
```

**When to Regenerate**:
- After updating card-showcase.html (required)
- After CSS changes that affect card appearance (recommended)
- Before submitting a PR with UI changes (required)
- When adding new card type documentation (required)

### Example Showcase Entry

```html
<!-- New HaAwesome Component -->
<div class="example-section">
  <h3>HaAwesome Card</h3>
  <p>Display awesome entity data with new styling</p>
  
  <div class="row g-3">
    <!-- Normal state -->
    <div class="col-lg-4 col-md-6">
      <div class="card card-display h-100 rounded-4 shadow-lg border-info">
        <div class="card-body">
          <h6 class="ha-entity-name">Awesome Entity</h6>
          <div class="ha-entity-value">42</div>
        </div>
      </div>
    </div>
    
    <!-- Active/On state -->
    <div class="col-lg-4 col-md-6">
      <div class="card card-control card-active h-100 rounded-4 shadow-lg">
        <div class="card-body">
          <h6 class="ha-entity-name">Active Awesome</h6>
          <div class="ha-entity-value">ON</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Performance Considerations

- Use `computed()` instead of `watch()` when possible
- Avoid unnecessary re-renders with proper dependency tracking
- Lazy load components that aren't immediately visible
- Cache expensive calculations in composables
- Minimize DOM operations in loops
- Use `requestAnimationFrame()` for animations

## Common Patterns & Examples

### Accessing Entity Data

```javascript
const { resolvedEntity } = useEntityResolver(props.entity);
const state = computed(() => resolvedEntity.value?.state ?? "unknown");
const friendlyName = computed(() => 
  resolvedEntity.value?.attributes?.friendly_name || "Unknown"
);
```

### Service Calls

```javascript
const { callService } = useServiceCall();
await callService("light", "turn_on", { entity_id: entityId });
```

### Conditional UI Based on State

```javascript
const isActive = computed(() => resolvedEntity.value?.state === "on");
const borderClass = computed(() => 
  isActive.value ? "border-success" : "border-secondary"
);
```

### Formatting Values for Display

```javascript
import { formatAttributeValue, formatKey } from "@/utils/attributeFormatters";

const displayValue = formatAttributeValue(entityValue);
const displayLabel = formatKey("battery_level"); // "Battery Level"
```

## For AI/Copilot Users

This document serves as context for AI-assisted development. When working with Copilot:

1. **Reference This Guide**: Include section names when asking for code generation
2. **Be Specific**: Mention component patterns, naming conventions, testing requirements
3. **Validate Output**: AI-generated code should follow architecture patterns above
4. **Test Thoroughly**: Ensure AI-generated tests meet coverage requirements (>70%)
5. **Review Standards**: Check generated code against all conventions listed
6. **Ask for Context**: Provide examples of similar components/composables in codebase

### Example Prompts for Copilot

- "Create a new card component following the HaSensor pattern that displays..."
- "Create a composable using the useEntityResolver pattern that..."
- "Add unit tests following the test structure in HaBinarySensor.spec.js for..."
- "Add CSS styling using shared classes in shared-styles.css for..."
- "Create a utility function in src/utils/ that formats... following formatAttributeValue pattern"

## Review Checklist for Contributors

Before submitting a PR:

- [ ] **UI Changes**: card-showcase.html updated first to demonstrate intended design (for any UI-impacting changes)
- [ ] **Images Regenerated**: Card images regenerated from showcase (`node capture-card-variations.js` if UI changes made)
- [ ] Unit tests written with >70% coverage
- [ ] All tests passing (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Dark mode tested
- [ ] Responsive on mobile/tablet/desktop
- [ ] RELEASE.md updated with summary
- [ ] CONFIGURATION.md updated (if changes impact user configuration)
- [ ] Code follows naming conventions
- [ ] Components follow established patterns
- [ ] No console errors or warnings
- [ ] Accessibility attributes included
- [ ] JSDoc comments added for public functions
