# @blockly/zoom-to-fit

## [<img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/docs/static/images/logos/built-with-blockly-badge-white.svg" alt="Built with Blockly" width="119">](https://github.com/RaspberryPiFoundation/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds a
zoom-to-fit control to the workspace.

## Installation

### Yarn

```
yarn add @blockly/zoom-to-fit
```

### npm

```
npm install @blockly/zoom-to-fit --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {ZoomToFitControl} from '@blockly/zoom-to-fit';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const zoomToFit = new ZoomToFitControl(workspace);
zoomToFit.init();
```

## API

- `init`: Initializes the zoom-to-fit control.
- `dispose`: Disposes of the zoom-to-fit control.
- `getBoundingRectangle`: Returns the bounding rectangle of the UI element in
  pixel units relative to the Blockly injection div.
- `position`: Positions the zoom-to-fit control.

## License

Apache 2.0
