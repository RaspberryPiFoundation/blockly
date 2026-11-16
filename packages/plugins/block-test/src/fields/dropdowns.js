/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Dropdown fields test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_dropdowns_long',
    message0: 'long: %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'FIELDNAME',
        options: [
          ['first item', 'ITEM1'],
          ['second item', 'ITEM2'],
          ['third item', 'ITEM3'],
          ['fourth item', 'ITEM4'],
          ['fifth item', 'ITEM5'],
          ['sixth item', 'ITEM6'],
          ['seventh item', 'ITEM7'],
          ['eighth item', 'ITEM8'],
          ['ninth item', 'ITEM9'],
          ['tenth item', 'ITEM10'],
          ['eleventh item', 'ITEM11'],
          ['twelfth item', 'ITEM12'],
          ['thirteenth item', 'ITEM13'],
          ['fourteenth item', 'ITEM14'],
          ['fifteenth item', 'ITEM15'],
          ['sixteenth item', 'ITEM16'],
          ['seventeenth item', 'ITEM17'],
          ['eighteenth item', 'ITEM18'],
          ['nineteenth item', 'ITEM19'],
          ['twentieth item', 'ITEM20'],
          ['twenty-first item', 'ITEM21'],
          ['twenty-second item', 'ITEM22'],
          ['twenty-third item', 'ITEM23'],
          ['twenty-fourth item', 'ITEM24'],
          ['twenty-fifth item', 'ITEM25'],
          ['twenty-sixth item', 'ITEM26'],
          ['twenty-seventh item', 'ITEM27'],
          ['twenty-eighth item', 'ITEM28'],
          ['twenty-ninth item', 'ITEM29'],
          ['thirtieth item', 'ITEM30'],
          ['thirty-first item', 'ITEM31'],
          ['thirty-second item', 'ITEM32'],
        ],
      },
    ],
  },
  {
    type: 'test_dropdowns_images',
    message0: '%1',
    args0: [
      {
        NOTE: 'The following paths are relative to playground.html',
        type: 'field_dropdown',
        name: 'FIELDNAME',
        options: [
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/a.png',
              width: 32,
              height: 32,
              alt: 'A',
            },
            'A',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/b.png',
              width: 32,
              height: 32,
              alt: 'B',
            },
            'B',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/c.png',
              width: 32,
              height: 32,
              alt: 'C',
            },
            'C',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/d.png',
              width: 32,
              height: 32,
              alt: 'D',
            },
            'D',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/e.png',
              width: 32,
              height: 32,
              alt: 'E',
            },
            'E',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/f.png',
              width: 32,
              height: 32,
              alt: 'F',
            },
            'F',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/g.png',
              width: 32,
              height: 32,
              alt: 'G',
            },
            'G',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/h.png',
              width: 32,
              height: 32,
              alt: 'H',
            },
            'H',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/i.png',
              width: 32,
              height: 32,
              alt: 'I',
            },
            'I',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/j.png',
              width: 32,
              height: 32,
              alt: 'J',
            },
            'J',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/k.png',
              width: 32,
              height: 32,
              alt: 'K',
            },
            'K',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/l.png',
              width: 32,
              height: 32,
              alt: 'L',
            },
            'L',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/m.png',
              width: 32,
              height: 32,
              alt: 'M',
            },
            'M',
          ],
        ],
      },
    ],
  },
  {
    type: 'test_dropdowns_images_and_text',
    message0: '%1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'FIELDNAME',
        options: [
          ['images and text', 'IMAGES AND TEXT'],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/a.png',
              width: 32,
              height: 32,
              alt: 'A',
            },
            'A',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/b.png',
              width: 32,
              height: 32,
              alt: 'B',
            },
            'B',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/c.png',
              width: 32,
              height: 32,
              alt: 'C',
            },
            'C',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/d.png',
              width: 32,
              height: 32,
              alt: 'D',
            },
            'D',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/e.png',
              width: 32,
              height: 32,
              alt: 'E',
            },
            'E',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/f.png',
              width: 32,
              height: 32,
              alt: 'F',
            },
            'F',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/g.png',
              width: 32,
              height: 32,
              alt: 'G',
            },
            'G',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/h.png',
              width: 32,
              height: 32,
              alt: 'H',
            },
            'H',
          ],
          ['xyz', 'LMNOP'],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/i.png',
              width: 32,
              height: 32,
              alt: 'I',
            },
            'I',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/j.png',
              width: 32,
              height: 32,
              alt: 'J',
            },
            'J',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/k.png',
              width: 32,
              height: 32,
              alt: 'K',
            },
            'K',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/l.png',
              width: 32,
              height: 32,
              alt: 'L',
            },
            'L',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/m.png',
              width: 32,
              height: 32,
              alt: 'M',
            },
            'M',
          ],
        ],
      },
    ],
  },
  {
    type: 'test_dropdowns_in_mutator',
    message0: 'dropdown mutator',
    mutator: 'test_dropdown_mutator',
  },
  {
    type: 'test_dropdowns_in_mutator_block',
    message0: 'dropdown %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'DROPDOWN',
        options: [
          ['option', 'ONE'],
          ['option', 'TWO'],
        ],
      },
    ],
  },
]);

/**
 * An array of options for the dynamic dropdown.
 * @type {!Array.<!Array>}
 * @private
 */
const dynamicDropdownOptions_ = [];

/**
 * Handles "add option" button in the field test category. This will prompt
 * the user for an option to add.
 * @package
 */
const addDynamicDropdownOption = function () {
  Blockly.dialog.prompt(
    'Add an option?',
    'option ' + dynamicDropdownOptions_.length,
    function (text) {
      if (text) {
        // Do not remove this log! Helps you know if it was added correctly.
        console.log('Adding option: ' + text);
        // The option is an array containing human-readable text and a
        // language-neutral id.
        dynamicDropdownOptions_.push([
          text,
          'OPTION' + dynamicDropdownOptions_.length,
        ]);
      }
    },
  );
};

/**
 * Handles "remove option" button in the field test category. This will prompt
 * the user for an option to remove. May remove multiple options with the
 * same name.
 * @package
 */
const removeDynamicDropdownOption = function () {
  const defaultText = dynamicDropdownOptions_[0]
    ? dynamicDropdownOptions_[0][0]
    : '';
  Blockly.dialog.prompt('Remove an option?', defaultText, function (text) {
    for (let i = 0, option; (option = dynamicDropdownOptions_[i]); i++) {
      // The option is an array containing human-readable text and a
      // language-neutral id, we'll compare against the human-readable text.
      if (option[0] == text) {
        // Do not remove this log! Helps you know if it was removed correctly.
        console.log('Removing option: ' + text);
        dynamicDropdownOptions_.splice(i, 1);
      }
    }
  });
};

Blockly.Blocks['test_dropdowns_dynamic_random'] = {
  init: function () {
    const dropdown = new Blockly.FieldDropdown(this.dynamicOptions);
    this.appendDummyInput()
      .appendField('dynamic random')
      .appendField(dropdown, 'OPTIONS');
  },

  dynamicOptions: function () {
    const random = Math.floor(Math.random() * 10) + 1;
    const options = [];
    for (let i = 0; i < random; i++) {
      options.push([String(i), String(i)]);
    }
    return options;
  },
};

Blockly.Blocks['test_dropdowns_dynamic_connect_dependant'] = {
  init: function () {
    const dropdown = new Blockly.FieldDropdown(this.dynamicOptions);
    this.appendDummyInput()
      .appendField('dynamic connect-dependant')
      .appendField(dropdown, 'OPTIONS');
    this.setNextStatement(true);
    this.setPreviousStatement(true);
  },

  dynamicOptions: function () {
    if (this.sourceBlock_ && this.sourceBlock_.getSurroundParent()) {
      const parent = this.sourceBlock_.getSurroundParent();
      const options = [
        ['connected', 'CONNECTED_KEY'],
        [`surroundParent: ${parent.type}`, `${parent.id}_type_key`],
        [`surroundParent: ${parent.id}`, `${parent.id}_key`],
      ];
      const top = this.sourceBlock_.getTopStackBlock();
      if (top.id !== parent.id) {
        options.push([`topStack: ${top.type}`, `${top.id}_type_key`]);
        options.push([`topStack: ${top.id}`, `${top.id}_key`]);
      }
      return options;
    } else {
      return [['unconnected', 'UNCONNECTED_KEY']];
    }
  },
};

/**
 * Mutator methods added to the test_dropdowns_in_mutator block.
 * @mixin
 * @package
 * @readonly
 */
const DROPDOWN_MUTATOR = {
  /**
   * Create XML to represent the block mutation.
   * @returns {Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    return container;
  },
  /**
   * Restore a block from XML.
   * @param {!Element} _xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function (_xmlElement) {},
  /**
   * Returns the state of the block as a JSON serializable object.
   * @returns {!Object} The state of the block as a JSON serializable object.
   */
  saveExtraState: function () {
    return {};
  },
  /**
   * Applies the given state to the block.
   * @param {!Object} _state The state to apply.
   */
  loadExtraState: function (_state) {},
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @returns {!Blockly.Block} Root block in mutator.
   * @this {Blockly.Block}
   */
  decompose: function (workspace) {
    const containerBlock = workspace.newBlock(
      'test_dropdowns_in_mutator_block',
    );
    containerBlock.initSvg();

    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} _containerBlock Root block in mutator.
   * @this {Blockly.Block}
   */
  compose: function (_containerBlock) {},
};

/**
 * Register custom mutator used by the test_dropdowns_in_mutator block.
 */
Blockly.Extensions.registerMutator(
  'test_dropdown_mutator',
  DROPDOWN_MUTATOR,
  null,
  ['test_dropdowns_in_mutator_block'],
);

Blockly.Blocks['test_dropdowns_dynamic'] = {
  init: function () {
    const dropdown = new Blockly.FieldDropdown(this.dynamicOptions);
    this.appendDummyInput()
      .appendField('dynamic')
      .appendField(dropdown, 'OPTIONS');
  },

  dynamicOptions: function () {
    if (!dynamicDropdownOptions_.length) {
      return [['', 'OPTION0']];
    }
    return dynamicDropdownOptions_;
  },
};

/**
 * The Dropdown field category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Drop-downs',
  contents: [
    {
      kind: 'LABEL',
      text: 'Dynamic',
    },
    {
      kind: 'BLOCK',
      type: 'test_dropdowns_dynamic',
    },
    {
      kind: 'BUTTON',
      text: 'Add option',
      callbackkey: 'addDynamicOption',
    },
    {
      kind: 'BUTTON',
      text: 'Remove option',
      callbackkey: 'removeDynamicOption',
    },
    {
      kind: 'BLOCK',
      type: 'test_dropdowns_dynamic_random',
    },
    {
      kind: 'BLOCK',
      type: 'test_dropdowns_dynamic_connect_dependant',
    },
    {
      kind: 'LABEL',
      text: 'Other',
    },
    {
      kind: 'BLOCK',
      type: 'test_dropdowns_long',
    },
    {
      kind: 'BLOCK',
      type: 'test_dropdowns_images',
    },
    {
      kind: 'BLOCK',
      type: 'test_dropdowns_images_and_text',
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  workspace.registerButtonCallback(
    'addDynamicOption',
    addDynamicDropdownOption,
  );
  workspace.registerButtonCallback(
    'removeDynamicOption',
    removeDynamicDropdownOption,
  );
}
