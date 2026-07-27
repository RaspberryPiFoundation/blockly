# @blockly/field-dependent-dropdown [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) dropdown field where the options depend on the value of a parent field.

## Installation

### Yarn

```
yarn add @blockly/field-dependent-dropdown
```

### npm

```
npm install @blockly/field-dependent-dropdown --save
```

## Usage

This plugin adds a field type `FieldDependentDropdown` that is an extension of `Blockly.FieldDropdown` and is registered as `'field_dependent_dropdown'` for the JSON API. You can associate it with a parent field that is attached to the same block, along with a mapping from the parent field's possible values to the desired menu options for this child field. Whenever the parent field's value changes, this field will automatically change its own available options to the options that correspond to the new parent value. You can also provide a set of default options that will be used if the parent field's value doesn't match any of the keys in your option mapping.

These changes are recorded properly in the undo history, and the fields can be [serialized and later deserialized](https://developers.google.com/blockly/guides/configure/web/serialization) while preserving their options, values, and validity. You can also create chains of dependent dropdowns that depend on other dependent dropdowns.

Note that the parent field must be attached to the block before the child field, and the child field will attach a validator function to the parent field to intercept changes to its value. If you want to add your own [custom field validator](https://developers.google.com/blockly/guides/create-custom-blocks/fields/validators) to the parent field, you need to use [the JavaScript API to define your block](https://developers.google.com/blockly/guides/create-custom-blocks/define/json-and-js) and [pass your validator to the parent field's constructor](https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/dropdown#creating_a_dropdown_validator). If you try to set the parent's validator later, you'll overwrite the one added by this plugin.

To create a dependent dropdown, you'll need to add this field type to a block definition, and add that block to your toolbox. See below for an example of defining a block that uses this field.

### JSON

```js
import * as Blockly from 'blockly';
import '@blockly/field-dependent-dropdown'; // Import with side effects.

Blockly.defineBlocksWithJsonArray([
  {
    'type': 'dependent_dropdown_example',
    'message0': 'Category %1 Animal %2',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'ANIMAL_CATEGORY',
        'options': [['Mammal', 'mammal'], ['Bird', 'bird'], ['Cryptid', 'cryptid']]
      },
      {
        'type': 'field_dependent_dropdown',
        'name': 'ANIMAL',
        'parentName': 'ANIMAL_CATEGORY',
        'optionMapping': {
          'mammal': [['Dog', 'dog'], ['Cat', 'cat'], ['Hamster', 'hamster']],
          'bird': [['Parakeet', 'parakeet'], ['Canary', 'canary']]
        }
        'defaultOptions': [['None available', 'noneAvailable']],
      }
    ]
  }
]);
```

### JavaScript

```js
import * as Blockly from 'blockly';
import {FieldDependentDropdown} from '@blockly/field-dependent-dropdown';

Blockly.Blocks['dependent_dropdown_example'] = {
  init: function () {
    const parentFieldName = 'ANIMAL_CATEGORY';
    const childFieldName = 'ANIMAL';
    const parentOptions = [
      ['Mammal', 'mammal'],
      ['Bird', 'bird'],
      ['Cryptid', 'cryptid'],
    ];
    const optionMapping = {
      mammal: [
        ['Dog', 'dog'],
        ['Cat', 'cat'],
        ['Hamster', 'hamster'],
      ],
      bird: [
        ['Parakeet', 'parakeet'],
        ['Canary', 'canary'],
      ],
    };
    const defaultOptions = [['None available', 'noneAvailable']];
    this.appendDummyInput()
      .appendField('Category')
      .appendField(new Blockly.FieldDropdown(parentOptions), parentFieldName)
      .appendField('Animal')
      .appendField(
        new FieldDependentDropdown(
          parentFieldName,
          optionMapping,
          defaultOptions,
        ),
        childFieldName,
      );
  },
};
```

## License

Apache 2.0
