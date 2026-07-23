# @blockly/shadow-block-converter [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin for automatically converting shadow blocks to regular blocks when the user edits them.

## Installation

### Yarn

```
yarn add @blockly/shadow-block-converter
```

### npm

```
npm install @blockly/shadow-block-converter --save
```

## Usage

This plugin exports a function called `shadowBlockConversionChangeListener`. If
you add it as a change listener to your Blockly workspace then any shadow block
the user edits will be converted to a regular block. This allows the user to
move or delete the block, in which case the original shadow block will
automatically return. With this plugin, shadow blocks behave like a persistent
default value associated with the parent block (unlike standard Blockly
behavior, where shadow blocks retain any edits made to them even after a regular
block is dragged on top of them).

The regular block will be a new block instance, separate from the shadow block
that was replaced, and will have a different id. It will otherwise have the same
properties and shape as the original shadow block.

If the shadow block was attached to any ancestor blocks that were also shadows,
they will be recreated as regular blocks. If the shadow block was attached to
any descendent blocks, they will be recreated with different ids but will still
be shadow blocks.

See below for an example using it with a workspace.

### JavaScript

```js
import * as Blockly from 'blockly';
import {shadowBlockConversionChangeListener} from '@blockly/shadow-block-converter';

function start() {
  const workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});
  workspace.addChangeListener(shadowBlockConversionChangeListener);
}
```

## License

Apache 2.0
