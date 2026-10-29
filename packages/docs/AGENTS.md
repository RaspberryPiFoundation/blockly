# packages/docs — developer documentation site

A Docusaurus site. Built as the `blockly-docs` Nx project; it is not released to npm.

Repo-wide conventions are in the [root `AGENTS.md`](../../AGENTS.md).

## Commands

Run from `packages/docs/`, or from the repo root as `npm run build-docs`.

```bash
npm start          # build the API reference, then serve the site locally
npm run build      # production build
npm run serve      # serve an already-built site
npm run clear      # clear the Docusaurus cache
npm run lint       # ESLint over docs/**/*.mdx
npm run lint-fix
```

## Things to know

- **`docs/reference/` is generated** by TypeDoc during the Docusaurus build, and is
  gitignored. Never edit those files directly — fix the TSDoc in `packages/blockly/core/`
  or `packages/plugins/<plugin>/src/` instead.
- **The reference is built from `blockly_api.json` and `plugins_api.json`, not from the
  current source.** They are snapshots of the core library's and the plugins' APIs
  committed during a release, so the site documents released APIs rather than whatever is
  on `main`. To preview your own TSDoc changes, run `npm run reference-refresh` or
  `npm run plugins-reference-refresh` to regenerate them locally — then leave them out of
  your commit, since only a release should update them.
- **Markdown and MDX here are linted, not Prettier-formatted.** `packages/docs/**/*.md`
  and `*.mdx` are listed in `.prettierignore` and handled by ESLint with
  `eslint-plugin-mdx` instead, so `npm run format` will not touch them.
- Prose wrapping is preserved rather than reflowed, so existing line breaks in prose are
  intentional — don't rewrap paragraphs you aren't otherwise changing.
