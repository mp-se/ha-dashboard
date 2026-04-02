# Coverage Exceptions

Files below that are permitted to fall below the 80% unit test coverage threshold.
These files **must not decrease** in their current coverage level.

| File                                                 | Reason                                                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/stores/haStore.ts`                              | Core Home Assistant WebSocket integration; behaviour is integration-tested end-to-end rather than unit-tested in isolation |
| `src/components/page-components/PwaInstallModal.vue` | Browser PWA install prompt API is not available in jsdom; meaningful coverage requires a real browser environment          |
| `src/views/RawEntityView.vue`                        | Thin view wrapper; coverage is low by design — logic is tested through composables it delegates to                         |
| `src/components/visual-editor/EditorCanvas.vue`      | Complex drag-layout canvas; DOM geometry APIs (getBoundingClientRect, pointer events) are minimally supported in happy-dom |
| `src/components/visual-editor/PropertyInspector.vue` | Large branching property editor; remaining branches require deep entity-store fixture data                                 |
| `src/components/visual-editor/EntityPalette.vue`     | Depends on live entity store data; remaining branches covered by e2e tests                                                 |

## Process for Adding an Exception

1. Add a row to the table above with a clear reason.
2. Add a comment at the top of the source file:
   ```js
   // coverage-exception: <same reason as table>
   ```
3. Review the exception at least once per quarter. Remove it when the blocker no longer applies.
