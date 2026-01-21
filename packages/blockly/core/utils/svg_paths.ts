/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.svgPaths

/**
 * Create a string representing the given x, y pair.  It does not matter whether
 * the coordinate is relative or absolute.  The result has leading
 * and trailing spaces, and separates the x and y coordinates with a comma but
 * no space.
 *
 * @param x The x coordinate.
 * @param y The y coordinate.
 * @returns A string of the format ' x,y '
 */
export function point(x: number, y: number): string {
  return ' ' + x + ',' + y + ' ';
}

/**
 * Draw a cubic or quadratic curve.  See
 * developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#Cubic_B%C3%A9zier_Curve
 * These coordinates are unitless and hence in the user coordinate system.
 *
 * @param command The command to use.
 *     Should be one of: c, C, s, S, q, Q.
 * @param points  An array containing all of the points to pass to the curve
 *     command, in order.  The points are represented as strings of the format '
 *     x, y '.
 * @returns A string defining one or more Bezier curves.  See the MDN
 *     documentation for exact format.
 */
export function curve(command: string, points: string[]): string {
  return ' ' + command + points.join('');
}

/**
 * Move the cursor to the given position without drawing a line.
 * The coordinates are absolute.
 * These coordinates are unitless and hence in the user coordinate system.
 * See developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Line_commands
 *
 * @param x The absolute x coordinate.
 * @param y The absolute y coordinate.
 * @returns A string of the format ' M x,y '
 */
export function moveTo(x: number, y: number): string {
  return ' M ' + x + ',' + y + ' ';
}

/**
 * Move the cursor to the given position without drawing a line.
 * Coordinates are relative.
 * These coordinates are unitless and hence in the user coordinate system.
 * See developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Line_commands
 *
 * @param dx The relative x coordinate.
 * @param dy The relative y coordinate.
 * @returns A string of the format ' m dx,dy '
 */
export function moveBy(dx: number, dy: number): string {
  return ' m ' + dx + ',' + dy + ' ';
}

/**
 * Draw a line from the current point to the end point, which is the current
 * point shifted by dx along the x-axis and dy along the y-axis.
 * These coordinates are unitless and hence in the user coordinate system.
 * See developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Line_commands
 *
 * @param dx The relative x coordinate.
 * @param dy The relative y coordinate.
 * @returns A string of the format ' l dx,dy '
 */
export function lineTo(dx: number, dy: number): string {
  return ' l ' + dx + ',' + dy + ' ';
}

/**
 * Draw multiple lines connecting all of the given points in order.  This is
 * equivalent to a series of 'l' commands.
 * These coordinates are unitless and hence in the user coordinate system.
 * See developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Line_commands
 *
 * @param points An array containing all of the points to draw lines to, in
 *     order.  The points are represented as strings of the format ' dx,dy '.
 * @returns A string of the format ' l (dx,dy)+ '
 */
export function line(points: string[]): string {
  return ' l' + points.join('');
}

/**
 * Draw a horizontal or vertical line.
 * The first argument specifies the direction and whether the given position is
 * relative or absolute.
 * These coordinates are unitless and hence in the user coordinate system.
 * See developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#LineTo_path_commands
 *
 * @param command The command to prepend to the coordinate.  This should be one
 *     of: V, v, H, h.
 * @param val The coordinate to pass to the command.  It may be absolute or
 *     relative.
 * @returns A string of the format ' command val '
 */
export function lineOnAxis(command: string, val: number): string {
  return ' ' + command + ' ' + val + ' ';
}

/**
 * Draw an elliptical arc curve.
 * These coordinates are unitless and hence in the user coordinate system.
 * See developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#Elliptical_Arc_Curve
 *
 * @param command The command string.  Either 'a' or 'A'.
 * @param flags The flag string.  See the MDN documentation for a description
 *     and examples.
 * @param radius The radius of the arc to draw.
 * @param point The point to move the cursor to after drawing the arc, specified
 *     either in absolute or relative coordinates depending on the command.
 * @returns A string of the format 'command radius radius flags point'
 */
export function arc(
  command: string,
  flags: string,
  radius: number,
  point: string,
): string {
  return command + ' ' + radius + ' ' + radius + ' ' + flags + point;
}
