/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Toolbox category with styling for continuous toolbox.
 */

import * as Blockly from 'blockly/core';

/** Toolbox category for continuous toolbox. */
export class ContinuousCategory extends Blockly.ToolboxCategory {
  /**
   * Creates a DOM element to display the category's label.
   *
   * @param name The name of this category.
   * @returns The newly created category label DOM element.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override createLabelDom_(name: string): Element {
    const label = document.createElement('div');
    label.setAttribute('id', this.getId() + '.label');
    label.textContent = name;
    label.classList.add(this.cssConfig_['label'] ?? '');
    return label;
  }

  /**
   * Creates a DOM element to display the category's icon. This category uses
   * color swatches instead of graphical icons.
   *
   * @returns The newly created category icon DOM element.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override createIconDom_(): Element {
    const icon = document.createElement('div');
    icon.classList.add('categoryBubble');
    icon.style.backgroundColor = this.colour_;
    return icon;
  }

  /**
   * Adds a color indicator to the toolbox category. Intentionally a no-op.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override addColourBorder_() {
    // No-op
  }

  /**
   * Sets whether or not this category is selected in the toolbox.
   *
   * @param isSelected True if this category is selected, otherwise false.
   */
  override setSelected(isSelected: boolean) {
    if (!this.rowDiv_ || !this.htmlDiv_) return;
    if (isSelected) {
      this.rowDiv_.style.backgroundColor = 'gray';
      Blockly.utils.dom.addClass(
        this.rowDiv_,
        this.cssConfig_['selected'] ?? '',
      );
    } else {
      this.rowDiv_.style.backgroundColor = '';
      Blockly.utils.dom.removeClass(
        this.rowDiv_,
        this.cssConfig_['selected'] ?? '',
      );
    }
    Blockly.utils.aria.setState(
      this.htmlDiv_,
      Blockly.utils.aria.State.SELECTED,
      isSelected,
    );
  }
}
