# @blockly/workspace-backpack [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds a Backpack to the workspace.

## Installation

### Yarn

```
yarn add @blockly/workspace-backpack
```

### npm

```
npm install @blockly/workspace-backpack --save
```

## Features

### Context Menus

The following context menu options are available for the backpack:

- "Copy all Blocks" to Backpack in main Workspace
- "Paste all Blocks" from Backpack in main Workspace
- "Remove from Backpack" on Block stack in Backpack Flyout
- "Copy to Backpack" on a Block stack in main Workspace
- "Empty" option when right clicking the Backpack that is disabled if the Backpack is empty

![An animated picture of all the context menu options in use](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/workspace-backpack/readme-media/context-menu.gif)

## Usage

```js
import * as Blockly from 'blockly';
import {Backpack} from '@blockly/workspace-backpack';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const backpack = new Backpack(workspace);
backpack.init();
```

### Configuration

This plugin takes an optional configuration object.

```
{
  allowEmptyBackpackOpen: (boolean|undefined),
  useFilledBackpackImage: (boolean|undefined),
  skipSerializerRegistration: (boolean|undefined),
  contextMenu: {
    emptyBackpack: (boolean|undefined),
    removeFromBackpack: (boolean|undefined),
    copyToBackpack: (boolean|undefined),
    copyAllToBackpack: (boolean|undefined),
    pasteAllToBackpack: (boolean|undefined),
    disablePreconditionChecks: (boolean|undefined),
  },
}
```

The configuration options are passed in to the constructor. In this
configuration object, you can currently configure which context menu options are
registered at `init`.

```js
const backpackOptions = {
  allowEmptyBackpackOpen: true,
  useFilledBackpackImage: true,
  contextMenu: {
    emptyBackpack: true,
    removeFromBackpack: true,
    copyToBackpack: false,
  },
};
const backpack = new Backpack(workspace, backpackOptions);
```

The following options are the default values used for any property in the
passed in options that is undefined:

```js
const defaultOptions = {
  allowEmptyBackpackOpen: true,
  useFilledBackpackImage: false,
  skipSerializerRegistration: false,
  contextMenu: {
    emptyBackpack: true,
    removeFromBackpack: true,
    copyToBackpack: true,
    copyAllToBackpack: false,
    pasteAllToBackpack: false,
    disablePreconditionChecks: false,
  },
};
```

The `allowEmptyBackpackOpen` property, if set to `false`, will prevent the backpack flyout from
being opened if the backpack is empty.

The `useFilledBackpackImage` property, if set to `true`, will change the
backpack image when the backpack has something in it.

The `skipSerializerRegistration` property, if set to `true`, will not register the backpack serializer with the workspace serializer. Set this to `true` if you don't want the backpack to be serialized alongside the workspace.

The `disablePreconditionChecks` property will prevent the "Copy to Backpack"
context menu option from disabling the context menu option if the block is
already in the Backpack. Setting this flag to `true` to disable the check can be
beneficial for performance if you expect blocks stacks to be very large.

![An animated picture of the "Copy to Backpack" context menu](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/workspace-backpack/readme-media/context-menu-precondition.gif)

Note: Currently the empty Backpack context menu is registered globally, while
the others are registered per workspace.

## API

- `init`: Initializes the backpack.
- `dispose`: Disposes of backpack.

- `getCount`: Returns the count of items in the backpack.
- `getContents` Returns backpack contents.
- `empty`: Empties the backpack's contents. If the contents-flyout is currently
  open it will be closed.
- `addBlock`: Adds Block to backpack.
- `addBlocks`: Adds Blocks to backpack.
- `removeBlock`: Removes Block to backpack.
- `containsBlock`: Returns whether the Block is in the backpack.
- `addBackpackable`: Adds Backpackable to backpack.
- `addBackpackables`: Adds Backpackable to backpack.
- `removeBackpackable`: Removes Backpackable to backpack.
- `containsBackpackable`: Returns whether the Backpackable is in the backpack.
- `addItem`: Adds item to backpack.
- `removeItem`: Removes item from the backpack.
- `setContents`: Sets backpack contents.

- `isOpen`: Returns whether the backpack is open.
- `open`: Opens the backpack flyout.
- `close`: Closes the backpack flyout.

- `handleBlockDrop`: Handles a block drop on this backpack.
- `onDragEnter`: Handle mouse over.
- `onDragExit`: Handle mouse exit.

- `getBoundingRectangle`: Returns the bounding rectangle of the UI element in
  pixel units relative to the Blockly injection div.
- `position`: Positions the backpack UI element.

## Compatibility

### Multiple Backpacks per Workspace

This plugin also currently only supports one Backpack per Workspace.

### Blockly.configureContextMenu

This plugin registers a custom context menu by overriding
`Blockly.configureContextMenu` in `init` in order to support the context menu
for emptying the Backpack.
If you also override `Blockly.configureContextMenu` after initializing this
plugin, you must also call the old `Blockly.configureContextMenu` function.
Example:

```
const prevConfigureContextMenu = workspace.configureContextMenu;
workspace.configureContextMenu = (menuOptions, e) => {
  prevConfigureContextMenu &&
      prevConfigureContextMenu.call(null, menuOptions, e);
  ...
}
```

### Backpack Flyout

The Backpack Flyout uses the registered Flyout for either
`Blockly.registry.Type.FLYOUTS_HORIZONTAL_TOOLBOX` or
`Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX`, similar to the implementation
for `Blockly.Trashcan`. If a custom class is registered for either of these
types, then the Backpack Flyout may need to be tested for compatibility.

### Draggables

If you have a custom draggable object, you can make it possible to add it to
the backpack by implementing the [`Backpackable`][backpackable] interface.

This interface requires the draggable to have a method that converts it into
[`FlyoutItemInfo`][flyout-info]. As of Blockly core v11 flyouts only support displaying blocks, buttons, and labels.

## License

Apache 2.0

[flyout-info]: https://developers.google.com/blockly/reference/js/blockly.utils_namespace.toolbox_namespace.flyoutiteminfo_typealias.md
[backpackable]: https://github.com/RaspberryPiFoundation/blockly-samples/blob/master/plugins/workspace-backpack/src/backpack.ts
