# Code review guidelines

## General principles
- **Style:** Suggest `npm run format` or `npm run lint:fix` for formatting issues; do not comment on individual style nits.
- **Patterns:** Enforce existing Blockly patterns and official docs over new conventions.
- **Documentation:** Prefer linking to [Blockly Dev Docs](https://developers.google.com/blockly) over duplicating content in comments.
- **TSDoc:** Public APIs require TSDoc for behavior, params, and returns. Do not include implementation details or historical context unless essential.

## Localization
- All user-visible strings must use `Blockly.Msg`.
- New strings must be added to `msg/messages.js`, `msg/json/qqq.json`, and `msg/json/en.json`.
- Link [this guide](https://developers.google.com/blockly/guides/contribute/core/add_localization_token) if strings are missing or misplaced.
- PRs that attempt to add translations for non-English strings should be redirected to TranslateWiki via the ([translation guide](hhttps://developers.google.com/blockly/guides/contribute/core/translating)).

## Breaking changes
### Policy
- A breaking change is any non-backwards-compatible change to public APIs, behavior, UI, or browser requirements.
- **Avoid:** Prefer deprecation with migration paths over removal. 
- **Compatibility:** Must support Safari 15.4+, latest Chrome, and latest Firefox.
- **Identification:** Flag breaking changes unless all of the following are true:
  1. PR description explicitly notes it.
  2. Commit type includes `!` (e.g., `feat!:`).
  3. Target branch is not `main`.

### Breaking
- Removing/renaming public methods, properties, or classes.
- Changing signatures or behavior of existing public methods.
- Adding required methods to public interfaces.
- New keyboard shortcuts or context menu items (potential developer conflicts).
- DOM restructures affecting external CSS/JS.
- Changes to build output/consumption (e.g., ESM-only).
- Changes that affect the output of serialization.

### Non-breaking (do not flag)
- Additive changes (new methods/properties).
- Internal refactoring (including items marked `@internal`).
- Tooling/workflow changes.
- Changes to unreleased code (non-`main` feature branches).