/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ICopyable

import type {ISelectable} from './i_selectable.js';

export interface ICopyable<T extends ICopyData> extends ISelectable {
  /**
   * Encode for copying.
   *
   * @returns Copy metadata.
   */
  toCopyData(): T | null;

  /**
   * Whether this instance is currently copyable. The standard implementation
   * is to return true if isOwnDeletable and isOwnMovable return true.
   *
   * @returns True if it can currently be copied.
   */
  isCopyable?(): boolean;
}

export namespace ICopyable {
  export interface ICopyData {
    paster: string;
  }
}

export type ICopyData = ICopyable.ICopyData;

/** @returns true if the given object is an ICopyable. */
export function isCopyable(obj: any): obj is ICopyable<ICopyData> {
  return obj && typeof obj.toCopyData === 'function';
}
