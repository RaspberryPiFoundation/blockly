/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object for configuring and updating a workspace grid in
 * Blockly.
 *
 * @class
 */
// Former goog.module ID: Blockly.Grid

import {GridOptions} from './options.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import {Svg} from './utils/svg.js';

/**
 * Class for a workspace's grid.
 */
export class Grid {
  private spacing: number;
  private length: number;
  private scale: number = 1;
  private readonly line1: SVGElement;
  private readonly line2: SVGElement;
  private snapToGrid: boolean;

  /**
   * @param pattern The grid's SVG pattern, created during injection.
   * @param options A dictionary of normalized options for the grid.
   *     See grid documentation:
   *     https://developers.google.com/blockly/guides/configure/web/grid
   */
  constructor(
    private pattern: SVGElement,
    options: GridOptions,
  ) {
    /** The spacing of the grid lines (in px). */
    this.spacing = options['spacing'] ?? 0;

    /** How long the grid lines should be (in px). */
    this.length = options['length'] ?? 1;

    /** The horizontal grid line, if it exists. */
    this.line1 = pattern.firstChild as SVGElement;

    /** The vertical grid line, if it exists. */
    this.line2 = this.line1 && (this.line1.nextSibling as SVGElement);

    /** Whether blocks should snap to the grid. */
    this.snapToGrid = options['snap'] ?? false;
  }

  /**
   * Sets the spacing between the centers of the grid lines.
   *
   * This does not trigger snapping to the newly spaced grid. If you want to
   * snap blocks to the grid programmatically that needs to be triggered
   * on individual top-level blocks. The next time a block is dragged and
   * dropped it will snap to the grid if snapping to the grid is enabled.
   */
  setSpacing(spacing: number) {
    this.spacing = spacing;
    this.update(this.scale);
  }

  /**
   * Get the spacing of the grid points (in px).
   *
   * @returns The spacing of the grid points.
   */
  getSpacing(): number {
    return this.spacing;
  }

  /** Sets the length of the grid lines. */
  setLength(length: number) {
    this.length = length;
    this.update(this.scale);
  }

  /** Get the length of the grid lines (in px). */
  getLength(): number {
    return this.length;
  }

  /**
   * Sets whether blocks should snap to the grid or not.
   *
   * Setting this to true does not trigger snapping. If you want to snap blocks
   * to the grid programmatically that needs to be triggered on individual
   * top-level blocks. The next time a block is dragged and dropped it will
   * snap to the grid.
   */
  setSnapToGrid(snap: boolean) {
    this.snapToGrid = snap;
  }

  /**
   * Whether blocks should snap to the grid.
   *
   * @returns True if blocks should snap, false otherwise.
   */
  shouldSnap(): boolean {
    return this.snapToGrid;
  }

  /**
   * Get the ID of the pattern element, which should be randomized to avoid
   * conflicts with other Blockly instances on the page.
   *
   * @returns The pattern ID.
   * @internal
   */
  getPatternId(): string {
    return this.pattern.id;
  }

  /**
   * Update the grid with a new scale.
   *
   * @param scale The new workspace scale.
   * @internal
   */
  update(scale: number) {
    this.scale = scale;
    const safeSpacing = this.spacing * scale;

    this.pattern.setAttribute('width', `${safeSpacing}`);
    this.pattern.setAttribute('height', `${safeSpacing}`);

    let half = Math.floor(this.spacing / 2) + 0.5;
    let start = half - this.length / 2;
    let end = half + this.length / 2;

    half *= scale;
    start *= scale;
    end *= scale;

    this.setLineAttributes(this.line1, scale, start, end, half, half);
    this.setLineAttributes(this.line2, scale, half, half, start, end);
  }

  /**
   * Set the attributes on one of the lines in the grid.  Use this to update the
   * length and stroke width of the grid lines.
   *
   * @param line Which line to update.
   * @param width The new stroke size (in px).
   * @param x1 The new x start position of the line (in px).
   * @param x2 The new x end position of the line (in px).
   * @param y1 The new y start position of the line (in px).
   * @param y2 The new y end position of the line (in px).
   */
  private setLineAttributes(
    line: SVGElement,
    width: number,
    x1: number,
    x2: number,
    y1: number,
    y2: number,
  ) {
    if (line) {
      line.setAttribute('stroke-width', `${width}`);
      line.setAttribute('x1', `${x1}`);
      line.setAttribute('y1', `${y1}`);
      line.setAttribute('x2', `${x2}`);
      line.setAttribute('y2', `${y2}`);
    }
  }

  /**
   * Move the grid to a new x and y position, and make sure that change is
   * visible.
   *
   * @param x The new x position of the grid (in px).
   * @param y The new y position of the grid (in px).
   * @internal
   */
  moveTo(x: number, y: number) {
    this.pattern.setAttribute('x', `${x}`);
    this.pattern.setAttribute('y', `${y}`);
  }

  /**
   * Given a coordinate, return the nearest coordinate aligned to the grid.
   *
   * @param xy A workspace coordinate.
   * @returns Workspace coordinate of nearest grid point.
   *   If there's no change, return the same coordinate object.
   */
  alignXY(xy: Coordinate): Coordinate {
    const spacing = this.getSpacing();
    const half = spacing / 2;
    const x = Math.round(Math.round((xy.x - half) / spacing) * spacing + half);
    const y = Math.round(Math.round((xy.y - half) / spacing) * spacing + half);
    if (x === xy.x && y === xy.y) {
      // No change.
      return xy;
    }
    return new Coordinate(x, y);
  }

  /**
   * Create the DOM for the grid described by options.
   *
   * @param rnd A random ID to append to the pattern's ID.
   * @param gridOptions The object containing grid configuration.
   * @param defs The root SVG element for this workspace's defs.
   * @param injectionDiv The div containing the parent workspace and all related
   *   workspaces and block containers. CSS variables representing SVG patterns
   *   will be scoped to this container.
   * @returns The SVG element for the grid pattern.
   * @internal
   */
  static createDom(
    rnd: string,
    gridOptions: GridOptions,
    defs: SVGElement,
    injectionDiv?: HTMLElement,
  ): SVGElement {
    /*
          <pattern id="blocklyGridPattern837493" patternUnits="userSpaceOnUse">
            <rect stroke="#888" />
            <rect stroke="#888" />
          </pattern>
        */
    const gridPattern = dom.createSvgElement(
      Svg.PATTERN,
      {'id': 'blocklyGridPattern' + rnd, 'patternUnits': 'userSpaceOnUse'},
      defs,
    );
    // x1, y1, x1, x2 properties will be set later in update.
    if ((gridOptions['length'] ?? 1) > 0 && (gridOptions['spacing'] ?? 0) > 0) {
      dom.createSvgElement(
        Svg.LINE,
        {'stroke': gridOptions['colour']},
        gridPattern,
      );
      if (gridOptions['length'] ?? 1 > 1) {
        dom.createSvgElement(
          Svg.LINE,
          {'stroke': gridOptions['colour']},
          gridPattern,
        );
      }
    } else {
      // Edge 16 doesn't handle empty patterns
      dom.createSvgElement(Svg.LINE, {}, gridPattern);
    }

    if (injectionDiv) {
      // Add CSS variables scoped to the injection div referencing the created
      // patterns so that CSS can apply the patterns to any element in the
      // injection div.
      injectionDiv.style.setProperty(
        '--blocklyGridPattern',
        `url(#${gridPattern.id})`,
      );
    }

    return gridPattern;
  }
}
