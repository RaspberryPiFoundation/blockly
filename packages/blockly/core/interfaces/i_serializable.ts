/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ISerializable {
  /**
   * @param doFullSerialization If true, this signals that any backing data
   *     structures used by this ISerializable should also be serialized. This
   *     is used for copy-paste.
   * @returns a JSON serializable value that records the ISerializable's state.
   */
  saveState(doFullSerialization: boolean): any;

  /**
   * Takes in a JSON serializable value and sets the ISerializable's state
   * based on that.
   *
   * @param state The state to apply to the ISerializable.
   */
  loadState(state: any): void;
}

/** Type guard that checks whether the given object is a ISerializable. */
export function isSerializable(obj: any): obj is ISerializable {
  return (
    obj &&
    typeof obj.saveState === 'function' &&
    typeof obj.loadState === 'function'
  );
}
