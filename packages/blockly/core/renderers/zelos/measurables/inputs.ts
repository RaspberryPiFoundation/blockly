/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.zelos.StatementInput

import type {Input} from '../../../inputs/input.js';
import type {ConstantProvider} from '../../../renderers/common/constants.js';
import {StatementInput as BaseStatementInput} from '../../../renderers/measurables/statement_input.js';

/**
 * An object containing information about the space a statement input takes up
 * during rendering.
 */
export class StatementInput extends BaseStatementInput {
  connectedBottomNextConnection = false;

  /**
   * @param constants The rendering constants provider.
   * @param input The statement input to measure and store information for.
   */
  constructor(constants: ConstantProvider, input: Input) {
    super(constants, input);

    if (this.connectedBlock) {
      // Find the bottom-most connected block in the stack.
      let block = this.connectedBlock;
      let nextBlock;
      while ((nextBlock = block.getNextBlock())) {
        block = nextBlock;
      }
      if (!block.nextConnection) {
        this.height = this.connectedBlockHeight;
        this.connectedBottomNextConnection = true;
      }
    }
  }
}
