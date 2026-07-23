# @blockly/workspace-content-highlight [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that highlights the
content on the workspace.

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/content-highlight/readme-media/content-highlight.gif)

## Installation

### Yarn

```
yarn add @blockly/workspace-content-highlight
```

### npm

```
npm install @blockly/workspace-content-highlight --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {ContentHighlight} from '@blockly/workspace-content-highlight';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const contentHighlight = new ContentHighlight(workspace);
contentHighlight.init();
```

## API

- `init`: Initializes the content highlight.
- `dispose`: Disposes of content highlight.

## License

Apache 2.0
