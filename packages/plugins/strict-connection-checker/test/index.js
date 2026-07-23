/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Test playground for the strict connection checker.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import {pluginInfo as StrictTypesPluginInfo} from '../src/index';
import toolboxCategories from '../src/toolboxCategories';

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
  const defaultOptions = {
    toolbox: toolboxCategories,
    plugins: {
      ...StrictTypesPluginInfo,
    },
  };
  createPlayground(
    document.getElementById('root'),
    createWorkspace,
    defaultOptions,
  );
});
