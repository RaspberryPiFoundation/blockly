/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.RoundCorner

import type {ConstantProvider} from '../common/constants.js';
import {Measurable} from './base.js';
import {Types} from './types.js';

/**
 * An object containing information about the space a rounded corner takes up
 * during rendering.
 */
export class RoundCorner extends Measurable {
  // This field exists solely to structurally distinguish this type from other
  // Measurable subclasses. Because this class otherwise has the same fields as
  // Measurable, and Typescript doesn't support nominal typing, Typescript will
  // consider it and other subclasses in the same situation as being of the same
  // type, even if typeguards are used, which could result in Typescript typing
  // objects of this class as `never`.
  private roundCorner: undefined;

  /**
   * @param constants The rendering constants provider.
   * @param opt_position The position of this corner.
   */
  constructor(constants: ConstantProvider, opt_position?: string) {
    super(constants);
    this.type =
      (!opt_position || opt_position === 'left'
        ? Types.LEFT_ROUND_CORNER
        : Types.RIGHT_ROUND_CORNER) | Types.CORNER;
    this.width = this.constants_.CORNER_RADIUS;
    // The rounded corner extends into the next row by 4 so we only take the
    // height that is aligned with this row.
    this.height = this.constants_.CORNER_RADIUS / 2;
  }
}
