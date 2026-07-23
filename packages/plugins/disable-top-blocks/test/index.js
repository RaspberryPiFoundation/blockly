/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Disable top blocks plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import {DisableTopBlocks} from '../src/index';

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @returns {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = Blockly.inject(blocklyDiv, options);

  // Add the disableOrphans event handler. This is not done automatically by
  // the plugin and should be handled by your application.
  workspace.addChangeListener(Blockly.Events.disableOrphans);

  // The plugin must be initialized before it has any effect.
  const disableTopBlocksPlugin = new DisableTopBlocks();
  disableTopBlocksPlugin.init();

  return workspace;
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions = {
    toolbox: toolboxCategories,
  };
  createPlayground(
    document.getElementById('root'),
    createWorkspace,
    defaultOptions,
  );
});
