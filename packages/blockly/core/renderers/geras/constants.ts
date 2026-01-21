/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.geras.ConstantProvider

import {ConstantProvider as BaseConstantProvider} from '../common/constants.js';

/**
 * An object that provides constants for rendering blocks in Geras mode.
 */
export class ConstantProvider extends BaseConstantProvider {
  override FIELD_TEXT_BASELINE_CENTER = false;

  // The dark/shadow path in classic rendering is the same as the normal block
  // path, but translated down one and right one.
  DARK_PATH_OFFSET = 1;

  /**
   * The maximum width of a bottom row that follows a statement input and has
   * inputs inline.
   */
  MAX_BOTTOM_WIDTH = 30;
  override STATEMENT_BOTTOM_SPACER = -this.NOTCH_HEIGHT / 2;

  constructor() {
    super();
  }

  override getCSS_(selector: string) {
    return super.getCSS_(selector).concat([
      // Insertion marker.
      `${selector} .blocklyInsertionMarker>.blocklyPathLight,`,
      `${selector} .blocklyInsertionMarker>.blocklyPathDark {`,
      `fill-opacity: ${this.INSERTION_MARKER_OPACITY};`,
      `stroke: none;`,
      '}',
    ]);
  }
}
