# Blockly Documentation Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

Run `npm install` at the root of the blockly repo, then all other commands from the `packages/docs` directory.

```bash
npm install
cd packages/docs
```

## Local development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Test your build locally

```bash
npm run serve
```

The build folder is now served at http://localhost:3000/

## Formatting and linting

```bash
# check formatting:
npm run format:check
# fix formatting:
npm run format
# check linting:
npm run lint
# fix linting:
npm run lint:fix
```

Prettier is used for formatting JavaScript files (the `format` script).

ESlint is used for linting `.md` and `.mdx` files due to poor support for these in Prettier (the `lint` script).

## Generating reference docs

The API reference pages are auto-generated from the Blockly TypeScript source using `@microsoft/api-extractor` and `@microsoft/api-documenter`. This is a separate step from the Docusaurus build and must be run from the `packages/blockly` directory:

```bash
cd packages/blockly
npm run build && npm run package
npm run docs
```

This generates MDX files into `packages/docs/docs/reference/`. These files are gitignored, so this needs to be run locally (and / or in CI).
