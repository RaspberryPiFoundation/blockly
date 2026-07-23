/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import '../src/toolbox_search';

/**
 * Create a workspace.
 *
 * @param blocklyDiv The blockly container div.
 * @param options The Blockly options.
 * @returns The created workspace.
 */
function createWorkspace(
  blocklyDiv: HTMLElement,
  options: Blockly.BlocklyOptions,
): Blockly.WorkspaceSvg {
  return Blockly.inject(blocklyDiv, options);
}

document.addEventListener('DOMContentLoaded', function () {
  const toolbox = {...toolboxCategories};
  toolbox['contents'].push({
    kind: 'search',
    name: 'Search',
    contents: [],
  });
  const defaultOptions: Blockly.BlocklyOptions = {
    toolbox,
  };

  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element is missing');
  }

  createPlayground(root, createWorkspace, defaultOptions);
});
