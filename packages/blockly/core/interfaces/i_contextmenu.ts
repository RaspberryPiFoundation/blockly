/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IContextMenu

export interface IContextMenu {
  /**
   * Show the context menu for this object.
   *
   * @param e Mouse event.
   */
  showContextMenu(e: Event): void;
}

/** @returns true if the given object implements IContextMenu. */
export function hasContextMenu(obj: any): obj is IContextMenu {
  return obj && typeof obj.showContextMenu === 'function';
}
