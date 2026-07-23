# @blockly/suggested-blocks [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that suggests blocks for the user based on which blocks they've used already in the workspace.

## Installation

### Yarn

```
yarn add @blockly/suggested-blocks
```

### npm

```
npm install @blockly/suggested-blocks --save
```

## Usage

```js
import * as Blockly from 'blockly/core';
import * as SuggestedBlocks from '@blockly/suggested-blocks';

const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'My Category',
      contents: [
        /* your category contents */
      ],
    },
    {
      kind: 'category',
      name: 'Frequently Used',
      custom: 'MOST_USED',
      categorystyle: 'frequently_used_category',
    },
    {
      kind: 'category',
      name: 'Recently Used',
      custom: 'RECENTLY_USED',
      categorystyle: 'recently_used_category',
    },
  ],
};

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolbox,
});

// Initialize the plugin
SuggestedBlocks.init(workspace);
```

## API

- `init`: Initializes the suggested blocks categories in the toolbox. Takes several arguments:
  - `workspace`: The workspace to use the plugin with. If you have multiple
    workspaces, you need to register the plugin for each workspace separately,
    and the stats will be tracked separately.
  - `numBlocksPerCategory` (optional): The maximum number of blocks to show in
    each category. Defaults to 10.
  - `waitForFinishedLoading` (optional): Whether to wait for the
    [`Blockly.Events.FinishedLoading` event](https://developers.google.com/blockly/reference/js/blockly.events_namespace.finishedloading_class.md)
    before taking action on any new `BlockCreate` events. If you disable event
    firing while you load the initial state of the workspace, you'll need to set
    this to `false`, or the plugin will never place blocks in either category.
    By default, this value is `true`, so that events fired while loading initial
    serialized state do not affect the statistics. If you leave this value as `true`,
    you need to ensure the `FinishedLoading` event is always fired; if you don't call
    `Blockly.serialization.workspaces.load` when there is no saved state to load, you'll
    need to fire it yourself for this plugin to work correctly.

## License

Apache 2.0
