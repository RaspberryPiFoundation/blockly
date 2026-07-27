# @blockly/field-bitmap [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) field that allows for user-inputted pixel grids. The image value is stored as a 2D array of 1s and 0s, and supports any size. The user can paint over pixels with their mouse, or randomize the grid.

Note: this field does not support serialization to XML.

## Installation

### Yarn

```
yarn add @blockly/field-bitmap
```

### npm

```
npm install @blockly/field-bitmap --save
```

## Usage

This field accepts up to 6 parameters:

- `"value"` to specify an initial value. Must be a 2D rectangular array of 1s and 0s.
  If not provided, the default is an empty grid of the specified size.
- `"width"` to specify an initial width, if there is no initial value.
  If not provided, the default is a width of 5.
- `"height"` to specify an initial height, if there is no initial value.
  If not provided, the default is a height of 5.
- `fieldHeight"` to specify a static field height. If provided, the individual pixels
  will be resized to fit inside the field. This only affects the field as it is
  seen on a block and not the pop-up editor. Good for larger images. (_Note: If this
  results in fractional pixel sizes, the overall field height may not exactly match
  the specified value on all browsers._)
- `"colours"` to override the default colours, Default values:  
  `{filled: '#363d80', empty: '#fff'}`
- `"buttons"` to show or hide the "Randomize" and/or "Clear" buttons. If either is
  omitted, the button will be shown. Default values:  
  `{randomize: true, clear: true}`

### JavaScript

```js
import * as Blockly from 'blockly';
import {FieldBitmap} from 'blockly-field-bitmap';
Blockly.Blocks["test_field_bitmap"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("bitmap: ")
      .appendField(new FieldBitmap(...), "FIELDNAME");
  }
};
```

### JSON

Example with default value:

```js
import * as Blockly from 'blockly';
import '@blockly/field-bitmap';
Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_field_bitmap',
    message0: 'bitmap: %1',
    args0: [
      {
        type: 'field_bitmap',
        name: 'FIELDNAME',
        value: [
          [0, 0, 0, 0, 0, 0, 0],
          [0, 1, 1, 0, 1, 1, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 1, 1, 1, 1, 1, 0],
          [0, 1, 0, 0, 0, 1, 0],
          [0, 0, 1, 1, 1, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
        ],
      },
    ],
  },
]);
```

Example with width and height:

```js
import * as Blockly from 'blockly';
import '@blockly/field-bitmap';
Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_field_bitmap',
    message0: 'bitmap: %1',
    args0: [
      {
        type: 'field_bitmap',
        name: 'FIELDNAME',
        width: 8,
        height: 8,
      },
    ],
  },
]);
```

## License

Apache 2.0
