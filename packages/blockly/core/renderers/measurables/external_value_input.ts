/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.ExternalValueInput

import type {Input} from '../../inputs/input.js';
import type {ConstantProvider} from '../common/constants.js';
import {InputConnection} from './input_connection.js';
import {Types} from './types.js';

/**
 * An object containing information about the space an external value input
 * takes up during rendering
 */
export class ExternalValueInput extends InputConnection {
  override height = 0;
  override width: number;
  override connectionOffsetY: number;
  connectionHeight: number;
  connectionWidth: number;

  /**
   * @param constants The rendering constants provider.
   * @param input The external value input to measure and store information for.
   */
  constructor(constants: ConstantProvider, input: Input) {
    super(constants, input);
    this.type |= Types.EXTERNAL_VALUE_INPUT;
    if (!this.connectedBlock) {
      this.height = this.shape.height as number;
    } else {
      this.height =
        this.connectedBlockHeight -
        this.constants_.TAB_OFFSET_FROM_TOP -
        this.constants_.MEDIUM_PADDING;
    }

    this.width =
      (this.shape.width as number) +
      this.constants_.EXTERNAL_VALUE_INPUT_PADDING;

    this.connectionOffsetY = this.constants_.TAB_OFFSET_FROM_TOP;

    this.connectionHeight = this.shape.height as number;

    this.connectionWidth = this.shape.width as number;
  }
}
