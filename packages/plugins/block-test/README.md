# @blockly/block-test

## [<img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/docs/static/images/logos/built-with-blockly-badge-white.svg" alt="Built with Blockly" width="119">](https://github.com/RaspberryPiFoundation/blockly)

A set of [Blockly](https://www.npmjs.com/package/blockly) test blocks.

## Installation

### Yarn

```
yarn add @blockly/block-test
```

### npm

```
npm install @blockly/block-test --save
```

## Usage

### Import

```js
import * as Blockly from 'blockly';
import {toolboxTestBlocks, toolboxTestBlocksInit} from '@blockly/block-test';

// Configure the Blockly workspace to use the test block's toolbox.
const workspace = Blockly.inject('blocklyDiv', {
  ...options
  toolbox: toolboxTestBlocks,
});

// Initalize the test block's toolbox.
toolboxTestBlocksInit(workspace);
```

## License

Apache 2.0
