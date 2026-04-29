/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview The full custom renderer built during custom renderer codelab.
 */

import * as Blockly from 'blockly/core';

/**
 * The ConstantProvider holds rendering-related constants such as colour
 * and size information.
 */
class CustomConstantProvider extends Blockly.blockRendering.ConstantProvider {
  /** @override */
  constructor() {
    // Set up all of the constants from the base provider.
    super();

    // Override a few properties.
    /**
     * The width of the notch used for previous and next connections.
     * @type {number}
     * @override
     */
    this.NOTCH_WIDTH = 20;

    /**
     * The height of the notch used for previous and next connections.
     * @type {number}
     * @override
     */
    this.NOTCH_HEIGHT = 10;

    /**
     * Rounded corner radius.
     * @type {number}
     * @override
     */
    this.CORNER_RADIUS = 2;

    /**
     * The height of the puzzle tab used for input and output connections.
     * @type {number}
     * @override
     */
    this.TAB_HEIGHT = 8;
  }

  /**
   * @override
   */
  init() {
    // First, call init() in the base provider to store the default objects.
    super.init();

    // Add calls to create shape objects for the new connection shapes.
    this.RECT_PREV_NEXT = this.makeRectangularPreviousConn();
    this.RECT_INPUT_OUTPUT = this.makeRectangularInputConn();
  }

  /**
   * @override
   */
  shapeFor(connection) {
    const checks = connection.getCheck();
    switch (connection.type) {
      case Blockly.INPUT_VALUE:
      case Blockly.OUTPUT_VALUE:
        if (checks && checks.includes('Number')) {
          return this.RECT_INPUT_OUTPUT;
        }
        if (checks && checks.includes('String')) {
          return this.RECT_INPUT_OUTPUT;
        }
        return this.PUZZLE_TAB;
      case Blockly.PREVIOUS_STATEMENT:
      case Blockly.NEXT_STATEMENT:
        return this.NOTCH;
      default:
        throw Error('Unknown connection type');
    }
  }

  /**
   * @returns {Object} Rectangular notch for use with previous and next connections.
   */
  makeRectangularPreviousConn() {
    const width = this.NOTCH_WIDTH;
    const height = this.NOTCH_HEIGHT;

    /**
     * Since previous and next connections share the same shape you can define
     * a function to generate the path for both.
     * @param {number} dir Multiplier for the horizontal direction of the path (-1 or 1)
     * @returns {Object} SVGPath line for use with previous and next connections.
     */
    function makeMainPath(dir) {
      return Blockly.utils.svgPaths.line([
        Blockly.utils.svgPaths.point(0, height),
        Blockly.utils.svgPaths.point(dir * width, 0),
        Blockly.utils.svgPaths.point(0, -height),
      ]);
    }
    const pathLeft = makeMainPath(1);
    const pathRight = makeMainPath(-1);

    return {
      width: width,
      height: height,
      pathLeft: pathLeft,
      pathRight: pathRight,
    };
  }

  /**
   * @returns {Object} Rectangular puzzle tab for use with input and output connections.
   */
  makeRectangularInputConn() {
    const width = this.TAB_WIDTH;
    const height = this.TAB_HEIGHT;

    /**
     * Since input and output connections share the same shape you can define
     * a function to generate the path for both.
     * @param {number} dir Multiplier for the vertical direction of the path (-1 or 1)
     * @returns {Object} SVGPath line for use with input and output connections.
     */
    function makeMainPath(dir) {
      return Blockly.utils.svgPaths.line([
        Blockly.utils.svgPaths.point(-width, 0),
        Blockly.utils.svgPaths.point(0, dir * height),
        Blockly.utils.svgPaths.point(width, 0),
      ]);
    }
    const pathUp = makeMainPath(-1);
    const pathDown = makeMainPath(1);

    return {
      width: width,
      height: height,
      pathUp: pathUp,
      pathDown: pathDown,
    };
  }
}

/** The CustomRenderer class incorporates our custom ConstantProvider. */
export class CustomRenderer extends Blockly.blockRendering.Renderer {
  /** @override */
  constructor() {
    super();
  }

  /**
   * @override
   */
  makeConstants_() {
    return new CustomConstantProvider();
  }
}

Blockly.blockRendering.register('custom_renderer', CustomRenderer);
