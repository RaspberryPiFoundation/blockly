# @blockly/block-dynamic-connection [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A group of [Blockly](https://www.npmjs.com/package/blockly) blocks that
add and remove connections dynamically.

## Installation

```
npm install @blockly/block-dynamic-connection --save
```

## Usage

```js
import * as Blockly from 'blockly';
import * as BlockDynamicConnection from '@blockly/block-dynamic-connection';

const myWorkspace = Blockly.inject({
    // options...
    plugins: {
      connectionPreviewer:
        BlockDynamicConnection.decoratePreviewer(
          // Replace with a custom connection previewer, or remove to decorate
          // the default one.
          Blockly.InsertionMarkerPreviewer,
        ),
    },
  };

// Add the change listener so connections will be finalized on deletion.
workspace.addChangeListener(BlockDynamicConnection.finalizeConnections);
```

## API

- `overrideOldBlockDefinitions`: Replaces the Blockly default blocks with the
  dynamic connection blocks. This enables projects to use the dynamic block
  plugin without changing existing XML/JSON.

## Blocks

- `dynamic_text_join` replaces `text_join`
- `dynamic_list_create` replaces `lists_create_with`
- `dynamic_if` replaces `controls_if`

## License

Apache 2.0
