# @blockly/workspace-minimap [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds a minimap to the workspace. A minimap is a miniature version of your blocks that appears on top of your main workspace. This gives you an overview of what your code looks like, and how it is organized.
There is a focus region within the minimap that highlights the users's current viewport; this is on by default.

![Minimap example](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/workspace-minimap/readme-media/sample_minimap.png)

## Installation

### Yarn

```
yarn add @blockly/workspace-minimap
```

### npm

```
npm install @blockly/workspace-minimap --save
```

## Usage

### Positioned Minimap

A positioned minimap is an embedded component that lies on top of the primary workspace. When using a PositionedMinimap, the size of the minimap is determined by the window size, and the position by the primary workspace layout configuration.

```js
import * as Blockly from 'blockly';
import {PositionedMinimap} from '@blockly/workspace-minimap';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const minimap = new PositionedMinimap(workspace);
minimap.init();
```

### Unpositioned Minimap

A raw minimap is an object whose size and position is configured using css.

```js
import * as Blockly from 'blockly';
import {Minimap} from '@blockly/workspace-minimap';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const minimap = new Minimap(workspace);
minimap.init();
```

```css
.blockly-minimap {
  position: absolute;
  box-shadow: none;
  width: 200px;
  height: 150px;
  top: 0px;
  left: 50vw;
}
```

### Configuration

The minimap takes a workspace as input and it inherits its RTL and theme properties (so that they don't need to be configured manually).
Additional styling of the minimap is possible with CSS. Use the `blockly-minimap` class for the minimap (box-shadow, etc.) and `blockly-focus-region` for the focus region (fill color, etc.).

## Keyboard accessibility

The minimap is a single tab stop in the page tab order. When focused, the arrow
keys pan the main workspace:

| Key          | Action                  |
| ------------ | ----------------------- |
| `ArrowUp`    | Pan the workspace up    |
| `ArrowDown`  | Pan the workspace down  |
| `ArrowLeft`  | Pan the workspace left  |
| `ArrowRight` | Pan the workspace right |

Modifier key combinations (Ctrl, Alt, Shift, Meta) are passed through without
panning.

The default pan distance is 40 workspace pixels per keypress and is
configurable:

```js
minimap.setKeyboardPanStep(80); // pan 80px per arrow press
```

## API

- `init`: Initializes the minimap.
- `dispose`: Disposes of the minimap.

- `isFocusEnabled`: Returns whether the focus region is enabled.
- `enableFocusRegion`: Turns on the focus region in the minimap.
- `disableFocusRegion`: Turns off the focus region in the minimap.

- `setKeyboardPanStep(stepPixels)`: Sets how far (in primary-workspace pixels)
  each arrow keypress pans the workspace when the minimap is focused.
- `getKeyboardPanStep()`: Returns the current keyboard pan step in
  primary-workspace pixels.

The following methods are also accessible with PositionedMinimap instances.

- `position`: Positions the minimap UI element.
- `getBoundingRectangle`: Returns the bounding rectangle of the UI element in
  pixel units relative to the Blockly injection div.

## License

Apache 2.0
