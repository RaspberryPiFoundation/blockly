# @blockly/theme-dark [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) dark theme.

![A Blockly workspace using the dark theme.](https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/theme-dark/readme-media/DarkTheme.png)

## Installation

### Yarn

```
yarn add @blockly/theme-dark
```

### npm

```
npm install @blockly/theme-dark --save
```

## Usage

```js
import * as Blockly from 'blockly';
import DarkTheme from '@blockly/theme-dark';

Blockly.inject('blocklyDiv', {
  theme: DarkTheme,
});
```

## License

Apache 2.0
