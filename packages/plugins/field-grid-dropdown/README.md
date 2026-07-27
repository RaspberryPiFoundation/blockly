# @blockly/field-grid-dropdown [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) dropdown field with grid layout.

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/field-grid-dropdown/readme-media/dropdown.png)

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/field-grid-dropdown/readme-media/dropdown-images.png)

## Installation

### Yarn

```
yarn add @blockly/field-grid-dropdown
```

### npm

```
npm install @blockly/field-grid-dropdown --save
```

## Usage

This field accepts the same parameters as the [Blockly.FieldDropdown](https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/dropdown#creation)
in Blockly core. The config object bag passed into this field accepts additional optional parameters:

- `"columns"` to specify the number of columns in the dropdown field (must be an integer greater than 0).
  If not provided, the default is 3 columns.
- `"primaryColour"` to specify the colour of the dropdown (must be a string CSS colour). If not provided,
  the dropdown color will match the primary colour of the parent block.
- `"borderColour"` to specify the colour of the border of the dropdown (must be a string CSS colour). If
  not provided, the border colour will match the tertiary colour of the parent block.

### JavaScript

```js
import * as Blockly from 'blockly';
import {FieldGridDropdown} from '@blockly/field-grid-dropdown';
Blockly.Blocks['test_field_grid_dropdown'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('grid dropdown: ')
      .appendField(
        new FieldGridDropdown([
          ['A', 'A'],
          ['B', 'B'],
          ['C', 'C'],
          ['D', 'D'],
          ['E', 'E'],
          ['F', 'F'],
          ['G', 'G'],
          ['H', 'H'],
        ]),
        'FIELDNAME',
      );
  },
};
```

### JSON

```js
import * as Blockly from 'blockly';
import '@blockly/field-grid-dropdown';
Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_field_grid_dropdown',
    message0: 'template: %1',
    args0: [
      {
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        options: [
          ['A', 'A'],
          ['B', 'B'],
          ['C', 'C'],
          ['D', 'D'],
          ['E', 'E'],
          ['F', 'F'],
          ['G', 'G'],
          ['H', 'H'],
        ],
      },
    ],
  },
]);
```

## License

Apache 2.0
