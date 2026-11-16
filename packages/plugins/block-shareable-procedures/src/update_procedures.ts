/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Calls the `doProcedureUpdate` method on all blocks which implement it.
 *
 * @param workspace The workspace within which to trigger block updates.
 * @internal
 */
export function triggerProceduresUpdate(workspace: Blockly.Workspace) {
  if (workspace.isClearing) return;
  for (const block of workspace.getAllBlocks(false)) {
    if (Blockly.procedures.isProcedureBlock(block)) {
      block.doProcedureUpdate();
    }
  }
}
