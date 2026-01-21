/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.InlineInput

import type {Input} from '../../inputs/input.js';
import type {ConstantProvider} from '../common/constants.js';
import {InputConnection} from './input_connection.js';
import {Types} from './types.js';

/**
 * An object containing information about the space an inline input takes up
 * during rendering.
 */
export class InlineInput extends InputConnection {
  connectionHeight: number;
  connectionWidth: number;

  /**
   * @param constants The rendering constants provider.
   * @param input The inline input to measure and store information for.
   */
  constructor(constants: ConstantProvider, input: Input) {
    super(constants, input);
    this.type |= Types.INLINE_INPUT;

    if (!this.connectedBlock) {
      this.height = this.constants_.EMPTY_INLINE_INPUT_HEIGHT;
      this.width = this.constants_.EMPTY_INLINE_INPUT_PADDING;
    } else {
      // We allow the dark path to show on the parent block so that the child
      // block looks embossed.  This takes up an extra pixel in both x and y.
      this.width = this.connectedBlockWidth;
      this.height = this.connectedBlockHeight;
    }

    this.connectionHeight = !this.isDynamicShape
      ? (this.shape.height as number)
      : (this.shape.height as (p1: number) => number)(this.height);

    this.connectionWidth = !this.isDynamicShape
      ? (this.shape.width as number)
      : (this.shape.width as (p1: number) => number)(this.height);
    if (!this.connectedBlock) {
      this.width += this.connectionWidth * (this.isDynamicShape ? 2 : 1);
    }

    this.connectionOffsetY =
      'connectionOffsetY' in this.shape
        ? this.shape.connectionOffsetY(this.connectionHeight)
        : this.constants_.TAB_OFFSET_FROM_TOP;

    this.connectionOffsetX =
      'connectionOffsetX' in this.shape
        ? this.shape.connectionOffsetX(this.connectionWidth)
        : 0;
  }
}
