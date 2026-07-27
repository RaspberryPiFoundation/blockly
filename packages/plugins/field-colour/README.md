# @blockly/field-colour [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) field and blocks for
choosing and combining colours.

## Installation

### Yarn

```
yarn add @blockly/field-colour
```

### npm

```
npm install @blockly/field-colour --save
```

## Usage

If you want to use this field in a block definition, you must install it by
calling `registerFieldColour` before instantiating your blocks. If another
field is registered under the same name (`field_colour`), this field will
overwrite it.

If you [install the blocks](#blocks) in this package, the field will
automatically be installed.

### Field

The colour field stores a string as its `value`, and a string as its `text`. Its
`value` is a string with the format `#rrggbb`, while its `text` may be a string
with the format `#rgb` if possible.

#### Colour field

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/field-colour/readme-media/on_block.png)

#### Colour field with editor open

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/field-colour/readme-media/with_editor.png)

#### Colour field on collapsed block

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/field-colour/readme-media/collapsed.png)

### Creation

#### JavaScript

```js
import * as Blockly from 'blockly';
import {registerFieldColour} from '@blockly/field-colour';

registerFieldColour();
Blockly.Blocks['test_field_colour'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('colour: ')
      .appendField(
        new FieldColour('#ff4040', null, {
          colourOptions: [
            '#ff4040',
            '#ff8080',
            '#ffc0c0',
            '#4040ff',
            '#8080ff',
            '#c0c0ff',
          ],
          colourTitles: [
            'dark pink',
            'pink',
            'light pink',
            'dark blue',
            'blue',
            'light blue',
          ],
          columns: 3,
        }),
        'FIELDNAME',
      );
  },
};
```

#### JSON

```js
import * as Blockly from 'blockly';
import {registerFieldColour} from '@blockly/field-colour';

registerFieldColour();
Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_field_colour',
    message0: 'colour: %1',
    args0: [
      {
        type: 'field_colour',
        name: 'FIELDNAME',
        colour: '#ff4040',
        colourOptions: [
          '#ff4040',
          '#ff8080',
          '#ffc0c0',
          '#4040ff',
          '#8080ff',
          '#c0c0ff',
        ],
        colourTitles: [
          'dark pink',
          'pink',
          'light pink',
          'dark blue',
          'blue',
          'light blue',
        ],
        columns: 3,
      },
    ],
  },
]);
```

The colour constructor takes in the following:

- an optional `value`
- an optional [validator](#creating-a-colour-validator)
- an optional map of options, including:
  - `colourOptions`
  - `colourTitles`
  - `columns`

The `value` should be a string in the format `#rrggbb`. If no `value`
is given or the given `value` is invalid, the first entry in the
default colours array will be used.

The following options can also be set in JSON:

- `colourOptions`
- `colourTitles`
- `columns`

Or they can be set using [JavaScript hooks](#editor-options).

## Customization

### Editor options

The `setColours`
function can be used to set the colour options of a colour field. It takes in an
array of colour strings, which must be defined in `#rrggbb` format, and an
optional array of tooltips. If the tooltip array is not provided, the default
tooltip array will be used.

Tooltips and colours are matched based on array index, not based on value. If
the colours array is longer than the tooltip array, the tooltips for the extra
colours will be their `#rrggbb` value.

The setColumns function sets the number of columns in the colour picker.

#### JSON

```js
{
  "type": "example_colour",
  "message0": "colour: %1",
  "args0": [
    {
      "type": "field_colour",
      "name": "COLOUR",
      "colour": "#ff4040"
    }
  ],
  "extensions": ["set_colours_extension"]
}
```

```js
Blockly.Extensions.register('set_colours_extension', function () {
  var field = this.getField('COLOUR');
  field.setColours(
    ['#ff4040', '#ff8080', '#ffc0c0', '#4040ff', '#8080ff', '#c0c0ff'],
    ['dark pink', 'pink', 'light pink', 'dark blue', 'blue', 'light blue'],
  );
  field.setColumns(3);
});
```

This is done using a JSON
[extension](https://developers.google.com/blockly/guides/create-custom-blocks/define/extensions).

#### JavaScript

```js
Blockly.Blocks['example_colour'] = {
  init: function () {
    var field = new Blockly.FieldColour('#ff4040');
    field.setColours(
      ['#ff4040', '#ff8080', '#ffc0c0', '#4040ff', '#8080ff', '#c0c0ff'],
      ['dark pink', 'pink', 'light pink', 'dark blue', 'blue', 'light blue'],
    );
    field.setColumns(3);
    this.appendDummyInput().appendField('colour:').appendField(field, 'COLOUR');
  },
};
```

![Customized colour field editor](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/field-colour/readme-media/customized.png)

#### Creating a colour validator

Note: For information on validators in general see [Validators](https://developers.google.com/blockly/guides/create-custom-blocks/fields/validators).

A colour field's value is a `#rrggbb` format string, so any validators must
accept a `#rrggbb` format string, and return a `#rrggbb` format string, `null`,
or `undefined`.

Here is an example of a validator that changes the colour of the block to match
the colour of the field.

```
function(newValue) {
  this.getSourceBlock().setColour(newValue);
  return newValue;
}
```

#### Block changing colour based on its colour field

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/field-colour/readme-media/validator.gif)

### Blocks

This package also provides four blocks related to the colour field. Each block
has generators in JavaScript, Python, PHP, Lua, and Dart.

- "colour_blend" takes in two colours and a ratio and outputs a single colour.
- "colour_picker" is a simple block with just the colour field and an output.
- "colour_random" generates a random colour.
- "colour_rgb" generates a colour based on red, green, and blue values.

You can install all four blocks by calling `installAllBlocks`. This will
install the blocks and all of their dependencies, including the colour field.
When calling `installAllBlocks`—or any of the individual `installSomeBlock`
functions—you can supply one or more `CodeGenerator` instances (e.g.
`javascriptGenerator`), and the install function will also install the correct
generator function for each block for the corresponding language(s).

```js
import {javascriptGenerator} from 'blockly/javascript';
import {dartGenerator} from 'blockly/dart';
import {phpGenerator} from 'blockly/php';
import {pythonGenerator} from 'blockly/python';
import {luaGenerator} from 'blockly/lua';
import {installAllBlocks as installColourBlocks} from '@blockly/field-colour';

// Installs all four blocks, the colour field, and all language generators.
installColourBlocks({
  javascript: javascriptGenerator,
  dart: dartGenerator,
  lua: luaGenerator,
  python: pythonGenerator,
  php: phpGenerator,
});
```

If you only want to install a single block, you can call that block's
`installBlock` function. The `generators` parameter is the same.

```js
import {javascriptGenerator} from 'blockly/javascript';
import {colourBlend} from '@blockly/field-colour';

// Installs the colour_blend block, the colour field,
// and the generator for colour_blend in JavaScript.
colourBlend.installBlock({
  javascript: javascriptGenerator,
});
```

#### Message files and locales

The blocks in this package contain text that can be localized into multiple
languages. As of August 2024, the relevant messages are included in the core
Blockly language files. For information on Blockly's approach to localization,
see [Localization](https://developers.google.com/blockly/guides/configure/web/translations)
in the developer's guide.

If your blocks show `%{BKY_COLOUR_BLEND_TITLE}` or similar text instead
of the expected text, make sure that you either:

- Import the default Blockly modules, which includes the English langfiles, or
- Explicitly import a language and call `setLocale` before using these blocks.

For more information, see [Load a Blockly localization
table](https://developers.google.com/blockly/guides/configure/web/translations#load-blockly).

### API Reference

- `setColours`: Sets the colour options, and optionally the titles for the
  options. The colours should be an array of `#rrggbb` strings.
- `setColumns`: Sets the number of columns the dropdown should have.

## License

Apache 2.0
