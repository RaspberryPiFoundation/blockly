/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Context menu options for lesson authoring, including making blocks deletable, uneditable, and immovable.
 */

import * as Blockly from 'blockly/core';
import {setBlockState} from './block_state_change';
import {setShadowState} from './shadow_state_change';

/**
 * Runs a callback with its events in one group, so they undo as one step.
 * Joins the current group if there is one.
 *
 * @param callback The function whose events to group.
 */
function executeInEventGroup(callback: () => void) {
  const existingGroup = Blockly.Events.getGroup();
  if (!existingGroup) Blockly.Events.setGroup(true);
  try {
    callback();
  } finally {
    Blockly.Events.setGroup(existingGroup);
  }
}

/**
 * Returns all blocks in the workspace that are not shadows.
 *
 * @param workspace The workspace with blocks to filter.
 * @returns An array of non-shadow blocks.
 */
function getNonShadowBlocks(workspace: Blockly.Workspace) {
  return workspace.getAllBlocks().filter((block) => !block.isShadow());
}

/**
 * Option to make a block deletable.
 */
function registerDeletable() {
  const deletableOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        throw new Error('No block in scope for context menu item');
      }
      return block.isOwnDeletable()
        ? 'Make block undeletable'
        : 'Make block deletable';
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (block && !block.isInFlyout) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        throw new Error('No block in scope for context menu item');
      }
      setBlockState(block, 'deletable', !block.isOwnDeletable());
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'lessonBlockDeletable',
    weight: 8,
  };
  Blockly.ContextMenuRegistry.registry.register(deletableOption);
}

/**
 * Option to make all blocks deletable.
 */
function registerAllDeletable() {
  const deletableAllOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }
      if (
        getNonShadowBlocks(workspace).every((block) => !block.isOwnDeletable())
      ) {
        return 'Make ALL blocks deletable';
      }
      return 'Make ALL blocks undeletable';
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }
      if (workspace.getTopBlocks(false).length > 0) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }
      const allBlocks = getNonShadowBlocks(workspace);
      executeInEventGroup(() => {
        if (allBlocks.every((block) => !block.isOwnDeletable())) {
          allBlocks.forEach((block) => setBlockState(block, 'deletable', true));
        } else {
          allBlocks
            .filter((block) => block.isOwnDeletable())
            .forEach((block) => setBlockState(block, 'deletable', false));
        }
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'lessonAllBlocksDeletable',
    weight: 8,
  };
  Blockly.ContextMenuRegistry.registry.register(deletableAllOption);
}

/**
 * Option to make a block editable.
 */
function registerEditable() {
  const editableOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        throw new Error('No block in scope for context menu item');
      }
      return block.isOwnEditable()
        ? 'Make block uneditable'
        : 'Make block editable';
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      return 'enabled';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        throw new Error('No block in scope for context menu item');
      }
      const editable = !block.isOwnEditable();
      executeInEventGroup(() => {
        setBlockState(block, 'editable', editable);
        block
          .getChildren(false)
          .filter((child) => child.isShadow())
          .forEach((shadow) =>
            shadow
              .getDescendants(false)
              .forEach((descendant) =>
                setBlockState(descendant, 'editable', editable),
              ),
          );
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'lessonBlockEditable',
    weight: 9,
  };
  Blockly.ContextMenuRegistry.registry.register(editableOption);
}

/**
 * Option to make all blocks editable.
 */
function registerAllEditable() {
  const editableAllOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }
      if (workspace.getAllBlocks().every((block) => !block.isOwnEditable())) {
        return 'Make ALL blocks editable';
      }
      return 'Make ALL blocks uneditable';
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }
      if (workspace.getTopBlocks(false).length > 0) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }

      const allBlocks = workspace.getAllBlocks();
      executeInEventGroup(() => {
        if (allBlocks.every((block) => !block.isOwnEditable())) {
          allBlocks.forEach((block) => setBlockState(block, 'editable', true));
        } else {
          allBlocks
            .filter((block) => block.isOwnEditable())
            .forEach((block) => setBlockState(block, 'editable', false));
        }
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'lessonAllBlocksEditable',
    weight: 9,
  };
  Blockly.ContextMenuRegistry.registry.register(editableAllOption);
}

/**
 * Option to make a block movable.
 */
function registerMovable() {
  const movableOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        throw new Error('No block in scope for context menu item');
      }
      return block.isOwnMovable()
        ? 'Make block immovable'
        : 'Make block movable';
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (block && !block.isInFlyout) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        throw new Error('No block in scope for context menu item');
      }
      setBlockState(block, 'movable', !block.isOwnMovable());
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'lessonBlockMovable',
    weight: 10,
  };
  Blockly.ContextMenuRegistry.registry.register(movableOption);
}

/**
 * Option to make all blocks movable.
 */
function registerAllMovable() {
  const movableAllOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }
      if (
        getNonShadowBlocks(workspace).every((block) => !block.isOwnMovable())
      ) {
        return 'Make ALL blocks movable';
      }
      return 'Make ALL blocks immovable';
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }
      if (workspace.getTopBlocks(false).length > 0) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const workspace = scope.workspace;
      if (!workspace) {
        throw new Error('No workspace in scope for context menu item');
      }

      const allBlocks = getNonShadowBlocks(workspace);
      executeInEventGroup(() => {
        if (allBlocks.every((block) => !block.isOwnMovable())) {
          allBlocks.forEach((block) => setBlockState(block, 'movable', true));
        } else {
          allBlocks
            .filter((block) => block.isOwnMovable())
            .forEach((block) => setBlockState(block, 'movable', false));
        }
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'lessonAllBlocksMovable',
    weight: 10,
  };
  Blockly.ContextMenuRegistry.registry.register(movableAllOption);
}

/**
 * Returns the value input connections of a block that have shadow state,
 * whether the shadow is visible or covered by a real block.
 *
 * @param block The parent block.
 * @returns The connections with shadow state.
 */
function getShadowInputConnections(block: Blockly.Block) {
  return block.inputList
    .map((input) => input.connection)
    .filter((connection) => !!connection)
    .filter(
      (connection) =>
        connection.type === Blockly.ConnectionType.INPUT_VALUE &&
        !!connection.getShadowState(true),
    );
}

/**
 * Option to turn a block into a shadow of the input it is attached to.
 */
function registerMakeShadow() {
  const makeShadowOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText() {
      return 'Make block a shadow';
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (
        !block ||
        block.isInFlyout ||
        !block.outputConnection?.targetConnection
      ) {
        return 'hidden';
      }
      // Shadows cannot have real children, and variable fields cannot exist
      // on shadows. Descendants are already shadows, so cannot have them.
      const allDescendantsAreShadows = block
        .getDescendants(false)
        .slice(1)
        .every((descendant) => descendant.isShadow());
      const hasVariableField = block.inputList.some((input) =>
        input.fieldRow.some((field) => field instanceof Blockly.FieldVariable),
      );
      return allDescendantsAreShadows && !hasVariableField
        ? 'enabled'
        : 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      const connection = block?.outputConnection?.targetConnection;
      if (!block || !connection) {
        return;
      }
      // Without saveIds, the temporary shadow that setShadowState builds
      // cannot collide with the IDs of the still-attached block.
      const state = Blockly.serialization.blocks.save(block, {
        addCoordinates: false,
        saveIds: false,
      });
      if (!state) {
        return;
      }
      executeInEventGroup(() => {
        setShadowState(connection, state);
        // Unplugging the block respawns the shadow in its place.
        block.dispose(false);
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'lessonMakeShadow',
    weight: 11,
  };
  Blockly.ContextMenuRegistry.registry.register(makeShadowOption);
}

/**
 * Option to turn a block's shadows into real blocks. Any real block covering a
 * shadow is unplugged to make room, and the shadow state is removed.
 */
function registerMakeShadowsReal() {
  const makeShadowsRealOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const count = scope.block
        ? getShadowInputConnections(scope.block).length
        : 0;
      return `Make ${count} shadow block${count === 1 ? '' : 's'} real`;
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (
        block &&
        !block.isInFlyout &&
        getShadowInputConnections(block).length
      ) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        return;
      }
      executeInEventGroup(() => {
        for (const connection of getShadowInputConnections(block)) {
          const state = connection.getShadowState(true);
          if (!state) {
            continue;
          }
          // Clear the shadow first, so that unplugging a covering block does
          // not respawn it.
          setShadowState(connection, null);
          const coveringBlock = connection.targetBlock();
          coveringBlock?.unplug();

          const realBlock = Blockly.serialization.blocks.append(
            state,
            block.workspace,
            {recordUndo: true},
          );
          const childConnection = realBlock.outputConnection;
          if (childConnection) {
            connection.connect(childConnection);
          }
          // Move the unplugged block so it isn't hidden behind the new one.
          coveringBlock?.bumpNeighbours();
        }
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'lessonMakeShadowsReal',
    weight: 12,
  };
  Blockly.ContextMenuRegistry.registry.register(makeShadowsRealOption);
}

/**
 * Option to remove the shadows from a block's inputs, whether they are visible
 * or covered by a real block.
 */
function registerRemoveShadows() {
  const removeShadowsOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const count = scope.block
        ? getShadowInputConnections(scope.block).length
        : 0;
      return `Remove ${count} shadow block${count === 1 ? '' : 's'}`;
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (
        block &&
        !block.isInFlyout &&
        getShadowInputConnections(block).length
      ) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) {
        return;
      }
      // Disposes a visible shadow, or forgets a covered one.
      executeInEventGroup(() =>
        getShadowInputConnections(block).forEach((connection) =>
          setShadowState(connection, null),
        ),
      );
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'lessonRemoveShadows',
    weight: 13,
  };
  Blockly.ContextMenuRegistry.registry.register(removeShadowsOption);
}

/**
 * Registers the lesson-authoring context menu options.
 */
export function registerLessonAuthoringContextMenuOptions() {
  registerDeletable();
  registerAllDeletable();
  registerEditable();
  registerAllEditable();
  registerMovable();
  registerAllMovable();
  registerMakeShadow();
  registerMakeShadowsReal();
  registerRemoveShadows();
}
