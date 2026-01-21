/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IDeletable

/**
 * The interface for an object that can be deleted.
 */
export interface IDeletable {
  /**
   * Get whether this object is deletable or not.
   *
   * @returns True if deletable.
   */
  isDeletable(): boolean;

  /** Disposes of this object, cleaning up any references or DOM elements. */
  dispose(): void;

  /** Visually indicates that the object is pending deletion. */
  setDeleteStyle(wouldDelete: boolean): void;
}

/** Returns whether the given object is an IDeletable. */
export function isDeletable(obj: any): obj is IDeletable {
  return (
    obj &&
    typeof obj.isDeletable === 'function' &&
    typeof obj.dispose === 'function' &&
    typeof obj.setDeleteStyle === 'function'
  );
}
