# @blockly/fixed-edges [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) MetricsManager that makes
fixed edges more easily configurable.

## Installation

### Yarn

```
yarn add @blockly/fixed-edges
```

### npm

```
npm install @blockly/fixed-edges --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {FixedEdgesMetricsManager} from '@blockly/fixed-edges';

// Configure fixed edges
FixedEdgesMetricsManager.setFixedEdges({
  top: true,
  left: true,
});

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
  plugins: {
    metricsManager: FixedEdgesMetricsManager,
  },
});
```

## API

- `setFixedEdges`: Configures which edges are fixed. This does not prevent fixed
  edges set by no scrollbars or single-direction scrollbars.

## License

Apache 2.0
