/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.inputTypes

import {ConnectionType} from '../connection_type.js';

/**
 * Enum for the type of a connection or input.
 */
export enum inputTypes {
  // A right-facing value input.  E.g. 'set item to' or 'return'.
  VALUE = ConnectionType.INPUT_VALUE,
  // A down-facing block stack.  E.g. 'if-do' or 'else'.
  STATEMENT = ConnectionType.NEXT_STATEMENT,
  // A dummy input.  Used to add field(s) with no input.
  DUMMY = 5,
  // An unknown type of input defined by an external developer.
  CUSTOM = 6,
  // An input with no connections that is always the last input of a row. Any
  // subsequent input will be rendered on the next row. Any newline character in
  // a JSON block definition's message will be parsed as an end-row input.
  END_ROW = 7,
}
