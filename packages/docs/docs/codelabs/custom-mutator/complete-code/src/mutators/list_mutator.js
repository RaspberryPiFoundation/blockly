/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// The mutator mixin
export const LIST_MUTATOR = {
  saveExtraState: function () {
    return {
      itemCount: this.itemCount,
    };
  },

  loadExtraState: function (state) {
    this.itemCount = state['itemCount'];
    this.updateShape();
  },

  updateShape: function () {
    // Add new inputs.
    for (let i = 1; i < this.itemCount; i++) {
      if (!this.getInput('ADD' + i)) {
        this.appendValueInput('ADD' + i).setAriaLabelProvider(
          () => 'value ' + (i + 1),
        );
      }
    }
    // Remove deleted inputs.
    for (let i = this.itemCount; this.getInput('ADD' + i); i++) {
      this.removeInput('ADD' + i);
    }
  },

  addConnection: function () {
    this.setItemCount(this.itemCount + 1);
  },

  removeConnection: function () {
    if (this.itemCount > 1) {
      this.setItemCount(this.itemCount - 1);
    }
  },

  setItemCount: function (newCount) {
    // If there's no event group, start one so that the whole mutation is one event
    const existingGroup = Blockly.Events.getGroup();
    if (!existingGroup) Blockly.Events.setGroup(true);

    const oldCountState = JSON.stringify(this.saveExtraState());

    this.itemCount = newCount;
    this.updateShape();

    const newCountState = JSON.stringify(this.saveExtraState());

    // If the state has changed, create and fire a BLOCK_CHANGE event
    if (newCountState !== oldCountState) {
      const BlockChangeClass = Blockly.Events.get(Blockly.Events.BLOCK_CHANGE);
      const blockChangeEvent = new BlockChangeClass(
        this,
        'mutation',
        null,
        oldCountState,
        newCountState,
      );
      Blockly.Events.fire(blockChangeEvent);
    }

    Blockly.Events.setGroup(existingGroup);
  },
};
