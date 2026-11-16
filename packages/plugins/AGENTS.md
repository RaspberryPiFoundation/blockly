# packages/plugins — first-party plugins

Most subdirectories here are self-contained plugins published to npm — fields, themes,
and workspace add-ons that an app developer loads into a Blockly workspace. Most are
TypeScript, and new ones must be; the remaining JavaScript plugins are legacy.

The rest are tooling, test fixtures, and example apps that happen to live alongside them.
Check the table below before assuming a directory is a plugin.

Repo-wide conventions (commits, licence headers, naming) are in the
[root `AGENTS.md`](../../AGENTS.md) and are not repeated here.

## Layout

Every actual plugin follows the same shape:

```
packages/plugins/<name>/
  src/
    index.ts        # public entry point (or index.js for JS plugins)
  test/
    *.mocha.js      # unit tests — the suffix is required, see below
    index.html      # playground page served by `npm start`
    index.ts        # playground setup
  package.json
  tsconfig.json     # present only for TypeScript plugins
  README.md
```

## Directories that are not plugins

Several packages live here for convenience but are not plugins you load into a workspace.
Don't treat them as examples of how a plugin should look:

| Directory                       | Package                   | What it actually is                                                     |
| ------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `dev-scripts/`                  | `@blockly/dev-scripts`    | The `blockly-scripts` CLI that every plugin's npm scripts call          |
| `dev-tools/`                    | `@blockly/dev-tools`      | Shared playground and test helpers that plugins import                  |
| `dev-create/`                   | `@blockly/create-package` | The scaffolding generator for new plugins                               |
| `block-test/`                   | `@blockly/block-test`     | Test blocks used by our own test suites — not blocks for app developers |
| `migration/`                    | `@blockly/migrate`        | A CLI that migrates apps to newer versions of Blockly                   |
| `sample-app/`, `sample-app-ts/` | private, unpublished      | Example applications                                                    |

`block-test` deserves particular care: `packages/blockly` takes it as a devDependency and
loads it from the Mocha setup, so editing those blocks can break the **core** test suite,
not just this package's.

## Commands

Run these from inside a plugin's directory:

```bash
npm start        # webpack dev server serving test/index.html, with hot reload.
                 # The port is chosen automatically and printed on startup.
npm test         # bundle test/*.mocha.js with webpack, then run them under Mocha
npm run build    # production webpack build into dist/
npm run clean
npm run lint
```

All of these shell out to `blockly-scripts`, the shared CLI in `dev-scripts`. If a plugin
needs custom Mocha settings, add `test/.mocharc.js` and it will be used instead of the
default.

To run a target from the repo root instead, use Nx. **The Nx project name is the `name`
field in the plugin's `package.json`, which is often not the directory name.** Package
names follow a type-based convention, so a generic plugin in `modal/` publishes as
`@blockly/plugin-modal`:

| Plugin type     | Package name                              |
| --------------- | ----------------------------------------- |
| Field           | `@blockly/field-*`                        |
| Theme           | `@blockly/theme-*`                        |
| Block           | `@blockly/block-*` or `@blockly/blocks-*` |
| Block extension | `@blockly/extension-*`                    |
| Workspace       | `@blockly/workspace-*`                    |
| Anything else   | `@blockly/plugin-*`                       |

Look the name up rather than guessing it from the directory:

```bash
npx nx show projects            # list every project name
npx nx run @blockly/field-slider:test
```

The full convention, including the tags to put in `package.json`, is in
[the plugin naming guide](../docs/docs/guides/contribute/core/plugins/naming.mdx).

## Plugin-specific conventions

- **Test files must be named `*.mocha.js`.** `blockly-scripts test` looks only for that
  pattern; if it finds nothing it prints a warning and exits **0**. A misnamed test file
  therefore fails silently and CI stays green, so double-check the suffix when adding
  tests.
- **Plugin tests are JavaScript.** Core takes TypeScript tests, but the suffix match
  above is literal, so a `.mocha.ts` file here is skipped without an error. Write plugin
  tests as `.mocha.js` until that changes.
- Tests use the `tdd` UI (`suite` / `test`), not BDD.
- **Plugin UI must be accessible.** The same screen reader and keyboard requirements
  apply here as in core, and the utilities to meet them — `Blockly.utils.aria` and the
  keyboard navigation policies — come from core.
  See [DOM and accessibility](../blockly/AGENTS.md#dom-and-accessibility).
- **New plugins are TypeScript.** Some existing ones are JavaScript; those are legacy
  and are not the pattern to copy.
- **`blockly` is a peer dependency**, never a direct dependency. Import from the public
  entry points; do not reach into deep paths inside the core package.
- **Stricter TypeScript linting than core.** `packages/plugins/**/src/*.ts` enforces
  `@typescript-eslint/naming-convention`, forbids interface names starting with `I`, and
  sets `explicit-member-accessibility` to `no-public` (so do not write `public`).
- **Different Prettier settings than core.** Plugins use `quoteProps: 'consistent'`, so
  if any one property in an object literal needs quotes, every property gets quoted. Core
  uses `preserve`. Run `npm run format` from the root and let it sort this out.
- Reuse `@blockly/dev-tools` for playground and test scaffolding instead of
  reimplementing it.

## Localization

**All user-visible strings must be translatable**, including ARIA labels and anything
else only a screen reader will ever read.

Plugins have no message machinery of their own. Strings go through core's `Blockly.Msg`,
and the keys are defined in **core's** [`msg/messages.js`](../blockly/msg/messages.js)
along with everything else — there is no per-plugin message file:

1. Add the key and English value to `packages/blockly/msg/messages.js`, with a `///`
   description comment above it. That comment becomes the translator note in `qqq.json`.
2. Run `npm run messages` in `packages/blockly` to regenerate `msg/json/`.
3. Read it from the plugin as `Blockly.Msg['YOUR_KEY']`.

A pull request that adds a plugin string will therefore also touch `packages/blockly`.
That is expected. The rest of the workflow — never hand-editing `msg/json/`, never
adding non-English translations directly — is in
[`packages/blockly/AGENTS.md`](../blockly/AGENTS.md#localization).

**Do not add an English fallback** — `Blockly.Msg['KEY'] || 'Some text'`. The existing
ones are legacy. A plugin can only ever be installed against a core release at or above
its own — which is the release that introduced the key. A fallback for a key that cannot
be missing is dead code that silently defeats translation if it ever does run.

## Adding a new plugin

Scaffold from a template rather than copying an existing plugin by hand. **New plugins
must be written in TypeScript**, and the generator defaults to JavaScript, so pass
`--typescript` explicitly — it selects the `typescript-*` template and adds the
TypeScript devDependency and `tsconfig.json`:

```bash
npx @blockly/create-package plugin my-plugin --type plugin --typescript
```

Available types are `field`, `block`, `theme`, and `plugin` (the default). The generator
lives in `dev-create/templates/`.

The remaining JavaScript plugins are legacy. Don't use one as the model for a new plugin,
and don't convert one to TypeScript as a drive-by change — that churns the public type
surface and belongs in its own pull request.

See [Add a plugin](../docs/docs/guides/contribute/core/plugins/add_a_plugin.mdx) for the
full process, including what to put in the README and how the plugin gets published.

## Versioning

Versions are managed by Lerna from the repo root. Never hand-edit the `version` field in
a plugin's `package.json`, and do not add a changelog entry by hand — `CHANGELOG.md` is
generated from conventional commits.
