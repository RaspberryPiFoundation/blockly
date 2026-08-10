# @blockly/theme-highcontrast [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly theme that uses darker colors
for the blocks to create contrast between the block color and the white text.

![A Blockly workspace using the high contrast theme.](https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/theme-highcontrast/readme-media/HighContrastTheme.png)

## Installation

### Yarn

```
yarn add @blockly/theme-highcontrast
```

### npm

```
npm install @blockly/theme-highcontrast --save
```

## Usage

```js
import * as Blockly from 'blockly';
import Theme from '@blockly/theme-highcontrast';

Blockly.inject('blocklyDiv', {
  theme: Theme,
});
```

## License

Apache 2.0
