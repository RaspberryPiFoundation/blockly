/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IDragTarget

import {Rect} from '../utils/rect.js';
import type {IComponent} from './i_component.js';
import {IDraggable} from './i_draggable.js';

/**
 * Interface for a component with custom behaviour when a block or bubble is
 * dragged over or dropped on top of it.
 */
export interface IDragTarget extends IComponent {
  /**
   * Returns the bounding rectangle of the drag target area in pixel units
   * relative to viewport.
   *
   * @returns The component's bounding box. Null if drag target area should be
   *     ignored.
   */
  getClientRect(): Rect | null;

  /**
   * Handles when a cursor with a block or bubble enters this drag target.
   *
   * @param dragElement The block or bubble currently being dragged.
   */
  onDragEnter(dragElement: IDraggable): void;

  /**
   * Handles when a cursor with a block or bubble is dragged over this drag
   * target.
   *
   * @param dragElement The block or bubble currently being dragged.
   */
  onDragOver(dragElement: IDraggable): void;

  /**
   * Handles when a cursor with a block or bubble exits this drag target.
   *
   * @param dragElement The block or bubble currently being dragged.
   */
  onDragExit(dragElement: IDraggable): void;

  /**
   * Handles when a block or bubble is dropped on this component.
   * Should not handle delete here.
   *
   * @param dragElement The block or bubble currently being dragged.
   */
  onDrop(dragElement: IDraggable): void;

  /**
   * Returns whether the provided block or bubble should not be moved after
   * being dropped on this component. If true, the element will return to where
   * it was when the drag started.
   *
   * @param dragElement The block or bubble currently being dragged.
   * @returns Whether the block or bubble provided should be returned to drag
   *     start.
   */
  shouldPreventMove(dragElement: IDraggable): boolean;
}
