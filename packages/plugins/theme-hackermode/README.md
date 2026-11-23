# @blockly/theme-hackermode

## [<img src="https://github.com/RaspberryPiFoundation/blockly/raw/main/packages/docs/static/images/logos/built-with-blockly-badge-white.svg" alt="Built with Blockly" width="119">](https://github.com/RaspberryPiFoundation/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) theme that is designed to look like a movie hacker screen. It has a black background, black blocks and lime green text.

## Installation

### Yarn

```
yarn add @blockly/theme-hackermode
```

### npm

```
npm install @blockly/theme-hackermode --save
```

## Usage

```js
import * as Blockly from 'blockly';
import Theme from '@blockly/theme-hackermode';

Blockly.inject('blocklyDiv', {
  theme: Theme,
});
```

## License

Apache 2.0
