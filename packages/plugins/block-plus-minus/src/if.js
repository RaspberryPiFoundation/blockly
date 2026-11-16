/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Changes the if block to use a +/- mutator UI.
 */

import * as Blockly from 'blockly/core';
import {createMinusField} from './field_minus';
import {createPlusField} from './field_plus';

const controlsIfMutator = {
  /**
   * Number of else-if inputs on this block.
   * @type {number}
   */
  elseIfCount_: 0,
  /**
   * Whether this block has an else input or not.
   * @type {boolean}
   */
  hasElse_: false,

  /**
   * Creates XML to represent the number of else-if and else inputs.
   * @returns {Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function () {
    if (!this.elseIfCount_ && !this.hasElse_) {
      return null;
    }
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('elseif', this.elseIfCount_);
    if (this.hasElse_) {
      // Has to be stored as an int for backwards compat.
      container.setAttribute('else', 1);
    }
    return container;
  },

  /**
   * Parses XML to restore the else-if and else inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function (xmlElement) {
    const targetCount = parseInt(xmlElement.getAttribute('elseif'), 10) || 0;
    this.hasElse_ = !!parseInt(xmlElement.getAttribute('else'), 10) || 0;
    if (this.hasElse_ && !this.getInput('ELSE')) {
      this.appendStatementInput('ELSE').appendField(
        Blockly.Msg['CONTROLS_IF_MSG_ELSE'],
      );
    }
    this.updateShape_(targetCount);
  },

  /**
   * Returns the state of this block as a JSON serializable object.
   * @returns {{elseIfCount: (number|undefined),
   *     haseElse: (boolean|undefined)}} The state of this block, ie the else
   *     if count and else state.
   */
  saveExtraState: function () {
    if (!this.elseIfCount_ && !this.hasElse_) {
      return null;
    }
    const state = Object.create(null);
    if (this.elseIfCount_) {
      state['elseIfCount'] = this.elseIfCount_;
    }
    if (this.hasElse_) {
      state['hasElse'] = true;
    }
    return state;
  },

  /**
   * Applies the given state to this block.
   * @param {*} state The state to apply to this block, ie the else if count and
   *     else state.
   */
  loadExtraState: function (state) {
    const targetCount = state['elseIfCount'] || 0;
    this.hasElse_ = state['hasElse'] || false;
    if (this.hasElse_ && !this.getInput('ELSE')) {
      this.appendStatementInput('ELSE').appendField(
        Blockly.Msg['CONTROLS_IF_MSG_ELSE'],
      );
    }
    this.updateShape_(targetCount);
  },

  /**
   * Adds else-if and do inputs to the block until the block matches the
   * target else-if count.
   * @param {number} targetCount The target number of else-if inputs.
   * @this {Blockly.Block}
   * @private
   */
  updateShape_: function (targetCount) {
    while (this.elseIfCount_ < targetCount) {
      this.addElseIf_();
    }
    while (this.elseIfCount_ > targetCount) {
      this.removeElseIf_();
    }
  },

  /**
   * Callback for the plus field. Adds an else-if input to the block.
   */
  plus: function () {
    this.addElseIf_();
  },

  /**
   * Callback for the minus field. Triggers "removing" the input at the specific
   * index.
   * @see removeInput_
   * @param {number} index The index of the else-if input to "remove".
   * @this {Blockly.Block}
   */
  minus: function (index) {
    if (this.elseIfCount_ == 0) {
      return;
    }
    this.removeElseIf_(index);
  },

  /**
   * Adds an else-if and a do input to the bottom of the block.
   * @this {Blockly.Block}
   * @private
   */
  addElseIf_: function () {
    // Because else-if inputs are 1-indexed we increment first, decrement last.
    this.elseIfCount_++;
    this.appendValueInput('IF' + this.elseIfCount_)
      .setCheck('Boolean')
      .appendField(Blockly.Msg['CONTROLS_IF_MSG_ELSEIF'])
      .appendField(
        createMinusField(
          Blockly.Msg['ARIA_LABEL_REMOVE_ELSE_IF'],
          this.elseIfCount_,
        ),
        'MINUS' + this.elseIfCount_,
      );
    this.appendStatementInput('DO' + this.elseIfCount_).appendField(
      Blockly.Msg['CONTROLS_IF_MSG_THEN'],
    );

    // Handle if-elseif-else block.
    if (this.getInput('ELSE')) {
      this.moveInputBefore('ELSE', /* put at end */ null);
    }
  },

  /**
   * Appears to remove the input at the given index. Actually shifts attached
   * blocks and then removes the input at the bottom of the block. This is to
   * make sure the inputs are always IF0, IF1, etc with no gaps.
   * @param {?number=} index The index of the input to "remove", or undefined
   *     to remove the last input.
   * @this {Blockly.Block}
   * @private
   */
  removeElseIf_: function (index = undefined) {
    // The strategy for removing a part at an index is to:
    //  - Kick any blocks connected to the relevant inputs.
    //  - Move all connect blocks from the other inputs up.
    //  - Remove the last input.
    // This makes sure all of our indices are correct.

    if (index !== undefined && index != this.elseIfCount_) {
      // Each else-if is two inputs on the block:
      // the else-if input and the do input.
      const elseIfIndex = index * 2;
      const inputs = this.inputList;
      let connection = inputs[elseIfIndex].connection; // If connection.
      if (connection.isConnected()) {
        connection.disconnect();
      }
      connection = inputs[elseIfIndex + 1].connection; // Do connection.
      if (connection.isConnected()) {
        connection.disconnect();
      }
      this.bumpNeighbours();
      for (let i = elseIfIndex + 2, input; (input = this.inputList[i]); i++) {
        if (input.name == 'ELSE') {
          break; // Should be last, so break.
        }
        const targetConnection = input.connection.targetConnection;
        if (targetConnection) {
          this.inputList[i - 2].connection.connect(targetConnection);
        }
      }
    }

    this.removeInput('IF' + this.elseIfCount_);
    this.removeInput('DO' + this.elseIfCount_);
    // Because else-if inputs are 1-indexed we increment first, decrement last.
    this.elseIfCount_--;
  },
};

/**
 * Adds the initial plus button to the if block.
 * @this {Blockly.Block}
 */
const controlsIfHelper = function () {
  this.getInput('IF0').insertFieldAt(
    0,
    createPlusField(Blockly.Msg['ARIA_LABEL_ADD_ELSE_IF']),
    'PLUS',
  );
};

if (Blockly.Extensions.isRegistered('controls_if_mutator')) {
  Blockly.Extensions.unregister('controls_if_mutator');
}
Blockly.Extensions.registerMutator(
  'controls_if_mutator',
  controlsIfMutator,
  controlsIfHelper,
);
