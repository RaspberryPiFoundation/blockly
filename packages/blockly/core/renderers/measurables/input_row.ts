/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.InputRow

import type {ConstantProvider} from '../common/constants.js';
import {Row} from './row.js';
import {Types} from './types.js';

/**
 * An object containing information about a row that holds one or more inputs.
 */
export class InputRow extends Row {
  /**
   * The total width of all blocks connected to this row.
   */
  connectedBlockWidths = 0;

  /**
   * @param constants The rendering constants provider.
   */
  constructor(constants: ConstantProvider) {
    super(constants);
    this.type |= Types.INPUT_ROW;
  }

  /**
   * Inspect all subcomponents and populate all size properties on the row.
   */
  override measure() {
    this.width = this.minWidth;
    this.height = this.minHeight;
    let connectedBlockWidths = 0;
    for (let i = 0; i < this.elements.length; i++) {
      const elem = this.elements[i];
      this.width += elem.width;
      if (Types.isInput(elem)) {
        if (Types.isStatementInput(elem)) {
          connectedBlockWidths += elem.connectedBlockWidth;
        } else if (
          Types.isExternalInput(elem) &&
          elem.connectedBlockWidth !== 0
        ) {
          connectedBlockWidths +=
            elem.connectedBlockWidth - elem.connectionWidth;
        }
      }
      if (!Types.isSpacer(elem)) {
        this.height = Math.max(this.height, elem.height);
      }
    }
    this.connectedBlockWidths = connectedBlockWidths;
    this.widthWithConnectedBlocks = this.width + connectedBlockWidths;
  }

  override endsWithElemSpacer() {
    return !this.hasExternalInput && !this.hasStatement;
  }
}
