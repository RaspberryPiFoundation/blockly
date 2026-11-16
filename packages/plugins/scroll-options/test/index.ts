/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Test page for the ScrollOptions plugin.
 */

import {createPlayground, toolboxCategories} from '@blockly/dev-tools';
import * as Blockly from 'blockly';

import {
  ScrollBlockDragger,
  ScrollMetricsManager,
  ScrollOptions,
} from '../src/index';

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

  const scrollOptionsPlugin = new ScrollOptions(workspace);
  // Supply options if desired, or you can configure the plugin after
  // initialization.
  scrollOptionsPlugin.init();

  return workspace;
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions = {
    toolbox: toolboxCategories,
    plugins: {
      // These are both required, even if you turn off edge scrolling.
      blockDragger: ScrollBlockDragger,
      metricsManager: ScrollMetricsManager,
    },
    move: {
      wheel: true,
    },
  };
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('No root element found!');
  createPlayground(rootEl, createWorkspace, defaultOptions);

  // Add workspace comments to the test page so we can test that they
  // auto-scroll too!
  Blockly.ContextMenuItems.registerCommentOptions();
});
