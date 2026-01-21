/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IConnectionChecker

import type {Connection} from '../connection.js';
import type {RenderedConnection} from '../rendered_connection.js';

/**
 * Class for connection type checking logic.
 */
export interface IConnectionChecker {
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
  ): boolean;

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
  ): number;

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
  ): string;

  /**
   * Check that connecting the given connections is safe, meaning that it would
   * not break any of Blockly's basic assumptions (e.g. no self connections).
   *
   * @param a The first of the connections to check.
   * @param b The second of the connections to check.
   * @returns An enum with the reason this connection is safe or unsafe.
   */
  doSafetyChecks(a: Connection | null, b: Connection | null): number;

  /**
   * Check whether this connection is compatible with another connection with
   * respect to the value type system.  E.g. square_root("Hello") is not
   * compatible.
   *
   * @param a Connection to compare.
   * @param b Connection to compare against.
   * @returns True if the connections share a type.
   */
  doTypeChecks(a: Connection, b: Connection): boolean;

  /**
   * Check whether this connection can be made by dragging.
   *
   * @param a Connection to compare.
   * @param b Connection to compare against.
   * @param distance The maximum allowable distance between connections.
   * @returns True if the connection is allowed during a drag.
   */
  doDragChecks(
    a: RenderedConnection,
    b: RenderedConnection,
    distance: number,
  ): boolean;
}
