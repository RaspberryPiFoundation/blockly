/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IDeleteArea

import type {IDragTarget} from './i_drag_target.js';
import type {IDraggable} from './i_draggable.js';

/**
 * Interface for a component that can delete a block or bubble that is dropped
 * on top of it.
 */
export interface IDeleteArea extends IDragTarget {
  /**
   * Returns whether the provided block or bubble would be deleted if dropped on
   * this area.
   * This method should check if the element is deletable and is always called
   * before onDragEnter/onDragOver/onDragExit.
   *
   * @param element The block or bubble currently being dragged.
   * @returns Whether the element provided would be deleted if dropped on this
   *     area.
   */
  wouldDelete(element: IDraggable): boolean;
}
