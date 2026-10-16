# @blockly/toolbox-search [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds a toolbox category for searching
blocks. Selecting the category opens its flyout with a search field pinned to the top, and the
flyout fills with matching blocks as you type. The Blockly docs have
[more information about toolbox definitions and categories](https://docs.blockly.com/guides/configure/toolboxes/category/).

## Keyboard

The category behaves like any other, except that moving into its flyout lands in the search field
rather than on the first block. `Ctrl`/`Cmd`+`B` also opens the category and puts the cursor there
from anywhere.

From inside the search field, in any toolbox:

- `Enter`: go to the first result
- `Escape`: go to the workspace
- `Left`/`Right`: move the cursor, and never leave the field

In a vertical toolbox:

- `Up`/`Down`: move between the search field and the results, wrapping at either end

In a horizontal toolbox:

- `Up`: go back to the category, if the toolbox is at the top
- `Down`: go back to the category, if the toolbox is at the bottom

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
