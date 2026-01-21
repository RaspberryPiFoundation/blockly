/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IToolboxItem

import type {IFocusableNode} from './i_focusable_node.js';

/**
 * Interface for an item in the toolbox.
 */
export interface IToolboxItem extends IFocusableNode {
  /**
   * Initializes the toolbox item.
   * This includes creating the DOM and updating the state of any items based
   * on the info object.
   */
  init(): void;

  /**
   * Gets the div for the toolbox item.
   *
   * @returns The div for the toolbox item.
   */
  getDiv(): Element | null;

  /**
   * Gets a unique identifier for this toolbox item.
   *
   * @returns The ID for the toolbox item.
   */
  getId(): string;

  /**
   * Gets the parent if the toolbox item is nested.
   *
   * @returns The parent toolbox item, or null if this toolbox item is not
   *     nested.
   */
  getParent(): IToolboxItem | null;

  /**
   * Gets the nested level of the category.
   *
   * @returns The nested level of the category.
   * @internal
   */
  getLevel(): number;

  /**
   * Whether the toolbox item is selectable.
   *
   * @returns True if the toolbox item can be selected.
   */
  isSelectable(): boolean;

  /**
   * Whether the toolbox item is collapsible.
   *
   * @returns True if the toolbox item is collapsible.
   */
  isCollapsible(): boolean;

  /** Dispose of this toolbox item. No-op by default. */
  dispose(): void;

  /**
   * Gets the HTML element that is clickable.
   *
   * @returns The HTML element that receives clicks.
   */
  getClickTarget(): Element | null;

  /**
   * Sets whether the category is visible or not.
   * For a category to be visible its parent category must also be expanded.
   *
   * @param isVisible True if category should be visible.
   */
  setVisible_(isVisible: boolean): void;
}
