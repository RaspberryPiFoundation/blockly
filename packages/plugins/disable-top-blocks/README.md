# @blockly/disable-top-blocks [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that shows the
'disable' context menu option only on non-orphan blocks. This is useful in
conjunction with the `Blockly.Events.disableOrphans` event handler (which you
must set up yourself).

## Installation

### Yarn

```
yarn add @blockly/disable-top-blocks
```

### npm

```
npm install @blockly/disable-top-blocks --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {DisableTopBlocks} from '@blockly/disable-top-blocks';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {};

// Add the disableOrphans event handler. This is not done automatically by
// the plugin and should be handled by your application.
workspace.addChangeListener(Blockly.Events.disableOrphans);

// The plugin must be initialized before it has any effect.
const disableTopBlocksPlugin = new DisableTopBlocks();
disableTopBlocksPlugin.init();
```

## API

- `init` initializes the plugin and modifies the behavior of the 'disable'
  context menu item.
- `dispose` restores the original behavior of the context menu. This is never
  required to be called, but can be if you want to programmatically disable
  the effects of the plugin.

## License

Apache 2.0
