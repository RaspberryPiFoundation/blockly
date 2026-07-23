# @blockly/plugin-typed-variable-modal [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds the ability
to create a modal for creating typed variables.

## Installation

```
npm install @blockly/plugin-typed-variable-modal --save
```

## Usage

To add a Typed Variable Modal to your application you will have to create a
custom dynamically populated flyout category. More information on custom flyouts
can be
found [here](https://developers.google.com/blockly/guides/configure/web/toolbox?hl=en#dynamic_categories).

#### Import

```js
import * as Blockly from 'blockly';
import {TypedVariableModal} from '@blockly/plugin-typed-variable-modal';
```

or

```js
<script src="https://unpkg.com/@blockly/plugin-typed-variable-modal"></script>
```

#### Setup

Create your workspace.

```js
workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolbox,
});
```

Add a custom category to your toolbox.

```xml
<category name="Colours" custom="CREATE_TYPED_VARIABLE"></category>
```

Define a callback to provide the category content.

```js
const createFlyout = function (workspace) {
  let xmlList = [];
  // Add your button and give it a callback name.
  const button = document.createElement('button');
  button.setAttribute('text', 'Create Typed Variable');
  button.setAttribute('callbackKey', 'callbackName');

  xmlList.push(button);

  // This gets all the variables that the user creates and adds them to the
  // flyout.
  const blockList = Blockly.VariablesDynamic.flyoutCategoryBlocks(workspace);
  xmlList = xmlList.concat(blockList);
  return xmlList;
};
```

Register the callback for the toolbox category.

```js
workspace.registerToolboxCategoryCallback(
  'CREATE_TYPED_VARIABLE',
  createFlyout,
);
```

Create your Typed Variable Modal using the workspace, callbackName for the
button and your types.

```js
const typedVarModal = new TypedVariableModal(workspace, 'callbackName', [
  ['PENGUIN', 'Penguin'],
  ['GIRAFFE', 'Giraffe'],
]);
typedVarModal.init();
```

#### Blockly Languages

We do not currently support translating the text in this plugin to different
languages. However, if you would like to support multiple languages the
different messages in the typed variable modal can be set by calling `typedVarModal.setLocale(messages)`.

Messages that need to be translated for a Typed Variable Modal:

- `TYPED_VAR_MODAL_CONFIRM_BUTTON` (Default: "Ok"): The label for the confirmation button.
- `TYPED_VAR_MODAL_VARIABLE_NAME_LABEL` (Default: "Variable Name: "): The label in front of the variable input.
- `TYPED_VAR_MODAL_TYPES_LABEL` (Default: "Variable Types"): The label in front of the types.
- `TYPED_VAR_MODAL_CANCEL_BUTTON` (Default: "Cancel"): The label for the cancel button.
- `TYPED_VAR_MODAL_TITLE` (Default: "Create Typed Variable"): The modal title.
- `TYPED_VAR_MODAL_INVALID_NAME`
  (Default: "Name is not valid. Please choose a different name.") The message used
  when a user gives an invalid variable name. Name is invalid if it is the message
  used for renaming a variable, creating a variable, or an empty string.

## API

- `init`: Create a typed variable modal and register it with the given button name.
- `dispose`: Dispose of the typed variable modal.
- `show`: Shows the modal and focus on the first focusable element.
- `hide`: Hide the modal.
- `render`: Create all the dom elements for the modal.
- `setLocale`: Change the language for the typed variable modal.

## License

Apache 2.0
