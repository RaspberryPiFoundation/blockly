# @blockly/plugin-scroll-options [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds additional
scroll features.

This plugin adds two features related to scrolling:

- Users can scroll the workspace with the mousewheel while dragging a block
  or workspace comment ("wheel scroll").
- The workspace will automatically scroll when a block or workspace comment
  is dragged near the edge of the workspace ("edge scroll").

Each of these options can be enabled or disabled independently, if you only want
one of these behaviors. The edge scrolling behavior can also be configured with
options such as fast and slow scroll speeds and the distance from the edge of
the workspace that the block should be before autoscrolling is activated. See
the Usage and API sections for more details on how to configure these behaviors.

## Installation

### Yarn

```
yarn add @blockly/plugin-scroll-options
```

### npm

```
npm install @blockly/plugin-scroll-options --save
```

## Usage

Basic usage. If you don't pass any options to `init`, then you will get the
default behavior, which enables both scroll options and uses the default
parameters for edge scrolling.

```js
import * as Blockly from 'blockly';
import {
  ScrollOptions,
  ScrollBlockDragger,
  ScrollMetricsManager,
} from '@blockly/plugin-scroll-options';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
  plugins: {
    // These are both required.
    // Note that the ScrollBlockDragger drags things besides blocks.
    // Block is included in the name for backwards compatibility.
    blockDragger: ScrollBlockDragger,
    metricsManager: ScrollMetricsManager,
  },
  move: {
    wheel: true, // Required for wheel scroll to work.
  },
});

// Initialize plugin.
const plugin = new ScrollOptions(workspace);
plugin.init();
```

If you want to disable one (or both) behaviors from the start, you can pass
options to `init`.

```js
plugin.init({enableWheelScroll: false, enableEdgeScroll: false});
```

If you want to supply custom configuration to the edge scrolling behavior, you
can also pass in that option to `init`.

```js
plugin.init({edgeScrollOptions: {slowBlockSpeed: 0.1}});
```

This can be combined with the previous example to disable wheel scroll at the
same time. For more details on the edge scroll options, see the next section.

## API

The plugin is configured during initialization for convenience. It can also be
configured, or reconfigured, at any time afterwards using the following methods
on `ScrollOptions`:

- `enableWheelScroll`/`disableWheelScroll`
- `enableEdgeScroll`/`disableEdgeScroll`
- `updateEdgeScrollOptions`

**IMPORTANT**: Currently, the options to configure the edge scroll behavior are
provided statically due to the way a BlockDragger is initialized. Thus, each
instance of the plugin will share the same settings, even if you call
`updateEdgeScrollOptions` on different instances of the plugin (i.e., on
different workspaces). You can have some workspaces using the plugin and some
not, but any that are using the plugin will share the settings. If this is a
blocking issue for you, please file an issue on blockly-samples.

The edge scroll options are provided in an object with the following properties
(default values in parentheses):

- `slowBlockSpeed` (0.28), `fastBlockSpeed` (1.4): Pixels per ms to scroll
  based on how far the block is from the edge of the viewport.
- `slowBlockStartDistance` (0): Distance in workspace units that the edge of
  the block is from the edge of the viewport before the corresponding scroll
  speed will be used. Can be negative to start scrolling before the block
  extends over the edge.
- `fastBlockStartDistance` (50): Same as above, for fast speed. Must be larger
  than `slowBlockStartDistance`.
- `oversizeBlockThreshold` (0.85): If a block takes up this percentage of the
  viewport or more, it will be considered oversized. Rather than using the
  block edge, we use the mouse cursor plus the given margin size to activate
  block-based scrolling.
- `oversizeBlockMargin` (15): Cursor margin to use for oversized blocks. A
  bigger value will cause the workspace to scroll sooner, i.e., the mouse can
  be further inward from the edge when scrolling begins.
- `slowMouseSpeed` (0.5), `fastMouseSpeed` (1.6): Pixels per ms to scroll
  based on how far the mouse is from the edge of the viewport.
- `slowMouseStartDistance` (0): Distance in workspace units that the mouse is
  from the edge of the viewport before the corresponding scroll speed will be
  used. Can be negative to start scrolling before the mouse extends over the
  edge.
- `fastMouseStartDistance` (35): Same as above, for fast speed. Must be larger
  than `slowMouseStartDistance`.

Each of these options is configured with the default value shown, which is
specified in `ScrollBlockDragger.js`. When you call `updateEdgeScrollOptions`,
only the properties actually included in the `options` parameter will be set.
Any unspecified options will use the previously set value (where the initial
value is from the default options). Therefore, do not pass in any options with
explicit `undefined` or `null` values. The plugin will break. Just leave them
out of the object if you don't want to change the default value.

This method is safe to call multiple times. Subsequent calls will add onto
previous calls, not completely overwrite them. That is, if you call this with:

```js
updateEdgeScrollOptions({fastMouseSpeed: 5});
updateEdgeScrollOptions({slowMouseSpeed: 2});
```

Then the final options used will include both `fastMouseSpeed: 5` and
`slowMouseSpeed: 2` with all other options being the default values.

You can call `ScrollBlockDragger.resetOptions()` to restore all default options.

## Usage with other plugins

This plugin ships with its own `MetricsManager` implementation. Other plugins
may ship with their own `MetricsManager` implementations as well. If you wish
to use multiple of these plugins together, you will need to create your own
implementation of `MetricsManager` that combines the necessary features of
both. This plugin simply requires that content metrics be cacheable so that
it can see content metrics from before a drag was started, even in the middle
of a drag. Your implementation must satisfy the `isCacheable` type guard in
`ScrollMetricsManager.ts`.

## Usage with custom draggables

Blockly supports adding custom objects that implement the `Blockly.IDraggable`
interface. Custom draggables are compatible with this plugin, but they will
not support the autoscrolling features by default. You can enable autoscrolling
features on them by also implementing the `AutoScrollable` interface on your
draggable objects.

## License

Apache 2.0
