/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Changes the list_create block to use a +/- mutator UI.
 */

import * as Blockly from 'blockly/core';
import {createPlusField} from './field_plus';
import {createMinusField} from './field_minus';

// Delete original block because there's no way to unregister it:
// https://github.com/RaspberryPiFoundation/blockly-samples/issues/768#issuecomment-885663394
delete Blockly.Blocks['lists_create_with'];

Blockly.defineBlocksWithJsonArray([
  {
    type: 'lists_create_with',
    message0: '%{BKY_LISTS_CREATE_EMPTY_TITLE} %1',
    args0: [
      {
        type: 'input_dummy',
        name: 'EMPTY',
      },
    ],
    output: 'Array',
    style: 'list_blocks',
    helpUrl: '%{BKY_LISTS_CREATE_WITH_HELPURL}',
    tooltip: '%{BKY_LISTS_CREATE_WITH_TOOLTIP}',
    mutator: 'new_list_create_with_mutator',
  },
]);

const listCreateMutator = {
  /**
   * Number of item inputs the block has.
   * @type {number}
   */
  itemCount_: 0,

  /**
   * Creates XML to represent number of text inputs.
   * @returns {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  /**
   * Parses XML to restore the text inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function (xmlElement) {
    const targetCount = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_(targetCount);
  },

  /**
   * Returns the state of this block as a JSON serializable object.
   * @returns {{itemCount: number}} The state of this block, ie the item count.
   */
  saveExtraState: function () {
    return {
      itemCount: this.itemCount_,
    };
  },

  /**
   * Applies the given state to this block.
   * @param {*} state The state to apply to this block, ie the item count.
   */
  loadExtraState: function (state) {
    this.updateShape_(state['itemCount']);
  },

  /**
   * Adds inputs to the block until it reaches the target number of inputs.
   * @param {number} targetCount The target number of inputs for the block.
   * @this {Blockly.Block}
   * @private
   */
  updateShape_: function (targetCount) {
    while (this.itemCount_ < targetCount) {
      this.addPart_();
    }
    while (this.itemCount_ > targetCount) {
      this.removePart_();
    }
    this.updateMinus_();
  },

  /**
   * Callback for the plus image. Adds an input to the end of the block and
   * updates the state of the minus.
   */
  plus: function () {
    this.addPart_();
    this.updateMinus_();
  },

  /**
   * Callback for the minus image. Removes an input from the end of the block
   * and updates the state of the minus.
   */
  minus: function () {
    if (this.itemCount_ == 0) {
      return;
    }
    this.removePart_();
    this.updateMinus_();
  },

  // To properly keep track of indices we have to increment before/after adding
  // the inputs, and decrement the opposite.
  // Because we want our first input to be ADD0 (not ADD1) we increment after.

  /**
   * Adds an input to the end of the block. If the block currently has no
   * inputs it updates the top 'EMPTY' input to receive a block.
   * @this {Blockly.Block}
   * @private
   */
  addPart_: function () {
    if (this.itemCount_ == 0) {
      this.removeInput('EMPTY');
      this.topInput_ = this.appendValueInput('ADD' + this.itemCount_)
        .appendField(
          createPlusField(Blockly.Msg['ARIA_LABEL_ADD_LIST_ITEM']),
          'PLUS',
        )
        .appendField(Blockly.Msg['LISTS_CREATE_WITH_INPUT_WITH']);
    } else {
      this.appendValueInput('ADD' + this.itemCount_);
    }
    this.itemCount_++;
  },

  /**
   * Removes an input from the end of the block. If we are removing the last
   * input this updates the block to have an 'EMPTY' top input.
   * @this {Blockly.Block}
   * @private
   */
  removePart_: function () {
    this.itemCount_--;
    this.removeInput('ADD' + this.itemCount_);
    if (this.itemCount_ == 0) {
      this.topInput_ = this.appendDummyInput('EMPTY')
        .appendField(
          createPlusField(Blockly.Msg['ARIA_LABEL_ADD_LIST_ITEM']),
          'PLUS',
        )
        .appendField(Blockly.Msg['LISTS_CREATE_EMPTY_TITLE']);
    }
  },

  /**
   * Makes it so the minus is visible iff there is an input available to remove.
   * @private
   */
  updateMinus_: function () {
    const minusField = this.getField('MINUS');
    if (!minusField && this.itemCount_ > 0) {
      this.topInput_.insertFieldAt(
        1,
        createMinusField(Blockly.Msg['ARIA_LABEL_REMOVE_LIST_ITEM']),
        'MINUS',
      );
    } else if (minusField && this.itemCount_ < 1) {
      this.topInput_.removeField('MINUS');
    }
  },
};

/**
 * Updates the shape of the block to have 3 inputs if no mutation is provided.
 * @this {Blockly.Block}
 */
const listCreateHelper = function () {
  this.getInput('EMPTY').insertFieldAt(
    0,
    createPlusField(Blockly.Msg['ARIA_LABEL_ADD_LIST_ITEM']),
    'PLUS',
  );
  this.updateShape_(3);
};

Blockly.Extensions.registerMutator(
  'new_list_create_with_mutator',
  listCreateMutator,
  listCreateHelper,
);
