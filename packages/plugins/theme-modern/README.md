# @blockly/theme-modern

## [<img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/docs/static/images/logos/built-with-blockly-badge-white.svg" alt="Built with Blockly" width="119">](https://github.com/RaspberryPiFoundation/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) modern theme that uses the
same block colours as the [Classic theme](https://github.com/google/blockly/blob/master/core/theme/classic.ts)
but with darker borders. This theme was designed to be used with the Thrasos or
Zelos renderer.

![A Blockly workspace using the modern theme.](https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/plugins/theme-modern/readme-media/ModernTheme.png)

## Installation

### Yarn

```
yarn add @blockly/theme-modern
```

### npm

```
npm install @blockly/theme-modern --save
```

## Usage

```js
import * as Blockly from 'blockly';
import Theme from '@blockly/theme-modern';

Blockly.inject('blocklyDiv', {
  theme: Theme,
});
```

## License

Apache 2.0
