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
  private onChangeWrapper?: (event: Blockly.Events.Abstract) => void;
  private indexedBlocks = '';
  private boundEvents: Blockly.browserEvents.Data[] = [];

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
    this.onChangeWrapper = this.handleWorkspaceChange.bind(this);
    this.workspace_.addChangeListener(this.onChangeWrapper);
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
    this.searchField.placeholder = Blockly.Msg['TOOLBOX_SEARCH_PLACEHOLDER'];
    this.workspace_.RTL
      ? (this.searchField.style.marginRight = '8px')
      : (this.searchField.style.marginLeft = '8px');
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.searchField,
        'keydown',
        this,
        (event: KeyboardEvent) => {
          if (
            event.key === 'ArrowUp' &&
            this.searchField?.selectionStart === 0
          ) {
            const previous = this.parentToolbox_
              .getNavigator()
              .getPreviousNode();
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
              // Removes matches from the flyout after programmatically clearing the search field.
              this.matchBlocks();
            }
          }
        },
      ),
      // When the user types in the search field, update the flyout to show matching blocks.
      Blockly.browserEvents.conditionalBind(
        this.searchField,
        'input',
        this,
        () => this.matchBlocks(),
      ),
    );
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
      [Blockly.utils.KeyCodes.CTRL_CMD],
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
    if ('custom' in schema && schema.custom) {
      const flyoutCallback = this.workspace_.getToolboxCategoryCallback(
        schema.custom,
      );
      if (!flyoutCallback) {
        return;
      }
      const flyoutDef = flyoutCallback(this.workspace_);
      Blockly.utils.toolbox
        .convertFlyoutDefToJsonArray(flyoutDef)
        .forEach((item) => {
          this.getAvailableBlocks(item, allBlocks);
        });
    } else if ('contents' in schema) {
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
    this.blockSearcher.indexBlocks([...availableBlocks], this.workspace_);
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

    if (!this.flyoutItems_.length) {
      this.flyoutItems_.push({
        kind: 'label',
        text:
          query.length < 3
            ? Blockly.Msg['TOOLBOX_SEARCH_PROMPT']
            : Blockly.Msg['TOOLBOX_SEARCH_NO_RESULTS'],
      });
    }

    if (this.parentToolbox_.getSelectedItem() !== this) {
      return;
    }

    if (oldCount !== newCount) {
      Blockly.utils.aria.announceDynamicAriaState(
        newCount === 1
          ? Blockly.Msg['TOOLBOX_SEARCH_RESULT_COUNT_ONE']
          : Blockly.Msg['TOOLBOX_SEARCH_RESULT_COUNT'].replace(
              '%1',
              String(newCount),
            ),
      );
    }

    this.parentToolbox_.refreshSelection();
  }

  /**
   * Disposes of this category.
   */
  override dispose() {
    super.dispose();
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
    if (this.onChangeWrapper) {
      this.workspace_.removeChangeListener(this.onChangeWrapper);
      this.onChangeWrapper = undefined;
    }
    Blockly.ShortcutRegistry.registry.unregister(
      ToolboxSearchCategory.START_SEARCH_SHORTCUT,
    );
  }

  /**
   * Rebuilds the search index when the workspace changes in a way that alters
   * what a dynamic toolbox category offers, such as creating or renaming a
   * variable or a procedure.
   *
   * @param event The change that occurred on the workspace.
   */
  private handleWorkspaceChange(event: Blockly.Events.Abstract) {
    if (event.isUiEvent) return;
    // This works off of the assumption that these events don't typically change
    // what a dynamic category contains. Apps that need to rebuild the index
    // manually can do so by firing a different workspace event.
    if (
      event.type === Blockly.Events.BLOCK_MOVE ||
      event.type === Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE ||
      event.type.startsWith('comment_')
    ) {
      return;
    }
    if (this.refreshBlockSearcher()) this.matchBlocks();
  }

  /**
   * Rebuilds the BlockSearcher index if the available blocks have changed.
   *
   * @returns True if the index was rebuilt.
   */
  private refreshBlockSearcher(): boolean {
    const availableBlocks = new Set<Blockly.utils.toolbox.BlockInfo>();
    this.workspace_.options.languageTree?.contents?.forEach((item) =>
      this.getAvailableBlocks(item, availableBlocks),
    );

    const blocks = [...availableBlocks];
    const snapshot = JSON.stringify([
      blocks,
      this.workspace_
        .getVariableMap()
        .getAllVariables()
        .map((v) => v.getName()),
    ]);
    if (snapshot === this.indexedBlocks) return false;
    this.indexedBlocks = snapshot;
    this.blockSearcher.indexBlocks(blocks, this.workspace_);
    return true;
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
