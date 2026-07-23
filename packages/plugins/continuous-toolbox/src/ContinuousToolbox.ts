/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Toolbox that uses a continuous scrolling flyout.
 */

import * as Blockly from 'blockly/core';
import {ContinuousFlyout} from './ContinuousFlyout';
import {ContinuousToolboxNavigator} from './ContinuousToolboxNavigator';

/**
 * Class for continuous toolbox.
 */
export class ContinuousToolbox extends Blockly.Toolbox {
  /**
   * Timeout ID used to prevent refreshing the flyout during extensive block
   * changes.
   */
  private refreshDebouncer?: ReturnType<typeof setTimeout>;

  /**
   * Navigator object responsible for handling keyboard navigation within this
   * toolbox.
   */
  private continuousToolboxNavigator = new ContinuousToolboxNavigator(this);

  /**
   * Initializes the continuous toolbox.
   */
  override init() {
    super.init();

    // Populate the flyout with all blocks and show it immediately.
    const flyout = this.getFlyout();
    flyout.show(this.getInitialFlyoutContents());

    this.getWorkspace().addChangeListener((e: Blockly.Events.Abstract) => {
      if (
        e.type === Blockly.Events.BLOCK_CREATE ||
        e.type === Blockly.Events.BLOCK_DELETE ||
        e.type === Blockly.Events.BLOCK_CHANGE
      ) {
        this.refreshSelection();
      }
    });
  }

  /**
   * Returns the continuous toolbox's flyout.
   *
   * @returns The toolbox's flyout.
   */
  override getFlyout(): ContinuousFlyout {
    return super.getFlyout() as ContinuousFlyout;
  }

  /**
   * Gets the contents that should be shown in the flyout immediately.
   * This includes all blocks and labels for each category of block.
   *
   * @returns Flyout contents.
   */
  private getInitialFlyoutContents(): Blockly.utils.toolbox.FlyoutItemInfoArray {
    return this.getToolboxItems().flatMap(this.convertToolboxItemToFlyoutItems);
  }

  /**
   * Converts a given toolbox item to an array of flyout items, generally a
   * label followed by the category's blocks.
   *
   * @param toolboxItem The toolbox item/category to convert.
   * @returns An array of flyout items contained in the given toolbox item.
   */
  protected convertToolboxItemToFlyoutItems(
    toolboxItem: Blockly.IToolboxItem,
  ): Blockly.utils.toolbox.FlyoutItemInfoArray {
    let contents: Blockly.utils.toolbox.FlyoutItemInfoArray = [];
    if (toolboxItem instanceof Blockly.ToolboxCategory) {
      // Create a label node to go at the top of the category
      contents.push({kind: 'LABEL', text: toolboxItem.getName()});
      let itemContents = toolboxItem.getContents();

      // Handle custom categories (e.g. variables and functions)
      if (typeof itemContents === 'string') {
        itemContents = [{custom: itemContents, kind: 'CATEGORY'}];
      }
      contents = contents.concat(itemContents);
    }
    return contents;
  }

  /**
   * Updates the flyout's contents if it is visible.
   */
  override refreshSelection() {
    if (this.getFlyout().isVisible()) {
      if (this.refreshDebouncer) {
        clearTimeout(this.refreshDebouncer);
      }
      this.refreshDebouncer = setTimeout(() => {
        this.getFlyout().show(this.getInitialFlyoutContents());
      }, 100);
    }
  }

  /**
   * Scrolls the flyout to display the newly selected category's contents.
   *
   * @param oldItem The previously selected toolbox category.
   * @param newItem The newly selected toolbox category.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override updateFlyout_(
    oldItem: Blockly.ISelectableToolboxItem | null,
    newItem: Blockly.ISelectableToolboxItem | null,
  ) {
    if (newItem) {
      this.getFlyout().scrollToCategory(newItem);
      if (!this.getFlyout().isVisible()) {
        this.getFlyout().show(this.getInitialFlyoutContents());
      }
    } else if (this.getFlyout().autoClose) {
      this.getFlyout().hide();
    }
  }

  /**
   * Returns whether or not the toolbox should deselect the old category.
   *
   * @param oldItem The previously selected toolbox category.
   * @param newItem The newly selected toolbox category.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override shouldDeselectItem_(
    oldItem: Blockly.ISelectableToolboxItem | null,
    newItem: Blockly.ISelectableToolboxItem | null,
  ): boolean {
    // Should not deselect if the same category is clicked again.
    return !!(oldItem && oldItem !== newItem);
  }

  /**
   * Gets a category by name.
   *
   * @param name Name of category to get.
   * @returns Category, or null if not found.
   * @internal
   */
  getCategoryByName(name: string): Blockly.ISelectableToolboxItem | null {
    const category = this.getToolboxItems().find(
      (item) =>
        item instanceof Blockly.ToolboxCategory &&
        item.isSelectable() &&
        name === item.getName(),
    );
    if (!category) return null;
    return category as Blockly.ISelectableToolboxItem;
  }

  /**
   * Selects the category with the given name.
   * Similar to setSelectedItem, but importantly, does not call updateFlyout
   * because this is called while the flyout is being scrolled.
   *
   * @param name Name of category to select.
   * @internal
   */
  selectCategoryByName(name: string) {
    const newItem = this.getCategoryByName(name);
    if (!newItem) return;

    const oldItem = this.selectedItem_;

    if (oldItem && this.shouldDeselectItem_(oldItem, newItem)) {
      this.deselectItem_(oldItem);
    }

    if (this.shouldSelectItem_(oldItem, newItem)) {
      this.selectItem_(oldItem, newItem);
    }
  }

  /**
   * Returns the bounding rectangle of the drag target/deletion area in pixels
   * relative to the viewport.
   *
   * @returns The toolbox's bounding box. Null if drag target area should be
   *     ignored.
   */
  override getClientRect(): Blockly.utils.Rect | null {
    // If the flyout never closes, it should be the deletable area.
    const flyout = this.getFlyout();
    if (flyout && !flyout.autoClose) {
      return flyout.getClientRect();
    }
    return super.getClientRect();
  }

  /**
   * Returns the Navigator object responsible for handling keyboard navigation
   * inside this toolbox.
   */
  override getNavigator(): Blockly.ToolboxNavigator {
    return this.continuousToolboxNavigator;
  }
}
