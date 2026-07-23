/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A toolbox category that provides a search field and displays matching blocks
 * in its flyout.
 */
import * as Blockly from 'blockly/core';
import {BlockSearcher} from './block_searcher';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * A toolbox category that provides a search field and displays matching blocks
 * in its flyout.
 */
export class ToolboxSearchCategory extends Blockly.ToolboxCategory {
  private static readonly START_SEARCH_SHORTCUT = 'startSearch';
  static readonly SEARCH_CATEGORY_KIND = 'search';
  private readonly SEARCH_INPUT_ID = 'toolbox-search-input';
  private searchField?: HTMLInputElement;
  private blockSearcher = new BlockSearcher();

  /**
   * Initializes a ToolboxSearchCategory.
   *
   * @param categoryDef The information needed to create a category in the
   *     toolbox.
   * @param parentToolbox The parent toolbox for the category.
   * @param opt_parent The parent category or null if the category does not have
   *     a parent.
   */
  constructor(
    categoryDef: Blockly.utils.toolbox.CategoryInfo,
    parentToolbox: Blockly.IToolbox,
    opt_parent?: Blockly.ICollapsibleToolboxItem,
  ) {
    super(categoryDef, parentToolbox, opt_parent);
    this.initBlockSearcher();
    this.registerShortcut();
  }

  /**
   * Initializes the search field toolbox category.
   *
   * @returns The <div> that will be displayed in the toolbox.
   */
  protected override createDom_(): HTMLDivElement {
    const dom = super.createDom_();
    this.searchField = document.createElement('input');
    this.searchField.id = this.SEARCH_INPUT_ID;
    this.searchField.type = 'search';
    this.searchField.placeholder = 'Search for blocks';
    this.workspace_.RTL
      ? (this.searchField.style.marginRight = '8px')
      : (this.searchField.style.marginLeft = '8px');
    this.searchField.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp' && this.searchField?.selectionStart === 0) {
        const previous = this.parentToolbox_.getNavigator().getPreviousNode();
        if (previous) {
          Blockly.getFocusManager().focusNode(previous);
        }
        return;
      } else if (
        event.key === 'ArrowRight' &&
        this.searchField?.selectionStart === this.searchField?.value.length
      ) {
        const previous = this.parentToolbox_.getNavigator().getInNode();
        if (previous) {
          Blockly.getFocusManager().focusNode(previous);
        }
        return;
      } else if (
        event.key === 'ArrowDown' &&
        this.searchField?.selectionStart === this.searchField?.value.length
      ) {
        const next = this.parentToolbox_.getNavigator().getNextNode();
        if (next) {
          Blockly.getFocusManager().focusNode(next);
        }
        return;
      } else if (event.key === 'Escape' && this.searchField) {
        if (this.searchField.value !== '') {
          this.searchField.value = '';
          event.stopPropagation();
        }
      }

      this.matchBlocks();
    });
    this.rowContents_?.replaceChildren(this.searchField);
    return dom;
  }

  /** The ID of the toolbox item must match the ID of the focusable node. */
  override getId(): string {
    return this.SEARCH_INPUT_ID;
  }

  /**
   * Registers a shortcut for displaying the toolbox search category.
   */
  private registerShortcut() {
    const shortcut = Blockly.ShortcutRegistry.registry.createSerializedKey(
      Blockly.utils.KeyCodes.B,
      [Blockly.utils.KeyCodes.CTRL],
    );
    Blockly.ShortcutRegistry.registry.register({
      name: ToolboxSearchCategory.START_SEARCH_SHORTCUT,
      callback: () => {
        Blockly.getFocusManager().focusNode(this);
        return true;
      },
      keyCodes: [shortcut],
    });
  }

  /**
   * Returns a list of block types that are present in the toolbox definition.
   *
   * @param schema A toolbox item definition.
   * @param allBlocks The set of all available blocks that have been encountered
   *     so far.
   */
  private getAvailableBlocks(
    schema: Blockly.utils.toolbox.ToolboxItemInfo,
    allBlocks: Set<Blockly.utils.toolbox.BlockInfo>,
  ) {
    if ('contents' in schema) {
      schema.contents.forEach((contents) => {
        this.getAvailableBlocks(contents, allBlocks);
      });
    } else if (schema.kind.toLowerCase() === 'block') {
      if ('type' in schema && schema.type) {
        allBlocks.add(schema);
      }
    }
  }

  /**
   * Builds the BlockSearcher index based on the available blocks.
   */
  private initBlockSearcher() {
    const availableBlocks = new Set<Blockly.utils.toolbox.BlockInfo>();
    this.workspace_.options.languageTree?.contents?.forEach((item) =>
      this.getAvailableBlocks(item, availableBlocks),
    );
    this.blockSearcher.indexBlocks([...availableBlocks]);
  }

  /** See IFocusableNode.getFocusableElement. */
  override getFocusableElement(): HTMLElement | SVGElement {
    if (!this.searchField) {
      throw Error('This field currently has no representative DOM element.');
    }
    return this.searchField;
  }

  /** See IFocusableNode.onNodeFocus. */
  override onNodeFocus(): void {
    super.onNodeFocus();
    if (!this.searchField?.value) {
      Blockly.renderManagement.finishQueuedRenders().then(() => {
        this.matchBlocks();
      });
    }
  }

  /**
   * Filters the available blocks based on the current query string.
   */
  private matchBlocks() {
    const query = this.searchField?.value || '';

    const oldCount = this.flyoutItems_.length;
    this.flyoutItems_ = query
      ? this.blockSearcher.blockTypesMatching(query)
      : [];

    const newCount = this.flyoutItems_.length;
    if (oldCount !== newCount) {
      Blockly.utils.aria.announceDynamicAriaState(
        `${newCount} matching blocks`,
      );
    }

    if (!this.flyoutItems_.length) {
      this.flyoutItems_.push({
        kind: 'label',
        text:
          query.length < 3
            ? 'Type to search for blocks'
            : 'No matching blocks found',
      });
    }
    this.parentToolbox_.refreshSelection();
  }

  /**
   * Disposes of this category.
   */
  override dispose() {
    super.dispose();
    Blockly.ShortcutRegistry.registry.unregister(
      ToolboxSearchCategory.START_SEARCH_SHORTCUT,
    );
  }
}

// Make the clear button clickable in Safari.
Blockly.Css.register(`
input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: searchfield-cancel-button;
    pointer-events: auto !important;
    position: relative;
    z-index: 10;
}`);

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  ToolboxSearchCategory.SEARCH_CATEGORY_KIND,
  ToolboxSearchCategory,
);
