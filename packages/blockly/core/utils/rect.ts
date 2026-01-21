/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility methods for rectangle manipulation.
 * These methods are not specific to Blockly, and could be factored out into
 * a JavaScript framework such as Closure.
 *
 * @class
 */
// Former goog.module ID: Blockly.utils.Rect

import {Coordinate} from './coordinate.js';

/**
 * Class for representing rectangular regions.
 */
export class Rect {
  /**
   * @param top Top.
   * @param bottom Bottom.
   * @param left Left.
   * @param right Right.
   */
  constructor(
    public top: number,
    public bottom: number,
    public left: number,
    public right: number,
  ) {}

  /**
   * Converts a DOM or SVG Rect to a Blockly Rect.
   *
   * @param rect The rectangle to convert.
   * @returns A representation of the same rectangle as a Blockly Rect.
   */
  static from(rect: DOMRect | SVGRect): Rect {
    return new Rect(rect.y, rect.y + rect.height, rect.x, rect.x + rect.width);
  }

  /**
   * Creates a new copy of this rectangle.
   *
   * @returns A copy of this Rect.
   */
  clone(): Rect {
    return new Rect(this.top, this.bottom, this.left, this.right);
  }

  /** Returns the height of this rectangle. */
  getHeight(): number {
    return this.bottom - this.top;
  }

  /** Returns the width of this rectangle. */
  getWidth(): number {
    return this.right - this.left;
  }

  /** Returns the top left coordinate of this rectangle. */
  getOrigin(): Coordinate {
    return new Coordinate(this.left, this.top);
  }

  /**
   * Tests whether this rectangle contains a x/y coordinate.
   *
   * @param x The x coordinate to test for containment.
   * @param y The y coordinate to test for containment.
   * @returns Whether this rectangle contains given coordinate.
   */
  contains(x: number, y: number): boolean {
    return (
      x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
    );
  }

  /**
   * Tests whether this rectangle intersects the provided rectangle.
   * Assumes that the coordinate system increases going down and left.
   *
   * @param other The other rectangle to check for intersection with.
   * @returns Whether this rectangle intersects the provided rectangle.
   */
  intersects(other: Rect): boolean {
    // The following logic can be derived and then simplified from a longer form symmetrical check
    // of verifying each rectangle's borders with the other rectangle by checking if either end of
    // the border's line segment is contained within the other rectangle. The simplified version
    // used here can be logically interpreted as ensuring that each line segment of 'this' rectangle
    // is not outside the bounds of the 'other' rectangle (proving there's an intersection).
    return (
      this.left <= other.right &&
      this.right >= other.left &&
      this.bottom >= other.top &&
      this.top <= other.bottom
    );
  }

  /**
   * Compares bounding rectangles for equality.
   *
   * @param a A Rect.
   * @param b A Rect.
   * @returns True iff the bounding rectangles are equal, or if both are null.
   */
  static equals(a?: Rect | null, b?: Rect | null): boolean {
    if (a === b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    return (
      a.top === b.top &&
      a.bottom === b.bottom &&
      a.left === b.left &&
      a.right === b.right
    );
  }

  /**
   * Creates a new Rect using a position and supplied dimensions.
   *
   * @param position The upper left coordinate of the new rectangle.
   * @param width The width of the rectangle, in pixels.
   * @param height The height of the rectangle, in pixels.
   * @returns A newly created Rect using the provided Coordinate and dimensions.
   */
  static createFromPoint(
    position: Coordinate,
    width: number,
    height: number,
  ): Rect {
    const left = position.x;
    const top = position.y;
    return new Rect(top, top + height, left, left + width);
  }
}
