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
import {SearchFieldNode} from './search_field_node';
import {SearchFlyoutNavigator} from './search_flyout_navigator';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * A toolbox category that provides a search field and displays matching blocks
 * in its flyout.
 */
export class ToolboxSearchCategory extends Blockly.ToolboxCategory {
  private static readonly START_SEARCH_SHORTCUT = 'startSearch';
  static readonly SEARCH_CATEGORY_KIND = 'search';
  private searchNode?: SearchFieldNode;
  private flyoutNavigator?: SearchFlyoutNavigator;
  /** The flyout this category searches into. */
  private readonly flyout: Blockly.Flyout;
  private blockSearcher: BlockSearcher;
  private onChangeWrapper?: (event: Blockly.Events.Abstract) => void;
  private indexedBlocks = '';
  private boundEvents: Blockly.browserEvents.Data[] = [];
  private resultCount = 0;

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
    const flyout = parentToolbox.getFlyout();
    if (!(flyout instanceof Blockly.Flyout)) {
      throw Error('A search category needs a toolbox that has a flyout.');
    }
    this.flyout = flyout;
    this.blockSearcher = new BlockSearcher(this.workspace_);
    this.initBlockSearcher();
    this.registerShortcut();
    this.onChangeWrapper = this.handleWorkspaceChange.bind(this);
    this.workspace_.addChangeListener(this.onChangeWrapper);
  }

  /**
   * Initializes the category and creates its search field.
   */
  override init() {
    super.init();
    const node = new SearchFieldNode(
      `toolbox-search-input-${this.getId()}`,
      this.workspace_,
      this.flyout,
      this,
    );
    this.searchNode = node;
    // Make the field the node that arrowing into the flyout lands on.
    this.flyoutNavigator = new SearchFlyoutNavigator(this.flyout, node);
    this.flyout.getWorkspace().setNavigator(this.flyoutNavigator);

    const searchField = node.getInput();
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        searchField,
        'keydown',
        this,
        // Blockly suppresses its own keyboard shortcuts while a text input
        // has focus, so every key that should move focus is handled here.
        // Left and right are left alone in both layouts: inside the field
        // they belong to the cursor.
        (event: KeyboardEvent) => {
          const isHorizontal = this.flyout.horizontalLayout;
          const leaveKey =
            this.workspace_.options.toolboxPosition ===
            Blockly.utils.toolbox.Position.BOTTOM
              ? 'ArrowDown'
              : 'ArrowUp';
          let handled = true;
          if (event.key === 'Escape') {
            Blockly.getFocusManager().focusTree(this.workspace_);
          } else if (event.key === 'Enter') {
            this.focusResult();
          } else if (!isHorizontal && event.key === 'ArrowDown') {
            this.focusResult();
          } else if (!isHorizontal && event.key === 'ArrowUp') {
            this.focusResult(true);
          } else if (isHorizontal && event.key === leaveKey) {
            Blockly.getFocusManager().focusNode(this);
          } else {
            handled = false;
          }

          if (handled) {
            event.preventDefault();
          }
        },
      ),
      // When the user types in the search field, update the flyout to show matching blocks.
      Blockly.browserEvents.conditionalBind(searchField, 'input', this, () =>
        this.matchBlocks(),
      ),
    );
  }

  /**
   * Moves focus to one end of the results.
   *
   * @param getLast Whether to focus the last item instead of the first.
   */
  private focusResult(getLast = false) {
    if (!this.flyoutNavigator) return;
    const result = getLast
      ? this.flyoutNavigator.getLastNode()
      : this.flyoutNavigator.getFirstChild(
          this.flyout.getWorkspace().getRootFocusableNode(),
        );
    if (result) {
      Blockly.getFocusManager().focusNode(result);
    }
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
        if (this.parentToolbox_.getSelectedItem() !== this) {
          // Shows the flyout and the field, so that the field can take focus.
          this.parentToolbox_.setSelectedItem(this);
        }
        this.matchBlocks();
        if (this.searchNode?.canBeFocused()) {
          Blockly.getFocusManager().focusNode(this.searchNode);
        }
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
    this.blockSearcher.indexBlocks([...availableBlocks]);
  }

  /** See IFocusableNode.onNodeFocus. */
  override onNodeFocus(): void {
    super.onNodeFocus();
    Blockly.renderManagement.finishQueuedRenders().then(() => {
      this.matchBlocks();
    });
  }

  /**
   * Shows the search field alongside this category's flyout.
   *
   * @param isSelected Whether this category is now the selected one.
   */
  override setSelected(isSelected: boolean) {
    super.setSelected(isSelected);
    this.searchNode?.setVisible(isSelected);
  }

  /**
   * Filters the available blocks based on the current query string.
   */
  private matchBlocks() {
    const node = this.searchNode;
    const field = node?.getInput();
    const query = field?.value || '';
    const results = query ? this.blockSearcher.blockTypesMatching(query) : [];

    const oldCount = this.resultCount;
    this.resultCount = results.length;
    this.flyoutItems_ = this.generateFlyoutContent(query, results);

    if (this.parentToolbox_.getSelectedItem() !== this) {
      return;
    }

    if (oldCount !== results.length) {
      Blockly.utils.aria.announceDynamicAriaState(
        results.length === 1
          ? Blockly.Msg['TOOLBOX_SEARCH_RESULT_COUNT_ONE']
          : Blockly.Msg['TOOLBOX_SEARCH_RESULT_COUNT'].replace(
              '%1',
              String(results.length),
            ),
      );
    }

    // Prevent losing the cursor position in the search field when the flyout is rebuilt.
    const cursorToRestore =
      field && node && Blockly.getFocusManager().getFocusedNode() === node
        ? {
            field,
            node,
            start: field.selectionStart,
            end: field.selectionEnd,
          }
        : null;

    this.parentToolbox_.refreshSelection();
    // Start each new set of results from the best match rather than from
    // wherever the previous query left the flyout scrolled.
    this.flyout.scrollToStart();

    if (cursorToRestore) {
      Blockly.getFocusManager().focusNode(cursorToRestore.node);
      cursorToRestore.field.setSelectionRange(
        cursorToRestore.start,
        cursorToRestore.end,
      );
    }
    // Showing the flyout may have changed its width, and that path doesn't
    // run positionable components.
    this.searchNode?.position();
  }

  /**
   * Builds the flyout contents for a query.
   *
   * The list always starts with a separator tall enough to clear the search
   * field, so that the first result appears below it rather than behind it.
   *
   * @param query The current search query.
   * @param results The blocks matching the query.
   * @returns The contents to show in the flyout.
   */
  private generateFlyoutContent(
    query: string,
    results: Blockly.utils.toolbox.BlockInfo[],
  ): Blockly.utils.toolbox.FlyoutItemInfoArray {
    const items: Blockly.utils.toolbox.FlyoutItemInfoArray = [
      {kind: 'sep', gap: this.searchNode?.getRequiredGap() ?? 0},
    ];

    if (results.length) {
      items.push(...results);
    } else {
      items.push({
        kind: 'label',
        text:
          query.length < 3
            ? Blockly.Msg['TOOLBOX_SEARCH_PROMPT']
            : Blockly.Msg['TOOLBOX_SEARCH_NO_RESULTS'],
      });
    }
    return items;
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
    this.searchNode?.dispose();
    this.searchNode = undefined;
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
    this.blockSearcher.indexBlocks(blocks);
    return true;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  ToolboxSearchCategory.SEARCH_CATEGORY_KIND,
  ToolboxSearchCategory,
);
