/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Adds blocks that replace the built-in mutator UI with dynamic
 *     connections that appear when a block is dragged over inputs on the block.
 */

import * as Blockly from 'blockly/core';
import './dynamic_if';
import './dynamic_text_join';
import './dynamic_list_create';
import {decoratePreviewer, blockIsDynamic} from './connection_previewer';

export {decoratePreviewer, blockIsDynamic};

export const overrideOldBlockDefinitions = function (): void {
  Blockly.Blocks['lists_create_with'] = Blockly.Blocks['dynamic_list_create'];
  Blockly.Blocks['text_join'] = Blockly.Blocks['dynamic_text_join'];
  Blockly.Blocks['controls_if'] = Blockly.Blocks['dynamic_if'];
};

/**
 * Finalizes connections when certain events (such as block deletion) are
 * detected.
 *
 * @param e
 */
export function finalizeConnections(e: Blockly.Events.Abstract) {
  if (e.type === Blockly.Events.BLOCK_DELETE) {
    const ws = Blockly.Workspace.getById(e.workspaceId ?? '');
    if (!ws) return;
    for (const block of ws.getAllBlocks() as Blockly.BlockSvg[]) {
      if (blockIsDynamic(block)) {
        block.finalizeConnections();
      }
    }
  }
}
