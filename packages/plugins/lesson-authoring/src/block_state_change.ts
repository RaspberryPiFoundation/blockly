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
import {refreshBlockStateIcon} from './block_state_icon';

const BLOCK_STATE_CHANGE = 'lesson_block_state_change';

/**
 * Something a block allows, which core turns on and off without firing an
 * event.
 */
export type BlockPermission = 'deletable' | 'editable' | 'movable';

interface BlockStateChangeJson extends Blockly.Events.BlockBaseJson {
  element: BlockPermission;
  oldValue: boolean;
  newValue: boolean;
}

/**
 * Notifies listeners that a block's deletable, editable or movable state has
 * changed.
 */
class BlockStateChange extends Blockly.Events.BlockBase {
  override type = BLOCK_STATE_CHANGE;

  /** The state that changed. Undefined for a blank event. */
  element?: BlockPermission;

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
    element?: BlockPermission,
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
    // Fires a new event, as core's events do when run, so that listeners
    // hear about undo and redo. Undo isn't recorded while undoing.
    setBlockState(block, this.element, forward ? this.newValue : this.oldValue);
  }
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  BLOCK_STATE_CHANGE,
  BlockStateChange,
);

/**
 * Sets a block's deletable, editable or movable state and updates its state
 * icon, firing an event so the change can be undone.
 *
 * @param block The block to change.
 * @param state The state to set.
 * @param value The new value of the state.
 */
export function setBlockState(
  block: Blockly.Block,
  state: BlockPermission,
  value: boolean,
) {
  let oldValue: boolean;
  switch (state) {
    case 'deletable':
      oldValue = block.isOwnDeletable();
      block.setDeletable(value);
      break;
    case 'editable':
      oldValue = block.isOwnEditable();
      block.setEditable(value);
      break;
    case 'movable':
      oldValue = block.isOwnMovable();
      block.setMovable(value);
      break;
  }
  Blockly.Events.fire(new BlockStateChange(block, state, oldValue, value));
  refreshBlockStateIcon(block);
}
