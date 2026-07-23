/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Mutator test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_mutator_textChange',
    message0: 'mutator text: %1',
    args0: [
      {
        type: 'field_input',
        name: 'MUTATOR_TEXT',
        text: 'a label',
      },
    ],
    style: 'colour_blocks',
  },
]);

/**
 * Mutator methods added to the test_mutators_many block.
 * @mixin
 * @package
 * @readonly
 */
const COLOR_CHANGE_MUTATOR = {
  /**
   * Create XML to represent the block mutation.
   * @returns {Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('arbitrary', this.getFieldValue('LABEL'));
    return container;
  },
  /**
   * Restore a block from XML.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function (xmlElement) {
    this.setFieldValue(xmlElement.getAttribute('arbitrary'), 'LABEL');
  },
  /**
   * Returns the state of this block as a json serializable object.
   * @returns {{arbitrary: string}} The state of this block.
   * @this {Blockly.Block}
   */
  saveExtraState: function () {
    return {arbitrary: this.getFieldValue('LABEL')};
  },
  /**
   * Applies the state to this block.
   * @param {{arbitrary: string}} state The state to apply.
   * @this {Blockly.Block}
   */
  loadExtraState: function (state) {
    this.setFieldValue(state['arbitrary'], 'LABEL');
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @returns {!Blockly.Block} Root block in mutator.
   * @this {Blockly.Block}
   */
  decompose: function (workspace) {
    const containerBlock = Blockly.serialization.blocks.append(
      {type: 'test_mutator_textChange'},
      workspace,
    );
    containerBlock
      .getField('MUTATOR_TEXT')
      .setValue(this.getFieldValue('LABEL'));
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this {Blockly.Block}
   */
  compose: function (containerBlock) {
    this.setFieldValue(containerBlock.getFieldValue('MUTATOR_TEXT'), 'LABEL');
  },
};

const n = 20;
const blocksIds = [];
for (let i = 0; i < n; i++) {
  blocksIds.push(`test_mutator_category_${i}`);
}

const defineBlocks = blocksIds.map((t) => ({
  type: t,
  message0: 'mutator text: %1',
  args0: [
    {
      type: 'field_input',
      name: 'MUTATOR_TEXT',
      text: 'a label',
    },
  ],
  style: 'colour_blocks',
}));

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_mutators_many',
    message0: 'test many blocks mutator %1',
    args0: [
      {
        type: 'field_label',
        name: 'LABEL',
        text: 'changeable label',
      },
    ],
    mutator: 'test_many_blocks_mutator',
    colour: '#000000',
  },
  ...defineBlocks,
]);

/** Register custom mutator used by the test_mutators_many block. */
Blockly.Extensions.registerMutator(
  'test_many_blocks_mutator',
  COLOR_CHANGE_MUTATOR,
  null,
  [...blocksIds],
);

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_mutators_noflyout',
    message0: 'noflyout mutator %1',
    args0: [
      {
        type: 'field_label',
        name: 'LABEL',
        text: 'changeable label',
      },
    ],
    mutator: 'test_noflyout_mutator',
    colour: '#000000',
  },
]);

/** Register custom mutator used by the test_mutators_noflyout block. */
Blockly.Extensions.registerMutator(
  'test_noflyout_mutator',
  COLOR_CHANGE_MUTATOR,
  null,
  [],
);

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_mutators_changeableFlyout',
    message0: 'changeable flyout mutator %1',
    args0: [
      {
        type: 'field_label',
        name: 'LABEL',
        text: 'changeable label',
      },
    ],
    mutator: 'test_changeableFlyout_mutator',
    colour: '#000000',
  },
]);

/** Register custom mutator used by the test_mutators_changeableFlyout block. */
Blockly.Extensions.registerMutator(
  'test_changeableFlyout_mutator',
  COLOR_CHANGE_MUTATOR,
  null,
  ['text'],
);

/**
 * The Mutators category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Mutators',
  contents: [
    {
      kind: 'LABEL',
      text: 'logic_compare',
    },
    {
      kind: 'BLOCK',
      type: 'logic_compare',
      inputs: {
        A: {
          shadow: {
            type: 'math_number',
            fields: {NUM: 10},
          },
        },
        B: {
          shadow: {
            type: 'math_number',
            fields: {NUM: 10},
          },
        },
      },
    },
    {
      kind: 'BLOCK',
      type: 'logic_compare',
      inputs: {
        A: {
          block: {
            type: 'math_number',
            fields: {NUM: 10},
          },
        },
        B: {
          block: {
            type: 'math_number',
            fields: {NUM: 10},
          },
        },
      },
    },
    {
      kind: 'BLOCK',
      type: 'test_mutators_noflyout',
    },
    {
      kind: 'BLOCK',
      type: 'test_mutators_many',
    },
    {
      kind: 'BLOCK',
      type: 'test_mutators_changeableFlyout',
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  // NOP
}
