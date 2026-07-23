/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Fixed sides test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import {FixedEdgesMetricsManager} from '../src/index';

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @returns {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  FixedEdgesMetricsManager.setFixedEdges({
    top: true,
    left: true,
  });
  const workspace = Blockly.inject(blocklyDiv, options);
  return workspace;
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions = {
    toolbox: toolboxCategories,
    plugins: {
      metricsManager: FixedEdgesMetricsManager,
    },
  };
  createPlayground(
    document.getElementById('root'),
    createWorkspace,
    defaultOptions,
  );
});
