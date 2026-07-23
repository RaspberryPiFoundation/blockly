# @blockly/plugin-strict-connection-checker [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that imposes stricter rules for connection check arrays than the default checker in Blockly, but uses the same rules for dragging and safety.

This checker still expects nullable arrays of string for connection type checks, and still looks for intersections in the arrays. Unlike the default checker, null checks arrays are only compatible with other null arrays.

## Installation

### Yarn

```
yarn add @blockly/plugin-strict-connection-checker
```

### npm

```
npm install @blockly/plugin-strict-connection-checker --save
```

## Usage

The plugin exports a `pluginInfo` object for use in the options struct.

```js
import * as Blockly from 'blockly';
import {pluginInfo as StrictConnectionsPluginInfo} from '@blockly/plugin-strict-connection-checker';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
  plugins: {
    ...StrictConnectionsPluginInfo,
  },
});
```

Note that this uses the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) (`...`) to copy the contents of `pluginInfo` into the `plugins` section of the struct.

## API

This plugin exports a class, `StrictConnectionChecker`, and registers it as a connection checker with Blockly. You should not need to instantiate it directly.

## License

Apache 2.0
