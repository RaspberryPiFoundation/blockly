/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An item in the toolbox.
 *
 * @class
 */
// Former goog.module ID: Blockly.ToolboxItem

import type {ICollapsibleToolboxItem} from '../interfaces/i_collapsible_toolbox_item.js';
import type {IFocusableTree} from '../interfaces/i_focusable_tree.js';
import type {IToolbox} from '../interfaces/i_toolbox.js';
import type {IToolboxItem} from '../interfaces/i_toolbox_item.js';
import * as idGenerator from '../utils/idgenerator.js';
import type * as toolbox from '../utils/toolbox.js';
import type {WorkspaceSvg} from '../workspace_svg.js';

/**
 * Class for an item in the toolbox.
 */
export class ToolboxItem implements IToolboxItem {
  protected id_: string;
  protected parent_: ICollapsibleToolboxItem | null;
  protected level_: number;
  protected toolboxItemDef_: toolbox.ToolboxItemInfo | null;
  protected workspace_: WorkspaceSvg;
  /** The toolbox this category belongs to. */
  protected readonly parentToolbox_: IToolbox;

  /**
   * @param toolboxItemDef The JSON defining the toolbox item.
   * @param parentToolbox The toolbox that holds the toolbox item.
   * @param opt_parent The parent toolbox item or null if the category does not
   *     have a parent.
   */
  constructor(
    toolboxItemDef: toolbox.ToolboxItemInfo,
    parentToolbox: IToolbox,
    opt_parent?: ICollapsibleToolboxItem,
  ) {
    /** The ID for the category. */
    this.id_ =
      (toolboxItemDef as AnyDuringMigration)['toolboxitemid'] ||
      idGenerator.getNextUniqueId();

    /** The parent of the category. */
    this.parent_ = opt_parent || null;

    /** The level that the category is nested at. */
    this.level_ = this.parent_ ? this.parent_.getLevel() + 1 : 0;

    /** The JSON definition of the toolbox item. */
    this.toolboxItemDef_ = toolboxItemDef;

    this.parentToolbox_ = parentToolbox;

    /** The workspace of the parent toolbox. */
    this.workspace_ = this.parentToolbox_.getWorkspace();
  }

  /**
   * Initializes the toolbox item.
   * This includes creating the DOM and updating the state of any items based
   * on the info object.
   */
  init() {}
  // No-op by default.

  /**
   * Gets the div for the toolbox item.
   *
   * @returns The div for the toolbox item.
   */
  getDiv(): Element | null {
    return null;
  }

  /**
   * Gets the HTML element that is clickable.
   * The parent toolbox element receives clicks. The parent toolbox will add an
   * ID to this element so it can pass the onClick event to the correct
   * toolboxItem.
   *
   * @returns The HTML element that receives clicks, or null if this item should
   *     not receive clicks.
   */
  getClickTarget(): Element | null {
    return null;
  }

  /**
   * Gets a unique identifier for this toolbox item.
   *
   * @returns The ID for the toolbox item.
   */
  getId(): string {
    return this.id_;
  }

  /**
   * Gets the parent if the toolbox item is nested.
   *
   * @returns The parent toolbox item, or null if this toolbox item is not
   *     nested.
   */
  getParent(): ICollapsibleToolboxItem | null {
    return null;
  }

  /**
   * Gets the nested level of the category.
   *
   * @returns The nested level of the category.
   * @internal
   */
  getLevel(): number {
    return this.level_;
  }

  /**
   * Whether the toolbox item is selectable.
   *
   * @returns True if the toolbox item can be selected.
   */
  isSelectable(): boolean {
    return false;
  }

  /**
   * Whether the toolbox item is collapsible.
   *
   * @returns True if the toolbox item is collapsible.
   */
  isCollapsible(): boolean {
    return false;
  }

  /** Dispose of this toolbox item. No-op by default. */
  dispose() {}

  /**
   * Sets whether the category is visible or not.
   * For a category to be visible its parent category must also be expanded.
   *
   * @param _isVisible True if category should be visible.
   */
  setVisible_(_isVisible: boolean) {}

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    const div = this.getDiv();
    if (!div) {
      throw Error('Trying to access toolbox item before DOM is initialized.');
    }
    if (!(div instanceof HTMLElement)) {
      throw Error('Toolbox item div is unexpectedly not an HTML element.');
    }
    return div as HTMLElement;
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this.parentToolbox_;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {}

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {}

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }
}
// nop by default
