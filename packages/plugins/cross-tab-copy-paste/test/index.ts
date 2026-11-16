/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import {CrossTabCopyPaste} from '../src/index';

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
  return workspace;
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions = {
    toolbox: toolboxCategories,
  };
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    return;
  }
  createPlayground(rootElement, createWorkspace, defaultOptions);
  // Add workspace comments so we can test copying them
  Blockly.ContextMenuItems.registerCommentOptions();
  const copyPastePlugin = new CrossTabCopyPaste();
  copyPastePlugin.init();
});
