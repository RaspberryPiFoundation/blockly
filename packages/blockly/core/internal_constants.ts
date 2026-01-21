/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.internalConstants

import {ConnectionType} from './connection_type.js';

/**
 * Number of characters to truncate a collapsed block to.
 *
 * @internal
 */
export const COLLAPSE_CHARS = 30;

/**
 * Lookup table for determining the opposite type of a connection.
 *
 * @internal
 */
export const OPPOSITE_TYPE: number[] = [];
OPPOSITE_TYPE[ConnectionType.INPUT_VALUE] = ConnectionType.OUTPUT_VALUE;
OPPOSITE_TYPE[ConnectionType.OUTPUT_VALUE] = ConnectionType.INPUT_VALUE;
OPPOSITE_TYPE[ConnectionType.NEXT_STATEMENT] =
  ConnectionType.PREVIOUS_STATEMENT;
OPPOSITE_TYPE[ConnectionType.PREVIOUS_STATEMENT] =
  ConnectionType.NEXT_STATEMENT;

/**
 * String for use in the dropdown created in field_variable.
 * This string indicates that this option in the dropdown is 'Rename
 * variable...' and if selected, should trigger the prompt to rename a variable.
 *
 * @internal
 */
export const RENAME_VARIABLE_ID = 'RENAME_VARIABLE_ID';

/**
 * String for use in the dropdown created in field_variable.
 * This string indicates that this option in the dropdown is 'Delete the "%1"
 * variable' and if selected, should trigger the prompt to delete a variable.
 *
 * @internal
 */
export const DELETE_VARIABLE_ID = 'DELETE_VARIABLE_ID';
