/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Components for creating connections between blocks.
 *
 * @class
 */
// Former goog.module ID: Blockly.Connection

import type {Block} from './block.js';
import {ConnectionType} from './connection_type.js';
import type {BlockMove} from './events/events_block_move.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import type {Input} from './inputs/input.js';
import type {IConnectionChecker} from './interfaces/i_connection_checker.js';
import * as blocks from './serialization/blocks.js';
import {idGenerator} from './utils.js';
import * as Xml from './xml.js';

/**
 * Class for a connection between blocks.
 */
export class Connection {
  /** Constants for checking whether two connections are compatible. */
  static CAN_CONNECT = 0;
  static REASON_SELF_CONNECTION = 1;
  static REASON_WRONG_TYPE = 2;
  static REASON_TARGET_NULL = 3;
  static REASON_CHECKS_FAILED = 4;
  static REASON_DIFFERENT_WORKSPACES = 5;
  static REASON_SHADOW_PARENT = 6;
  static REASON_DRAG_CHECKS_FAILED = 7;
  static REASON_PREVIOUS_AND_OUTPUT = 8;

  protected sourceBlock_: Block;

  /** Connection this connection connects to.  Null if not connected. */
  targetConnection: Connection | null = null;

  /**
   * Has this connection been disposed of?
   *
   * @internal
   */
  disposed = false;

  /** List of compatible value types.  Null if all types are compatible. */
  private check: string[] | null = null;

  /** DOM representation of a shadow block, or null if none. */
  private shadowDom: Element | null = null;

  /** The unique ID of this connection. */
  id: string;

  /**
   * Horizontal location of this connection.
   *
   * @internal
   */
  x = 0;

  /**
   * Vertical location of this connection.
   *
   * @internal
   */
  y = 0;

  private shadowState: blocks.State | null = null;

  /**
   * @param source The block establishing this connection.
   * @param type The type of the connection.
   */
  constructor(
    source: Block,
    public type: number,
  ) {
    this.sourceBlock_ = source;
    if (source.id.includes('_connection')) {
      throw new Error(
        `Connection ID indicator is contained in block ID. This will cause ` +
          `problems with focus: ${source.id}.`,
      );
    }
    this.id = `${source.id}_connection_${idGenerator.getNextUniqueId()}`;
  }

  /**
   * Connect two connections together.  This is the connection on the superior
   * block.
   *
   * @param childConnection Connection on inferior block.
   */
  protected connect_(childConnection: Connection) {
    const INPUT = ConnectionType.INPUT_VALUE;
    const parentBlock = this.getSourceBlock();
    const childBlock = childConnection.getSourceBlock();

    // Make sure the childConnection is available.
    if (childConnection.isConnected()) {
      childConnection.disconnectInternal(false);
    }

    // Make sure the parentConnection is available.
    let orphan;
    if (this.isConnected()) {
      const shadowState = this.stashShadowState();
      const target = this.targetBlock();
      if (target!.isShadow()) {
        target!.dispose(false);
      } else {
        this.disconnectInternal();
        orphan = target;
      }
      this.applyShadowState(shadowState);
    }

    // Connect the new connection to the parent.
    let event;
    if (eventUtils.isEnabled()) {
      event = new (eventUtils.get(EventType.BLOCK_MOVE))(
        childBlock,
      ) as BlockMove;
      event.setReason(['connect']);
    }
    connectReciprocally(this, childConnection);
    childBlock.setParent(parentBlock);
    if (event) {
      event.recordNew();
      eventUtils.fire(event);
    }

    // Deal with the orphan if it exists.
    if (orphan) {
      const orphanConnection =
        this.type === INPUT
          ? orphan.outputConnection
          : orphan.previousConnection;
      if (!orphanConnection) return;
      const connection = Connection.getConnectionForOrphanedConnection(
        childBlock,
        orphanConnection,
      );
      if (connection) {
        orphanConnection.connect(connection);
      } else {
        orphanConnection.onFailedConnect(this);
      }
    }
  }

  /**
   * Dispose of this connection and deal with connected blocks.
   *
   * @internal
   */
  dispose() {
    // isConnected returns true for shadows and non-shadows.
    if (this.isConnected()) {
      if (this.isSuperior()) {
        // Destroy the attached shadow block & its children (if it exists).
        this.setShadowStateInternal();
      }

      const targetBlock = this.targetBlock();
      if (targetBlock && !targetBlock.isDeadOrDying()) {
        // Disconnect the attached normal block.
        targetBlock.unplug();
      }
    }

    this.disposed = true;
  }

  /**
   * Get the source block for this connection.
   *
   * @returns The source block.
   */
  getSourceBlock(): Block {
    return this.sourceBlock_;
  }

  /**
   * Does the connection belong to a superior block (higher in the source
   * stack)?
   *
   * @returns True if connection faces down or right.
   */
  isSuperior(): boolean {
    return (
      this.type === ConnectionType.INPUT_VALUE ||
      this.type === ConnectionType.NEXT_STATEMENT
    );
  }

  /**
   * Is the connection connected?
   *
   * @returns True if connection is connected to another connection.
   */
  isConnected(): boolean {
    return !!this.targetConnection;
  }

  /**
   * Get the workspace's connection type checker object.
   *
   * @returns The connection type checker for the source block's workspace.
   * @internal
   */
  getConnectionChecker(): IConnectionChecker {
    return this.sourceBlock_.workspace.connectionChecker;
  }

  /**
   * Called when an attempted connection fails. NOP by default (i.e. for
   * headless workspaces).
   *
   * @param _superiorConnection Connection that this connection failed to connect
   *     to. The provided connection should be the superior connection.
   * @internal
   */
  onFailedConnect(_superiorConnection: Connection) {}
  // NOP

  /**
   * Connect this connection to another connection.
   *
   * @param otherConnection Connection to connect to.
   * @returns Whether the blocks are now connected or not.
   */
  connect(otherConnection: Connection): boolean {
    if (this.targetConnection === otherConnection) {
      // Already connected together.  NOP.
      return true;
    }

    const checker = this.getConnectionChecker();
    if (checker.canConnect(this, otherConnection, false)) {
      const existingGroup = eventUtils.getGroup();
      if (!existingGroup) {
        eventUtils.setGroup(true);
      }
      // Determine which block is superior (higher in the source stack).
      if (this.isSuperior()) {
        // Superior block.
        this.connect_(otherConnection);
      } else {
        // Inferior block.
        otherConnection.connect_(this);
      }
      eventUtils.setGroup(existingGroup);
    }

    return this.isConnected();
  }

  /**
   * Disconnect this connection.
   */
  disconnect() {
    this.disconnectInternal();
  }

  /**
   * Disconnect two blocks that are connected by this connection.
   *
   * @param setParent Whether to set the parent of the disconnected block or
   *     not, defaults to true.
   *     If you do not set the parent, ensure that a subsequent action does,
   *     otherwise the view and model will be out of sync.
   */
  protected disconnectInternal(setParent = true) {
    const {parentConnection, childConnection} =
      this.getParentAndChildConnections();
    if (!parentConnection || !childConnection) {
      throw Error('Source connection not connected.');
    }

    const existingGroup = eventUtils.getGroup();
    if (!existingGroup) {
      eventUtils.setGroup(true);
    }

    let event;
    if (eventUtils.isEnabled()) {
      event = new (eventUtils.get(EventType.BLOCK_MOVE))(
        childConnection.getSourceBlock(),
      ) as BlockMove;
      event.setReason(['disconnect']);
    }
    const otherConnection = this.targetConnection;
    if (otherConnection) {
      otherConnection.targetConnection = null;
    }
    this.targetConnection = null;
    if (setParent) childConnection.getSourceBlock().setParent(null);
    if (event) {
      event.recordNew();
      eventUtils.fire(event);
    }

    if (!childConnection.getSourceBlock().isShadow()) {
      // If we were disconnecting a shadow, no need to spawn a new one.
      parentConnection.respawnShadow_();
    }

    eventUtils.setGroup(existingGroup);
  }

  /**
   * Returns the parent connection (superior) and child connection (inferior)
   * given this connection and the connection it is connected to.
   *
   * @returns The parent connection and child connection, given this connection
   *     and the connection it is connected to.
   */
  protected getParentAndChildConnections(): {
    parentConnection?: Connection;
    childConnection?: Connection;
  } {
    if (!this.targetConnection) return {};
    if (this.isSuperior()) {
      return {
        parentConnection: this,
        childConnection: this.targetConnection,
      };
    }
    return {
      parentConnection: this.targetConnection,
      childConnection: this,
    };
  }

  /**
   * Respawn the shadow block if there was one connected to the this connection.
   */
  protected respawnShadow_() {
    // Have to keep respawnShadow_ for backwards compatibility.
    this.createShadowBlock(true);
  }

  /**
   * Reconnects this connection to the input with the given name on the given
   * block. If there is already a connection connected to that input, that
   * connection is disconnected.
   *
   * @param block The block to connect this connection to.
   * @param inputName The name of the input to connect this connection to.
   * @returns True if this connection was able to connect, false otherwise.
   */
  reconnect(block: Block, inputName: string): boolean {
    // No need to reconnect if this connection's block is deleted.
    if (this.getSourceBlock().isDeadOrDying()) return false;

    const connectionParent = block.getInput(inputName)?.connection;
    const currentParent = this.targetBlock();
    if (
      (!currentParent || currentParent === block) &&
      connectionParent &&
      connectionParent.targetConnection !== this
    ) {
      if (connectionParent.isConnected()) {
        // There's already something connected here.  Get rid of it.
        connectionParent.disconnect();
      }
      connectionParent.connect(this);
      return true;
    }
    return false;
  }

  /**
   * Returns the block that this connection connects to.
   *
   * @returns The connected block or null if none is connected.
   */
  targetBlock(): Block | null {
    if (this.isConnected()) {
      return this.targetConnection?.getSourceBlock() ?? null;
    }
    return null;
  }

  /**
   * Function to be called when this connection's compatible types have changed.
   */
  protected onCheckChanged_() {
    // The new value type may not be compatible with the existing connection.
    if (
      this.isConnected() &&
      (!this.targetConnection ||
        !this.getConnectionChecker().canConnect(
          this,
          this.targetConnection,
          false,
        ))
    ) {
      const child = this.isSuperior() ? this.targetBlock() : this.sourceBlock_;
      child!.unplug();
    }
  }

  /**
   * Change a connection's compatibility.
   *
   * @param check Compatible value type or list of value types. Null if all
   *     types are compatible.
   * @returns The connection being modified (to allow chaining).
   */
  setCheck(check: string | string[] | null): Connection {
    if (check) {
      if (!Array.isArray(check)) {
        check = [check];
      }
      this.check = check;
      this.onCheckChanged_();
    } else {
      this.check = null;
    }
    return this;
  }

  /**
   * Get a connection's compatibility.
   *
   * @returns List of compatible value types.
   *     Null if all types are compatible.
   */
  getCheck(): string[] | null {
    return this.check;
  }

  /**
   * Changes the connection's shadow block.
   *
   * @param shadowDom DOM representation of a block or null.
   */
  setShadowDom(shadowDom: Element | null) {
    this.setShadowStateInternal({shadowDom});
  }

  /**
   * Returns the xml representation of the connection's shadow block.
   *
   * @param returnCurrent If true, and the shadow block is currently attached to
   *     this connection, this serializes the state of that block and returns it
   *     (so that field values are correct). Otherwise the saved shadowDom is
   *     just returned.
   * @returns Shadow DOM representation of a block or null.
   */
  getShadowDom(returnCurrent?: boolean): Element | null {
    return returnCurrent && this.targetBlock()!.isShadow()
      ? (Xml.blockToDom(this.targetBlock() as Block) as Element)
      : this.shadowDom;
  }

  /**
   * Changes the connection's shadow block.
   *
   * @param shadowState An state represetation of the block or null.
   */
  setShadowState(shadowState: blocks.State | null) {
    this.setShadowStateInternal({shadowState});
  }

  /**
   * Returns the serialized object representation of the connection's shadow
   * block.
   *
   * @param returnCurrent If true, and the shadow block is currently attached to
   *     this connection, this serializes the state of that block and returns it
   *     (so that field values are correct). Otherwise the saved state is just
   *     returned.
   * @returns Serialized object representation of the block, or null.
   */
  getShadowState(returnCurrent?: boolean): blocks.State | null {
    if (returnCurrent && this.targetBlock() && this.targetBlock()!.isShadow()) {
      return blocks.save(this.targetBlock() as Block);
    }
    return this.shadowState;
  }

  /**
   * Find all nearby compatible connections to this connection.
   * Type checking does not apply, since this function is used for bumping.
   *
   * Headless configurations (the default) do not have neighboring connection,
   * and always return an empty list (the default).
   * {@link (RenderedConnection:class).neighbours} overrides this behavior with a list
   * computed from the rendered positioning.
   *
   * @param _maxLimit The maximum radius to another connection.
   * @returns List of connections.
   * @internal
   */
  neighbours(_maxLimit: number): Connection[] {
    return [];
  }

  /**
   * Get the parent input of a connection.
   *
   * @returns The input that the connection belongs to or null if no parent
   *     exists.
   * @internal
   */
  getParentInput(): Input | null {
    let parentInput = null;
    const inputs = this.sourceBlock_.inputList;
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].connection === this) {
        parentInput = inputs[i];
        break;
      }
    }
    return parentInput;
  }

  /**
   * This method returns a string describing this Connection in developer terms
   * (English only). Intended to on be used in console logs and errors.
   *
   * @returns The description.
   */
  toString(): string {
    const block = this.sourceBlock_;
    if (!block) {
      return 'Orphan Connection';
    }
    let msg;
    if (block.outputConnection === this) {
      msg = 'Output Connection of ';
    } else if (block.previousConnection === this) {
      msg = 'Previous Connection of ';
    } else if (block.nextConnection === this) {
      msg = 'Next Connection of ';
    } else {
      let parentInput = null;
      for (let i = 0, input; (input = block.inputList[i]); i++) {
        if (input.connection === this) {
          parentInput = input;
          break;
        }
      }
      if (parentInput) {
        msg = 'Input "' + parentInput.name + '" connection on ';
      } else {
        console.warn('Connection not actually connected to sourceBlock_');
        return 'Orphan Connection';
      }
    }
    return msg + block.toDevString();
  }

  /**
   * Returns the state of the shadowDom_ and shadowState_ properties, then
   * temporarily sets those properties to null so no shadow respawns.
   *
   * @returns The state of both the shadowDom_ and shadowState_ properties.
   */
  private stashShadowState(): {
    shadowDom: Element | null;
    shadowState: blocks.State | null;
  } {
    const shadowDom = this.getShadowDom(true);
    const shadowState = this.getShadowState(true);
    // Set to null so it doesn't respawn.
    this.shadowDom = null;
    this.shadowState = null;
    return {shadowDom, shadowState};
  }

  /**
   * Reapplies the stashed state of the shadowDom_ and shadowState_ properties.
   *
   * @param param0 The state to reapply to the shadowDom_ and shadowState_
   *     properties.
   */
  private applyShadowState({
    shadowDom,
    shadowState,
  }: {
    shadowDom: Element | null;
    shadowState: blocks.State | null;
  }) {
    this.shadowDom = shadowDom;
    this.shadowState = shadowState;
  }

  /**
   * Sets the state of the shadow of this connection.
   *
   * @param param0 The state to set the shadow of this connection to.
   */
  private setShadowStateInternal({
    shadowDom = null,
    shadowState = null,
  }: {
    shadowDom?: Element | null;
    shadowState?: blocks.State | null;
  } = {}) {
    // One or both of these should always be null.
    // If neither is null, the shadowState will get priority.
    this.shadowDom = shadowDom;
    this.shadowState = shadowState;

    if (this.getSourceBlock().isDeadOrDying()) return;

    const target = this.targetBlock();
    if (!target) {
      this.respawnShadow_();
      if (this.targetBlock() && this.targetBlock()!.isShadow()) {
        this.serializeShadow(this.targetBlock());
      }
    } else if (target.isShadow()) {
      target.dispose(false);
      this.respawnShadow_();
      if (this.targetBlock() && this.targetBlock()!.isShadow()) {
        this.serializeShadow(this.targetBlock());
      }
    } else {
      const shadow = this.createShadowBlock(false);
      this.serializeShadow(shadow);
      if (shadow) {
        shadow.dispose(false);
      }
    }
  }

  /**
   * Creates a shadow block based on the current shadowState_ or shadowDom_.
   * shadowState_ gets priority.
   *
   * @param attemptToConnect Whether to try to connect the shadow block to this
   *     connection or not.
   * @returns The shadow block that was created, or null if both the
   *     shadowState_ and shadowDom_ are null.
   */
  private createShadowBlock(attemptToConnect: boolean): Block | null {
    const parentBlock = this.getSourceBlock();
    const shadowState = this.getShadowState();
    const shadowDom = this.getShadowDom();
    if (parentBlock.isDeadOrDying() || (!shadowState && !shadowDom)) {
      return null;
    }

    let blockShadow;
    if (shadowState) {
      blockShadow = blocks.appendInternal(shadowState, parentBlock.workspace, {
        parentConnection: attemptToConnect ? this : undefined,
        isShadow: true,
        recordUndo: false,
      });
      return blockShadow;
    }

    if (shadowDom) {
      blockShadow = Xml.domToBlockInternal(shadowDom, parentBlock.workspace);
      if (attemptToConnect) {
        if (this.type === ConnectionType.INPUT_VALUE) {
          if (!blockShadow.outputConnection) {
            throw new Error('Shadow block is missing an output connection');
          }
          if (!this.connect(blockShadow.outputConnection)) {
            throw new Error('Could not connect shadow block to connection');
          }
        } else if (this.type === ConnectionType.NEXT_STATEMENT) {
          if (!blockShadow.previousConnection) {
            throw new Error('Shadow block is missing previous connection');
          }
          if (!this.connect(blockShadow.previousConnection)) {
            throw new Error('Could not connect shadow block to connection');
          }
        } else {
          throw new Error(
            'Cannot connect a shadow block to a previous/output connection',
          );
        }
      }
      return blockShadow;
    }
    return null;
  }

  /**
   * Saves the given shadow block to both the shadowDom_ and shadowState_
   * properties, in their respective serialized forms.
   *
   * @param shadow The shadow to serialize, or null.
   */
  private serializeShadow(shadow: Block | null) {
    if (!shadow) {
      return;
    }
    this.shadowDom = Xml.blockToDom(shadow) as Element;
    this.shadowState = blocks.save(shadow);
  }

  /**
   * Returns the connection (starting at the startBlock) which will accept
   * the given connection. This includes compatible connection types and
   * connection checks.
   *
   * @param startBlock The block on which to start the search.
   * @param orphanConnection The connection that is looking for a home.
   * @returns The suitable connection point on the chain of blocks, or null.
   */
  static getConnectionForOrphanedConnection(
    startBlock: Block,
    orphanConnection: Connection,
  ): Connection | null {
    if (orphanConnection.type === ConnectionType.OUTPUT_VALUE) {
      return getConnectionForOrphanedOutput(
        startBlock,
        orphanConnection.getSourceBlock(),
      );
    }
    // Otherwise we're dealing with a stack.
    const connection = startBlock.lastConnectionInStack(true);
    const checker = orphanConnection.getConnectionChecker();
    if (connection && checker.canConnect(orphanConnection, connection, false)) {
      return connection;
    }
    return null;
  }
}

/**
 * Update two connections to target each other.
 *
 * @param first The first connection to update.
 * @param second The second connection to update.
 */
function connectReciprocally(first: Connection, second: Connection) {
  if (!first || !second) {
    throw Error('Cannot connect null connections.');
  }
  first.targetConnection = second;
  second.targetConnection = first;
}
/**
 * Returns the single connection on the block that will accept the orphaned
 * block, if one can be found. If the block has multiple compatible connections
 * (even if they are filled) this returns null. If the block has no compatible
 * connections, this returns null.
 *
 * @param block The superior block.
 * @param orphanBlock The inferior block.
 * @returns The suitable connection point on 'block', or null.
 */
function getSingleConnection(
  block: Block,
  orphanBlock: Block,
): Connection | null {
  let foundConnection = null;
  const output = orphanBlock.outputConnection;
  const typeChecker = output?.getConnectionChecker();

  for (let i = 0, input; (input = block.inputList[i]); i++) {
    const connection = input.connection;
    if (connection && typeChecker?.canConnect(output, connection, false)) {
      if (foundConnection) {
        return null; // More than one connection.
      }
      foundConnection = connection;
    }
  }
  return foundConnection;
}

/**
 * Walks down a row a blocks, at each stage checking if there are any
 * connections that will accept the orphaned block.  If at any point there
 * are zero or multiple eligible connections, returns null.  Otherwise
 * returns the only input on the last block in the chain.
 * Terminates early for shadow blocks.
 *
 * @param startBlock The block on which to start the search.
 * @param orphanBlock The block that is looking for a home.
 * @returns The suitable connection point on the chain of blocks, or null.
 */
function getConnectionForOrphanedOutput(
  startBlock: Block,
  orphanBlock: Block,
): Connection | null {
  let newBlock: Block | null = startBlock;
  let connection;
  while ((connection = getSingleConnection(newBlock, orphanBlock))) {
    newBlock = connection.targetBlock();
    if (!newBlock || newBlock.isShadow()) {
      return connection;
    }
  }
  return null;
}
