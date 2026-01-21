/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ConnectionType

/**
 * Enum for the type of a connection or input.
 */
export enum ConnectionType {
  // A right-facing value input.  E.g. 'set item to' or 'return'.
  INPUT_VALUE = 1,
  // A left-facing value output.  E.g. 'random fraction'.
  OUTPUT_VALUE,
  // A down-facing block stack.  E.g. 'if-do' or 'else'.
  NEXT_STATEMENT,
  // An up-facing block stack.  E.g. 'break out of loop'.
  PREVIOUS_STATEMENT,
}
