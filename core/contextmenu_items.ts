/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ContextMenuItems

import type {BlockSvg} from './block_svg.js';
import * as clipboard from './clipboard.js';
import {RenderedWorkspaceComment} from './comments/rendered_workspace_comment.js';
import {MANUALLY_DISABLED} from './constants.js';
import {
  ContextMenuRegistry,
  RegistryItem,
  Scope,
} from './contextmenu_registry.js';
import * as dialog from './dialog.js';
import * as Events from './events/events.js';
import * as eventUtils from './events/utils.js';
import {getFocusManager} from './focus_manager.js';
import {CommentIcon} from './icons/comment_icon.js';
import {Msg} from './msg.js';
import {StatementInput} from './renderers/zelos/zelos.js';
import {Coordinate} from './utils/coordinate.js';
import * as svgMath from './utils/svg_math.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Option to undo previous action.
 */
export function registerUndo() {
  const undoOption: RegistryItem = {
    displayText() {
      return Msg['UNDO'];
    },
    preconditionFn(scope: Scope) {
      if (scope.workspace!.getUndoStack().length > 0) {
        return 'enabled';
      }
      return 'disabled';
    },
    callback(scope: Scope) {
      scope.workspace!.undo(false);
    },
    scopeType: ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'undoWorkspace',
    weight: 1,
  };
  ContextMenuRegistry.registry.register(undoOption);
}

/**
 * Option to redo previous action.
 */
export function registerRedo() {
  const redoOption: RegistryItem = {
    displayText() {
      return Msg['REDO'];
    },
    preconditionFn(scope: Scope) {
      if (scope.workspace!.getRedoStack().length > 0) {
        return 'enabled';
      }
      return 'disabled';
    },
    callback(scope: Scope) {
      scope.workspace!.undo(true);
    },
    scopeType: ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'redoWorkspace',
    weight: 2,
  };
  ContextMenuRegistry.registry.register(redoOption);
}

/**
 * Option to clean up blocks.
 */
export function registerCleanup() {
  const cleanOption: RegistryItem = {
    displayText() {
      return Msg['CLEAN_UP'];
    },
    preconditionFn(scope: Scope) {
      if (scope.workspace!.isMovable()) {
        if (scope.workspace!.getTopBlocks(false).length > 1) {
          return 'enabled';
        }
        return 'disabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      scope.workspace!.cleanUp();
    },
    scopeType: ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'cleanWorkspace',
    weight: 3,
  };
  ContextMenuRegistry.registry.register(cleanOption);
}
/**
 * Creates a callback to collapse or expand top blocks.
 *
 * @param shouldCollapse Whether a block should collapse.
 * @param topBlocks Top blocks in the workspace.
 */
function toggleOption_(shouldCollapse: boolean, topBlocks: BlockSvg[]) {
  const DELAY = 10;
  let ms = 0;
  let timeoutCounter = 0;
  function timeoutFn(block: BlockSvg) {
    timeoutCounter--;
    block.setCollapsed(shouldCollapse);
    if (timeoutCounter === 0) {
      Events.setGroup(false);
    }
  }
  Events.setGroup(true);
  for (let i = 0; i < topBlocks.length; i++) {
    let block: BlockSvg | null = topBlocks[i];
    while (block) {
      timeoutCounter++;
      setTimeout(timeoutFn.bind(null, block), ms);
      block = block.getNextBlock();
      ms += DELAY;
    }
  }
}

/**
 * Option to collapse all blocks.
 */
export function registerCollapse() {
  const collapseOption: RegistryItem = {
    displayText() {
      return Msg['COLLAPSE_ALL'];
    },
    preconditionFn(scope: Scope) {
      if (scope.workspace!.options.collapse) {
        const topBlocks = scope.workspace!.getTopBlocks(false);
        for (let i = 0; i < topBlocks.length; i++) {
          let block: BlockSvg | null = topBlocks[i];
          while (block) {
            if (!block.isCollapsed()) {
              return 'enabled';
            }
            block = block.getNextBlock();
          }
        }
        return 'disabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      toggleOption_(true, scope.workspace!.getTopBlocks(true));
    },
    scopeType: ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'collapseWorkspace',
    weight: 4,
  };
  ContextMenuRegistry.registry.register(collapseOption);
}

/**
 * Option to expand all blocks.
 */
export function registerExpand() {
  const expandOption: RegistryItem = {
    displayText() {
      return Msg['EXPAND_ALL'];
    },
    preconditionFn(scope: Scope) {
      if (scope.workspace!.options.collapse) {
        const topBlocks = scope.workspace!.getTopBlocks(false);
        for (let i = 0; i < topBlocks.length; i++) {
          let block: BlockSvg | null = topBlocks[i];
          while (block) {
            if (block.isCollapsed()) {
              return 'enabled';
            }
            block = block.getNextBlock();
          }
        }
        return 'disabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      toggleOption_(false, scope.workspace!.getTopBlocks(true));
    },
    scopeType: ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'expandWorkspace',
    weight: 5,
  };
  ContextMenuRegistry.registry.register(expandOption);
}
/**
 * Adds a block and its children to a list of deletable blocks.
 *
 * @param block to delete.
 * @param deleteList list of blocks that can be deleted.
 *     This will be modified in place with the given block and its descendants.
 */
function addDeletableBlocks_(block: BlockSvg, deleteList: BlockSvg[]) {
  if (block.isDeletable()) {
    Array.prototype.push.apply(deleteList, block.getDescendants(false));
  } else {
    const children = block.getChildren(false);
    for (let i = 0; i < children.length; i++) {
      addDeletableBlocks_(children[i], deleteList);
    }
  }
}

/**
 * Constructs a list of blocks that can be deleted in the given workspace.
 *
 * @param workspace to delete all blocks from.
 * @returns list of blocks to delete.
 */
function getDeletableBlocks_(workspace: WorkspaceSvg): BlockSvg[] {
  const deleteList: BlockSvg[] = [];
  const topBlocks = workspace.getTopBlocks(true);
  for (let i = 0; i < topBlocks.length; i++) {
    addDeletableBlocks_(topBlocks[i], deleteList);
  }
  return deleteList;
}

/**
 * Deletes the given blocks. Used to delete all blocks in the workspace.
 *
 * @param deleteList List of blocks to delete.
 * @param eventGroup Event group ID with which all delete events should be
 *     associated.  If not specified, create a new group.
 */
function deleteNext_(deleteList: BlockSvg[], eventGroup?: string) {
  const DELAY = 10;
  if (eventGroup) {
    eventUtils.setGroup(eventGroup);
  } else {
    eventUtils.setGroup(true);
    eventGroup = eventUtils.getGroup();
  }
  const block = deleteList.shift();
  if (block) {
    if (!block.isDeadOrDying()) {
      block.dispose(false, true);
      setTimeout(deleteNext_, DELAY, deleteList, eventGroup);
    } else {
      deleteNext_(deleteList, eventGroup);
    }
  }
  eventUtils.setGroup(false);
}

/**
 * Option to delete all blocks.
 */
export function registerDeleteAll() {
  const deleteOption: RegistryItem = {
    displayText(scope: Scope) {
      if (!scope.workspace) {
        return '';
      }
      const deletableBlocksLength = getDeletableBlocks_(scope.workspace).length;
      if (deletableBlocksLength === 1) {
        return Msg['DELETE_BLOCK'];
      }
      return Msg['DELETE_X_BLOCKS'].replace('%1', `${deletableBlocksLength}`);
    },
    preconditionFn(scope: Scope) {
      if (!scope.workspace) {
        return 'disabled';
      }
      const deletableBlocksLength = getDeletableBlocks_(scope.workspace).length;
      return deletableBlocksLength > 0 ? 'enabled' : 'disabled';
    },
    callback(scope: Scope) {
      if (!scope.workspace) {
        return;
      }
      scope.workspace.cancelCurrentGesture();
      const deletableBlocks = getDeletableBlocks_(scope.workspace);
      if (deletableBlocks.length < 2) {
        deleteNext_(deletableBlocks);
      } else {
        dialog.confirm(
          Msg['DELETE_ALL_BLOCKS'].replace(
            '%1',
            String(deletableBlocks.length),
          ),
          function (ok) {
            if (ok) {
              deleteNext_(deletableBlocks);
            }
          },
        );
      }
    },
    scopeType: ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'workspaceDelete',
    weight: 6,
  };
  ContextMenuRegistry.registry.register(deleteOption);
}
/** Registers all workspace-scoped context menu items. */
function registerWorkspaceOptions_() {
  registerUndo();
  registerRedo();
  registerCleanup();
  registerCollapse();
  registerExpand();
  registerDeleteAll();
}

/**
 * Option to duplicate a block.
 */
export function registerDuplicate() {
  const duplicateOption: RegistryItem = {
    displayText() {
      return Msg['DUPLICATE_BLOCK'];
    },
    preconditionFn(scope: Scope) {
      const block = scope.block;
      if (!block!.isInFlyout && block!.isDeletable() && block!.isMovable()) {
        if (block!.isDuplicatable()) {
          return 'enabled';
        }
        return 'disabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      if (!scope.block) return;
      const data = scope.block.toCopyData();
      if (!data) return;
      clipboard.paste(data, scope.block.workspace);
    },
    scopeType: ContextMenuRegistry.ScopeType.BLOCK,
    id: 'blockDuplicate',
    weight: 1,
  };
  ContextMenuRegistry.registry.register(duplicateOption);
}

/**
 * Option to add or remove block-level comment.
 */
export function registerComment() {
  const commentOption: RegistryItem = {
    displayText(scope: Scope) {
      if (scope.block!.hasIcon(CommentIcon.TYPE)) {
        // If there's already a comment,  option is to remove.
        return Msg['REMOVE_COMMENT'];
      }
      // If there's no comment yet, option is to add.
      return Msg['ADD_COMMENT'];
    },
    preconditionFn(scope: Scope) {
      const block = scope.block;
      if (
        block &&
        !block.isInFlyout &&
        block.workspace.options.comments &&
        !block.isCollapsed() &&
        block.isEditable() &&
        // Either block already has a comment so let us remove it,
        // or the block isn't just one full-block field block, which
        // shouldn't be allowed to have comments as there's no way to read them.
        (block.hasIcon(CommentIcon.TYPE) || !block.isSimpleReporter(true))
      ) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      const block = scope.block;
      if (block && block.hasIcon(CommentIcon.TYPE)) {
        block.setCommentText(null);
      } else {
        block!.setCommentText('');
      }
    },
    scopeType: ContextMenuRegistry.ScopeType.BLOCK,
    id: 'blockComment',
    weight: 2,
  };
  ContextMenuRegistry.registry.register(commentOption);
}

/**
 * Option to inline variables.
 */
export function registerInline() {
  const inlineOption: RegistryItem = {
    displayText(scope: Scope) {
      return scope.block!.getInputsInline()
        ? Msg['EXTERNAL_INPUTS']
        : Msg['INLINE_INPUTS'];
    },
    preconditionFn(scope: Scope) {
      const block = scope.block;
      if (!block!.isInFlyout && block!.isMovable() && !block!.isCollapsed()) {
        for (let i = 1; i < block!.inputList.length; i++) {
          // Only display this option if there are two value or dummy inputs
          // next to each other.
          if (
            !(block!.inputList[i - 1] instanceof StatementInput) &&
            !(block!.inputList[i] instanceof StatementInput)
          ) {
            return 'enabled';
          }
        }
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      scope.block!.setInputsInline(!scope.block!.getInputsInline());
    },
    scopeType: ContextMenuRegistry.ScopeType.BLOCK,
    id: 'blockInline',
    weight: 3,
  };
  ContextMenuRegistry.registry.register(inlineOption);
}

/**
 * Option to collapse or expand a block.
 */
export function registerCollapseExpandBlock() {
  const collapseExpandOption: RegistryItem = {
    displayText(scope: Scope) {
      return scope.block!.isCollapsed()
        ? Msg['EXPAND_BLOCK']
        : Msg['COLLAPSE_BLOCK'];
    },
    preconditionFn(scope: Scope) {
      const block = scope.block;
      if (
        !block!.isInFlyout &&
        block!.isMovable() &&
        block!.workspace.options.collapse
      ) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      scope.block!.setCollapsed(!scope.block!.isCollapsed());
    },
    scopeType: ContextMenuRegistry.ScopeType.BLOCK,
    id: 'blockCollapseExpand',
    weight: 4,
  };
  ContextMenuRegistry.registry.register(collapseExpandOption);
}

/**
 * Option to disable or enable a block.
 */
export function registerDisable() {
  const disableOption: RegistryItem = {
    displayText(scope: Scope) {
      return scope.block!.hasDisabledReason(MANUALLY_DISABLED)
        ? Msg['ENABLE_BLOCK']
        : Msg['DISABLE_BLOCK'];
    },
    preconditionFn(scope: Scope) {
      const block = scope.block;
      if (
        !block!.isInFlyout &&
        block!.workspace.options.disable &&
        block!.isEditable()
      ) {
        // Determine whether this block is currently disabled for any reason
        // other than the manual reason that this context menu item controls.
        const disabledReasons = block!.getDisabledReasons();
        const isDisabledForOtherReason =
          disabledReasons.size >
          (disabledReasons.has(MANUALLY_DISABLED) ? 1 : 0);

        if (block!.getInheritedDisabled() || isDisabledForOtherReason) {
          return 'disabled';
        }
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      const block = scope.block;
      const existingGroup = eventUtils.getGroup();
      if (!existingGroup) {
        eventUtils.setGroup(true);
      }
      block!.setDisabledReason(
        !block!.hasDisabledReason(MANUALLY_DISABLED),
        MANUALLY_DISABLED,
      );
      eventUtils.setGroup(existingGroup);
    },
    scopeType: ContextMenuRegistry.ScopeType.BLOCK,
    id: 'blockDisable',
    weight: 5,
  };
  ContextMenuRegistry.registry.register(disableOption);
}

/**
 * Option to delete a block.
 */
export function registerDelete() {
  const deleteOption: RegistryItem = {
    displayText(scope: Scope) {
      const block = scope.block;
      // Count the number of blocks that are nested in this block.
      let descendantCount = block!.getDescendants(false).length;
      const nextBlock = block!.getNextBlock();
      if (nextBlock) {
        // Blocks in the current stack would survive this block's deletion.
        descendantCount -= nextBlock.getDescendants(false).length;
      }
      return descendantCount === 1
        ? Msg['DELETE_BLOCK']
        : Msg['DELETE_X_BLOCKS'].replace('%1', `${descendantCount}`);
    },
    preconditionFn(scope: Scope) {
      if (!scope.block!.isInFlyout && scope.block!.isDeletable()) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      if (scope.block) {
        scope.block.checkAndDelete();
      }
    },
    scopeType: ContextMenuRegistry.ScopeType.BLOCK,
    id: 'blockDelete',
    weight: 6,
  };
  ContextMenuRegistry.registry.register(deleteOption);
}

/**
 * Option to open help for a block.
 */
export function registerHelp() {
  const helpOption: RegistryItem = {
    displayText() {
      return Msg['HELP'];
    },
    preconditionFn(scope: Scope) {
      const block = scope.block;
      const url =
        typeof block!.helpUrl === 'function'
          ? block!.helpUrl()
          : block!.helpUrl;
      if (url) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Scope) {
      scope.block!.showHelp();
    },
    scopeType: ContextMenuRegistry.ScopeType.BLOCK,
    id: 'blockHelp',
    weight: 7,
  };
  ContextMenuRegistry.registry.register(helpOption);
}

/** Registers an option for deleting a workspace comment. */
export function registerCommentDelete() {
  const deleteOption: RegistryItem = {
    displayText: () => Msg['REMOVE_COMMENT'],
    preconditionFn(scope: Scope) {
      return scope.comment?.isDeletable() ? 'enabled' : 'hidden';
    },
    callback(scope: Scope) {
      eventUtils.setGroup(true);
      scope.comment?.dispose();
      eventUtils.setGroup(false);
    },
    scopeType: ContextMenuRegistry.ScopeType.COMMENT,
    id: 'commentDelete',
    weight: 6,
  };
  ContextMenuRegistry.registry.register(deleteOption);
}

/** Registers an option for duplicating a workspace comment. */
export function registerCommentDuplicate() {
  const duplicateOption: RegistryItem = {
    displayText: () => Msg['DUPLICATE_COMMENT'],
    preconditionFn(scope: Scope) {
      return scope.comment?.isMovable() ? 'enabled' : 'hidden';
    },
    callback(scope: Scope) {
      if (!scope.comment) return;
      const data = scope.comment.toCopyData();
      if (!data) return;
      clipboard.paste(data, scope.comment.workspace);
    },
    scopeType: ContextMenuRegistry.ScopeType.COMMENT,
    id: 'commentDuplicate',
    weight: 1,
  };
  ContextMenuRegistry.registry.register(duplicateOption);
}

/** Registers an option for adding a workspace comment to the workspace. */
export function registerCommentCreate() {
  const createOption: RegistryItem = {
    displayText: () => Msg['ADD_COMMENT'],
    preconditionFn: (scope: Scope) => {
      return scope.workspace?.isMutator ? 'hidden' : 'enabled';
    },
    callback: (
      scope: Scope,
      menuOpenEvent: Event,
      menuSelectEvent: Event,
      location: Coordinate,
    ) => {
      const workspace = scope.workspace;
      if (!workspace) return;
      eventUtils.setGroup(true);
      const comment = new RenderedWorkspaceComment(workspace);
      comment.setPlaceholderText(Msg['WORKSPACE_COMMENT_DEFAULT_TEXT']);
      comment.moveTo(
        svgMath.screenToWsCoordinates(
          workspace,
          new Coordinate(location.x, location.y),
        ),
      );
      getFocusManager().focusNode(comment);
      eventUtils.setGroup(false);
    },
    scopeType: ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'commentCreate',
    weight: 8,
  };
  ContextMenuRegistry.registry.register(createOption);
}

/** Registers all block-scoped context menu items. */
function registerBlockOptions_() {
  registerDuplicate();
  registerComment();
  registerInline();
  registerCollapseExpandBlock();
  registerDisable();
  registerDelete();
  registerHelp();
}

/** Registers all workspace comment related menu items. */
export function registerCommentOptions() {
  registerCommentDuplicate();
  registerCommentDelete();
  registerCommentCreate();
}

/**
 * Registers all default context menu items. This should be called once per
 * instance of ContextMenuRegistry.
 *
 * @internal
 */
export function registerDefaultOptions() {
  registerWorkspaceOptions_();
  registerBlockOptions_();
}

registerDefaultOptions();
