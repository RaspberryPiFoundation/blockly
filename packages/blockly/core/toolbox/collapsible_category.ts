/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A toolbox category used to organize blocks in the toolbox.
 *
 * @class
 */
// Former goog.module ID: Blockly.CollapsibleToolboxCategory

import type {ICollapsibleToolboxItem} from '../interfaces/i_collapsible_toolbox_item.js';
import type {IToolbox} from '../interfaces/i_toolbox.js';
import type {IToolboxItem} from '../interfaces/i_toolbox_item.js';
import * as registry from '../registry.js';
import * as aria from '../utils/aria.js';
import * as dom from '../utils/dom.js';
import * as toolbox from '../utils/toolbox.js';
import {ToolboxCategory} from './category.js';
import {ToolboxSeparator} from './separator.js';

/**
 * Class for a category in a toolbox that can be collapsed.
 */
export class CollapsibleToolboxCategory
  extends ToolboxCategory
  implements ICollapsibleToolboxItem
{
  /** Name used for registering a collapsible toolbox category. */
  static override registrationName = 'collapsibleCategory';

  /** Container for any child categories. */
  protected subcategoriesDiv_: HTMLDivElement | null = null;

  /** Whether or not the category should display its subcategories. */
  protected expanded_ = false;

  /** The child toolbox items for this category. */
  protected toolboxItems_: IToolboxItem[] = [];

  /**
   * @param categoryDef The information needed to create a category in the
   *     toolbox.
   * @param toolbox The parent toolbox for the category.
   * @param opt_parent The parent category or null if the category does not have
   *     a parent.
   */
  constructor(
    categoryDef: toolbox.CategoryInfo,
    toolbox: IToolbox,
    opt_parent?: ICollapsibleToolboxItem,
  ) {
    super(categoryDef, toolbox, opt_parent);
  }

  override makeDefaultCssConfig_() {
    const cssConfig = super.makeDefaultCssConfig_();
    cssConfig['contents'] = 'blocklyToolboxCategoryGroup';
    return cssConfig;
  }

  override parseContents_(categoryDef: toolbox.CategoryInfo) {
    if ('custom' in categoryDef) {
      this.flyoutItems_ = categoryDef['custom'];
    } else {
      const contents = categoryDef['contents'];
      if (!contents) return;
      this.flyoutItems_ = [];
      let prevIsFlyoutItem = true;
      for (let i = 0; i < contents.length; i++) {
        const itemDef = contents[i];
        // Separators can exist as either a flyout item or a toolbox item so
        // decide where it goes based on the type of the previous item.
        if (
          !registry.hasItem(registry.Type.TOOLBOX_ITEM, itemDef['kind']) ||
          (itemDef['kind'].toLowerCase() ===
            ToolboxSeparator.registrationName &&
            prevIsFlyoutItem)
        ) {
          const flyoutItem = itemDef as toolbox.FlyoutItemInfo;
          this.flyoutItems_.push(flyoutItem);
          prevIsFlyoutItem = true;
        } else {
          this.createToolboxItem(itemDef);
          prevIsFlyoutItem = false;
        }
      }
    }
  }

  /**
   * Creates a toolbox item and adds it to the list of toolbox items.
   *
   * @param itemDef The information needed to create a toolbox item.
   */
  private createToolboxItem(itemDef: toolbox.ToolboxItemInfo) {
    let registryName = itemDef['kind'];
    const categoryDef = itemDef as toolbox.CategoryInfo;
    // Categories that are collapsible are created using a class registered
    // under a different name.
    if (
      registryName.toUpperCase() === 'CATEGORY' &&
      toolbox.isCategoryCollapsible(categoryDef)
    ) {
      registryName = CollapsibleToolboxCategory.registrationName;
    }
    const ToolboxItemClass = registry.getClass(
      registry.Type.TOOLBOX_ITEM,
      registryName,
    );
    const toolboxItem = new ToolboxItemClass!(
      itemDef,
      this.parentToolbox_,
      this,
    );
    this.toolboxItems_.push(toolboxItem);
  }

  override init() {
    super.init();

    this.setExpanded(
      this.toolboxItemDef_['expanded'] === 'true' ||
        this.toolboxItemDef_['expanded'] === true,
    );
  }

  override createDom_() {
    super.createDom_();

    const subCategories = this.getChildToolboxItems();
    this.subcategoriesDiv_ = this.createSubCategoriesDom_(subCategories);
    aria.setRole(this.subcategoriesDiv_, aria.Role.GROUP);
    this.htmlDiv_!.appendChild(this.subcategoriesDiv_);
    this.closeIcon_(this.iconDom_);
    aria.setState(this.htmlDiv_ as HTMLDivElement, aria.State.EXPANDED, false);

    return this.htmlDiv_!;
  }

  override createIconDom_() {
    const toolboxIcon = document.createElement('span');
    if (!this.parentToolbox_.isHorizontal()) {
      const className = this.cssConfig_['icon'];
      if (className) {
        dom.addClass(toolboxIcon, className);
      }
      toolboxIcon.style.visibility = 'visible';
    }

    toolboxIcon.style.display = 'inline-block';
    return toolboxIcon;
  }

  /**
   * Create the DOM for all subcategories.
   *
   * @param subcategories The subcategories.
   * @returns The div holding all the subcategories.
   */
  protected createSubCategoriesDom_(
    subcategories: IToolboxItem[],
  ): HTMLDivElement {
    const contentsContainer = document.createElement('div');
    contentsContainer.style.display = 'none';
    const className = this.cssConfig_['contents'];
    if (className) {
      dom.addClass(contentsContainer, className);
    }

    for (let i = 0; i < subcategories.length; i++) {
      const newCategory = subcategories[i];
      newCategory.init();
      const newCategoryDiv = newCategory.getDiv();
      contentsContainer.appendChild(newCategoryDiv!);
      if (newCategory.getClickTarget) {
        newCategory.getClickTarget()?.setAttribute('id', newCategory.getId());
      }
    }
    return contentsContainer;
  }

  /**
   * Opens or closes the current category and the associated flyout.
   *
   * @param isExpanded True to expand the category, false to close.
   */
  setExpanded(isExpanded: boolean) {
    if (this.expanded_ === isExpanded) return;

    this.expanded_ = isExpanded;
    if (isExpanded) {
      this.subcategoriesDiv_!.style.display = 'block';
      this.openIcon_(this.iconDom_);
    } else {
      this.parentToolbox_.getFlyout()?.setVisible(false);
      this.subcategoriesDiv_!.style.display = 'none';
      this.closeIcon_(this.iconDom_);
    }
    aria.setState(
      this.htmlDiv_ as HTMLDivElement,
      aria.State.EXPANDED,
      isExpanded,
    );

    this.parentToolbox_.handleToolboxItemResize();
  }

  override setVisible_(isVisible: boolean) {
    this.htmlDiv_!.style.display = isVisible ? 'block' : 'none';
    const childToolboxItems = this.getChildToolboxItems();
    for (let i = 0; i < childToolboxItems.length; i++) {
      const child = childToolboxItems[i];
      child.setVisible_(isVisible);
    }
    this.isHidden_ = !isVisible;

    if (this.parentToolbox_.getSelectedItem() === this) {
      this.parentToolbox_.clearSelection();
    }
  }

  /**
   * Whether the category is expanded to show its child subcategories.
   *
   * @returns True if the toolbox item shows its children, false if it is
   *     collapsed.
   */
  isExpanded(): boolean {
    return this.expanded_;
  }

  override isCollapsible() {
    return true;
  }

  override onClick(_e: Event) {
    this.toggleExpanded();
  }

  /** Toggles whether or not the category is expanded. */
  toggleExpanded() {
    this.setExpanded(!this.expanded_);
  }

  override getDiv() {
    return this.htmlDiv_;
  }

  /**
   * Gets any children toolbox items. (ex. Gets the subcategories)
   *
   * @returns The child toolbox items.
   */
  getChildToolboxItems(): IToolboxItem[] {
    return this.toolboxItems_;
  }
}

export namespace CollapsibleToolboxCategory {
  /**
   * All the CSS class names that are used to create a collapsible
   * category. This is all the properties from the regular category plus
   * contents.
   */
  export interface CssConfig {
    container: string | null;
    row: string | null;
    rowcontentcontainer: string | null;
    icon: string | null;
    label: string | null;
    selected: string | null;
    openicon: string | null;
    closedicon: string | null;
    contents: string | null;
  }
}

export type CssConfig = CollapsibleToolboxCategory.CssConfig;

registry.register(
  registry.Type.TOOLBOX_ITEM,
  CollapsibleToolboxCategory.registrationName,
  CollapsibleToolboxCategory,
);
