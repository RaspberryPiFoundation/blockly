/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Continuous toolbox plugin test.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import {registerContinuousToolbox} from '../src/index';

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @returns {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  return Blockly.inject(blocklyDiv, options);
}

document.addEventListener('DOMContentLoaded', function () {
  registerContinuousToolbox();
  createPlayground(document.getElementById('root'), createWorkspace, {
    plugins: {
      flyoutsVerticalToolbox: 'ContinuousFlyout',
      metricsManager: 'ContinuousMetrics',
      toolbox: 'ContinuousToolbox',
    },
  });
});
