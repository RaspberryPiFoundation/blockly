/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview An event for changes to a connection's shadow state, which
 * core does not fire one for, so that those changes can be undone.
 */

import * as Blockly from 'blockly/core';

const SHADOW_STATE_CHANGE = 'lesson_shadow_state_change';

type ShadowState = Blockly.serialization.blocks.State | null;

interface ShadowStateChangeJson extends Blockly.Events.BlockBaseJson {
  inputName: string;
  oldState: ShadowState;
  newState: ShadowState;
}

/**
 * Notifies listeners that the shadow state of one of a block's value inputs
 * has changed.
 */
class ShadowStateChange extends Blockly.Events.BlockBase {
  override type = SHADOW_STATE_CHANGE;

  /** The input whose connection changed. */
  inputName: string;

  /** The shadow state before the change. */
  oldState: ShadowState;

  /** The shadow state after the change. */
  newState: ShadowState;

  /**
   * @param block The block that owns the connection. Undefined for a blank
   *     event.
   * @param inputName The input whose connection changed.
   * @param oldState The shadow state before the change.
   * @param newState The shadow state after the change.
   */
  constructor(
    block?: Blockly.Block,
    inputName = '',
    oldState: ShadowState = null,
    newState: ShadowState = null,
  ) {
    super(block);
    this.inputName = inputName;
    this.oldState = oldState;
    this.newState = newState;
  }

  /**
   * Encodes this event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): ShadowStateChangeJson {
    const json = super.toJson() as ShadowStateChangeJson;
    json.inputName = this.inputName;
    json.oldState = this.oldState;
    json.newState = this.newState;
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
    json: ShadowStateChangeJson,
    workspace: Blockly.Workspace,
    event?: ShadowStateChange,
  ): ShadowStateChange {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new ShadowStateChange(),
    ) as ShadowStateChange;
    newEvent.inputName = json.inputName;
    newEvent.oldState = json.oldState;
    newEvent.newState = json.newState;
    return newEvent;
  }

  /**
   * Does this event record any change of state?
   *
   * @returns False if something changed.
   */
  override isNull(): boolean {
    return JSON.stringify(this.oldState) === JSON.stringify(this.newState);
  }

  /**
   * Applies the old or new shadow state to the connection.
   *
   * @param forward True to apply the new state, false to restore the old one.
   */
  override run(forward: boolean) {
    const block = this.blockId
      ? this.getEventWorkspace_().getBlockById(this.blockId)
      : null;
    const connection = block?.getInput(this.inputName)?.connection;
    if (!connection) {
      console.warn("Can't set shadow state of non-existent connection");
      return;
    }
    connection.setShadowState(forward ? this.newState : this.oldState);
  }
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  SHADOW_STATE_CHANGE,
  ShadowStateChange,
);

/**
 * Sets a connection's shadow state, firing an event so it can be undone.
 *
 * @param connection The value input connection to change.
 * @param newState The new shadow state, or null to remove the shadow.
 */
export function setShadowState(
  connection: Blockly.Connection,
  newState: ShadowState,
) {
  const block = connection.getSourceBlock();
  const inputName = block.inputList.find(
    (input) => input.connection === connection,
  )?.name;
  if (!inputName) {
    throw new Error('Could not find input name for connection');
  }
  const oldState = connection.getShadowState(true);
  // Fired before the change, so that undo restores the shadow state after
  // any blocks moved by the same action have been put back.
  Blockly.Events.fire(
    new ShadowStateChange(block, inputName, oldState, newState),
  );
  connection.setShadowState(newState);
}
