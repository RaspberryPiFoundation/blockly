/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Field validators test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.Blocks['test_validators_dispose_block'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('dispose block')
      .appendField(
        new Blockly.FieldTextInput('default', this.validate),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      'Any changes to the text cause the block to be' + ' disposed',
    );
  },

  validate: function (newValue) {
    if (newValue != 'default') {
      this.getSourceBlock().dispose(true);
    }
  },
};

Blockly.Blocks['test_validators_text_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('always null')
      .appendField(
        new Blockly.FieldTextInput('default', this.validate),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      'All input validates to null (invalid). The display' +
        ' text will remain the input text, but the value should be the' +
        ' default text. The input should be red after the first keystroke.',
    );
  },

  validate: function (newValue) {
    return null;
  },
};
Blockly.Blocks['test_validators_text_A'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("remove 'a'")
      .appendField(
        new Blockly.FieldTextInput('default', this.validate),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      "All 'a' characters are removed from field value." +
        " The display text will include invalid 'a' characters while the" +
        ' field is being edited, but the value will not.',
    );
  },

  validate: function (newValue) {
    return newValue.replace(/a/g, '');
  },
};
Blockly.Blocks['test_validators_text_B'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("'b' -> null")
      .appendField(
        new Blockly.FieldTextInput('default', this.validate),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      "Upon detecting a 'b' character the input will" +
        ' validated to null (invalid). Upon removal it should revert to' +
        ' being valid. The display text will remain the input text, but if' +
        ' the input text is invalid the value should be the default text.',
    );
  },

  validate: function (newValue) {
    if (newValue.indexOf('b') !== -1) {
      return null;
    }
    return newValue;
  },
};

Blockly.Blocks['test_validators_checkbox_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('always null')
      .appendField(new Blockly.FieldCheckbox(true, this.validate), 'INPUT');
    this.setColour(230);
    this.setCommentText(
      'The new input always validates to null (invalid).' +
        ' This means that the field value should not change.',
    );
  },

  validate: function (newValue) {
    return null;
  },
};
Blockly.Blocks['test_validators_checkbox_match'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('force match')
      .appendField(new Blockly.FieldCheckbox(true), 'MATCH')
      .appendField(new Blockly.FieldCheckbox(true, this.validate), 'INPUT');
    this.setColour(230);
    this.setCommentText(
      'The validator for this block only works on the end-most checkbox.' +
        ' The validator will always return the value of the start-most' +
        ' checkbox. Therefore they should always match.',
    );
  },

  validate: function (newValue) {
    return this.sourceBlock_.getFieldValue('MATCH');
  },
};
Blockly.Blocks['test_validators_checkbox_not_match_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('not match -> null')
      .appendField(new Blockly.FieldCheckbox(true), 'MATCH')
      .appendField(new Blockly.FieldCheckbox(true, this.validate), 'INPUT');
    this.setColour(230);
    this.setCommentText(
      'The validator for this block only works on the' +
        ' end-most checkbox. If the new value does not match the value of the' +
        ' start-most checkbox, it will return null (invalid), which means the' +
        ' field value should not change. Therefore they should always match.',
    );
  },

  validate: function (newValue) {
    if (this.sourceBlock_.getFieldValue('MATCH') != newValue) {
      return null;
    }
    return newValue;
  },
};

Blockly.Blocks['test_validators_dropdown_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('always null')
      .appendField(
        new Blockly.FieldDropdown(
          [
            ['1a', '1A'],
            ['1b', '1B'],
            ['1c', '1C'],
            ['2a', '2A'],
            ['2b', '2B'],
            ['2c', '2C'],
          ],
          this.validate,
        ),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      'All input validates to null (invalid). This means' +
        ' the field value should not change.',
    );
  },

  validate: function (newValue) {
    return null;
  },
};
Blockly.Blocks['test_validators_dropdown_force_1s'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('force 1s')
      .appendField(
        new Blockly.FieldDropdown(
          [
            ['1a', '1A'],
            ['1b', '1B'],
            ['1c', '1C'],
            ['2a', '2A'],
            ['2b', '2B'],
            ['2c', '2C'],
          ],
          this.validate,
        ),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      "The input's value will always change to start with 1.",
    );
  },

  validate: function (newValue) {
    return '1' + newValue.charAt(1);
  },
};
Blockly.Blocks['test_validators_dropdown_1s_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('not 1s -> null')
      .appendField(
        new Blockly.FieldDropdown(
          [
            ['1a', '1A'],
            ['1b', '1B'],
            ['1c', '1C'],
            ['2a', '2A'],
            ['2b', '2B'],
            ['2c', '2C'],
          ],
          this.validate,
        ),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      'If the input does not start with 1, the input will validate to' +
        ' null (invalid). Otherwise it will return the input value.',
    );
  },

  validate: function (newValue) {
    if (newValue.charAt(0) != '1') {
      return null;
    }
    return newValue;
  },
};

Blockly.Blocks['test_validators_number_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('always null')
      .appendField(
        new Blockly.FieldNumber(123, null, null, null, this.validate),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      'All input validates to null (invalid). The field will display the' +
        ' input while the field is being edited, but the value should be the' +
        ' default value. The input should be red after the first' +
        ' keystroke.',
    );
  },

  validate: function (newValue) {
    return null;
  },
};
Blockly.Blocks['test_validators_number_mult10_force'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('force mult of 10')
      .appendField(
        new Blockly.FieldNumber(123, null, null, null, this.validate),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      'The input value will be rounded to the nearest' +
        ' multiple of 10. The field will display the input while the field is' +
        ' being edited, but the value should be the validated (rounded)' +
        ' value. Note: If you want to do rounding this is not the proper' +
        ' way, use the precision option of the number field constructor' +
        ' instead.',
    );
  },

  validate: function (newValue) {
    return Math.round(newValue / 10) * 10;
  },
};
Blockly.Blocks['test_validators_number_mult10_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('not mult of 10 -> null')
      .appendField(
        new Blockly.FieldNumber(123, null, null, null, this.validate),
        'INPUT',
      );
    this.setColour(230);
    this.setCommentText(
      'If the input value is not a multiple of 10, the' +
        ' input will validate to null (invalid). The field will display the' +
        ' input while the field is being edited, but if the input value is' +
        ' invalid the value should be the default value.',
    );
  },

  validate: function (newValue) {
    if (newValue % 10 != 0) {
      return null;
    }
    return newValue;
  },
};

Blockly.Blocks['test_validators_variable_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('always null')
      .appendField(new Blockly.FieldVariable('1a', this.validate), 'INPUT');
    this.setColour(230);
    this.setCommentText(
      'All ids validate to null (invalid). This means' +
        ' the variable should not change.',
    );
  },

  validate: function (newValue) {
    return null;
  },
};
Blockly.Blocks['test_validators_variable_force_1s'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('force 1s')
      .appendField(new Blockly.FieldVariable('1a', this.validate), 'INPUT');
    this.setColour(230);
    this.setCommentText('The id will always change to start with 1.');
  },

  validate: function (newValue) {
    return '1' + newValue.charAt(1);
  },
};
Blockly.Blocks['test_validators_variable_1s_null'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('not 1s -> null')
      .appendField(new Blockly.FieldVariable('1a', this.validate), 'INPUT');
    this.setColour(230);
    this.setCommentText(
      'If the id does not start with 1, the id will' +
        ' validate to null (invalid). Otherwise it will return the id.',
    );
  },

  validate: function (newValue) {
    if (newValue.charAt(0) != '1') {
      return null;
    }
    return newValue;
  },
};

/**
 * The Validators field category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Validators',
  contents: [
    {
      kind: 'BUTTON',
      text: 'add blocks to workspace',
      callbackkey: 'addAllBlocksToWorkspace',
    },
    {
      kind: 'SEP',
      gap: '8',
    },
    {
      kind: 'BUTTON',
      text: 'set input',
      callbackkey: 'setInput',
    },
    {
      kind: 'LABEL',
      text: 'Dispose block',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_dispose_block',
    },
    {
      kind: 'LABEL',
      text: 'Checkboxes',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_checkbox_null',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_checkbox_match',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_checkbox_not_match_null',
    },
    {
      kind: 'LABEL',
      text: 'Dropdowns',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_dropdown_null',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_dropdown_force_1s',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_dropdown_1s_null',
    },
    {
      kind: 'LABEL',
      text: 'Numbers',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_number_null',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_number_mult10_force',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_number_mult10_null',
    },
    {
      kind: 'LABEL',
      text: 'Text',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_text_null',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_text_A',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_text_B',
    },
    {
      kind: 'LABEL',
      text: 'Variables',
    },
    {
      kind: 'SEP',
      gap: '8',
    },
    {
      'kind': 'BUTTON',
      'text': 'add test variables',
      'callbackkey': 'addVariables',
      'web-class': 'modifiesWorkspace',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_variable_null',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_variable_force_1s',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_validators_variable_1s_null',
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  const addVariables = function (button) {
    workspace.getVariableMap().createVariable('1b', '', '1B');
    workspace.getVariableMap().createVariable('1c', '', '1C');
    workspace.getVariableMap().createVariable('2a', '', '2A');
    workspace.getVariableMap().createVariable('2b', '', '2B');
    workspace.getVariableMap().createVariable('2c', '', '2C');
  };
  const setInput = function (button) {
    Blockly.dialog.prompt('Input text to set.', 'ab', function (input) {
      const blocks = button.getTargetWorkspace().getAllBlocks(false);
      for (let i = 0, block; (block = blocks[i]); i++) {
        if (block.getField('INPUT')) {
          block.setFieldValue(input, 'INPUT');
        }
      }
    });
  };

  workspace.registerButtonCallback('addVariables', addVariables);
  workspace.registerButtonCallback('setInput', setInput);
}
