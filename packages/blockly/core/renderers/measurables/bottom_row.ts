/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.BottomRow

import type {BlockSvg} from '../../block_svg.js';
import type {ConstantProvider} from '../common/constants.js';
import type {NextConnection} from './next_connection.js';
import {Row} from './row.js';
import {Types} from './types.js';

/**
 * An object containing information about what elements are in the bottom row of
 * a block as well as spacing information for the bottom row.
 * Elements in a bottom row can consist of corners, spacers and next
 * connections.
 */
export class BottomRow extends Row {
  /**
   * Whether this row has a next connection.
   */
  hasNextConnection = false;

  /**
   * The next connection on the row, if any.
   */
  connection: NextConnection | null = null;

  /**
   * The amount that the bottom of the block extends below the horizontal
   * edge, e.g. because of a next connection.  Must be non-negative (see
   * #2820).
   */
  descenderHeight = 0;

  /**
   * The Y position of the bottom edge of the block, relative to the origin
   * of the block rendering.
   */
  baseline = 0;

  /**
   * @param constants The rendering constants provider.
   */
  constructor(constants: ConstantProvider) {
    super(constants);
    this.type |= Types.BOTTOM_ROW;
  }

  /**
   * Returns whether or not the bottom row has a left square corner.
   *
   * @param block The block whose bottom row this represents.
   * @returns Whether or not the bottom row has a left square corner.
   */
  hasLeftSquareCorner(block: BlockSvg): boolean {
    return !!block.outputConnection || !!block.getNextBlock();
  }

  /**
   * Returns whether or not the bottom row has a right square corner.
   *
   * @param _block The block whose bottom row this represents.
   * @returns Whether or not the bottom row has a right square corner.
   */
  hasRightSquareCorner(_block: BlockSvg): boolean {
    return true;
  }

  override measure() {
    let height = 0;
    let width = 0;
    let descenderHeight = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const elem = this.elements[i];
      width += elem.width;
      if (!Types.isSpacer(elem)) {
        // Note: this assumes that next connections have *only* descenderHeight,
        // with no height above the baseline.
        if (Types.isNextConnection(elem)) {
          descenderHeight = Math.max(descenderHeight, elem.height);
        } else {
          height = Math.max(height, elem.height);
        }
      }
    }
    this.width = Math.max(this.minWidth, width);
    this.height = Math.max(this.minHeight, height) + descenderHeight;
    this.descenderHeight = descenderHeight;
    this.widthWithConnectedBlocks = this.width;
  }

  override startsWithElemSpacer() {
    return false;
  }

  override endsWithElemSpacer() {
    return false;
  }
}
