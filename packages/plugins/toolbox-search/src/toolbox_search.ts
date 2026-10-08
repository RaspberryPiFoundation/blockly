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
 * Padding between a flyout's scrollbar and the edge of the flyout. Mirrors
 * Flyout.SCROLLBAR_MARGIN, which is not part of the IFlyout interface.
 */
const SCROLLBAR_MARGIN = 2.5;

/**
 * A toolbox category that provides a search field and displays matching blocks
 * in its flyout.
 *
 * The search field is deliberately not a flyout item. Typing into it rebuilds
 * the flyout's contents, which would dispose the field along with everything
 * else. Instead the category registers itself as an IPositionable and pins the
 * field to the flyout's top edge, reserving room for it with a separator at
 * the head of the flyout.
 */
export class ToolboxSearchCategory
  extends Blockly.ToolboxCategory
  implements Blockly.IPositionable
{
  private static readonly START_SEARCH_SHORTCUT = 'startSearch';
  static readonly SEARCH_CATEGORY_KIND = 'search';
  /**
   * Identifies the search field to the workspace's ComponentManager.
   * IComponent requires this exact name; it is not the toolbox item's ID,
   * which is getId().
   */
  readonly id: string;
  private searchFieldDiv?: HTMLDivElement;
  private searchField?: HTMLInputElement;
  private searchNode?: SearchFieldNode;
  private flyoutNavigator?: SearchFlyoutNavigator;
  /** The flyout this category searches into. */
  private readonly flyout: Blockly.IFlyout;
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
    if (!flyout) {
      throw Error('A search category needs a toolbox that has a flyout.');
    }
    this.flyout = flyout;
    // Suffixed with the toolbox item's ID so that two workspaces on a page
    // don't share the same ID.
    this.id = `toolbox-search-input-${this.getId()}`;
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
    const searchField = this.createSearchField();
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
          let handled = true;
          if (event.key === 'Escape') {
            Blockly.getFocusManager().focusTree(this.workspace_);
          } else if (event.key === 'Enter') {
            this.focusResult();
          } else if (!isHorizontal && event.key === 'ArrowDown') {
            this.focusResult();
          } else if (!isHorizontal && event.key === 'ArrowUp') {
            this.focusResult(true);
          } else if (isHorizontal) {
            const isBottom =
              this.workspace_.options.toolboxPosition ===
              Blockly.utils.toolbox.Position.BOTTOM;
            const leaveKey = isBottom ? 'ArrowDown' : 'ArrowUp';
            if (event.key === leaveKey) {
              Blockly.getFocusManager().focusNode(this);
            }
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
   * Builds the search field and pins it over the flyout.
   *
   * @returns The search input.
   */
  private createSearchField(): HTMLInputElement {
    const input = document.createElement('input');
    input.id = this.id;
    input.type = 'search';
    input.placeholder = Blockly.Msg['TOOLBOX_SEARCH_PLACEHOLDER'];
    Blockly.utils.aria.setState(
      input,
      Blockly.utils.aria.State.LABEL,
      Blockly.Msg['TOOLBOX_SEARCH_PLACEHOLDER'],
    );
    this.searchField = input;

    const div = document.createElement('div');
    div.classList.add('blocklyToolboxSearchField');
    div.appendChild(input);
    this.searchFieldDiv = div;
    this.setFieldVisible(false);

    // Match the flyout's colour, so blocks scrolling past go behind it.
    // Themes without a flyout colour fall back to the one in the CSS below.
    this.workspace_
      .getThemeManager()
      .subscribe(div, 'flyoutBackgroundColour', 'background-color');
    this.workspace_
      .getInjectionDiv()
      .insertBefore(div, this.workspace_.getParentSvg());
    this.workspace_.getComponentManager().addComponent({
      component: this,
      weight: 0,
      capabilities: [Blockly.ComponentManager.Capability.POSITIONABLE],
    });

    // Make the field a focusable node of the flyout's workspace, and the node
    // that arrowing into the flyout lands on.
    const flyout = this.flyout;
    this.searchNode = new SearchFieldNode(this.id, input, flyout);
    this.flyoutNavigator = new SearchFlyoutNavigator(flyout, this.searchNode);
    flyout
      .getWorkspace()
      .getComponentManager()
      .addComponent({
        component: this.searchNode,
        weight: 0,
        capabilities: [Blockly.ComponentManager.Capability.FOCUSABLE],
      });
    flyout.getWorkspace().setNavigator(this.flyoutNavigator);
    return input;
  }

  /**
   * Moves focus to one end of the results.
   *
   * @param getLast Whether to focus the last item instead of the first.
   */
  private focusResult(getLast = false) {
    if (!this.flyoutNavigator) return;
    const result = getLast
      ? this.flyoutNavigator.getLastItem()
      : this.flyoutNavigator.getFirstItem();
    if (result) {
      Blockly.getFocusManager().focusNode(result);
    }
  }

  /**
   * Shows or hides the search field.
   *
   * @param visible Whether the field should be shown.
   */
  private setFieldVisible(visible: boolean) {
    if (this.searchFieldDiv) {
      this.searchFieldDiv.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The component's bounding box. Null in this case since we don't need
   *     other elements to avoid the toolbox search field.
   */
  getBoundingRectangle(): Blockly.utils.Rect | null {
    return null;
  }

  /**
   * Aligns the search field with the top edge of the flyout.
   */
  position() {
    const div = this.searchFieldDiv;
    const flyout = this.flyout;
    if (!div || !flyout.isVisible()) return;

    const margin = flyout.MARGIN;
    let left = flyout.getX() + margin;

    if (flyout.horizontalLayout) {
      // The flyout spans the workspace and its scrollbar runs along the
      // bottom, so there is nothing to size the field against.
      div.style.width = '';
    } else {
      // Fit the search field within the flyout, accounting for the scrollbar.
      const scrollbarInset =
        Blockly.Scrollbar.scrollbarThickness + SCROLLBAR_MARGIN;
      if (this.workspace_.RTL) left += scrollbarInset;
      const width = flyout.getWidth() - 2 * margin - scrollbarInset;
      div.style.width = `${Math.max(width, 0)}px`;
    }

    div.style.left = `${left}px`;
    div.style.top = `${flyout.getY() + margin}px`;
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
    this.setFieldVisible(isSelected);
    if (!isSelected) {
      // The field belongs to the flyout's workspace but sits outside its SVG,
      // so core's own cleanup can't find the indicator to remove.
      this.searchField?.classList.remove('blocklyPassiveFocus');
    }
  }

  /**
   * Filters the available blocks based on the current query string.
   */
  private matchBlocks() {
    const query = this.searchField?.value || '';
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
      this.searchField &&
      Blockly.getFocusManager().getFocusedNode() === this.searchNode
        ? {
            start: this.searchField.selectionStart,
            end: this.searchField.selectionEnd,
          }
        : null;

    this.parentToolbox_.refreshSelection();

    if (cursorToRestore && this.searchField && this.searchNode) {
      Blockly.getFocusManager().focusNode(this.searchNode);
      this.searchField.setSelectionRange(
        cursorToRestore.start,
        cursorToRestore.end,
      );
    }
    // Showing the flyout may have changed its width, and that path doesn't
    // run positionable components.
    this.position();
  }

  /**
   * Returns the room to reserve at the head of the flyout for the search field.
   *
   * @returns The height of the search field, in workspace units.
   */
  private spacerGap(): number {
    const flyout = this.flyout;
    const scale = flyout.getWorkspace().scale || 1;
    // Leave the flyout's own margin below the field as well as room for the
    // field itself.
    const clearance = flyout.MARGIN;
    const size =
      (flyout.horizontalLayout
        ? this.searchFieldDiv?.offsetWidth
        : this.searchFieldDiv?.offsetHeight) ?? 0;
    return (size + clearance) / scale;
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
      {kind: 'sep', gap: this.spacerGap()},
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
    if (this.searchFieldDiv) {
      this.workspace_.getThemeManager().unsubscribe(this.searchFieldDiv);
      this.workspace_.getComponentManager().removeComponent(this.id);
      this.searchFieldDiv.remove();
      this.searchFieldDiv = undefined;
    }
    if (this.searchNode) {
      this.flyout.getWorkspace().getComponentManager().removeComponent(this.id);
      this.searchNode = undefined;
    }
    this.searchField = undefined;
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

Blockly.Css.register(`
.blocklyToolboxSearchField {
  /* Matches the default fill of .blocklyFlyoutBackground.
     A theme that sets flyoutBackgroundColour overrides this. */
  background-color: #ddd;
  position: absolute;
  /* Matches the z-index of .blocklyFlyout. */
  z-index: 20;
}

.blocklyToolboxSearchField>input {
  width: 100%;
}
`);

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  ToolboxSearchCategory.SEARCH_CATEGORY_KIND,
  ToolboxSearchCategory,
);
