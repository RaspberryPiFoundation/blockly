/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {createPlayground, toolboxCategories} from '@blockly/dev-tools';
import * as Blockly from 'blockly';

import {Backpack} from '../src/index';

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
  const workspace = Blockly.inject(blocklyDiv, options);

  const backpack = new Backpack(workspace);
  backpack.init();

  return workspace;
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions = {
    toolbox: toolboxCategories,
  };
  const rootElement = document.getElementById('root');
  if (rootElement instanceof HTMLElement) {
    createPlayground(rootElement, createWorkspace, defaultOptions);
  }
});
