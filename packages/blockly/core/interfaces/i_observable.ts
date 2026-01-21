/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An object that fires events optionally.
 *
 * @internal
 */
export interface IObservable {
  startPublishing(): void;
  stopPublishing(): void;
}

/**
 * Type guard for checking if an object fulfills IObservable.
 *
 * @internal
 */
export function isObservable(obj: any): obj is IObservable {
  return (
    obj &&
    typeof obj.startPublishing === 'function' &&
    typeof obj.stopPublishing === 'function'
  );
}
