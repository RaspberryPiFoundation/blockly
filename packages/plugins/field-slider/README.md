# @blockly/field-slider

## [<img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/docs/static/images/logos/built-with-blockly-badge-white.svg" alt="Built with Blockly" width="119">](https://github.com/RaspberryPiFoundation/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) slider field.

## Installation

### Yarn

```
yarn add @blockly/field-slider
```

### npm

```
npm install @blockly/field-slider --save
```

## Usage

This field is an extension of the Blockly.FieldNumber field. See the [Blockly.FieldNumber documentation](https://docs.blockly.com/guides/create-custom-blocks/fields/built-in-fields/number/#creation) on what parameters and configurations this field supports.

### JavaScript

```js
import * as Blockly from 'blockly';
import {FieldSlider} from '@blockly/field-slider';
Blockly.Blocks['test_field_slider'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('slider: ')
      .appendField(new FieldSlider(50), 'FIELDNAME');
  },
};
```

### JSON

```js
import * as Blockly from 'blockly';
import '@blockly/field-slider';
Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_field_slider',
    message0: 'slider: %1',
    args0: [
      {
        type: 'field_slider',
        name: 'FIELDNAME',
        value: 50,
      },
    ],
  },
]);
```

## License

Apache 2.0
