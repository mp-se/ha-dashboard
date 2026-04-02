---
name: vue-qa
description: "Quality verification workflow for Vue projects. Use when: running quality checks, verifying tests pass, checking coverage, fixing lint errors, ensuring build succeeds, reviewing test coverage for a component or composable, preparing a change for merge, doing a quality gate check, writing tests for a bug fix, adding tests for new functionality."
argument-hint: "Optional: specify a file or component to focus quality checks on"
---

# Vue Project Quality Workflow

## When to Use

- Before finalizing and committing any code change
- After fixing a bug (verify regression tests exist)
- When adding a new component, composable, or utility
- When asked to "run quality checks" or "verify the change"
- When coverage for a specific file needs review

## Quality Gates (Must All Pass)

| Gate       | Command                 | Requirement                           |
| ---------- | ----------------------- | ------------------------------------- |
| Unit Tests | `npm test`              | All tests pass                        |
| Coverage   | `npm run test:coverage` | ≥ 80% for modified files under `src/` |
| Lint       | `npm run lint`          | Zero errors                           |
| Format     | `npm run format:check`  | No formatting violations              |
| Build      | `npm run build`         | No errors or warnings                 |

### Coverage Exceptions

Some files may be permitted to fall below the 80% threshold (e.g., files that are hard to unit test in isolation, legacy files, or UI bootstrapping code). These exceptions must be:

1. Listed explicitly in the project — check `COVERAGE_EXCEPTIONS.md` or inline comments at the top of the file itself (`// coverage-exception: <reason>`)
2. Not allowed to **decrease** from their current level — exceptions only prevent enforcement of the threshold, not regression
3. Reviewed periodically and removed as the project matures

If you encounter a file below 80% with no documented exception, either add tests or document the exception with a reason.

## Step-by-Step Procedure

### 1. Identify Scope

Determine which files were added or changed. For each source file under `src/`, find (or create) its test counterpart. Test files should mirror the source structure inside a `__tests__/` directory at the same level:

```
src/components/cards/MyCard.vue         → src/components/cards/__tests__/MyCard.spec.ts
src/composables/useMyLogic.ts           → src/composables/__tests__/useMyLogic.spec.ts
src/utils/myFormatter.ts               → src/utils/__tests__/myFormatter.spec.ts
src/stores/myStore.ts                  → src/stores/__tests__/myStore.spec.ts
```

### 2. Check Tests Exist and Are Adequate

For **new functionality**:

- Tests must cover the happy path and at least one edge case
- Vue components: use `@vue/test-utils` `mount` or `shallowMount`
- Composables: call them inside `withSetup` or directly if they have no lifecycle hooks
- Utilities: plain unit tests with varied inputs

For **bug fixes**, tests must:

1. Reproduce the bug **before** the fix (initially failing)
2. Pass **after** the fix
3. Cover the root cause and related edge cases

### 3. Run Quality Gates

Run all gates in sequence and fix any failures before proceeding:

```bash
npm test
npm run test:coverage
npm run lint
npm run format:check
npm run build
```

To auto-fix lint and format issues:

```bash
npm run lint:fix
npm run format
```

### 4. Review Coverage Output

After `npm run test:coverage`, focus on files you changed. Look for uncovered lines and branches. The HTML report is typically at `coverage/index.html`.

Coverage targets by file type:

- **Composables**: aim for 90%+ (pure logic, easy to test)
- **Utils**: aim for 90%+ (pure functions)
- **Vue components**: aim for 80%+ (test props, emits, computed, key interactions)
- **Stores**: aim for 80%+ (test actions and getters)

### 5. Update Release Notes

Every change must have a summary added under the current unreleased section of the project's changelog (e.g., `RELEASE.md` under `## Unreleased`). Keep it concise — one line per logical change.

## Test Patterns

### Vue Component (Vitest + @vue/test-utils)

```js
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import MyComponent from "../MyComponent.vue";

describe("MyComponent", () => {
  it("renders with entity state", () => {
    const wrapper = mount(MyComponent, {
      props: { value: "test" },
      global: {
        plugins: [
          createTestingPinia({
            initialState: { myStore: { data: { key: "value" } } },
          }),
        ],
      },
    });
    expect(wrapper.text()).toContain("value");
  });
});
```

### Composable

```js
import { useMyLogic } from "../useMyLogic";

describe("useMyLogic", () => {
  it("returns expected result for given input", () => {
    const { result } = useMyLogic("input");
    expect(result.value).toBe("expected");
  });
});
```

### Bug Fix Test Structure

```js
describe("MyComponent - bug: <short description>", () => {
  it("reproduces the bug: <what was broken>", () => {
    // This test MUST have failed before the fix
    // ...
  });

  it("fix: <what should now happen>", () => {
    // Verifies corrected behavior
    // ...
  });

  it("edge case: <related scenario>", () => {
    // Prevents related regressions
    // ...
  });
});
```

## Common Lint Rules

- No `console.log` in production code — use the project's logger utility
- No unused variables or imports
- Vue 3 `<script setup>` is required for components
- Props must be validated (type + required/default)
- No inline styles; use scoped styles or the project's shared stylesheet

## Architecture Reminders

- Follow the project's naming conventions (check `copilot-instructions.md` or `CONTRIBUTION.md`)
- Shared CSS belongs in the project's shared stylesheet, not scattered across components
- Use the project's icon normalization utilities rather than raw icon strings
- Composables are the right place for reusable reactive logic; avoid duplicating it in components
- Do not replicate functionallity that already exists in the project — check for existing utilities, composables, or components before creating new ones
- Identify duplicated functionallity and extract it into a shared utility or composable to DRY up the codebase
- UI should be optimized for user experience and support mobile and desktop layouts; use the project's responsive design utilities and patterns

