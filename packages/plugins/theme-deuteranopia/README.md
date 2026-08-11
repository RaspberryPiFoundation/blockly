# @blockly/theme-deuteranopia [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) theme for people that have
deuteranopia (the inability to perceive green light). This can also be used for
people that have protanopia (the inability to perceive red light).

![A Blockly workspace using the deuteranopia theme.](https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/theme-deuteranopia/readme-media/DeuteranopiaTheme.png)

## Installation

### Yarn

```
yarn add @blockly/theme-deuteranopia
```

### npm

```
npm install @blockly/theme-deuteranopia --save
```

## Usage

```js
import * as Blockly from 'blockly';
import Theme from '@blockly/theme-deuteranopia';

Blockly.inject('blocklyDiv', {
  theme: Theme,
});
```

## License

Apache 2.0
