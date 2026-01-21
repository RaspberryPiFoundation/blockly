/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IToolbox

import type {ToolboxInfo} from '../utils/toolbox.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import type {IFlyout} from './i_flyout.js';
import type {IFocusableTree} from './i_focusable_tree.js';
import type {IRegistrable} from './i_registrable.js';
import type {IToolboxItem} from './i_toolbox_item.js';

/**
 * Interface for a toolbox.
 */
export interface IToolbox extends IRegistrable, IFocusableTree {
  /** Initializes the toolbox. */
  init(): void;

  /**
   * Fills the toolbox with new toolbox items and removes any old contents.
   *
   * @param toolboxDef Object holding information for creating a toolbox.
   */
  render(toolboxDef: ToolboxInfo): void;

  /**
   * Gets the width of the toolbox.
   *
   * @returns The width of the toolbox.
   */
  getWidth(): number;

  /**
   * Gets the height of the toolbox.
   *
   * @returns The height of the toolbox.
   */
  getHeight(): number;

  /**
   * Gets the toolbox flyout.
   *
   * @returns The toolbox flyout.
   */
  getFlyout(): IFlyout | null;

  /**
   * Gets the workspace for the toolbox.
   *
   * @returns The parent workspace for the toolbox.
   */
  getWorkspace(): WorkspaceSvg;

  /**
   * Gets whether or not the toolbox is horizontal.
   *
   * @returns True if the toolbox is horizontal, false if the toolbox is
   *     vertical.
   */
  isHorizontal(): boolean;

  /**
   * Positions the toolbox based on whether it is a horizontal toolbox and
   * whether the workspace is in rtl.
   */
  position(): void;

  /** Handles resizing the toolbox when a toolbox item resizes. */
  handleToolboxItemResize(): void;

  /** Unhighlights any previously selected item. */
  clearSelection(): void;

  /**
   * Updates the category colours and background colour of selected categories.
   */
  refreshTheme(): void;

  /**
   * Updates the flyout's content without closing it.  Should be used in
   * response to a change in one of the dynamic categories, such as variables or
   * procedures.
   */
  refreshSelection(): void;

  /**
   * Sets the visibility of the toolbox.
   *
   * @param isVisible True if toolbox should be visible.
   */
  setVisible(isVisible: boolean): void;

  /**
   * Selects the toolbox item by its position in the list of toolbox items.
   *
   * @param position The position of the item to select.
   */
  selectItemByPosition(position: number): void;

  /**
   * Gets the selected item.
   *
   * @returns The selected item, or null if no item is currently selected.
   */
  getSelectedItem(): IToolboxItem | null;

  /**
   * Sets the selected item.
   *
   * @param item The toolbox item to select, or null to remove the current
   *     selection.
   */
  setSelectedItem(item: IToolboxItem | null): void;

  /** Disposes of this toolbox. */
  dispose(): void;
}
