/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility methods for coordinate manipulation.
 * These methods are not specific to Blockly, and could be factored out into
 * a JavaScript framework such as Closure.
 *
 * @class
 */
// Former goog.module ID: Blockly.utils.Coordinate

/**
 * Class for representing coordinates and positions.
 */
export class Coordinate {
  /**
   * @param x Left.
   * @param y Top.
   */
  constructor(
    public x: number,
    public y: number,
  ) {}

  /**
   * Creates a new copy of this coordinate.
   *
   * @returns A copy of this coordinate.
   */
  clone(): Coordinate {
    return new Coordinate(this.x, this.y);
  }

  /**
   * Scales this coordinate by the given scale factor.
   *
   * @param s The scale factor to use for both x and y dimensions.
   * @returns This coordinate after scaling.
   */
  scale(s: number): Coordinate {
    this.x *= s;
    this.y *= s;
    return this;
  }

  /**
   * Translates this coordinate by the given offsets.
   * respectively.
   *
   * @param tx The value to translate x by.
   * @param ty The value to translate y by.
   * @returns This coordinate after translating.
   */
  translate(tx: number, ty: number): Coordinate {
    this.x += tx;
    this.y += ty;
    return this;
  }

  /**
   * Compares coordinates for equality.
   *
   * @param a A Coordinate.
   * @param b A Coordinate.
   * @returns True iff the coordinates are equal, or if both are null.
   */
  static equals(a?: Coordinate | null, b?: Coordinate | null): boolean {
    if (a === b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    return a.x === b.x && a.y === b.y;
  }

  /**
   * Returns the distance between two coordinates.
   *
   * @param a A Coordinate.
   * @param b A Coordinate.
   * @returns The distance between `a` and `b`.
   */
  static distance(a: Coordinate, b: Coordinate): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Returns the magnitude of a coordinate.
   *
   * @param a A Coordinate.
   * @returns The distance between the origin and `a`.
   */
  static magnitude(a: Coordinate): number {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }

  /**
   * Returns the difference between two coordinates as a new
   * Coordinate.
   *
   * @param a An x/y coordinate.
   * @param b An x/y coordinate.
   * @returns A Coordinate representing the difference between `a` and `b`.
   */
  static difference(
    a: Coordinate | SVGPoint,
    b: Coordinate | SVGPoint,
  ): Coordinate {
    return new Coordinate(a.x - b.x, a.y - b.y);
  }

  /**
   * Returns the sum of two coordinates as a new Coordinate.
   *
   * @param a An x/y coordinate.
   * @param b An x/y coordinate.
   * @returns A Coordinate representing the sum of the two coordinates.
   */
  static sum(a: Coordinate | SVGPoint, b: Coordinate | SVGPoint): Coordinate {
    return new Coordinate(a.x + b.x, a.y + b.y);
  }
}
