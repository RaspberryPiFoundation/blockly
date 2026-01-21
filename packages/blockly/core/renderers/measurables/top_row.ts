/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.TopRow

import type {BlockSvg} from '../../block_svg.js';
import type {ConstantProvider} from '../common/constants.js';
import type {PreviousConnection} from './previous_connection.js';
import {Row} from './row.js';
import {Types} from './types.js';

/**
 * An object containing information about what elements are in the top row of a
 * block as well as sizing information for the top row.
 * Elements in a top row can consist of corners, hats, spacers, and previous
 * connections.
 * After this constructor is called, the row will contain all non-spacer
 * elements it needs.
 */
export class TopRow extends Row {
  /**
   * The starting point for drawing the row, in the y direction.
   * This allows us to draw hats and similar shapes that don't start at the
   * origin. Must be non-negative (see #2820).
   */
  capline = 0;

  /** How much the row extends up above its capline. */
  ascenderHeight = 0;

  /** Whether the block has a previous connection. */
  hasPreviousConnection = false;

  /** The previous connection on the block, if any. */
  connection: PreviousConnection | null = null;

  /**
   * @param constants The rendering constants provider.
   */
  constructor(constants: ConstantProvider) {
    super(constants);

    this.type |= Types.TOP_ROW;
  }

  /**
   * Returns whether or not the top row has a left square corner.
   *
   * @param block The block whose top row this represents.
   * @returns Whether or not the top row has a left square corner.
   */
  hasLeftSquareCorner(block: BlockSvg): boolean {
    const hasHat =
      (block.hat ? block.hat === 'cap' : this.constants_.ADD_START_HATS) &&
      !block.outputConnection &&
      !block.previousConnection;
    const prevBlock = block.getPreviousBlock();

    return (
      !!block.outputConnection ||
      hasHat ||
      (prevBlock ? prevBlock.getNextBlock() === block : false)
    );
  }

  /**
   * Returns whether or not the top row has a right square corner.
   *
   * @param _block The block whose top row this represents.
   * @returns Whether or not the top row has a right square corner.
   */
  hasRightSquareCorner(_block: BlockSvg): boolean {
    return true;
  }

  override measure() {
    let height = 0;
    let width = 0;
    let ascenderHeight = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const elem = this.elements[i];
      width += elem.width;
      if (!Types.isSpacer(elem)) {
        if (Types.isHat(elem)) {
          ascenderHeight = Math.max(ascenderHeight, elem.ascenderHeight);
        } else {
          height = Math.max(height, elem.height);
        }
      }
    }
    this.width = Math.max(this.minWidth, width);
    this.height = Math.max(this.minHeight, height) + ascenderHeight;
    this.ascenderHeight = ascenderHeight;
    this.capline = this.ascenderHeight;
    this.widthWithConnectedBlocks = this.width;
  }

  override startsWithElemSpacer() {
    return false;
  }

  override endsWithElemSpacer() {
    return false;
  }
}
