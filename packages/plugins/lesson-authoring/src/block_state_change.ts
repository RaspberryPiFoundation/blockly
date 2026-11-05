/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview An event for changes to a block's deletable, editable or
 * movable state, which core does not fire one for, so that those changes can
 * be undone.
 */

import * as Blockly from 'blockly/core';

const BLOCK_STATE_CHANGE = 'lesson_block_state_change';

/** A boolean block state that core changes without firing an event. */
type BlockStateName = 'deletable' | 'editable' | 'movable';

interface BlockStateChangeJson extends Blockly.Events.BlockBaseJson {
  element: BlockStateName;
  oldValue: boolean;
  newValue: boolean;
}

/**
 * Returns the value of one of a block's own boolean states.
 *
 * @param block The block to read.
 * @param state The state to read.
 * @returns The block's own value for the state.
 */
function getBlockState(block: Blockly.Block, state: BlockStateName): boolean {
  switch (state) {
    case 'deletable':
      return block.isOwnDeletable();
    case 'editable':
      return block.isOwnEditable();
    case 'movable':
      return block.isOwnMovable();
  }
}

/**
 * Applies a value to one of a block's boolean states, without firing an event.
 *
 * @param block The block to change.
 * @param state The state to change.
 * @param value The new value of the state.
 */
function applyBlockState(
  block: Blockly.Block,
  state: BlockStateName,
  value: boolean,
) {
  switch (state) {
    case 'deletable':
      block.setDeletable(value);
      break;
    case 'editable':
      block.setEditable(value);
      break;
    case 'movable':
      block.setMovable(value);
      break;
  }
}

/**
 * Notifies listeners that a block's deletable, editable or movable state has
 * changed.
 */
class BlockStateChange extends Blockly.Events.BlockBase {
  override type = BLOCK_STATE_CHANGE;

  /** The state that changed. Undefined for a blank event. */
  element?: BlockStateName;

  /** The value before the change. */
  oldValue: boolean;

  /** The value after the change. */
  newValue: boolean;

  /**
   * @param block The changed block. Undefined for a blank event.
   * @param element The state that changed.
   * @param oldValue The value before the change.
   * @param newValue The value after the change.
   */
  constructor(
    block?: Blockly.Block,
    element?: BlockStateName,
    oldValue = false,
    newValue = false,
  ) {
    super(block);
    this.element = element;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  /**
   * Encodes this event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): BlockStateChangeJson {
    if (!this.element) {
      throw new Error(
        'The changed element is undefined. Either pass an element to the ' +
          'constructor, or call fromJson',
      );
    }
    const json = super.toJson() as BlockStateChangeJson;
    json.element = this.element;
    json.oldValue = this.oldValue;
    json.newValue = this.newValue;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param json The JSON representation of the event.
   * @param workspace The workspace the event belongs to.
   * @param event The event to populate, if any.
   * @returns The deserialized event.
   */
  static fromJson(
    json: BlockStateChangeJson,
    workspace: Blockly.Workspace,
    event?: BlockStateChange,
  ): BlockStateChange {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockStateChange(),
    ) as BlockStateChange;
    newEvent.element = json.element;
    newEvent.oldValue = json.oldValue;
    newEvent.newValue = json.newValue;
    return newEvent;
  }

  /**
   * Does this event record any change of state?
   *
   * @returns False if something changed.
   */
  override isNull(): boolean {
    return this.oldValue === this.newValue;
  }

  /**
   * Applies the old or new value to the block.
   *
   * @param forward True to apply the new value, false to restore the old one.
   */
  override run(forward: boolean) {
    const block = this.blockId
      ? this.getEventWorkspace_().getBlockById(this.blockId)
      : null;
    if (!block || !this.element) {
      console.warn("Can't change state of non-existent block");
      return;
    }
    applyBlockState(
      block,
      this.element,
      forward ? this.newValue : this.oldValue,
    );
  }
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  BLOCK_STATE_CHANGE,
  BlockStateChange,
);

/**
 * Sets a block's deletable, editable or movable state, firing an event so it
 * can be undone.
 *
 * @param block The block to change.
 * @param state The state to set.
 * @param value The new value of the state.
 */
export function setBlockState(
  block: Blockly.Block,
  state: BlockStateName,
  value: boolean,
) {
  Blockly.Events.fire(
    new BlockStateChange(block, state, getBlockState(block, state), value),
  );
  applyBlockState(block, state, value);
}
