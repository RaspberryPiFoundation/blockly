# packages/blockly — core library

The Blockly library itself. Source is TypeScript in `core/`; the build runs through Gulp
and the Closure Compiler.

Repo-wide conventions (commits, license headers, naming) are in the
[root `AGENTS.md`](../../AGENTS.md) and are not repeated here.

## Commands

Run from `packages/blockly/`, or from the repo root as `npx nx run blockly:<target>`.

```bash
npm run build          # Full build via Gulp
npm run tsc            # TypeScript compilation only
npm run clean          # Remove build artifacts

npm run start          # Dev server, watches for changes and serves the playground
                       # at /tests/playground.html

npm run test                   # The full CI suite. Slow — see below.
npm run test:mocha:node        # Unit tests headless under Node + jsdom. The fast inner loop.
npm run test:mocha:interactive # Unit tests in a real browser, hot reloads on change
npm run test:browser           # Webdriver tests in a real browser
npm run test:generators        # Code generator golden-file tests

npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
```

Prettier is configured at the repo root only — run `npm run format` from there.

`npm run test` runs the entire CI suite in series: eslint, build, renamings, mocha,
generators, type definitions, and two advanced-compilation passes. Prefer
`test:mocha:node` while iterating and save the full suite for a final check.

### Running a single test

```bash
npx mocha --config tests/mocha/.mocharc.node.cjs tests/mocha/block_test.js
npx mocha --config tests/mocha/.mocharc.node.cjs tests/mocha/block_test.js --grep "myTestName"
```

Test console output is suppressed by default. Set `BLOCKLY_TEST_CONSOLE=1` to see it.

Mocha tests use the `tdd` UI (`suite` / `test`), not BDD.

## Writing tests

**New tests are in TypeScript.** Both extensions are collected
(`tests/mocha/**/*_test.{js,ts}`), and the remaining `.js` files are legacy — they do
not need converting as a drive-by.

TypeScript tests run under Node's native type stripping, with type checking as a
separate `npm run test:mocha:typecheck` pass. So
[`tests/mocha/tsconfig.json`](tests/mocha/tsconfig.json) sets `erasableSyntaxOnly`, and
anything requiring codegen is unavailable: no `enum`, no parameter properties, no
`namespace`. `verbatimModuleSyntax` is also on, so type-only imports must be written as
`import type`.

Assertions use chai, and prefer building real workspaces and blocks over stubbing them.
Both are covered in the [root conventions](../../AGENTS.md#code-conventions).

## Further reading

In-repo contributor documentation, which is more detailed than this file:

- [A tour of core](../docs/docs/guides/contribute/core/core-architecture/core-tour.mdx)
- [Render management](../docs/docs/guides/contribute/core/core-architecture/render-management.mdx)
- [Style guide](../docs/docs/guides/contribute/core/style_guide.mdx)
- [Unit testing](../docs/docs/guides/contribute/core/testing/unit_testing.mdx)
- [Building and compilation](../docs/docs/guides/contribute/core/building_and_compilation/building.mdx)
- [Localization and translation](../docs/docs/guides/contribute/core/localization_and_translation.mdx)

## Architecture

### Core modules (`core/`)

- **Block model:** `block.ts` — data model; `block_svg.ts` — SVG rendering and UI
- **Workspace:** `workspace.ts` — data container; `workspace_svg.ts` — rendered workspace with drag/zoom
- **Fields:** `field.ts` — base class for all block input fields (text, dropdown, checkbox, etc.)
- **Connections:** `connection.ts`, `connection_checker.ts`, `connection_db.ts`, `rendered_connection.ts` — typed connection points between blocks
- **Events:** `core/events/` — pub/sub event system with 20+ event types (block create/delete/move, UI events, etc.)
- **Keyboard navigation:** `core/keyboard_nav/` — keyboard-driven navigation and the navigation policies that define traversal order
- **Renderers:** `core/renderers/` — pluggable rendering engines; Thrasos is the current default, with Geras and Zelos also available
- **Toolbox:** `core/toolbox/` — the block picker panel and flyout
- **Serialization:** `core/serialization/` — JSON and XML block state serialization
- **Registry:** `registry.ts` — central registration for plugins, renderers, fields, and other extensible types
- **Gesture:** `gesture.ts` — unified mouse/touch/pointer event handling for drag, click, and zoom

### Standard blocks and generators

- `blocks/` — built-in block definitions (logic, loops, math, text, lists, variables, procedures)
- `generators/` — code generators for JavaScript, Python, Dart, Lua, and PHP; each has a subdirectory mirroring the block categories

### Localization

All user-visible strings must go through `Blockly.Msg`. When adding a new string:

1. Add the key and English value to `msg/messages.js`.
2. Run `npm run messages`, which regenerates `msg/json/en.json` and `msg/json/qqq.json`.

Never hand-edit files in `msg/json/` — they are generated, and your changes will be
overwritten. A pull request that adds a string will legitimately contain changes to all
three files.

Do not add translations for non-English locales directly. Those come in through
TranslateWiki.

## DOM and accessibility

Accessibility is a requirement, not a nice-to-have. Anything that touches the DOM has to
work for screen reader users and for keyboard-only users: every interactive element
reachable and operable by keyboard, with an accessible name, a sensible focus order, and
a visible focus indicator.

Use [`core/utils/aria.ts`](core/utils/aria.ts) for roles and ARIA state — `setRole`,
`setState`, `announceDynamicAriaState` — rather than setting `aria-*` attributes by
hand. Keyboard behavior belongs in `core/keyboard_nav/`; new interactive UI needs a
navigation policy, not just a click handler.

The relevant guides:

- [Accessibility best practices](../docs/docs/guides/app-integration/accessibility/best-practices.mdx)
- [Screen readers](../docs/docs/guides/configure/screen-reader.mdx)
- [Keyboard navigation](../docs/docs/guides/configure/keyboard-nav.mdx)
- [Focus](../docs/docs/guides/configure/focus.mdx)

This applies to plugins as well as core. The utilities live here, but plugin UI has the
same obligations — see [`packages/plugins/AGENTS.md`](../plugins/AGENTS.md).

### Prefer vanilla DOM APIs to the `dom.ts` shims

Some helpers in [`core/utils/dom.ts`](core/utils/dom.ts) predate broad browser support
for their standard equivalents and remain only for backwards compatibility. Use the
platform API in new code:

| Instead of            | Use                             |
| --------------------- | ------------------------------- |
| `dom.addClass`        | `element.classList.add`         |
| `dom.removeClass`     | `element.classList.remove`      |
| `dom.removeClasses`   | `element.classList.remove(...)` |
| `dom.hasClass`        | `element.classList.contains`    |
| `dom.setCssTransform` | `element.style.transform`       |

The rest of `dom.ts` is not legacy and may still be used — in particular
`createSvgElement`, and the text measurement helpers (`getTextWidth`,
`getFastTextWidth`, `measureFontMetrics`), which maintain a cache that hand-rolled
measurement would bypass.

## Public API surface

### Default to the narrowest visibility

New APIs should be `private` or `@internal`, unless there is a specific reason for them
to be public. Good reasons include:

- The API was deliberately added for external developers to call.
- It represents a new behavior we are okay with developers overriding in order to customize.

"A user could conceivably want this" is not one of them. Without a known use case, keep
it closed. Widening visibility later is easy and backwards-compatible; narrowing it later
is a breaking change, so anything made public by default is a commitment that is
expensive to walk back.

### Marking internals

`@internal` marks the rough equivalent of Java's package-private: a member that other
files inside the library legitimately use, but that is not part of the public API and
that code outside Blockly should not depend on.

- Mark a member `@internal` when it has to be reachable from elsewhere in the library —
  so, public in TypeScript terms — but is not something external developers should call.
  In practice this means members with no visibility modifier.
- **A `private` member does not need `@internal`.** It already cannot be reached outside
  its own class, so the tag adds nothing.
- Do **not** mark something `@internal` if it is expected to be overridden in a subclass,
  or if it is needed for expected customization such as writing a custom field. Those are
  part of the public API even though most consumers never call them directly.

## Breaking changes

A breaking change is any non-backwards-compatible change to public APIs, behavior, UI,
or browser requirements. Changing internal-only methods is not a breaking change.

Prefer deprecation with a migration path over removal. Core must keep supporting Safari
15.4+, the latest Chrome, and the latest Firefox.

Breaking changes must be noted in the pull request description, and the commit type must
include `!` (for example `feat!:`).

### What counts as a breaking change

- Removing or renaming public methods, properties, or classes
- Changing the signature or behavior of existing public methods
- Adding required methods to public interfaces
- New keyboard shortcuts or context menu items (they can collide with ones developers
  have already bound)
- DOM restructures that would affect external CSS/JS
- Changes to serialization output
- Changes to build output or how the package is consumed (for example going ESM-only)

### What does not count

- Purely additive changes, such as a new method or property
- Internal refactoring, including anything marked `@internal`
- Tooling and workflow changes
- Changes to code that has not been released yet
