/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Plugin for changing the context menu to match the
 * `disableOrphans` event handler.
 */

import * as Blockly from 'blockly/core';

/**
 * This plugin changes the logic of the enable/disable context menu item. It is
 * enabled for all blocks except top-level blocks that have output or
 * previous connections. In other words, the option is disabled for orphan
 * blocks. Using this plugin allows users to disable valid non-orphan blocks,
 * but not re-enable blocks that have been automatically disabled by
 * `disableOrphans`.
 */
export class DisableTopBlocks {
  /**
   * Modifies the context menu 'disable' option as described above.
   */
  init() {
    const disableMenuItem =
      Blockly.ContextMenuRegistry.registry.getItem('blockDisable');
    this.oldPreconditionFn = disableMenuItem.preconditionFn;
    disableMenuItem.preconditionFn = function (
      /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope,
    ) {
      const block = scope.block;
      if (
        !block.isInFlyout &&
        block.workspace.options.disable &&
        block.isEditable()
      ) {
        if (block.getInheritedDisabled() || isOrphan(block)) {
          return 'disabled';
        }
        return 'enabled';
      }
      return 'hidden';
    };
  }

  /**
   * Turn off the effects of this plugin and restore the initial behavior.
   * This is never required to be called. It is optional in case you need to
   * disable the plugin.
   */
  dispose() {
    const disableMenuItem =
      Blockly.ContextMenuRegistry.registry.getItem('blockDisable');
    disableMenuItem.preconditionFn = this.oldPreconditionFn;
  }
}

/**
 * A block is an orphan if its parent is an orphan, or if it doesn't have a
 * parent but it does have a previous or output connection (so it expects to be
 * attached to something). This means all children of orphan blocks are also
 * orphans and cannot be manually re-enabled.
 * @param {!Blockly.BlockSvg} block Block to check.
 * @returns {boolean} Whether the block is an orphan.
 */
function isOrphan(block) {
  // If the parent is an orphan block, this block should also be considered
  // an orphan so it cannot be manually re-enabled.
  const parent = /** @type {Blockly.BlockSvg} */ (block.getParent());
  if (parent && isOrphan(parent)) {
    return true;
  }
  return !parent && !!(block.outputConnection || block.previousConnection);
}
