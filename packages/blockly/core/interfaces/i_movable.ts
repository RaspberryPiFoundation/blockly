/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IMovable

/**
 * The interface for an object that is movable.
 */
export interface IMovable {
  /**
   * Get whether this is movable or not.
   *
   * @returns True if movable.
   */
  isMovable(): boolean;
}
