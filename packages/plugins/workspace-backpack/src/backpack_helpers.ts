/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper and utility methods for the backpack plugin.
 * @author kozbial@google.com (Monica Kozbial)
 */

import * as Blockly from 'blockly/core';

import {Backpack} from './backpack';
import {BackpackContextMenuOptions} from './options';

/**
 * Registers a context menu option to remove a block from a backpack flyout.
 */
function registerRemoveFromBackpack() {
  if (Blockly.ContextMenuRegistry.registry.getItem('remove_from_backpack')) {
    return;
  }
  const removeFromBackpack = {
    displayText: Blockly.Msg['REMOVE_FROM_BACKPACK'],
    preconditionFn: function (scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block) return 'hidden';
      const ws = scope.block.workspace;
      if (ws.isFlyout && ws.targetWorkspace) {
        const backpack = ws.targetWorkspace
          .getComponentManager()
          .getComponent('backpack') as Backpack;
        const backpackFlyout = backpack && backpack.getFlyout();
        if (
          backpack &&
          backpackFlyout &&
          backpackFlyout.getWorkspace().id === ws.id
        ) {
          return 'enabled';
        }
      }
      return 'hidden';
    },
    callback: function (scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block || !scope.block.workspace.targetWorkspace) return;
      const backpack = scope.block.workspace.targetWorkspace
        .getComponentManager()
        .getComponent('backpack') as Backpack;
      backpack.removeBlock(scope.block);
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'remove_from_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(removeFromBackpack);
}

/**
 * Registers context menu options for adding a block to the backpack.
 *
 * @param disablePreconditionContainsCheck Whether to disable the
 *   precondition check for whether the backpack contains the block.
 */
function registerCopyToBackpack(disablePreconditionContainsCheck: boolean) {
  if (Blockly.ContextMenuRegistry.registry.getItem('copy_to_backpack')) {
    return;
  }
  const copyToBackpack = {
    displayText: function (scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block) {
        return '';
      }
      return Blockly.Msg['COPY_TO_BACKPACK'];
    },
    preconditionFn: function (scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block) return 'hidden';
      const ws = scope.block.workspace;
      if (!ws.isFlyout) {
        const backpack = ws
          .getComponentManager()
          .getComponent('backpack') as Backpack;
        if (backpack) {
          if (disablePreconditionContainsCheck) {
            return 'enabled';
          }
          return backpack.containsBlock(scope.block) ? 'disabled' : 'enabled';
        }
      }
      return 'hidden';
    },
    callback: function (scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block) return;
      const backpack = scope.block.workspace
        .getComponentManager()
        .getComponent('backpack') as Backpack;
      backpack.addBlock(scope.block);
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'copy_to_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(copyToBackpack);
}

/**
 * Registers context menu options for copying all blocks from the workspace to
 * the backpack.
 */
function registerCopyAllBackpack() {
  if (Blockly.ContextMenuRegistry.registry.getItem('copy_all_to_backpack')) {
    return;
  }
  const copyAllToBackpack = {
    displayText: Blockly.Msg['COPY_ALL_TO_BACKPACK'],
    preconditionFn: function (scope: Blockly.ContextMenuRegistry.Scope) {
      const ws = scope.workspace;
      if (ws && !ws.isFlyout) {
        const backpack = ws.getComponentManager().getComponent('backpack');
        if (backpack) {
          return 'enabled';
        }
      }
      return 'hidden';
    },
    callback: function (scope: Blockly.ContextMenuRegistry.Scope) {
      const ws = scope.workspace;
      if (!ws) return;
      const backpack = ws
        .getComponentManager()
        .getComponent('backpack') as Backpack;
      backpack.addBlocks(ws.getTopBlocks(true));
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'copy_all_to_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(copyAllToBackpack);
}

/**
 * Registers context menu options for pasting all blocks from the backpack to
 * the workspace.
 */
function registerPasteAllBackpack() {
  if (Blockly.ContextMenuRegistry.registry.getItem('paste_all_from_backpack')) {
    return;
  }
  const pasteAllFromBackpack = {
    displayText: function (scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.workspace) {
        return '';
      }
      const backpack = scope.workspace
        .getComponentManager()
        .getComponent('backpack') as Backpack;
      const backpackCount = backpack.getCount();
      return `${Blockly.Msg['PASTE_ALL_FROM_BACKPACK']} (${backpackCount})`;
    },
    preconditionFn: function (scope: Blockly.ContextMenuRegistry.Scope) {
      const ws = scope.workspace;
      if (ws && !ws.isFlyout) {
        const backpack = ws.getComponentManager().getComponent('backpack');
        if (backpack) {
          return 'enabled';
        }
      }
      return 'hidden';
    },
    callback: function (scope: Blockly.ContextMenuRegistry.Scope) {
      const ws = scope.workspace;
      if (!ws) return;
      const backpack = ws
        .getComponentManager()
        .getComponent('backpack') as Backpack;
      const contents = backpack.getContents();
      contents.forEach((blockText) => {
        const block = Blockly.serialization.blocks.append(
          JSON.parse(blockText),
          ws,
        ) as Blockly.BlockSvg;
        block.scheduleSnapAndBump();
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'paste_all_from_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(pasteAllFromBackpack);
}

/**
 * Register all context menu options.
 *
 * @param contextMenuOptions The backpack context menu options.
 * @param workspace The workspace to register the context menu options.
 */
export function registerContextMenus(
  contextMenuOptions: BackpackContextMenuOptions,
  workspace: Blockly.WorkspaceSvg,
) {
  if (contextMenuOptions.removeFromBackpack) {
    registerRemoveFromBackpack();
  }
  if (contextMenuOptions.copyToBackpack) {
    registerCopyToBackpack(
      contextMenuOptions.disablePreconditionChecks ?? false,
    );
  }
  if (contextMenuOptions.copyAllToBackpack) {
    registerCopyAllBackpack();
  }
  if (contextMenuOptions.pasteAllToBackpack) {
    registerPasteAllBackpack();
  }
}
