# @blockly/plugin-modal [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that renders a modal.

## Installation

### Yarn

```
yarn add @blockly/plugin-modal
```

### npm

```
npm install @blockly/plugin-modal --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {Modal} from '@blockly/plugin-modal';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const modal = new Modal(workspace);
modal.init();
```

## API

### Methods

- `init`: Create a modal.
- `dispose`: Dispose of the modal.
- `show`: Show the modal and focus on the first interactable element.
- `hide`: Hide the modal.
- `render`: Create all the dom elements for the modal.

### Properties

- `shouldCloseOnOverlayClick`: (default true) If set to true will close the
  overlay when a user clicks outside of the modal.
- `shouldCloseOnEsc`: (default true) If set to true will close the modal when the user hits escape.

## License

Apache 2.0
