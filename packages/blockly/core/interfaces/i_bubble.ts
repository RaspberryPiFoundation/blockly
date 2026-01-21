/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IBubble

import type {Coordinate} from '../utils/coordinate.js';
import type {IContextMenu} from './i_contextmenu.js';
import type {IDraggable} from './i_draggable.js';
import {IFocusableNode} from './i_focusable_node.js';

/**
 * A bubble interface.
 */
export interface IBubble extends IDraggable, IContextMenu, IFocusableNode {
  /**
   * Return the coordinates of the top-left corner of this bubble's body
   * relative to the drawing surface's origin (0,0), in workspace units.
   *
   * @returns Object with .x and .y properties.
   */
  getRelativeToSurfaceXY(): Coordinate;

  /**
   * Return the root node of the bubble's SVG group.
   *
   * @returns The root SVG node of the bubble's group.
   */
  getSvgRoot(): SVGElement;

  /**
   * Sets whether or not this bubble is being dragged.
   *
   * @param adding True if dragging, false otherwise.
   */
  setDragging(dragging: boolean): void;

  /**
   * Move this bubble during a drag.
   *
   * @param newLoc The location to translate to, in workspace coordinates.
   */
  moveDuringDrag(newLoc: Coordinate): void;

  /**
   * Move the bubble to the specified location in workspace coordinates.
   *
   * @param x The x position to move to.
   * @param y The y position to move to.
   */
  moveTo(x: number, y: number): void;

  /**
   * Update the style of this bubble when it is dragged over a delete area.
   *
   * @param enable True if the bubble is about to be deleted, false otherwise.
   */
  setDeleteStyle(enable: boolean): void;

  /** Dispose of this bubble. */
  dispose(): void;
}
