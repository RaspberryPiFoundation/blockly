/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.geras.InlineInput

import type {Input} from '../../../inputs/input.js';
import type {ConstantProvider as BaseConstantProvider} from '../../../renderers/common/constants.js';
import {InlineInput as BaseInlineInput} from '../../../renderers/measurables/inline_input.js';
import type {ConstantProvider as GerasConstantProvider} from '../constants.js';

/**
 * An object containing information about the space an inline input takes up
 * during rendering.
 */
export class InlineInput extends BaseInlineInput {
  override constants_: GerasConstantProvider;

  /**
   * @param constants The rendering constants provider.
   * @param input The inline input to measure and store information for.
   */
  constructor(constants: BaseConstantProvider, input: Input) {
    super(constants, input);
    this.constants_ = constants as GerasConstantProvider;

    if (this.connectedBlock) {
      // We allow the dark path to show on the parent block so that the child
      // block looks embossed.  This takes up an extra pixel in both x and y.
      this.width += this.constants_.DARK_PATH_OFFSET;
      this.height += this.constants_.DARK_PATH_OFFSET;
    }
  }
}
