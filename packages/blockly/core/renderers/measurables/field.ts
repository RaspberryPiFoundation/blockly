/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.Field

import type {Field as BlocklyField} from '../../field.js';
import type {Input} from '../../inputs/input.js';
import type {ConstantProvider} from '../common/constants.js';
import {Measurable} from './base.js';
import {Types} from './types.js';

/**
 * An object containing information about the space a field takes up during
 * rendering
 */
export class Field extends Measurable {
  isEditable: boolean;
  flipRtl: boolean;
  override height: number;
  override width: number;

  /**
   * @param constants The rendering constants provider.
   * @param field The field to measure and store information for.
   * @param parentInput The parent input for the field.
   */
  constructor(
    constants: ConstantProvider,
    public field: BlocklyField,
    public parentInput: Input,
  ) {
    super(constants);

    this.isEditable = field.EDITABLE;

    this.flipRtl = field.getFlipRtl();
    this.type |= Types.FIELD;

    const size = this.field.getSize();

    this.height = size.height;

    this.width = size.width;
  }
}
