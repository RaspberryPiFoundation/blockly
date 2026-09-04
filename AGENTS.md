# AGENTS.md

## Project ownership

Blockly is maintained by the **Raspberry Pi Foundation**.
`RaspberryPiFoundation/blockly` is the canonical upstream. It is **not** a fork of
`google/blockly`, and there is no separate Google-maintained version that this one
tracks or defers to.

Blockly was originally developed at Google, so a lot of legacy remains and it is easy to
conclude otherwise. Two things in particular are not evidence of ownership:

- Most existing files carry a `Copyright <year> Google LLC` header. **Leave them alone.**
  Only new files get the Raspberry Pi Foundation copyright.
- Several hundred links to `developers.google.com/blockly` are still embedded in TSDoc
  and comments. They are stale. Do not add new ones.

When adding a reference or link, use the current locations:

| For               | Use                                                       |
| ----------------- | --------------------------------------------------------- |
| Source repository | `https://github.com/RaspberryPiFoundation/blockly`        |
| Issues            | `https://github.com/RaspberryPiFoundation/blockly/issues` |
| Documentation     | `https://docs.blockly.com`                                |
| Project home      | `https://blockly.com`                                     |

The npm package name is unchanged: the core library is still published as `blockly`.

## Repository structure

This is an npm + Nx monorepo. Workspaces are `packages/*` and `packages/plugins/*`.

| Path                 | Package name   | What it is                                                                      |
| -------------------- | -------------- | ------------------------------------------------------------------------------- |
| `packages/blockly/`  | `blockly`      | The core library                                                                |
| `packages/plugins/*` | `@blockly/*`   | First-party plugins (fields, themes, workspace add-ons) and their build tooling |
| `packages/docs/`     | `blockly-docs` | The Docusaurus developer documentation site                                     |

Detailed guidance lives next to the code it describes. Read the relevant one before working in that area, rather than loading all of them:

- [`packages/blockly/AGENTS.md`](packages/blockly/AGENTS.md) — core library
- [`packages/plugins/AGENTS.md`](packages/plugins/AGENTS.md) — plugins
- [`packages/docs/AGENTS.md`](packages/docs/AGENTS.md) — documentation site

## Commands

Run these from the repo root. Root scripts fan out across workspaces via Nx.

```bash
npm ci                 # Install. Re-run after any pull that changes package-lock.json.

npm run build          # Build every package except the docs site
npm run build-all      # Build everything, including the docs site
npm run build-docs     # Docs site only

npm run test           # Full test suite across all packages. Slow.

npm run lint           # ESLint across all workspaces
npm run lint-fix
npm run format         # Prettier write, whole repo
npm run format:check

npm run clean          # Reset the Nx cache and clean every package
```

To work on a single package, either `cd` into it and use its own scripts, or target it
with Nx from the root. The Nx project name is the package's `name` field, which for
plugins is often not the same as the directory name — run `npx nx show projects` to list
them rather than guessing.

```bash
npx nx show projects
npx nx run blockly:test
npx nx run @blockly/field-slider:test
npx nx run-many -t build --projects=@blockly/field-slider
```

Two things to watch out for:

- `format` and `format:check` exist **only** at the root. Prettier is configured once
  for the whole repo, so there is no per-package equivalent.
- `build`, `test`, `clean`, `lint`, and `start` exist at both levels and mean different
  things. At the root they fan out through Nx; inside a package they run that package's
  own tooling.

## Shared configuration

Tooling is configured once at the root and covers every package. Do not add per-package
copies of these:

- `eslint.config.mjs` — a single flat config with per-package `files` sections
- `.prettierrc.js` — shared base plus `overrides` for core, plugins, and docs, which
  each use different settings
- `nx.json` — target defaults and caching
- `lerna.json` — versioning and publishing
- `commitlint.config.mjs` — conventional commit rules

## Making changes

- **Keep changes minimal and pull requests small.** Change what the task requires and
  nothing else. When you notice unrelated problems along the way, report them rather
  than folding them into the same change.

- **Reach for command line tools before writing tooling.** Most build, migration, and
  inspection tasks are one invocation of `git`, `grep`, `find`, `sed`, or an existing
  `npx` package. Prefer that to a script with its own argument parsing, logging, and
  error handling. A bespoke script is code someone has to maintain; a command is not.
  The same goes for scripts you write for yourself mid-task — prefer the one-liner you
  can throw away.

- **Fix root causes, not symptoms.** Prefer the fix that removes the problem to the one
  that routes around it. Adding a path to `.prettierignore` or an `eslint.config.mjs`
  override, special-casing a single block type, or skipping a failing test are all
  signals that the real issue is still there. Where an exception genuinely is the right
  call, say why in a comment.

- **Leave debugging code alone.** Do not remove or revert `console.log` calls, temporary
  assertions, commented-out experiments, or similar scaffolding that someone else added
  — it is probably load-bearing for whatever they are in the middle of. You can point it
  out, but clean it up only when asked, or when explicitly preparing a final commit or
  pull request.

- **Take a final pass before you finish.** Re-read the whole diff looking for things to
  condense or drop: code that is no longer needed, comments that no longer describe what
  the code does, an abstraction with one caller, your own debugging leftovers.

## Dependencies

`packages/blockly` has **no runtime dependencies**. That is deliberate — it is loaded
into other people's applications — so do not add one.

A new `devDependency` needs a case: what it does, why a few lines of our own code or an
existing dependency is worse, and what it costs in install size and ongoing maintenance.
Weigh that with the author before adding it, not after.

For plugins, `blockly` is always a peer dependency; see
[`packages/plugins/AGENTS.md`](packages/plugins/AGENTS.md).

## Commits and pull requests

Commits follow the conventional commit spec, enforced by commitlint. The type should be
one of `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `refactor`, `release`, `revert`,
or `test`.

Breaking changes must append `!` to the type (for example `feat!:`) **and** be called out
in the pull request description. See [`packages/blockly/AGENTS.md`](packages/blockly/AGENTS.md)
for what counts as a breaking change.

## Pull request descriptions

Keep them short. A reviewer should be able to read the description in well under a
minute. The template in `.github/PULL_REQUEST_TEMPLATE.md` asks for the right things —
fill it in briefly rather than expanding it.

Cover:

- **What changed** — a short summary of the change.
- **Why** — the problem it solves. Link the issue rather than restating it.
- Anything a reviewer genuinely needs: breaking changes, migration notes, or how to
  verify behavior that isn't obvious from the diff.

Do not write a narrative. Leave out the story of how you arrived at the solution, the
approaches you tried and rejected, a file-by-file walkthrough of the diff, and any
restatement of what the code already says. Where the reasoning behind a non-obvious
decision matters, a sentence or two is enough — and it often belongs in a code comment
instead, where it will still be there in a year.

## Versioning and publishing

All packages share a single version line, managed by Lerna from the root
(`.github/workflows/publish.yml`). A release bumps only the packages that actually
changed, but they all move to the same version number. Git tags use the `blockly-v`
prefix.

Never hand-edit a `version` field in a `package.json`.

## Code conventions

These apply to every package. The code style has changed over time; use the conventions
listed here even where the surrounding code does not.

Consistency with surrounding code is not a reason to repeat a mistake. Where the
existing code in a file is poorly structured, write the better version rather than
matching what is there — better beats consistent. This is especially true in tests,
which vary in quality and do not always follow best practices.

Naming and public API conventions are the exception. There, matching the established
pattern _is_ encouraged, even where you would have chosen differently, because an
inconsistent API is a cost paid by every consumer.

- **New files** get the Apache-2.0 header with a Raspberry Pi Foundation copyright:

  ```ts
  /**
   * @license
   * Copyright 2026 Raspberry Pi Foundation
   * SPDX-License-Identifier: Apache-2.0
   */
  ```

  Leave the copyright line alone on existing files.

- **Optional parameters** take plain names — `workspace`, not `opt_workspace`. The
  linter still permits the `opt_` prefix so that legacy code keeps passing, but do not
  add new uses of it.
- **Private and internal methods** do not take a trailing `_` suffix.
- **TSDoc** is required on all public APIs, covering behavior, params, and returns.
  Implementation details belong in inline comments, not in TSDoc.
- **Inline comments** explain complex implementation details or gotchas. They are not a
  changelog: do not record how the code used to work unless it explains a
  backwards-compatibility workaround.
- **Prefer `?` and explicit guards to `!`.** Optional chaining, or an early return that
  narrows the type, is safer than asserting non-null.
  `@typescript-eslint/no-non-null-assertion` warns; the existing uses in core are legacy
  and are not precedent.
- **Tests use chai** — `import {assert} from 'chai'`, never Node's built-in `assert`
  module.
- **Prefer real objects to stubs in tests.** Construct an actual workspace, block, or
  field rather than stubbing one. A stub encodes assumptions about internals that then
  have to be maintained, and it goes on passing after those internals break. Reach for
  sinon where a real object is genuinely impractical — timers, network, randomness — not
  as the default.
- **Test-only exports** should be avoided. Where they are unavoidable, prefix them with
  `TEST_ONLY`.

### Spelling

Three words are spelled the British way in APIs: **colour** (`setColour`, `FieldColour`,
`@blockly/field-colour`), **neighbour** (`bumpNeighbours`, `getNeighbours`), and
**centre** (`Align.CENTRE`). Use those spellings everywhere — identifiers, TSDoc,
comments, and documentation prose.

Every other word is American: `initialize`, `serialize`, `behavior`, `license`,
`dialog`.

The line to hold is **API surface versus stylesheet**. A property we named is `colour`;
a property CSS named is `color`. CSS is always American — `color`, `background-color`,
`gray`.

## Further reading

The contributor documentation is in this repository under
[`packages/docs/docs/guides/contribute/`](packages/docs/docs/guides/contribute/). Read
those files directly rather than following links out to the published site. Most useful:

- [Style guide](packages/docs/docs/guides/contribute/core/style_guide.mdx)
- [Commit messages](packages/docs/docs/guides/contribute/get-started/commits.mdx)
- [Writing a good PR](packages/docs/docs/guides/contribute/get-started/write_a_good_pr.mdx)
