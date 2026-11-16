/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Blocks that have both a previous connection and an output
 *     connection while they are being dragged.
 */

import * as Blockly from 'blockly/core';

Blockly.Blocks['test_chameleon'] = {
  hasOutput: true,
  hasPrevious: true,

  init: function () {
    this.appendDummyInput().appendField('chameleon');
    this.setColour(120);
    this.updateShape();
  },

  onchange: function (e) {
    if (e.type === Blockly.Events.BLOCK_DRAG) {
      console.log('got drag event');
      this.hasPrevious =
        !this.outputConnection || !this.outputConnection.targetBlock();
      this.hasOutput = !this.getPreviousBlock();
      this.updateShape();
    }
  },

  updateShape: function () {
    this.setPreviousStatement(this.hasPrevious);
    this.setOutput(this.hasOutput);
  },
};

/**
 * The Chameleon Category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Chameleon',
  contents: [
    {
      kind: 'BLOCK',
      type: 'test_chameleon',
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
