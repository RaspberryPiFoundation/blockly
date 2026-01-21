/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.math

/**
 * Converts degrees to radians.
 * Copied from Closure's goog.math.toRadians.
 *
 * @param angleDegrees Angle in degrees.
 * @returns Angle in radians.
 */
export function toRadians(angleDegrees: number): number {
  return (angleDegrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 * Copied from Closure's goog.math.toDegrees.
 *
 * @param angleRadians Angle in radians.
 * @returns Angle in degrees.
 */
export function toDegrees(angleRadians: number): number {
  return (angleRadians * 180) / Math.PI;
}

/**
 * Clamp the provided number between the lower bound and the upper bound.
 *
 * @param lowerBound The desired lower bound.
 * @param number The number to clamp.
 * @param upperBound The desired upper bound.
 * @returns The clamped number.
 */
export function clamp(
  lowerBound: number,
  number: number,
  upperBound: number,
): number {
  if (upperBound < lowerBound) {
    const temp = upperBound;
    upperBound = lowerBound;
    lowerBound = temp;
  }
  return Math.max(lowerBound, Math.min(number, upperBound));
}
