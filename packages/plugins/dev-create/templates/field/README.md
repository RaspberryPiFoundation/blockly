# @blockly/plugin [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

<!--
  - TODO: Add field description.
  -->

A [Blockly](https://www.npmjs.com/package/blockly) ... field.

## Installation

### Yarn

```
yarn add @blockly/plugin
```

### npm

```
npm install @blockly/plugin --save
```

## Usage

<!--
  - TODO: Update usage and rename field.
  -->

### JavaScript

```js
import * as Blockly from 'blockly';
import {FieldTemplate} from '@blockly/plugin';
Blockly.Blocks["test_field_template"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("template: ")
      .appendField(new FieldTemplate(...), "FIELDNAME");
  }
};
```

### JSON

```js
import * as Blockly from 'blockly';
import '@blockly/plugin';
Blockly.defineBlocksWithJsonArray([
    {
        "type": "test_field_template",
        "message0": "template: %1",
        "args0": [
            {
                "type": "field_template",
                "name": "FIELDNAME",
                "value": ...
            }
        ]
    }]);
```

## License

Apache 2.0
