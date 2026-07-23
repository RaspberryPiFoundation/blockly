# @blockly/plugin-cross-tab-copy-paste [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds context menu items and keyboard shortcuts to allow users to copy and paste a block between tabs.

## Installation

### Yarn

```
yarn add @blockly/plugin-cross-tab-copy-paste
```

### npm

```
npm install @blockly/plugin-cross-tab-copy-paste --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {CrossTabCopyPaste} from '@blockly/plugin-cross-tab-copy-paste';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

const options = {
  contextMenu: true,
  shortcut: true,
};

// Initialize plugin.
const plugin = new CrossTabCopyPaste();
plugin.init(options, () => {
  console.log('Use this error callback to handle TypeError while pasting');
});

// optional: Remove the duplication command from Blockly's context menu.
Blockly.ContextMenuRegistry.registry.unregister('blockDuplicate');

// optional: You can change the position of the menu added to the context menu.
Blockly.ContextMenuRegistry.registry.getItem('blockCopyToStorage').weight = 2;
Blockly.ContextMenuRegistry.registry.getItem('blockPasteFromStorage').weight =
  3;
```

## Options

- `contextMenu` `{boolean}`: Register copy, cut, and paste commands in the Blockly context menu.
- `shortcut` `{boolean}`: Register cut (ctr + x), copy (ctr + c) and paste (ctr + v) in the keybord shortcut.

## Error Callback

- `typeErrorCallback` `{Function}`: is an extra parameter to the init method, one can pass a callback to the cross-tab-copy-paste plugin that is called when the plugin triggers a TypeError error when pasting.

## Localization

You can change the displayed words.

### English

```js
Blockly.Msg['CROSS_TAB_COPY'] = 'Copy';
Blockly.Msg['CROSS_TAB_PASTE'] = 'Paste';
```

### Japanese

```js
Blockly.Msg['CROSS_TAB_COPY'] = 'コピー';
Blockly.Msg['CROSS_TAB_PASTE'] = '貼り付け';
```

## License

Apache 2.0
