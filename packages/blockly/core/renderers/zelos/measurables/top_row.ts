/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.zelos.TopRow

import type {BlockSvg} from '../../../block_svg.js';
import type {ConstantProvider} from '../../../renderers/common/constants.js';
import {TopRow as BaseTopRow} from '../../../renderers/measurables/top_row.js';

/**
 * An object containing information about what elements are in the top row of a
 * block as well as sizing information for the top row.
 * Elements in a top row can consist of corners, hats, spacers, and previous
 * connections.
 * After this constructor is called, the row will contain all non-spacer
 * elements it needs.
 */
export class TopRow extends BaseTopRow {
  /**
   * @param constants The rendering constants provider.
   */
  constructor(constants: ConstantProvider) {
    super(constants);
  }

  override endsWithElemSpacer() {
    return false;
  }

  /** Render a round corner unless the block has an output connection. */
  override hasLeftSquareCorner(block: BlockSvg) {
    const hasHat =
      (block.hat ? block.hat === 'cap' : this.constants_.ADD_START_HATS) &&
      !block.outputConnection &&
      !block.previousConnection;
    return !!block.outputConnection || hasHat;
  }

  /** Render a round corner unless the block has an output connection. */
  override hasRightSquareCorner(block: BlockSvg) {
    return (
      !!block.outputConnection &&
      !block.statementInputCount &&
      !block.nextConnection
    );
  }
}
