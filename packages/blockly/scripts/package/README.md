# Blockly

Google's Blockly is a web-based, visual programming editor. Users can drag
blocks together to build programs. All code is free and open source.

The source for this module is in the [Blockly repo](http://github.com/google/blockly).

## Example Usage

```js
import * as Blockly from 'blockly/core';
Blockly.inject('blocklyDiv', {
    ...
})
```

## Samples

For samples on how to integrate Blockly into your project, view the list of samples at [blockly-samples](https://github.com/google/blockly-samples).

## Installation

You can install this package either via `npm` or `unpkg`.

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

### npm

```bash
npm install blockly
```

## Imports

Note: Using import of our package targets requires you to use a bundler (like webpack), since Blockly is packaged as a UMD, rather than an ESM.

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

## Applying messages

Once you have the message files, you also need to apply them.

```js
Blockly.setLocal(En);
```

For a full list of supported Blockly locales, see: [https://github.com/google/blockly/tree/master/msg/js](https://github.com/google/blockly/tree/master/msg/js)

## Docs

For more information about how to use Blockly, check out our
[devsite](https://developers.google.com/blockly/guides/overview).

## License

Apache 2.0
