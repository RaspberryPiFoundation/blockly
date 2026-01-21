/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IBoundedElement

import type {Rect} from '../utils/rect.js';

/**
 * A bounded element interface.
 */
export interface IBoundedElement {
  /**
   * Returns the coordinates of a bounded element describing the dimensions of
   * the element. Coordinate system: workspace coordinates.
   *
   * @returns Object with coordinates of the bounded element.
   */
  getBoundingRectangle(): Rect;

  /**
   * Move the element by a relative offset.
   *
   * @param dx Horizontal offset in workspace units.
   * @param dy Vertical offset in workspace units.
   * @param reason Why is this move happening?  'user', 'bump', 'snap'...
   */
  moveBy(dx: number, dy: number, reason?: string[]): void;
}
