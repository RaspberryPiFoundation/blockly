# @blockly/field-date [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that uses a browser default "date" input.

## Installation

### Yarn

```
yarn add @blockly/field-date
```

### npm

```
npm install @blockly/field-date --save
```

## Usage

### JavaScript

```js
import * as Blockly from 'blockly';
import {FieldDate} from '@blockly/field-date';

Blockly.Blocks['test_fields_date'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('date: ')
      .appendField(new FieldDate('2020-02-20'), 'FIELDNAME');
  },
};
```

### JSON

```js
import * as Blockly from 'blockly';
import '@blockly/field-date';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_fields_date',
    message0: 'date: %1',
    args0: [
      {
        type: 'field_date',
        name: 'FIELDNAME',
        date: '2020-02-20',
      },
    ],
  },
]);
```

## License

Apache 2.0
