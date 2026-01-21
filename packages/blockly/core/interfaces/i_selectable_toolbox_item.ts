/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ISelectableToolboxItem

import type {FlyoutItemInfoArray} from '../utils/toolbox';
import type {IToolboxItem} from './i_toolbox_item.js';

/**
 * Interface for an item in the toolbox that can be selected.
 */
export interface ISelectableToolboxItem extends IToolboxItem {
  /**
   * Gets the name of the toolbox item. Used for emitting events.
   *
   * @returns The name of the toolbox item.
   */
  getName(): string;

  /**
   * Gets the contents of the toolbox item. These are items that are meant to be
   * displayed in the flyout.
   *
   * @returns The definition of items to be displayed in the flyout.
   */
  getContents(): FlyoutItemInfoArray | string;

  /**
   * Sets the current toolbox item as selected.
   *
   * @param _isSelected True if this category is selected, false otherwise.
   */
  setSelected(_isSelected: boolean): void;

  /**
   * Gets the HTML element that is clickable.
   * The parent toolbox element receives clicks. The parent toolbox will add an
   * ID to this element so it can pass the onClick event to the correct
   * toolboxItem.
   *
   * @returns The HTML element that receives clicks.
   */
  getClickTarget(): Element;

  /**
   * Handles when the toolbox item is clicked.
   *
   * @param _e Click event to handle.
   */
  onClick(_e: Event): void;
}

/**
 * Type guard that checks whether an IToolboxItem is an ISelectableToolboxItem.
 */
export function isSelectableToolboxItem(
  toolboxItem: IToolboxItem,
): toolboxItem is ISelectableToolboxItem {
  return toolboxItem.isSelectable();
}
