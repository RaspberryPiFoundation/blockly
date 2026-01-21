/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.JaggedEdge

import type {ConstantProvider} from '../common/constants.js';
import {Measurable} from './base.js';
import {Types} from './types.js';

/**
 * An object containing information about the space the jagged edge of a
 * collapsed block takes up during rendering.
 */
export class JaggedEdge extends Measurable {
  // This field exists solely to structurally distinguish this type from other
  // Measurable subclasses. Because this class otherwise has the same fields as
  // Measurable, and Typescript doesn't support nominal typing, Typescript will
  // consider it and other subclasses in the same situation as being of the same
  // type, even if typeguards are used, which could result in Typescript typing
  // objects of this class as `never`.
  private jaggedEdge: undefined;

  /**
   * @param constants The rendering constants provider.
   */
  constructor(constants: ConstantProvider) {
    super(constants);
    this.type |= Types.JAGGED_EDGE;
    this.height = this.constants_.JAGGED_TEETH.height;
    this.width = this.constants_.JAGGED_TEETH.width;
  }
}
