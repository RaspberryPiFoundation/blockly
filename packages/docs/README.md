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
npm run format-check
# fix formatting:
npm run format
# check linting:
npm run lint
# fix linting:
npm run lint-fix
```

Prettier is used for formatting JavaScript files (the `format` script).

ESlint is used for linting `.md` and `.mdx` files due to poor support for these in Prettier (the `lint` script).

## Generating reference docs

The API reference pages are auto-generated from the Blockly TypeScript source 
using [TypeDoc](https://www.npmjs.com/package/typedoc). Typedoc automatically 
generates MDX files into `/docs/reference/` when Docusaurus starts.

TypeDoc generates the API docs based on the latest Blockly release, not the 
current code. If you would like to see unreleased or beta changes to core Blockly 
in your local docs site, run `npm run reference-refresh`. This will overwrite a 
file called `blockly_api.json` which TypeDoc uses to generate the docs. Then, 
you can run docs again to see updates to the API docs. 

If your changes are on a plugin instead, run `npm run plugins-refresh` which 
will regenerate `plugins_api.json`. 

If you regenerate `blockly_api.json` or `plugins_api.json`, please do not commit 
either of these files in a PR. This file is committed automatically as part of 
our release process. 
