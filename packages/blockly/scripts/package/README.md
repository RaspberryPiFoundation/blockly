# Blockly

Blockly is a web-based visual programming editor maintained by the
[Raspberry Pi Foundation](https://www.raspberrypi.org). The Blockly editor uses
interlocking graphical blocks to represent code concepts like variables,
logical expressions, loops, and more. It allows users to apply programming
principles without having to worry about syntax or the intimidation of a
blinking cursor on the command line, and can automatically translate block-based
programs into a variety of text-based programming languages like Python,
Javascript and Lua. All code is free and open source.

[Try a live demo](https://raspberrypifoundation.github.io/blockly/packages/blockly/demos/code/index.html),
or browse the source code in the [Blockly repo](http://github.com/RaspberryPiFoundation/blockly).

## Example Usage

```js
import * as Blockly from 'blockly/core';
Blockly.inject('blocklyDiv', {
    ...
})
```

## Plugins

A [wide variety of plugins](https://raspberrypifoundation.github.io/blockly-samples/)
that add additional features and functionality to Blockly are available. All
plugins are distributed via NPM; source code can be found in the
[Blockly Samples repo](http://github.com/RaspberryPiFoundation/blockly-samples).

## Installation

You can install Blockly either via `npm` or `unpkg`. Or, if you're starting an
entirely new project that uses Blockly, you can bootstrap it using our
`create-package` tool:

### npm

```bash
npm install blockly
```

### unpkg

```html
<script src="https://unpkg.com/blockly/blockly.min.js"></script>
```

When importing from unpkg, you can access imports from the global namespace.

```js
// Access Blockly.
Blockly.thing;
// Access the default blocks.
Blockly.Blocks['block_type'];
// Access the javascript generator.
javascript.javascriptGenerator;
```

### create-package

```bash
npx @blockly/create-package app my-cool-blockly-app --typescript
```

## Imports

Note: Using import of our package targets requires you to use a bundler
(like webpack), since Blockly is packaged as a UMD, rather than an ESM.

```js
// Import Blockly core.
import * as Blockly from 'blockly/core';
// Import the default blocks.
import * as libraryBlocks from 'blockly/blocks';
// Import a generator.
import {javascriptGenerator} from 'blockly/javascript';
// Import a message file.
import * as En from 'blockly/msg/en';
```

## Requires

```js
// Require Blockly core.
const Blockly = require('blockly/core');
// Require the default blocks.
const libraryBlocks = require('blockly/blocks');
// Require a generator.
const {javascriptGenerator} = require('blockly/javascript');
// Require a message file.
const En = require('blockly/msg/en');
```

## Loading messages

Blockly is translated into [more than 100 different languages](https://github.com/RaspberryPiFoundation/blockly/tree/main/packages/blockly/msg/json).
Once you've imported or required the message file for the language you want to
use as shown above, it needs to be applied:

```js
Blockly.setLocale(En);
```

## Docs

For more information about how to use Blockly, check out our
[developer documentation](https://docs.blockly.com).

## Accessibility

Although Blockly is built around drag-and-drop, it is fully usable with the
keyboard alone. Blockly is also accessible to screenreader users by default. We
provide [Accessibility Conformance Reports](https://docs.blockly.com/guides/app-integration/accessibility/compliance/)
in the VPAT format that outline Blockly's conformance to WCAG 2.2 Level AA.

## License

Apache 2.0
