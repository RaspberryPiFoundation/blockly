# @blockly/toolbox-search [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds a toolbox category for searching
blocks. The category displays a search field in the toolbox, and filters the available blocks as you
type. The Blockly docs have [more information about toolbox definitions and categories](https://developers.google.com/blockly/guides/configure/web/toolboxes/category).

## Installation

### Yarn

```
yarn add @blockly/toolbox-search
```

### npm

```
npm install @blockly/toolbox-search --save
```

## Usage

```
import * as Blockly from 'blockly';
import '@blockly/toolbox-search';

const toolboxCategories = {
  'contents': [
    /* Other toolbox categories with blocks go here */
    {
      'kind': 'search',
      'name': 'Search',
      'contents': [],
    }
  ]
};

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});
```

## License

Apache 2.0
