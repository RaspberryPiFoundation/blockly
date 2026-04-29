/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ICollapsibleToolboxItem

import {
  type ISelectableToolboxItem,
  isSelectableToolboxItem,
} from './i_selectable_toolbox_item.js';
import type {IToolboxItem} from './i_toolbox_item.js';

/**
 * Interface for an item in the toolbox that can be collapsed.
 */
export interface ICollapsibleToolboxItem extends ISelectableToolboxItem {
  /**
   * Gets any children toolbox items. (ex. Gets the subcategories)
   *
   * @returns The child toolbox items.
   */
  getChildToolboxItems(): IToolboxItem[];

  /**
   * Whether the toolbox item is expanded to show its child subcategories.
   *
   * @returns True if the toolbox item shows its children, false if it is
   *     collapsed.
   */
  isExpanded(): boolean;

  /** Toggles whether or not the toolbox item is expanded. */
  toggleExpanded(): void;
}

/**
 * Type guard that checks whether an object is an ICollapsibleToolboxItem.
 */
export function isCollapsibleToolboxItem(
  obj: any,
): obj is ICollapsibleToolboxItem {
  return (
    obj &&
    typeof obj.getChildToolboxItems === 'function' &&
    typeof obj.isExpanded === 'function' &&
    typeof obj.toggleExpanded === 'function' &&
    isSelectableToolboxItem(obj) &&
    obj.isCollapsible()
  );
}
