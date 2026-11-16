/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Changes the text_join block to use a +/- mutator UI.
 */

import * as Blockly from 'blockly/core';
import {createPlusField} from './field_plus';
import {createMinusField} from './field_minus';

const textJoinMutator = {
  /**
   * Number of text inputs on this block.
   * @type {number}
   */
  itemCount_: 0,

  /**
   * Creates XML to represent number of inputs.
   * @returns {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },

  /**
   * Parses XML to restore the inputs.
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
   * Adds inputs to the block until the block reaches the target input count.
   * @param {number} targetCount The number of inputs the block should have.
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
   * Callback for the plus image. Adds an input to the block and updates the
   * state of the minus.
   * @this {Blockly.Block}
   */
  plus: function () {
    this.addPart_();
    this.updateMinus_();
  },

  /**
   * Callback for the minus image. Removes the input at the end of the block and
   * updates the state of the minus.
   * @this {Blockly.Block}
   */
  minus: function () {
    if (this.itemCount_ == 0) {
      return;
    }
    this.removePart_();
    this.updateMinus_();
  },

  /**
   * Adds an input to the end of the block. If the block currently has no
   * inputs it updates the top 'EMPTY' input to receive a block.
   * @this {Blockly.Block}
   * @private
   */
  addPart_: function () {
    if (this.itemCount_ == 0) {
      if (this.getInput('EMPTY')) {
        this.removeInput('EMPTY');
      }
      this.topInput_ = this.appendValueInput('ADD' + this.itemCount_)
        .appendField(
          createPlusField(Blockly.Msg['ARIA_LABEL_ADD_TEXT']),
          'PLUS',
        )
        .appendField(Blockly.Msg['TEXT_JOIN_TITLE_CREATEWITH']);
    } else {
      this.appendValueInput('ADD' + this.itemCount_);
    }
    // Because item inputs are 0-index we decrement first, increment last.
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
          createPlusField(Blockly.Msg['ARIA_LABEL_ADD_TEXT']),
          'PLUS',
        )
        .appendField(this.newQuote_(true))
        .appendField(this.newQuote_(false));
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
        createMinusField(Blockly.Msg['ARIA_LABEL_REMOVE_TEXT']),
        'MINUS',
      );
    } else if (minusField && this.itemCount_ < 1) {
      this.topInput_.removeField('MINUS');
    }
  },
};

/**
 * Adds the quotes mixin to the block. Also updates the shape so that if no
 * mutator is provided the block has two inputs.
 * @this {Blockly.Block}
 */
const textJoinHelper = function () {
  Blockly.Extensions.apply('quote_image_mixin', this, false);
  this.updateShape_(2);
};

if (Blockly.Extensions.isRegistered('text_join_mutator')) {
  Blockly.Extensions.unregister('text_join_mutator');
}
Blockly.Extensions.registerMutator(
  'text_join_mutator',
  textJoinMutator,
  textJoinHelper,
);
