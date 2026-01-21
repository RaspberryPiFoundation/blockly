/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An object that encapsulates logic for checking whether a
 * potential connection is safe and valid.
 *
 * @class
 */
// Former goog.module ID: Blockly.ConnectionChecker

import * as common from './common.js';
import {Connection} from './connection.js';
import {ConnectionType} from './connection_type.js';
import type {IConnectionChecker} from './interfaces/i_connection_checker.js';
import * as internalConstants from './internal_constants.js';
import * as registry from './registry.js';
import type {RenderedConnection} from './rendered_connection.js';

/**
 * Class for connection type checking logic.
 */
export class ConnectionChecker implements IConnectionChecker {
  /**
   * Check whether the current connection can connect with the target
   * connection.
   *
   * @param a Connection to check compatibility with.
   * @param b Connection to check compatibility with.
   * @param isDragging True if the connection is being made by dragging a block.
   * @param opt_distance The max allowable distance between the connections for
   *     drag checks.
   * @returns Whether the connection is legal.
   */
  canConnect(
    a: Connection | null,
    b: Connection | null,
    isDragging: boolean,
    opt_distance?: number,
  ): boolean {
    return (
      this.canConnectWithReason(a, b, isDragging, opt_distance) ===
      Connection.CAN_CONNECT
    );
  }

  /**
   * Checks whether the current connection can connect with the target
   * connection, and return an error code if there are problems.
   *
   * @param a Connection to check compatibility with.
   * @param b Connection to check compatibility with.
   * @param isDragging True if the connection is being made by dragging a block.
   * @param opt_distance The max allowable distance between the connections for
   *     drag checks.
   * @returns Connection.CAN_CONNECT if the connection is legal, an error code
   *     otherwise.
   */
  canConnectWithReason(
    a: Connection | null,
    b: Connection | null,
    isDragging: boolean,
    opt_distance?: number,
  ): number {
    const safety = this.doSafetyChecks(a, b);
    if (safety !== Connection.CAN_CONNECT) {
      return safety;
    }

    // If the safety checks passed, both connections are non-null.
    const connOne = a!;
    const connTwo = b!;
    if (!this.doTypeChecks(connOne, connTwo)) {
      return Connection.REASON_CHECKS_FAILED;
    }

    if (
      isDragging &&
      !this.doDragChecks(
        a as RenderedConnection,
        b as RenderedConnection,
        opt_distance || 0,
      )
    ) {
      return Connection.REASON_DRAG_CHECKS_FAILED;
    }

    return Connection.CAN_CONNECT;
  }

  /**
   * Helper method that translates a connection error code into a string.
   *
   * @param errorCode The error code.
   * @param a One of the two connections being checked.
   * @param b The second of the two connections being checked.
   * @returns A developer-readable error string.
   */
  getErrorMessage(
    errorCode: number,
    a: Connection | null,
    b: Connection | null,
  ): string {
    switch (errorCode) {
      case Connection.REASON_SELF_CONNECTION:
        return 'Attempted to connect a block to itself.';
      case Connection.REASON_DIFFERENT_WORKSPACES:
        // Usually this means one block has been deleted.
        return 'Blocks not on same workspace.';
      case Connection.REASON_WRONG_TYPE:
        return 'Attempt to connect incompatible types.';
      case Connection.REASON_TARGET_NULL:
        return 'Target connection is null.';
      case Connection.REASON_CHECKS_FAILED: {
        const connOne = a!;
        const connTwo = b!;
        let msg = 'Connection checks failed. ';
        msg +=
          connOne +
          ' expected ' +
          connOne.getCheck() +
          ', found ' +
          connTwo.getCheck();
        return msg;
      }
      case Connection.REASON_SHADOW_PARENT:
        return 'Connecting non-shadow to shadow block.';
      case Connection.REASON_DRAG_CHECKS_FAILED:
        return 'Drag checks failed.';
      case Connection.REASON_PREVIOUS_AND_OUTPUT:
        return 'Block would have an output and a previous connection.';
      default:
        return 'Unknown connection failure: this should never happen!';
    }
  }

  /**
   * Check that connecting the given connections is safe, meaning that it would
   * not break any of Blockly's basic assumptions (e.g. no self connections).
   *
   * @param a The first of the connections to check.
   * @param b The second of the connections to check.
   * @returns An enum with the reason this connection is safe or unsafe.
   */
  doSafetyChecks(a: Connection | null, b: Connection | null): number {
    if (!a || !b) {
      return Connection.REASON_TARGET_NULL;
    }
    let superiorBlock;
    let inferiorBlock;
    let superiorConnection;
    let inferiorConnection;
    if (a.isSuperior()) {
      superiorBlock = a.getSourceBlock();
      inferiorBlock = b.getSourceBlock();
      superiorConnection = a;
      inferiorConnection = b;
    } else {
      inferiorBlock = a.getSourceBlock();
      superiorBlock = b.getSourceBlock();
      inferiorConnection = a;
      superiorConnection = b;
    }
    if (superiorBlock === inferiorBlock) {
      return Connection.REASON_SELF_CONNECTION;
    } else if (
      inferiorConnection.type !==
      internalConstants.OPPOSITE_TYPE[superiorConnection.type]
    ) {
      return Connection.REASON_WRONG_TYPE;
    } else if (superiorBlock.workspace !== inferiorBlock.workspace) {
      return Connection.REASON_DIFFERENT_WORKSPACES;
    } else if (superiorBlock.isShadow() && !inferiorBlock.isShadow()) {
      return Connection.REASON_SHADOW_PARENT;
    } else if (
      inferiorConnection.type === ConnectionType.OUTPUT_VALUE &&
      inferiorBlock.previousConnection &&
      inferiorBlock.previousConnection.isConnected()
    ) {
      return Connection.REASON_PREVIOUS_AND_OUTPUT;
    } else if (
      inferiorConnection.type === ConnectionType.PREVIOUS_STATEMENT &&
      inferiorBlock.outputConnection &&
      inferiorBlock.outputConnection.isConnected()
    ) {
      return Connection.REASON_PREVIOUS_AND_OUTPUT;
    }
    return Connection.CAN_CONNECT;
  }

  /**
   * Check whether this connection is compatible with another connection with
   * respect to the value type system.  E.g. square_root("Hello") is not
   * compatible.
   *
   * @param a Connection to compare.
   * @param b Connection to compare against.
   * @returns True if the connections share a type.
   */
  doTypeChecks(a: Connection, b: Connection): boolean {
    const checkArrayOne = a.getCheck();
    const checkArrayTwo = b.getCheck();

    if (!checkArrayOne || !checkArrayTwo) {
      // One or both sides are promiscuous enough that anything will fit.
      return true;
    }
    // Find any intersection in the check lists.
    for (let i = 0; i < checkArrayOne.length; i++) {
      if (checkArrayTwo.includes(checkArrayOne[i])) {
        return true;
      }
    }
    // No intersection.
    return false;
  }

  /**
   * Check whether this connection can be made by dragging.
   *
   * @param a Connection to compare (on the block that's being dragged).
   * @param b Connection to compare against.
   * @param distance The maximum allowable distance between connections.
   * @returns True if the connection is allowed during a drag.
   */
  doDragChecks(
    a: RenderedConnection,
    b: RenderedConnection,
    distance: number,
  ): boolean {
    if (a.distanceFrom(b) > distance) {
      return false;
    }

    // Don't consider insertion markers.
    if (b.getSourceBlock().isInsertionMarker()) {
      return false;
    }

    switch (b.type) {
      case ConnectionType.PREVIOUS_STATEMENT:
        return this.canConnectToPrevious_(a, b);
      case ConnectionType.OUTPUT_VALUE: {
        // Don't offer to connect an already connected left (male) value plug to
        // an available right (female) value plug.
        if (
          (b.isConnected() && !b.targetBlock()!.isInsertionMarker()) ||
          a.isConnected()
        ) {
          return false;
        }
        break;
      }
      case ConnectionType.INPUT_VALUE: {
        // Offering to connect the left (male) of a value block to an already
        // connected value pair is ok, we'll splice it in.
        // However, don't offer to splice into an immovable block.
        if (
          b.isConnected() &&
          !b.targetBlock()!.isMovable() &&
          !b.targetBlock()!.isShadow()
        ) {
          return false;
        }
        break;
      }
      case ConnectionType.NEXT_STATEMENT: {
        // Don't let a block with no next connection bump other blocks out of
        // the stack.  But covering up a shadow block or stack of shadow blocks
        // is fine.  Similarly, replacing a terminal statement with another
        // terminal statement is allowed.
        if (
          b.isConnected() &&
          !a.getSourceBlock().nextConnection &&
          !b.targetBlock()!.isShadow() &&
          b.targetBlock()!.nextConnection
        ) {
          return false;
        }

        // Don't offer to splice into a stack where the connected block is
        // immovable, unless the block is a shadow block.
        if (
          b.targetBlock() &&
          !b.targetBlock()!.isMovable() &&
          !b.targetBlock()!.isShadow()
        ) {
          return false;
        }
        break;
      }
      default:
        // Unexpected connection type.
        return false;
    }

    // Don't let blocks try to connect to themselves or ones they nest.
    if (common.draggingConnections.includes(b)) {
      return false;
    }

    return true;
  }

  /**
   * Helper function for drag checking.
   *
   * @param a The connection to check, which must be a statement input or next
   *     connection.
   * @param b A nearby connection to check, which must be a previous connection.
   * @returns True if the connection is allowed, false otherwise.
   */
  protected canConnectToPrevious_(a: Connection, b: Connection): boolean {
    if (a.targetConnection) {
      // This connection is already occupied.
      // A next connection will never disconnect itself mid-drag.
      return false;
    }

    // Don't let blocks try to connect to themselves or ones they nest.
    if (common.draggingConnections.includes(b)) {
      return false;
    }

    if (!b.targetConnection) {
      return true;
    }

    const targetBlock = b.targetBlock();
    // If it is connected to a real block, game over.
    if (!targetBlock!.isInsertionMarker()) {
      return false;
    }
    // If it's connected to an insertion marker but that insertion marker
    // is the first block in a stack, it's still fine.  If that insertion
    // marker is in the middle of a stack, it won't work.
    return !targetBlock!.getPreviousBlock();
  }
}

registry.register(
  registry.Type.CONNECTION_CHECKER,
  registry.DEFAULT,
  ConnectionChecker,
);
