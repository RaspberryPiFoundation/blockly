# @blockly/dev-tools [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A library of helpful tools for Blockly development.

## Installation

```
npm install @blockly/dev-tools -D --save
```

## Usage

### Playground

The playground is a tremendously useful tool for debugging your Blockly project. As a preview, here is [one of the plugin playgrounds](https://raspberrypifoundation.github.io/blockly-samples/plugins/theme-modern/test/). The playground features are:

- All the default blocks
- All the language generators (JavaScript, Python, PHP, Lua, and Dart)
- Switch between different Blockly options (eg: rtl, renderer, readOnly, zoom and scroll)
- Switch between different toolboxes and themes
- Import and export programs, or generate code using one of the built-in generators
- Trigger programmatic actions (eg: Show/hide, Clear, Undo/Redo, Scale)
- A debug renderer
- Stress tests for the renderer
- Log all events in the console

```js
import {createPlayground} from '@blockly/dev-tools';

const defaultOptions = {
  ...
};
createPlayground(document.getElementById('blocklyDiv'), (blocklyDiv, options) => {
  return Blockly.inject(blocklyDiv, options);
}, defaultOptions);
```

This package also exports pieces of the playground (addGUIControls, addCodeEditor) if you'd rather build your own playground.

### Toolboxes

Blockly built-in Simple and Category toolboxes.

```js
import * as Blockly from 'blockly';
import {toolboxSimple, toolboxCategories} from '@blockly/dev-tools';

Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});
```

#### Test Toolbox

The test toolbox is re-exported in this package, but can be imported as a stand-alone through [@blockly/block-test](https://www.npmjs.com/package/@blockly/block-test). See the README for details.

### Helpers

#### `populateRandom`

The `populateRandom` function adds random blocks to a workspace. Blocks are selected from the full set of defined blocks. Pass in a worskpace and how many blocks should be created.

```js
import {populateRandom} from '@blockly/dev-tools';
// Add 10 random blocks to the workspace.
populateRandom(workspace, 10);
```

#### `spaghetti`

The `spaghetti` function is a renderer stress test that populates the workspace with nested if-statements. Pass in a worskpace and how deep the nesting should be.

```js
import {spaghetti} from '@blockly/dev-tools';
spaghetti(workspace, 8);
```

#### `generateFieldTestBlocks`

The `generateFieldTestBlocks` function automatically generates a number of field testing blocks for the passed-in field. This is useful for testing field plugins.

```js
import {generateFieldTestBlocks} from '@blockly/dev-tools';

const toolbox = generateFieldTestBlocks('field_template', [
  {
    args: {
      value: 0, // default value
    },
  },
]);
```

### Test Helpers

This package is also used in mocha tests, and exports a suite of useful test helpers.
You can find the full list of helpers [here](https://github.com/RaspberryPiFoundation/blockly/blob/main/packages/plugins/dev-tools/src/test_helpers.mocha.js).

### Debug Renderer

The [debug renderer][dev-tools] is a renderer plugin that wraps your normal
renderer, and visualizes the measurements the [render info][render-info]
collects. This is extremely helpful for understanding what your renderer thinks
about the block it is trying to render.

#### What it surfaces

The debug renderer can show you several different things.

<table>
  <tr>
    <th>Debug info</th>
    <th>Image</th>
    <th>Description</th>
  </tr>
    <td><a href="https://docs.blockly.com/guides/create-custom-blocks/renderers/concepts/rows/">Rows</a></td>
    <td><img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/dev-tools/readme-media/row.png"/></td>
    <td>The bounds of the individual rows in a block.</td>
  <tr>
    <td><a href="https://docs.blockly.com/guides/create-custom-blocks/renderers/concepts/rows/#row-spacer">Row spacers</a></td>
    <td><img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/dev-tools/readme-media/row-spacer.png"/></td>
    <td>The bounds of the row spacers in a block.</td>
  </tr>
  <tr>
    <td><a href="https://docs.blockly.com/guides/create-custom-blocks/renderers/concepts/elements/">Elements</a></td>
    <td><img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/dev-tools/readme-media/element.png"/></td>
    <td>The bounds of the elements in a block.</td>
  </tr>
  <tr>
    <td><a href="https://docs.blockly.com/guides/create-custom-blocks/renderers/concepts/elements/#element-spacer">Element spacers</a></td>
    <td><img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/dev-tools/readme-media/element-spacer.png"/></td>
    <td>The bounds of the element spacers in a block.</td>
  </tr>
  <tr>
    <td>Connections</td>
    <td><img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/dev-tools/readme-media/connection.png"/></td>
    <td>
      The locations of the connection points, with large circles for next and
      input connections (parent connections) and small circles for output and
      previous connections (child connections).
  </td>
  </tr>
  <tr>
    <td>Block bounds</td>
    <td><img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/dev-tools/readme-media/block-bounds.png"/></td>
    <td>
      The bounds of the block, not including any child blocks.
    </td>
  </tr>
  <tr>
    <td>Connectioned block bounds</td>
    <td><img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/dev-tools/readme-media/block-bounds-with-children.png"/></td>
    <td>
      The bounds of the block, including child blocks.
    </td>
  </tr>
  <tr>
    <td>Render / paint</td>
    <td></td>
    <td>
      Flashes the block red when the renderer rerenders the block, equivalent
      to <a href="https://developer.chrome.com/docs/devtools/rendering/performance/#paint-flashing">paint flashing</a>
      in Chrome.
    </td>
  </tr>
</table>

#### How to use it

The debug renderer wraps your existing renderer, and then you can register and
use it just like any other renderer.

```js
import {createNewRenderer, DebugDrawer} from '@blockly/dev-tools';

const DebugRenderer = createNewRenderer(YourCustomRenderer);
Blockly.blockRendering.register('debugRenderer', DebugRenderer);

Blockly.inject('blocklyDiv', {renderer: 'debugRenderer'});
```

To see the different information the debug renderer surfaces, you can modify
the config from the browser console.

```js
DebugDrawer.config = {
  rows: true,
  rowSpacers: true,
  elems: true,
  elemSpacers: true,
  connections: true,
  blockBounds: true,
  connectedBlockBounds: true,
  render: true,
};
```

[render-info]: https://docs.blockly.com/guides/create-custom-blocks/renderers/concepts/info/
[dev-tools]: https://www.npmjs.com/package/@blockly/dev-tools

### Logger

A lightweight workspace console logger.

```js
import {logger} from '@blockly/dev-tools';

logger.enableLogger(workspace);
logger.disableLogger(workspace);
```

The logger is included by default in the playground.

## License

Apache 2.0
