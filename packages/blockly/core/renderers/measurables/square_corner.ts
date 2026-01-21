/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.SquareCorner

import type {ConstantProvider} from '../common/constants.js';
import {Measurable} from './base.js';
import {Types} from './types.js';

/**
 * An object containing information about the space a square corner takes up
 * during rendering.
 */
export class SquareCorner extends Measurable {
  // This field exists solely to structurally distinguish this type from other
  // Measurable subclasses. Because this class otherwise has the same fields as
  // Measurable, and Typescript doesn't support nominal typing, Typescript will
  // consider it and other subclasses in the same situation as being of the same
  // type, even if typeguards are used, which could result in Typescript typing
  // objects of this class as `never`.
  private squareCorner: undefined;

  /**
   * @param constants The rendering constants provider.
   * @param opt_position The position of this corner.
   */
  constructor(constants: ConstantProvider, opt_position?: string) {
    super(constants);
    this.type =
      (!opt_position || opt_position === 'left'
        ? Types.LEFT_SQUARE_CORNER
        : Types.RIGHT_SQUARE_CORNER) | Types.CORNER;
    this.height = this.constants_.NO_PADDING;
    this.width = this.constants_.NO_PADDING;
  }
}
