/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.Icon

import type {IIcon as BlocklyIcon} from '../../interfaces/i_icon.js';
import type {ConstantProvider} from '../common/constants.js';
import {Measurable} from './base.js';
import {Types} from './types.js';

/**
 * An object containing information about the space an icon takes up during
 * rendering.
 */
export class Icon extends Measurable {
  flipRtl = false;

  /**
   * An object containing information about the space an icon takes up during
   * rendering.
   *
   * @param constants The rendering constants provider.
   * @param icon The icon to measure and store information for.
   */
  constructor(
    constants: ConstantProvider,
    public icon: BlocklyIcon,
  ) {
    super(constants);

    this.type |= Types.ICON;

    const size = icon.getSize();
    this.height = size.height;
    this.width = size.width;
  }
}
