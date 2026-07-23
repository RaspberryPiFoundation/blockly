# @blockly/block-plus-minus [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A group of [Blockly](https://www.npmjs.com/package/blockly) blocks that replace the built-in mutator UI with a +/-
based UI.

Currently this only affects the built-in blocks that use mutators (controls_if, text_join, list_create_with,
procedures_defnoreturn, and procedures_defreturn).

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/If.png)

But the ability to easily add this to your own mutators may be added
in the future.

## Installation

### Yarn

```
yarn add @blockly/block-plus-minus
```

### npm

```
npm install @blockly/block-plus-minus --save
```

## Usage

### Import

```js
import Blockly from 'blockly';
import '@blockly/block-plus-minus';
```

### Localization and text customization

The plus and minus buttons have ARIA labels to communicate their purpose to
screenreaders. These are localizable; additionally, if you want to customize the
labels (for example, to use a different term that "input" for procedure blocks)
you can do so by adjusting the messages:

```javascript
Blockly.Msg['ARIA_LABEL_ADD_INPUT'] = 'Add parameter';
// Inject workspace, etc...
```

### XML

Blocks will automatically use the +/- UI when loaded from XML. But here is some example XML incase you are trying to
add specific mutations of blocks:

#### If

```xml
<block type="controls_if"></block>
```

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/If.png)

```xml
<block type="controls_if">
    <mutation elseif="1"></mutation>
</block>
```

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/IfElseIf.png)

```xml
<block type="controls_if">
    <mutation elseif="1" else="1"></mutation>
</block>
```

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/IfElseIfElse.png)

#### Text Join

```xml
<block type="text_join"></block>
```

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/TextJoin.png)

```xml
<block type="text_join">
    <mutation items="0"></mutation>
</block>
```

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/TextJoinNone.png)

#### List Create

```xml
<block type="lists_create_with"></block>
```

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/ListCreateWith.png)

```xml
<block type="lists_create_with">
    <mutation items="0"></mutation>
</block>
```

![](https://github.com/RaspberryPiFoundation/blockly-samples/raw/master/plugins/block-plus-minus/readme-media/ListCreateWithNone.png)

## License

Apache 2.0
