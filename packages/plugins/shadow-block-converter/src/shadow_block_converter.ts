/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin for converting shadow blocks to real ones on edit.
 */

import * as Blockly from 'blockly/core';

export interface BlockShadowStateChangeJson
  extends Blockly.Events.BlockBaseJson {
  inputIndexInParent: number | null;
  shadowState: Blockly.serialization.blocks.State;
}

/**
 * A Blockly event class to revert a block connection's shadow state to the
 * provided state, to be used after attaching a child block that would
 * ordinarily overwrite the connection's shadow state.
 */
export class BlockShadowStateChange extends Blockly.Events.BlockBase {
  /**
   * The name of the event type for broadcast and listening purposes.
   */

  static readonly EVENT_TYPE = 'block_shadow_state_change';

  /**
   * The index of the connection in the parent block's list of connections. If
   * null, then the nextConnection will be used instead.
   */
  inputIndexInParent: number | null;

  /**
   * The intended shadow state of the connection.
   */
  shadowState: Blockly.serialization.blocks.State;

  /**
   * The constructor for a new BlockShadowStateChange event.
   *
   * @param block The parent of the connection to modify.
   * @param inputIndexInParent The index of the input associated with the
   *     connection to modify, if it is associated with one. Otherwise the
   *     nextConnection will be used.
   * @param shadowState The intended shadow state of the connection.
   */
  constructor(
    block: Blockly.Block,
    inputIndexInParent: number | null,
    shadowState: Blockly.serialization.blocks.State,
  ) {
    super(block);

    this.type = BlockShadowStateChange.EVENT_TYPE;
    this.inputIndexInParent = inputIndexInParent;
    this.shadowState = shadowState;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   * @override
   */
  toJson(): BlockShadowStateChangeJson {
    const json = super.toJson() as BlockShadowStateChangeJson;
    json['inputIndexInParent'] = this.inputIndexInParent;
    json['shadowState'] = this.shadowState;
    return json;
  }

  /**
   * Decode the JSON event.
   *
   * @param json JSON representation.
   * @override
   */
  static fromJson(
    json: BlockShadowStateChangeJson,
    workspace: Blockly.Workspace,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    event?: any,
  ): BlockShadowStateChange {
    const newEvent = super.fromJson(
      json,
      workspace,
      event,
    ) as BlockShadowStateChange;
    newEvent.inputIndexInParent = json['inputIndexInParent'];
    newEvent.shadowState = json['shadowState'];
    return event;
  }

  /**
   * Does this event record any change of state?
   *
   * @returns False if something changed.
   * @override
   */
  isNull(): boolean {
    return false;
  }

  /**
   * Run a change event.
   *
   * @param forward True if run forward, false if run backward (undo).
   * @override
   */
  run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    if (!this.blockId) {
      throw new Error(
        'The block ID is undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    const block = workspace.getBlockById(this.blockId);
    if (!block) {
      throw new Error(
        'The associated block is undefined. Either pass a ' +
          'block to the constructor, or call fromJson',
      );
    }

    const connections = block.getConnections_(true);

    let connection: Blockly.Connection | null;
    if (this.inputIndexInParent === null) {
      connection = block.nextConnection;
    } else if (
      typeof this.inputIndexInParent !== 'number' ||
      this.inputIndexInParent < 0 ||
      this.inputIndexInParent >= connections.length
    ) {
      throw new Error('inputIndexInParent was invalid.');
    } else {
      connection = block.inputList[this.inputIndexInParent].connection;
    }
    if (connection === null) {
      throw new Error('No matching connection was found.');
    }

    if (forward) {
      connection.setShadowState(this.shadowState || null);
    }

    // Make sure the modified block is focused, otherwise
    // the document root gets focus when the block is deleted.
    Blockly.getFocusManager().focusNode(block as Blockly.BlockSvg);

    // Nothing to be done when run backward, because removing a child block
    // doesn't overwrite the connection's shadowState and thus doesn't need to
    // be reverted.
  }
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  BlockShadowStateChange.EVENT_TYPE,
  BlockShadowStateChange,
);

/**
 * Convert the provided shadow block into a regular block, along with any parent
 * shadow blocks.
 *
 * The provided block will be deleted, and a new regular block will be created
 * in its place that has new id but is otherwise identical to the shadow block.
 * The parent connection's shadow state will be forcibly preserved, despite the
 * fact that attaching a regular block to the connection ordinarily overwrites
 * the connection's shadow state.
 *
 * @param shadowBlock
 * @param selectNewBlock true to select the newly reified block.
 * @returns The newly created regular block with a different id, if one could be
 *     created.
 */
function reifyEditedShadowBlock(
  shadowBlock: Blockly.Block,
  selectNewBlock = false,
): Blockly.Block {
  // Determine how the shadow block is connected to the parent.
  let parentConnection: Blockly.Connection | null = null;
  let connectionIsThroughOutputConnection = false;
  if (shadowBlock.previousConnection?.isConnected()) {
    parentConnection = shadowBlock.previousConnection.targetConnection;
  } else if (shadowBlock.outputConnection?.isConnected()) {
    parentConnection = shadowBlock.outputConnection.targetConnection;
    connectionIsThroughOutputConnection = true;
  }
  if (parentConnection === null) {
    // We can't change the shadow status of a block with no parent, so just
    // return the block as-is.
    return shadowBlock;
  }

  // Get the parent block, and the index of the connection's input if it is
  // associated with one.
  let parentBlock = parentConnection.getSourceBlock();
  const inputInParent = parentConnection.getParentInput();
  const inputIndexInParent: number | null = inputInParent
    ? parentBlock.inputList.indexOf(inputInParent)
    : null;

  // Recover the state of the shadow block before it was edited. The connection
  // should still have the original state until a new block is attached to it.
  const originalShadowState = parentConnection.getShadowState(
    /* returnCurrent = */ false,
  );

  // Serialize the current state of the shadow block (after it was edited).
  const editedBlockState = Blockly.serialization.blocks.save(shadowBlock, {
    addCoordinates: false,
    addInputBlocks: true,
    addNextBlocks: true,
    doFullSerialization: false,
  });
  if (originalShadowState === null || editedBlockState === null) {
    // The serialized block states are necessary to convert the block. Without
    // them, just return the block as-is.
    return shadowBlock;
  }

  // If the parent block is a shadow, it must be converted first.
  if (parentBlock.isShadow()) {
    const newParentBlock = reifyEditedShadowBlock(parentBlock);
    if (newParentBlock === null) {
      throw new Error(
        "No parent block was created, so we can't recreate the " +
          'current block either.',
      );
    }
    parentBlock = newParentBlock;

    // The reference to the connection is obsolete. Find it from the new parent.
    if (inputIndexInParent === null) {
      parentConnection = parentBlock.nextConnection;
    } else if (
      inputIndexInParent < 0 ||
      inputIndexInParent >= parentBlock.inputList.length
    ) {
      throw new Error('inputIndexInParent is invalid.');
    } else {
      parentConnection = parentBlock.inputList[inputIndexInParent].connection;
    }
    if (parentConnection === null) {
      throw new Error(
        "Couldn't find the corresponding connection on the new " +
          'version of the parent block.',
      );
    }
  }

  // Let Blockly generate a new id for the new regular block. Ideally, we would
  // let the shadow block and the regular block have the same id, and in
  // principle that ought to be possible since they don't need to coexist at the
  // same time. However, we'll need to call setShadowState on the connection
  // after attaching the regular block to revert any changes made by attaching
  // the block, and the setShadowState implementation temporarily instantiates
  // the provided shadow state, which can't have the same id as a block in the
  // workspace. The new shadow state id won't be compatible with any existing
  // undo history on the shadow block, such as the block change event that
  // triggered this whole shadow conversion!
  editedBlockState.id = undefined;

  // Create a regular version of the shadow block by deserializing its state
  // independently from the connection.
  const regularBlock = Blockly.serialization.blocks.append(
    editedBlockState,
    parentBlock.workspace,
    {recordUndo: true},
  );

  // Attach the regular block to the connection in place of the shadow block.
  const childConnection = connectionIsThroughOutputConnection
    ? regularBlock.outputConnection
    : regularBlock.previousConnection;
  if (childConnection) {
    parentConnection.connect(childConnection);
  }

  // The process of connecting a block overwrites the connection's shadow state,
  // so revert it.
  parentConnection.setShadowState(originalShadowState);
  Blockly.Events.fire(
    new BlockShadowStateChange(
      parentBlock,
      inputIndexInParent,
      originalShadowState,
    ),
  );

  if (selectNewBlock) {
    Blockly.renderManagement.finishQueuedRenders().then(() => {
      Blockly.getFocusManager().focusNode(regularBlock as Blockly.BlockSvg);
    });
  }

  return regularBlock;
}

/**
 * Add this function to your workspace as a change listener to automatically
 * convert shadow blocks to real blocks whenever the user edits a field on the
 * block, like this:
 *
 * workspace.addChangeListener(shadowBlockConversionChangeListener);
 *
 * Ideally the Blockly.Field.prototype.setValue method should handle this logic,
 * but for the purposes of this plugin it can be a workspace change listener.
 *
 * @param event An event broadcast by the workspace.
 */
export function shadowBlockConversionChangeListener(
  event: Blockly.Events.Abstract,
) {
  // Auto-converting shadow blocks to real blocks should happen in response to
  // new user action events (which get recorded as undo events) but not when
  // undoing or redoing events (which do not get recorded again).
  if (!event.recordUndo) {
    return;
  }

  // Auto-converting shadow blocks to real blocks should happen in response to
  // editing a field value, which is recorded as Blockly.Events.BLOCK_CHANGE.
  if (event.type != Blockly.Events.BLOCK_CHANGE) {
    return;
  }
  const blockEvent = event as Blockly.Events.BlockChange;

  if (!blockEvent.workspaceId || !blockEvent.blockId) {
    return;
  }
  const workspace = Blockly.Workspace.getById(blockEvent.workspaceId);
  if (!workspace) {
    return;
  }
  const block = workspace.getBlockById(blockEvent.blockId);
  if (!block) {
    return;
  }

  // Blocks that are already real blocks can be ignored.
  if (!block.isShadow()) {
    return;
  }

  // Remember the current event group so that it can be resumed below.
  const currentGroup = Blockly.Events.getGroup();

  if (blockEvent.group) {
    // Temporarily use the same group as the initiating event so that
    // the shadow events get grouped with it for undo purposes.
    Blockly.Events.setGroup(blockEvent.group);
  } else {
    // The initiating event wasn't part of any named group, so the shadow events
    // can't be grouped with it, but at least they can be grouped with each
    // other.
    Blockly.Events.setGroup(true);
  }

  reifyEditedShadowBlock(block, true);

  // Revert to the current event group, if any.
  Blockly.Events.setGroup(currentGroup);
}
